import { useState, useEffect, useRef } from "react";
import "./App.css";
import Header from "./header";
import Footer from "./footer";
import Settings from "./settings";
import SubmitField from "./submitField";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const theme = createTheme({
    palette: {
        primary: {
            main: "#526D82",
        },
        secondary: {
            main: "#9DB2BF",
            light: "#DDE6ED",
            contrastText: "#27374D",
        },
    },
});

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_PROJECT_URL,
    process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
);

const systemMessage = {
    role: "system",
    content: process.env.REACT_APP_SYSTEM_PROMPT,
};

function Success() {
    const navigate = useNavigate();

    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const [username, setUsername] = useState("");
    const [tokens, setTokens] = useState(null);
    const [lockUI, setLockUI] = useState(false);
    const [turnOver, setTurnOver] = useState(false);
    const [result, setResult] = useState("");
    const [enteredText, setEnteredText] = useState("");
    const [language, setLanguage] = useState(null);
    const [difficulty, setDifficulty] = useState(1);
    const [messages, setMessages] = useState([]);
    const [awaitingGPT, SetAwaitingGPT] = useState(false);
    const [currentSentence, setCurrentSentence] = useState("...");
    const [showSettings, setShowSettings] = useState("false");
    var isNewSentenceReq = true;

    const hasEffectRun = useRef(false);

    useEffect(() => {
        getUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (tokens > 0) {
            setLockUI(false);
            if (language !== null) setShowSettings(false)
        } else {
            setLockUI(true);
        }
    }, [tokens]);

    useEffect(() => {
        if (tokens !== null && !hasEffectRun.current) {
            console.log("Ready to begin");
            let initPrompt = process.env.REACT_APP_INIT_PROMPT;
            switch (difficulty) {
                case 1:
                    // Already set to beginner
                    break;
                case 2:
                    initPrompt = initPrompt.replace("beginner", "intermediate");
                    break;
                case 3:
                    initPrompt = initPrompt.replace("beginner", "advanced");
                    break;
                default:
                    break;
            }
            initPrompt = initPrompt.replace("Japanese", language);
            isNewSentenceReq = true;
            handleSend(initPrompt);
            hasEffectRun.current = true;
        }
    }, [tokens]);

    async function getUserData() {
        let email = "";

        await supabase.auth.getUser().then((value) => {
            if (value.data?.user) {
                console.log("Got user:" + value.data.user.email);

                if (value.data.user.language == null) setShowSettings(true);

                email = value.data.user.email;
                setUsername(value.data.user.email);
            } else {
                console.log("Failed to get user data.");
                navigate("/");
            }
        });

        await registerNewUser(email);
        console.log("Attempting to get data for " + email);

        const { data, error } = await supabase
            .from("users")
            .select()
            .eq("email", email)
            .single();
        if (error) {
            console.log("Get user data error:");
            console.log(error);
        } else {
            console.log(data);
            setTokens(data.tokens);
            setLanguage(data.language);
            setDifficulty(data.difficulty);
        }
    }

    const handleSend = async (message) => {
        console.log("Current user tokens:" + tokens);
        if (tokens > 0) {
            const { error } = await supabase
                .from("users")
                .update({ tokens: tokens - 1 })
                .eq("email", username);
            if (error) console.log(error);
            setTokens(tokens - 1);

            const newMessage = {
                message,
                direction: "outgoing",
                sender: "user",
            };

            const newMessages = [...messages, newMessage];

            setMessages(newMessages);
            SetAwaitingGPT(true);
            await processMessageToGPT(newMessages);
        } else {
            console.log("[handleSend]: No tokens remaining");
            setLockUI(true);
        }
    };

    async function registerNewUser(email) {
        console.log("Attempting to register user: " + email);

        const { error } = await supabase.from("users").insert({ email: email });
        if (error) {
            console.log("Error registering new user:");
            console.log(error);
        } else {
            console.log("Successfully registered: " + email);
        }
    }

    async function processMessageToGPT(chatMessages) {
        console.log(
            "Sending to GPT: " + chatMessages[chatMessages.length - 1].message
        );

        let apiMessages = chatMessages.map((messageObject) => {
            let role = "";
            if (messageObject.sender === "ChatGPT") {
                role = "assistant";
            } else {
                role = "user";
            }
            return { role: role, content: messageObject.message };
        });

        const apiRequestBody = {
            model: "gpt-3.5-turbo",
            messages: [systemMessage, ...apiMessages],
        };
        console.log("1");
        console.log(apiKey);
        await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(apiRequestBody),
        })
            .then((data) => {
                console.log("2");
                return data.json();
            })
            .then((data) => {
                console.log("3");
                console.log(data);
                setMessages([
                    ...chatMessages,
                    {
                        message: data.choices[0].message.content,
                        sender: "ChatGPT",
                    },
                ]);
                console.log("4");
                console.log("Received:", data.choices[0].message.content);
                if (containsFeedback(data.choices[0].message.content)) {
                    const feedback =
                        data.choices[0].message.content.toLowerCase();
                    if (feedback.includes("incorrect")) {
                        setResult("incorrect");
                    } else if (feedback.includes("correct")) {
                        setResult("correct");
                    } else {
                        console.log(
                            "wasn't able to determine the result because of weird response:" +
                                feedback
                        );
                    }
                }
                if (isNewSentenceReq) {
                    console.log("New sentence received!");
                    let nextSentence = data.choices[0].message.content;
                    nextSentence = extractUpToDelimiters(nextSentence);
                    if (language !== "French" && language !== "Spanish") {
                        nextSentence = filterRomanChars(nextSentence);
                    }
                    setCurrentSentence(nextSentence);
                }
                SetAwaitingGPT(false);
                isNewSentenceReq = true;
            });
    }

    function extractUpToDelimiters(inputString) {
        let extractedString = "";

        for (let i = 0; i < inputString.length; i++) {
            const char = inputString[i];

            // Skip double quotation marks
            if (char === '"') {
                continue;
            }

            // Skip characters '「' and '」'
            if (char === "「" || char === "」") {
                continue;
            }

            extractedString += char;

            if (char === "." || char === "?" || char === "。" || char === "!") {
                break;
            }
        }

        return extractedString;
    }

    function filterRomanChars(inputString) {
        let filteredString = "";
        let foundDelimiter = false; // Flag to track if a delimiter is found

        // Iterate through each character in the input string
        for (let i = 0; i < inputString.length; i++) {
            const char = inputString[i];

            // Check if the character is one of the specified delimiters
            if (char === "." || char === "?" || char === "。" || char === "!") {
                foundDelimiter = true;
            }

            // If a delimiter is found or if it's not a Roman character or bracket,
            // add the character to the filtered result
            if (
                foundDelimiter ||
                ((char.charCodeAt(0) < 65 || char.charCodeAt(0) > 90) &&
                    (char.charCodeAt(0) < 97 || char.charCodeAt(0) > 122) &&
                    char !== "(" &&
                    char !== ")" &&
                    char !== ":")
            ) {
                filteredString += char;
            }

            // If a delimiter is found, break out of the loop
            if (foundDelimiter) {
                break;
            }
        }

        return filteredString;
    }

    const handleTextChange = (event) => {
        setEnteredText(event.target.value);
    };

    const handleSubmitAnswer = (event) => {
        console.log("handleSubmitAnswer called");
        if (enteredText === "") {
            console.log("Empty  text!!!");
        } else {
            console.log("enteredTexttt:" + enteredText);
        }
        console.log("Setting newSentenceReq to false.");
        isNewSentenceReq = false;
        handleSend(
            `Here is my translation:"${enteredText}"\nWhich of the following options best describes my translation? [Correct|Incorrect]`
        );
        document.getElementById("text-entry").disabled = true;
        document.getElementById("button-submit").disabled = true;
    };

    async function signOutUser() {
        const { error } = await supabase.auth.signOut();
        if (error) console.log(error);
        navigate("/");
    }

    function containsFeedback(str) {
        const feedbackText = str.toLowerCase();
        const keywords = ["correct", "partially", "perfect", " - "];
        for (const keyword of keywords) {
            if (feedbackText.includes(keyword)) {
                return true;
            }
        }
        return false;
    }

    return (
        <ThemeProvider theme={theme}>
            {tokens > 0 ? (
                <>
                    <Header
                        username={username}
                        signOutUser={signOutUser}
                        setShowSettings={setShowSettings}
                    />
                    {showSettings === true ? (
                        <Settings
                            username={username}
                            setShowSettings={setShowSettings}
                        />
                    ) : (
                        <>
                            <SubmitField
                                awaitingGPT={awaitingGPT}
                                turnOver={turnOver}
                                currentSentence={currentSentence}
                                enteredText={enteredText}
                                onSubmit={handleSubmitAnswer}
                                onTextChange={handleTextChange}
                                disabled={awaitingGPT || turnOver}
                                result={result}
                                lockUI={lockUI}
                                onSendIconClick={() => {
                                    if (turnOver) {
                                        setTurnOver(false);
                                        setEnteredText("");
                                        setResult("");
                                        isNewSentenceReq = true;
                                        if (difficulty === 1) {
                                            handleSend(
                                                `Give me another beginner level one.`
                                            );
                                        } else if (difficulty === 2) {
                                            handleSend(
                                                `Give me another intermediate level one.`
                                            );
                                        } else if (difficulty === 3) {
                                            handleSend(
                                                `Give me another advanced level one.`
                                            );
                                        } else {
                                            handleSend(
                                                `Give me another beginner level one.`
                                            );
                                        }
                                    } else {
                                        if (enteredText !== "") {
                                            isNewSentenceReq = false;
                                            setTurnOver(true);
                                            handleSend(
                                                `Here is my translation:"${enteredText}"\nWhich of the following options best describes my translation? [Correct|Incorrect]`
                                            );
                                        }
                                    }
                                }}
                            />
                        </>
                    )}
                </>
            ) : (
                <>
                    <div style={{ textAlign: "center" }}>
                        <CircularProgress />
                    </div>
                </>
            )}
        </ThemeProvider>
    );
}

export default Success;
