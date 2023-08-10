import { useState, useEffect, useRef } from "react";
import "./App.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import initPrompt from "./initPrompt.txt";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import MenuIcon from "@mui/icons-material/Menu";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@material-ui/core/IconButton";
import { IoIosFlag } from "react-icons/io";
import TextField from "@mui/material/TextField";
import { textAlign } from "@mui/system";
import SendIcon from "@mui/icons-material/Send";
import CircularProgress from "@material-ui/core/CircularProgress";
import Select from "@mui/material/Select";
import OutlinedInput from "@mui/material/OutlinedInput";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

const supabase = createClient(
    "https://dsrgrtdunqtylmafczpg.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcmdydGR1bnF0eWxtYWZjenBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODA2NDkwNjcsImV4cCI6MTk5NjIyNTA2N30.TTAafA8ayCRUsEZKKknAIt6m3xY1uxlFHMtiI2amxv0"
);

const systemMessage = {
    role: "system",
    content: "",
};

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

function Success() {
    const [apiKey, setApiKey] = useState("");
    const [isValidApiKey, setIsValidApiKey] = useState(false);
    const apiKeyEntryRef = useRef(null);
    const [username, setUsername] = useState({});
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [enteredText, setEnteredText] = useState("");
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [currentSentence, setCurrentSentence] = useState("...");
    var isNewSentenceReq = true;

    const handleSend = async (message) => {
        getLastMsgFromChatGPT();
        if (initPrompt.includes(".txt")) {
            await fetch(initPrompt)
                .then((r) => r.text())
                .then((text) => {
                    initPrompt = text;
                });
            message = initPrompt;
        }

        console.log("Sending: ", message);
        const newMessage = {
            message,
            direction: "outgoing",
            sender: "user",
        };

        const newMessages = [...messages, newMessage];

        setMessages(newMessages);

        // Initial system message to determine ChatGPT functionality
        // How it responds, how it talks, etc.
        setIsTyping(true);
        await processMessageToChatGPT(newMessages);
    };

    useEffect(() => {
        testApiKey();
        async function getUserData() {
            await supabase.auth.getUser().then((value) => {
                if (value.data?.user) {
                    setUsername(value.data.user);
                }
            });
        }
        getUserData();

        if (isValidApiKey) {
            handleSend(initPrompt);
        }
    }, [isValidApiKey]); // <-- empty dependency array

    async function processMessageToChatGPT(chatMessages) {
        // messages is an array of messages
        // Format messages for chatGPT API
        // API is expecting objects in format of { role: "user" or "assistant", "content": "message here"}
        // So we need to reformat

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
                    setCurrentSentence(
                        getJapanese(data.choices[0].message.content)
                    );
                }
                setIsTyping(false);
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
        setEnteredText("");
        document.getElementById("text-entry").disabled = true;
        document.getElementById("button-submit").disabled = true;
    };

    async function signOutUser() {
        const { error } = await supabase.auth.signOut();
        navigate("/lang");
    }

    useEffect(() => {
        if (apiKey !== "") {
            testApiKey();
        }
    }, [apiKey]);

    const testApiKey = async () => {
        try {
            const response = await fetch("https://api.openai.com/v1/engines", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
            });
            if (response.ok) {
                // setIsValidApiKey(true);
                console.log("API Key is valid");
                setIsValidApiKey(true);
            } else {
                // setIsValidApiKey(false);
                console.log("API Key is INVALID");
                setIsValidApiKey(false);
            }
        } catch (error) {
            // setIsValidApiKey(false);
            console.log("Error validating API key");
            setIsValidApiKey(false);
        }
    };

    return (
        <div style={{ textAlign: "center" }}>
            {Object.keys(username).length !== 0 ? (
                <>
                    <Box sx={{ flexGrow: 1 }}>
                        <AppBar position="static">
                            <Toolbar
                                sx={{ flexGrow: 1 }}
                                style={{
                                    backgroundColor: !isValidApiKey
                                        ? "red"
                                        : "initial",
                                }}
                            >
                                <p color="inherit">
                                    {isValidApiKey
                                        ? "Hello " + username?.email
                                        : "Hello " +
                                          username?.email +
                                          ", please enter valid OpenAI API key: "}
                                </p>
                                {!isValidApiKey && (
                                    <TextField
                                        id="apiKeyEntry"
                                        inputRef={apiKeyEntryRef}
                                        variant="standard"
                                        size="small"
                                    ></TextField>
                                )}
                                <Box sx={{ flexGrow: 1 }} />
                                {!isValidApiKey && (
                                    <Button
                                        color="inherit"
                                        onClick={() => {
                                            setApiKey(
                                                apiKeyEntryRef.current.value
                                            );
                                        }}
                                    >
                                        Test API Key
                                    </Button>
                                )}
                                <Button
                                    color="inherit"
                                    onClick={() => signOutUser()}
                                >
                                    Logout
                                </Button>
                            </Toolbar>
                        </AppBar>
                    </Box>
                    <div style={{ textAlign: "center" }}>
                        <h3>Try to translate the following sentence::</h3>
                        <h2 id="sentence" style={{ color: "grey" }}>
                            {currentSentence}
                        </h2>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleSubmitAnswer();
                            }}
                        >
                            <TextField
                                id="text-entry"
                                hint="Enter your translation"
                                style={{ width: "50%" }}
                                disabled={isTyping}
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
                                    handleSubmitAnswer();
                                }}
                                disabled={isTyping}
                                style={{ height: "40px", marginLeft: "2px" }}
                            >
                                <SendIcon />
                            </Button>
                        </form>
                        <div style={{ marginTop: "4px" }}>
                            <Button
                                variant="contained"
                                style={{ marginRight: "4px" }}
                                disabled={isTyping}
                                onClick={() => {
                                    isNewSentenceReq = true;
                                    handleSend("Give me another one.");
                                    document.getElementById(
                                        "user-answer"
                                    ).innerText = "";
                                    document.getElementById(
                                        "text-entry"
                                    ).disabled = {
                                        isTyping,
                                    };
                                    document.getElementById(
                                        "button-submit"
                                    ).disabled = { isTyping };
                                }}
                            >
                                Another
                            </Button>
                            <Button
                                variant="contained"
                                style={{ marginRight: "4px" }}
                                disabled={isTyping}
                                onClick={() => {
                                    isNewSentenceReq = false;
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
                                disabled={isTyping}
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

                        <p
                            id="user-answer"
                            style={{
                                textAlign: "left",
                                paddingLeft: "6px",
                                marginTop: "0px",
                                maxWidth: "600px",
                            }}
                        ></p>
                        <br></br>
                        <span style={{ maxWidth: "600px" }}>
                            {!isTyping ? (
                                getLastMsgFromChatGPT()
                            ) : (
                                <CircularProgress size={20} />
                            )}
                        </span>
                    </div>
                </>
            ) : (
                <>
                    <p>Not permitted</p>
                </>
            )}
        </div>
    );
}

export default Success;