import { useState, useEffect, useRef } from "react";
import "./App.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import SubmitField from "./submitField";

import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import CircularProgress from "@material-ui/core/CircularProgress";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { ReactCountryFlag } from 'react-country-flag';
import Rating from '@mui/material/Rating';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // Import CSS for styling

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
    const countryCodes = ['JP', 'CN', 'FR', 'PK'];
    const languages = ["japanese", "chinese", "french", "urdu"]
    const [selectedCountryIndex, setSelectedCountryIndex] = useState(0);
    const [apiKey, setApiKey] = useState(process.env.REACT_APP_OPENAI_API_KEY);
    const [username, setUsername] = useState("");
    const [tokens, setTokens] = useState(null);
    const [lockUI, setLockUI] = useState(false);
    const [isStarted, setStarted] = useState(false);
    const [turnOver, setTurnOver] = useState(false);
    const [result, setResult] = useState("");
    const [enteredText, setEnteredText] = useState("");
    const [language, setLanguage] = useState("Japanese");
    const [difficulty, setDifficulty] = useState("beginner");

    const [messages, setMessages] = useState([]);
    const [awaitingGPT, SetAwaitingGPT] = useState(false);
    const [currentSentence, setCurrentSentence] = useState("...");
    var isNewSentenceReq = true;

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

    async function pageInit() { }

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

    const handleDifficultyChange = (event, newValue) => {
        switch (newValue) {
            case 1:
                setDifficulty("beginner");
                break;
            case 2:
                setDifficulty("intermediate");
                break;
            case 3:
                setDifficulty("advanced");
                break;
            default:
                setDifficulty("beginner");
                break;
        }

    };

    const handleLanguageChange = (index) => {
        setLanguage(languages[index]);
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

    function getLastUserMessage() {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender === "user") {
                return messages[i];
            }
        }
        return null;
    }

    return (
        <>
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
                            <h2 color="inherit">LANG•AI</h2>
                            <Box sx={{ flexGrow: 1 }} />
                            <AccountCircleIcon
                                style={{ fontSize: "48px" }}
                                onClick={() => {
                                    signOutUser();
                                }}
                            />

                        </Toolbar>
                    </Box>
                    {isStarted ? (
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
                                        handleSend(`Give me another ${difficulty} level one.`);
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
                        <><div style={{ display: "flex", justifyContent: "center" }}>
                            <h3>{tokens > 0 ? "" : "No tokens remaining!"}</h3>
                            <Box display="flex" justifyContent="center"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                <h4>Learning</h4>
                                <Carousel
                                    showArrows={true}
                                    showThumbs={false}
                                    showStatus={false}
                                    showIndicators={false}
                                    infiniteLoop={true}
                                    onChange={handleLanguageChange}
                                    style={{
                                        innerHeight: "500px",
                                        innerWidth: "500px",
                                        '&.control-next': {
                                            color: 'red',
                                        }
                                    }}
                                >

                                    {countryCodes.map((countryCode, index) => (
                                        <div key={countryCode}>
                                            <ReactCountryFlag
                                                countryCode={countryCode}
                                                svg
                                                style={{ height: '50px', width: 'auto' }}
                                            />
                                        </div>
                                    ))}
                                </Carousel>
                                <h4>Difficulty</h4>
                                <Rating
                                    max={3}
                                    onChange={handleDifficultyChange}
                                    style={{ color: "#3F72AF" }} />
                                <Button
                                    variant="contained"
                                    style={{ color: "black", backgroundColor: "#F9F7F7", marginTop: "10px" }}
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
        </>
    );
}

export default Success;
