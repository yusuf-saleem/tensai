import { useState, useEffect, useRef } from "react";
import "./App.css";
import "./index.css";
import Header from "./header";
import Footer from "./footer";
import Settings from "./settings";
import VocabBar from "./VocabBar";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typist from "react-typist";
import SendIcon from "@mui/icons-material/Send";

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

const messages = [
    {
        role: "system",
        content: process.env.REACT_APP_SYSTEM_PROMPT,
    },
];

function Success() {
    const navigate = useNavigate();

    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const [username, setUsername] = useState(null);
    const [tokens, setTokens] = useState(null);
    const [lockUI, setLockUI] = useState(false);
    const [turnOver, setTurnOver] = useState(false);
    const [result, setResult] = useState("");
    const [enteredText, setEnteredText] = useState("");
    const [language, setLanguage] = useState(null);
    const [vocabList, setVocabList] = useState(null);
    const [difficulty, setDifficulty] = useState(1);
    const [awaitingGPT, SetAwaitingGPT] = useState(false);
    const [currentSentence, setCurrentSentence] = useState("...");
    const [showSettings, setShowSettings] = useState(false);
    const [animationFinished, setAnimationFinished] = useState(false);
    var isNewSentenceReq = true;
    const hasEffectRun = useRef(false);
    const [forceRerender, setForceRerender] = useState(false);

    const onAnimationEnd = () => {
        setAnimationFinished(true);
    };

    useEffect(() => {
        getUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (tokens > 0) {
            setLockUI(false);
        } else {
            setLockUI(true);
        }
    }, [tokens]);

    useEffect(() => {
        setForceRerender(false);
    }, [forceRerender]);

    useEffect(() => {
        if (tokens !== null && !hasEffectRun.current) {
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
                email = value.data.user.email;
                setUsername(value.data.user.email);
            } else {
                navigate("/");
            }
        });

        await registerNewUser(email);

        const { data, error } = await supabase
            .from("users")
            .select()
            .eq("email", email)
            .single();
        if (error) {
            console.log(error);
        } else {
            setTokens(data.tokens);
            setLanguage(data.language);
            setDifficulty(data.difficulty);

            if (data.language === null || data.difficulty === null) {
                setShowSettings(true);
            } else {
                setShowSettings(false);
            }
        }
    }

    const handleSend = async (message) => {
        if (tokens > 0) {
            // Decrement Tokens
            const { error } = await supabase
                .from("users")
                .update({ tokens: tokens - 1 })
                .eq("email", username);
            if (error) console.log(error);
            setTokens(tokens - 1);

            // Create new message object
            const newMessage = {
                role: "user",
                content: message,
            };
            messages.push(newMessage);

            // Send request to BFF
            SetAwaitingGPT(true);
            const response = await fetch("https://tensai-express.netlify.app/.netlify/functions/api", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messages),
            });

            // Process response
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            messages.push(data);

            if (containsFeedback(data.content)) {
                const feedback = data.content.toLowerCase();
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
                let nextSentence = data.content;
                nextSentence = extractUpToDelimiters(nextSentence);
                if (language !== "French" && language !== "Spanish") {
                    nextSentence = filterRomanChars(nextSentence);
                }
                setCurrentSentence(nextSentence);
            }
            SetAwaitingGPT(false);
            isNewSentenceReq = true;
        } else {
            console.log("No tokens remaining");
            setLockUI(true);
        }
    };

    async function registerNewUser(email) {
        const { error } = await supabase.from("users").insert({ email: email });
    }

    function requestNewSentence() {
        setTurnOver(false);
        setEnteredText("");
        setResult("");
        isNewSentenceReq = true;
        if (difficulty === 1) {
            handleSend(`Give me another beginner level one.`);
        } else if (difficulty === 2) {
            handleSend(`Give me another intermediate level one.`);
        } else if (difficulty === 3) {
            handleSend(`Give me another advanced level one.`);
        } else {
            handleSend(`Give me another beginner level one.`);
        }
    }

    function handleSubmitAnswer2() {
        if (turnOver) {
            requestNewSentence();
        } else {
        }
    }

    function extractUpToDelimiters(inputString) {
        let extractedString = "";

        for (let i = 0; i < inputString.length; i++) {
            const char = inputString[i];

            if (char === '"') {
                continue;
            }

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
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                            }}
                        >
                            {!awaitingGPT || turnOver ? (
                                <Typist
                                    className="typist"
                                    cursor={{
                                        show: true,
                                        blink: true,
                                        hideWhenDone: true,
                                    }}
                                >
                                    <span className="typist-font">
                                        {currentSentence}
                                    </span>
                                </Typist>
                            ) : (
                                <CircularProgress size={40} />
                            )}
                            <br />
                            <br />
                            <form
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    width: "65%",
                                    textAlign: "center",
                                    alignItems: "center",
                                }}
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    if (!turnOver) {
                                        if (enteredText !== "") {
                                            isNewSentenceReq = false;
                                            setTurnOver(true);
                                            handleSend(
                                                `Here is my translation:"${enteredText}"\nWhich of the following options best describes my translation? [Correct|Incorrect]`
                                            );
                                            // setEnteredText("");
                                            setLockUI(true);
                                        }
                                    }
                                }}
                            >
                                <TextField
                                    variant="standard"
                                    size="small"
                                    autoComplete="off"
                                    value={enteredText}
                                    disabled={awaitingGPT || turnOver}
                                    onChange={(event) => {
                                        setEnteredText(event.target.value);
                                    }}
                                    inputProps={{
                                        min: 0,
                                        spellCheck: "false",
                                        style: {
                                            textAlign: "center",
                                            fontSize: "5vw",
                                        },
                                    }}
                                ></TextField>
                                <br />
                                <Button
                                    type="submit"
                                    variant="outlined"
                                    size="large"
                                    disabled={awaitingGPT || turnOver}
                                    style={{
                                        borderRadius: "100%", // Make the button round
                                        minWidth: 0,
                                        width: "70px", // Set a specific width if needed
                                        height: "70px", // Set a specific height if needed
                                    }}
                                >
                                    <SendIcon></SendIcon>
                                </Button>
                            </form>
                            {turnOver && !awaitingGPT ? (
                                <div
                                    className={`line ${
                                        forceRerender ? "force-rerender" : ""
                                    }`}
                                >
                                    <h2
                                        className="lineUp"
                                        onAnimationEnd={onAnimationEnd}
                                    >
                                        {result === "incorrect" ? (
                                            "Incorrect"
                                        ) : result === "correct" ? (
                                            "Correct"
                                        ) : (
                                            <></>
                                        )}
                                    </h2>
                                    {animationFinished && (
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={() => {
                                                setTurnOver(false);
                                                setEnteredText("");
                                                setResult("");
                                                setForceRerender(true);
                                                setAnimationFinished(false);
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
                                            }}
                                        >
                                            Next
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <></>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <Header
                        username={username}
                        signOutUser={signOutUser}
                        setShowSettings={setShowSettings}
                    />
                    <div
                        style={{
                            width: "max-content",
                            height: "40vh", // Set the height to 100vh (viewport height)
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                        }}
                    >
                        {tokens === 0 ? (
                            <>
                                <h2>No more tokens!</h2>
                                <a href="https://www.linkedin.com/in/yusuf--saleem/">
                                    Request for more
                                </a>
                            </>
                        ) : (
                            <></>
                        )}
                    </div>
                </>
            )}
            {username !== null && language !== null && (
                <VocabBar
                    isOpen={true}
                    email={username}
                    language={language}
                    supabase={supabase}
                />
            )}
        </ThemeProvider>
    );
}

export default Success;
