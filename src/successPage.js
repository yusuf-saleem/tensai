import { useState, useEffect, useRef } from "react";
import "./App.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import SendIcon from "@mui/icons-material/Send";
import LogoutIcon from "@mui/icons-material/Logout";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import Dropdown from "react-dropdown";
import "./dropdown.css";

const supabase = createClient(
    "https://dsrgrtdunqtylmafczpg.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcmdydGR1bnF0eWxtYWZjenBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODA2NDkwNjcsImV4cCI6MTk5NjIyNTA2N30.TTAafA8ayCRUsEZKKknAIt6m3xY1uxlFHMtiI2amxv0"
);

const systemMessage = {
    role: "system",
    content:
        'Provide a sentence in the language and difficulty that is requested by the user. Your response must be only 1 single sentence that is only in the language requested. When the user provides their translation of the sentence, you responde with either "Correct" or "Incorrect". Provide the answer or vocabulary only when requested.',
};

function Success() {
    const navigate = useNavigate();
    const [apiKey, setApiKey] = useState(process.env.REACT_APP_OPENAI_API_KEY);
    const [username, setUsername] = useState("");
    const [tokens, setTokens] = useState(null);
    const [lockUI, setLockUI] = useState(false);
    const [isStarted, setStarted] = useState(false);
    const [turnOver, setTurnOver] = useState(false);
    const [enteredText, setEnteredText] = useState("");
    const [language, setLanguage] = useState("Japanese");
    const [difficulty, setDifficulty] = useState("beginner");
    const dropdownRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [awaitingGPT, SetAwaitingGPT] = useState(false);
    const [currentSentence, setCurrentSentence] = useState("...");
    var isNewSentenceReq = true;

    // Initial Page Load
    useEffect(() => {
        console.log("username:" + username);
        getUserData();
    }, []);

    useEffect(() => {
        registerNewUser();
    }, [username]);

    useEffect(() => {
        if (tokens > 0) {
            setLockUI(false);
        } else {
            setLockUI(true);
        }
    }, [tokens]);

    async function pageInit() {}

    async function getUserData() {
        let email = "";

        await supabase.auth.getUser().then((value) => {
            if (value.data?.user) {
                console.log("Got user:" + value.data.user.email);
                email = value.data.user.email;
                setUsername(value.data.user.email);
            } else {
                console.log("Failed to get user data.");
            }
        });

        const { data, error } = await supabase
            .from("users")
            .select("tokens")
            .eq("email", email)
            .single();
        if (error) {
            console.log("Get user token error:");
            console.log(error);
        } else {
            console.log("Got user token balance: " + data.tokens);
            setTokens(data.tokens);
        }
    }

    const handleSend = async (message) => {
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

    async function registerNewUser() {
        const { error } = await supabase
            .from("users")
            .insert({ email: username });
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

        // Get the request body set up with the model we plan to use
        // and the messages which we formatted above. We add a system message in the front to'
        // determine how we want chatGPT to act.
        const apiRequestBody = {
            model: "gpt-3.5-turbo",
            messages: [
                systemMessage, // The system message DEFINES the logic of our chatGPT
                ...apiMessages, // The messages from our chat with ChatGPT
            ],
        };

        await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(apiRequestBody),
        })
            .then((data) => {
                return data.json();
            })
            .then((data) => {
                setMessages([
                    ...chatMessages,
                    {
                        message: data.choices[0].message.content,
                        sender: "ChatGPT",
                    },
                ]);
                console.log("Received:", data.choices[0].message.content);

                if (isNewSentenceReq) {
                    console.log("New sentence received!");
                    // setCurrentSentence(
                    //     getJapanese(data.choices[0].message.content)
                    // );
                    setCurrentSentence(data.choices[0].message.content);
                }
                SetAwaitingGPT(false);
                isNewSentenceReq = true;
            });
    }

    function getJapanese(str) {
        console.log("Parsing japanese from received msg.");

        const output = [...str]
            .filter(
                (char) =>
                    (char.charCodeAt(0) >= 0x3040 &&
                        char.charCodeAt(0) <= 0x309f) || // Hiragana
                    (char.charCodeAt(0) >= 0x30a0 &&
                        char.charCodeAt(0) <= 0x30ff) || // Katakana
                    (char.charCodeAt(0) >= 0x4e00 &&
                        char.charCodeAt(0) <= 0x9fff) || // Kanji
                    (char.charCodeAt(0) >= 0xff10 &&
                        char.charCodeAt(0) <= 0xff19) || // Numbers
                    char === "0" ||
                    char === "1" ||
                    char === "2" ||
                    char === "3" ||
                    char === "4" ||
                    char === "5" ||
                    char === "6" ||
                    char === "7" ||
                    char === "8" ||
                    char === "9" ||
                    char === "。"
            )
            .join("");
        return output;
    }

    function getLastMsgFromChatGPT() {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender === "ChatGPT") {
                return messages[i].message;
            }
        }
        return "";
    }

    const handleTextChange = (event) => {
        setEnteredText(event.target.value);
    };

    const handleSubmitAnswer = (event) => {
        console.log("Setting newSentenceReq to false.");
        isNewSentenceReq = false;
        handleSend(`Here is my translation:"${enteredText}"`);
        document.getElementById(
            "user-answer"
        ).innerText = `Your answer: ${enteredText}`;
        // setEnteredText("");
        document.getElementById("text-entry").disabled = true;
        document.getElementById("button-submit").disabled = true;
    };

    async function signOutUser() {
        const { error } = await supabase.auth.signOut();
        if (error) console.log(error);
        navigate("/");
    }

    const handleSelectLanguage = (selectedOption) => {
        console.log(`Selected language: ${selectedOption.value}`);
        setLanguage(selectedOption.value);
    };

    const handleSelectDifficulty = (selectedOption) => {
        console.log(`Selected difficulty: ${selectedOption.value}`);
        setDifficulty(selectedOption.value);
    };

    const handleChange = (event) => {
        setDifficulty(event.target.value);
    };

    function containsFeedback() {
        const str = getLastMsgFromChatGPT().toLowerCase();
        const keywords = ["correct", "partially", "perfect", " - "];
        for (const keyword of keywords) {
            if (str.includes(keyword)) {
                return true;
            }
        }
        return false;
    }

    function getLastUserMessage() {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender === "user") {
                return messages[i];
            }
        }
        return null; // No user message found
    }

    return (
        <>
            {Object.keys(username).length !== 0 ? (
                <>
                    <Box sx={{ flexGrow: 1 }}>
                        <AppBar position="static">
                            <Toolbar
                                sx={{ flexGrow: 1 }}
                                style={{
                                    backgroundColor: "initial",
                                }}
                            >
                                <h3 color="inherit">langAI</h3>
                                <Box sx={{ flexGrow: 1 }} />
                                <h3>{username}</h3>
                                <LogoutIcon
                                    style={{ marginLeft: "10px", cursor: 'pointer' }}
                                    onClick={() => {
                                        signOutUser();
                                    }}
                                />
                            </Toolbar>
                        </AppBar>
                    </Box>
                    {isStarted ? (
                        <div style={{ textAlign: "center" }}>
                            <h3>
                                {tokens > 0
                                    ? "Try to translate the following sentence:"
                                    : "No tokens remaining!"}
                            </h3>
                            <h2 id="sentence">
                                {!awaitingGPT ? (
                                    currentSentence
                                ) : (
                                    <CircularProgress size={20} />
                                )}
                            </h2>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    handleSubmitAnswer();
                                }}
                            >
                                <div>
                                    <TextField
                                        id="text-entry"
                                        hint="Enter your translation"
                                        autoComplete="off"
                                        style={{
                                            width: "50%",
                                        }}
                                        disabled={awaitingGPT || turnOver}
                                        onSubmit={(input) => {
                                            console.log(
                                                "Setting newSentenceReq to false."
                                            );
                                            isNewSentenceReq = false;
                                            handleSend(
                                                `Here is my translation:"${enteredText}"`
                                            );
                                            document.getElementById(
                                                "user-answer"
                                            ).innerText = `Your answer: ${enteredText}`;
                                        }}
                                        size="small"
                                        value={enteredText}
                                        onChange={handleTextChange}
                                    />

                                    <Button
                                        id="button-submit"
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        onClick={() => {
                                            setTurnOver(true);
                                            handleSubmitAnswer();
                                        }}
                                        disabled={
                                            awaitingGPT || lockUI || turnOver
                                        }
                                        style={{
                                            height: "40px",
                                            marginLeft: "2px",
                                        }}
                                    >
                                        <SendIcon />
                                    </Button>
                                    <h5>{"Tokens remaining: " + tokens}</h5>
                                </div>
                            </form>
                            <div style={{ marginTop: "4px" }}>
                                <Button
                                    variant="contained"
                                    style={{ marginRight: "4px" }}
                                    disabled={awaitingGPT || lockUI}
                                    onClick={() => {
                                        setTurnOver(false);
                                        setEnteredText("");
                                        isNewSentenceReq = true;
                                        handleSend("Give me another one.");
                                        document.getElementById(
                                            "user-answer"
                                        ).innerText = "";
                                        document.getElementById(
                                            "text-entry"
                                        ).disabled = {
                                            awaitingGPT,
                                        };
                                        document.getElementById(
                                            "button-submit"
                                        ).disabled = { awaitingGPT };
                                    }}
                                >
                                    Another
                                </Button>
                                <Button
                                    variant="contained"
                                    style={{ marginRight: "4px" }}
                                    disabled={awaitingGPT || lockUI}
                                    onClick={() => {
                                        isNewSentenceReq = false;
                                        setTurnOver(true);
                                        handleSend(
                                            "I give up. Please tell me the correct answer just this time."
                                        );
                                    }}
                                >
                                    Answer
                                </Button>
                                <Button
                                    variant="contained"
                                    style={{ marginRight: "4px" }}
                                    disabled={awaitingGPT || lockUI}
                                    onClick={() => {
                                        isNewSentenceReq = false;
                                        handleSend(
                                            "Please give me the vocabulary just this time."
                                        );
                                    }}
                                >
                                    Vocab
                                </Button>
                            </div>
                            <br></br>
                            <span style={{ maxWidth: "600px" }}>
                                {containsFeedback()
                                    ? getLastMsgFromChatGPT()
                                    : ""}
                            </span>
                        </div>
                    ) : (
                        <div style={{ textAlign: "center" }}>
                            <h3>{tokens > 0 ? "" : "No tokens remaining!"}</h3>
                            <FormControl component="fieldset">
                                <FormLabel
                                    component="legend"
                                    style={{ color: "black" }}
                                >
                                    Choose language:
                                </FormLabel>
                                <Dropdown
                                    className="poopers"
                                    options={[
                                        "Japanese",
                                        "Chinese",
                                        "Urdu",
                                        "French",
                                    ]}
                                    placeholder={"Select Language"}
                                    onChange={handleSelectLanguage}
                                />
                                <FormLabel
                                    component="legend"
                                    style={{ color: "black" }}
                                >
                                    Choose difficulty:
                                </FormLabel>
                                <Dropdown
                                    options={[
                                        "Beginner",
                                        "Intermediate",
                                        "Advanced",
                                    ]}
                                    placeholder={"Beginner"}
                                    onChange={handleSelectDifficulty}
                                />
                            </FormControl>
                            <br />
                            <Button
                                variant="contained"
                                style={{ marginRight: "4px" }}
                                disabled={awaitingGPT || lockUI}
                                onClick={() => {
                                    let initPrompt =
                                        "Please provide me a beginner level Japanese sentence.";
                                    initPrompt = initPrompt.replace(
                                        "beginner",
                                        difficulty
                                    );
                                    initPrompt = initPrompt.replace(
                                        "Japanese",
                                        language
                                    );
                                    setStarted(true);
                                    isNewSentenceReq = true;
                                    handleSend(initPrompt);
                                }}
                            >
                                Begin
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div style={{ textAlign: "center" }}>
                        <h1>Not Permitted</h1>
                        <button
                            onClick={() => {
                                navigate("/");
                            }}
                        >
                            Return
                        </button>
                    </div>
                </>
            )}
        </>
    );
}

export default Success;
