import { useState, useEffect, useRef } from "react";
import "./App.css";
import SubmitField from "./submitField";
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Popover,
    Rating,
    Select,
    Toolbar,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Fab from "@material-ui/core/Fab";
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
    process.env.REACT_APP_SUPABASE_API_KEY
);

const systemMessage = {
    role: "system",
    content: process.env.REACT_APP_SYSTEM_PROMPT,
};

function Success() {
    const navigate = useNavigate();
    const languages = ["Japanese", "Chinese", "French", "Urdu"];
    const [apiKey, setApiKey] = useState(process.env.REACT_APP_OPENAI_API_KEY);
    const [username, setUsername] = useState("");
    const [tokens, setTokens] = useState(null);
    const [lockUI, setLockUI] = useState(false);
    const [isStarted, setStarted] = useState(true);
    const [turnOver, setTurnOver] = useState(false);
    const [result, setResult] = useState("");
    const [enteredText, setEnteredText] = useState("");
    const [language, setLanguage] = useState("Japanese");
    const [difficulty, setDifficulty] = useState(1);
    const [messages, setMessages] = useState([]);
    const [awaitingGPT, SetAwaitingGPT] = useState(false);
    const [currentSentence, setCurrentSentence] = useState("...");
    var isNewSentenceReq = true;
    const [selectedLanguage, setSelectedLanguage] = useState();
    const [selectedDifficulty, setSelectedDifficulty] = useState(1);

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    let timeoutId = null;
    const hasEffectRun = useRef(false);

    useEffect(() => {
        getUserData();
    }, []);

    useEffect(() => {
        if (tokens > 0) {
            setLockUI(false);
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
                email = value.data.user.email;
                setUsername(value.data.user.email);
                registerNewUser(value.data.user.email);
            } else {
                console.log("Failed to get user data.");
            }
        });

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
        if (username != "") {
            const { error } = await supabase
                .from("users")
                .insert({ email: username });
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

    const handleTextChange = (event) => {
        setEnteredText(event.target.value);
    };

    const handleSubmitAnswer = (event) => {
        console.log("Setting newSentenceReq to false.");
        isNewSentenceReq = false;
        handleSend(`Here is my translation:"${enteredText}"`);

        document.getElementById("text-entry").disabled = true;
        document.getElementById("button-submit").disabled = true;
    };

    async function signOutUser() {
        const { error } = await supabase.auth.signOut();
        if (error) console.log(error);
        navigate("/");
    }

    const handleDifficultySelect = (event, newValue) => {
        switch (newValue) {
            case 1:
                setSelectedDifficulty(1);
                break;
            case 2:
                setSelectedDifficulty(2);
                break;
            case 3:
                setSelectedDifficulty(3);
                break;
            default:
                setSelectedDifficulty(1);
                break;
        }
    };

    const handleLanguageSelect = (e) => {
        console.log(e.target.value);
        setSelectedLanguage(e.target.value);
    };

    const handlePopoverOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

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
            {Object.keys(username).length !== 0 ? (
                <>
                    <Box sx={{ flexGrow: 1 }}>
                        <Toolbar
                            sx={{ flexGrow: 1 }}
                            style={{
                                backgroundColor: "initial",
                                marginBottom: "40px",
                            }}
                        >
                            <h2
                                onClick={() => {
                                    console.log(tokens);
                                }}
                                color="inherit"
                            >
                                LANG•AI
                            </h2>
                            <Box sx={{ flexGrow: 1 }} />
                            <div>
                                <Fab
                                    aria-owns={
                                        open ? "mouse-over-popover" : undefined
                                    }
                                    aria-haspopup="true"
                                    onMouseEnter={handlePopoverOpen}
                                    onMouseLeave={() => {}}
                                >
                                    <AccountCircleIcon
                                        style={{ fontSize: "48px" }}
                                    />
                                </Fab>
                                <Popover
                                    id="mouse-over-popover"
                                    open={open}
                                    anchorEl={anchorEl}
                                    anchorOrigin={{
                                        vertical: "bottom",
                                        horizontal: "right",
                                    }}
                                    transformOrigin={{
                                        vertical: "top",
                                        horizontal: "left",
                                    }}
                                    onClose={handlePopoverClose}
                                >
                                    <div
                                        onMouseEnter={() =>
                                            clearTimeout(timeoutId)
                                        }
                                        onMouseLeave={() => {
                                            timeoutId = setTimeout(
                                                handlePopoverClose,
                                                500
                                            );
                                        }}
                                    >
                                        <Box
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                width: "auto",
                                            }}
                                        >
                                            <p>{username}</p>
                                            <Button
                                                onClick={() => {
                                                    setStarted(false);
                                                    handlePopoverClose();
                                                }}
                                            >
                                                Settings
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    signOutUser();
                                                    handlePopoverClose();
                                                }}
                                            >
                                                Sign Out
                                            </Button>
                                        </Box>
                                    </div>
                                </Popover>
                            </div>
                        </Toolbar>
                    </Box>
                    {language !== null && isStarted == true ? (
                        <div
                            style={{
                                textAlign: "center",
                            }}
                        >
                            <h2 id="sentence">
                                {!awaitingGPT || turnOver ? (
                                    currentSentence
                                ) : (
                                    <CircularProgress size={30} />
                                )}
                            </h2>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    handleSubmitAnswer();
                                }}
                            ></form>
                            <SubmitField
                                enteredText={enteredText}
                                onTextChange={handleTextChange}
                                disabled={awaitingGPT || turnOver}
                                result={result}
                                onSendIconClick={() => {
                                    if (turnOver) {
                                        setTurnOver(false);
                                        setEnteredText("");
                                        setResult("");
                                        isNewSentenceReq = true;
                                        if (difficulty == 1) {
                                            handleSend(
                                                `Give me another beginner level one.`
                                            );
                                        } else if (difficulty == 2) {
                                            handleSend(
                                                `Give me another intermediate level one.`
                                            );
                                        } else if (difficulty == 3) {
                                            handleSend(
                                                `Give me another advanced level one.`
                                            );
                                        } else {
                                            handleSend(
                                                `Give me another beginner level one.`
                                            );
                                        }
                                    } else {
                                        isNewSentenceReq = false;
                                        setTurnOver(true);
                                        handleSend(
                                            `Here is my translation:"${enteredText}"`
                                        );
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <h3>
                                    {tokens > 0 ? "" : "No tokens remaining!"}
                                </h3>
                                <Box
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        width: "200px",
                                    }}
                                >
                                    <h4>Learning</h4>
                                    <FormControl fullWidth>
                                        <InputLabel id="demo-simple-select-label">
                                            Language
                                        </InputLabel>
                                        <Select
                                            labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            label="Language"
                                            defaultValue=""
                                            onChange={handleLanguageSelect}
                                        >
                                            {languages.map((lang, index) => (
                                                <MenuItem
                                                    key={index}
                                                    value={lang}
                                                >
                                                    {lang}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <h4>Difficulty</h4>
                                    <Rating
                                        max={3}
                                        value={selectedDifficulty}
                                        onChange={handleDifficultySelect}
                                        style={{ color: "#3F72AF" }}
                                    />
                                    <Button
                                        variant="contained"
                                        style={{
                                            marginTop: "10px",
                                        }}
                                        disabled={
                                            selectedLanguage === undefined ||
                                            selectedDifficulty === undefined
                                        }
                                        onClick={async () => {
                                            const { error } = await supabase
                                                .from("users")
                                                .update({
                                                    language: selectedLanguage,
                                                    difficulty:
                                                        selectedDifficulty,
                                                })
                                                .eq("email", username);
                                            if (error) console.log(error);
                                            
                                            setStarted(true);
                                            setMessages(null);
                                            getUserData();
                                            let initPrompt =
                                                process.env
                                                    .REACT_APP_INIT_PROMPT;
                                            switch (difficulty) {
                                                case 1:
                                                    // Already set to beginner
                                                    break;
                                                case 2:
                                                    initPrompt =
                                                        initPrompt.replace(
                                                            "beginner",
                                                            "intermediate"
                                                        );
                                                    break;
                                                case 3:
                                                    initPrompt =
                                                        initPrompt.replace(
                                                            "beginner",
                                                            "advanced"
                                                        );
                                                    break;
                                                default:
                                                    break;
                                            }
                                            initPrompt = initPrompt.replace(
                                                "Japanese",
                                                language
                                            );
                                            isNewSentenceReq = true;
                                            handleSend(initPrompt);
                                        }}
                                    >
                                        Begin
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            console.log(selectedLanguage);
                                            console.log(selectedDifficulty);
                                        }}
                                    >
                                        test
                                    </Button>
                                </Box>
                            </div>
                        </>
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
        </ThemeProvider>
    );
}

export default Success;
