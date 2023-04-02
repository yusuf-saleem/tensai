import { useState, useEffect } from "react";
import "./App.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { MessageInput } from "@chatscope/chat-ui-kit-react";
import initPrompt from "./initPrompt.txt";
import TinySegmenter from "tiny-segmenter";
import CircularProgress from "@material-ui/core/CircularProgress";

const API_KEY = "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";

const systemMessage = {
    role: "system",
    content:
        "Explain things like you're talking to a software professional with 2 years of experience.",
};

function App() {
    const [messages, setMessages] = useState([
        {
            message: "Hello, I'm ChatGPT! Ask me anything!",
            sentTime: "just now",
            sender: "ChatGPT",
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    // const [isCorrect, setCorrect] = useState(true);
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
        handleSend(initPrompt);
    }, []); // <-- empty dependency array

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
                Authorization: "Bearer " + API_KEY,
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

    return (
        <div className="App">
            <div
                style={{
                    position: "relative",
                    height: "800px",
                    width: "600px",
                    justifyContent: "center",
                    textAlign: "center",
                }}
            >
                <h2>What does this sentence mean?</h2>
                <h3 id="sentence" style={{ color: "grey" }}>
                    {currentSentence}
                </h3>
                <MessageInput
                    id="input"
                    placeholder="Enter answer"
                    attachButton={false}
                    style={{ maxWidth: "600px" }}
                    onSend={(input) => {
                        console.log("Setting newSentenceReq to false.");
                        isNewSentenceReq = false;
                        handleSend(`Here is my translation:"${input}"`);
                        document.getElementById(
                            "answer"
                        ).innerText = `Your answer: ${input}`;
                    }}
                    disabled={isTyping}
                />
                <h4
                    id="answer"
                    style={{
                        textAlign: "left",
                        paddingLeft: "6px",
                        marginTop: "0px",
                        maxWidth: "600px",
                    }}
                ></h4>
                <p style={{ maxWidth: "600px" }}>
                    {!isTyping ? (
                        getLastMsgFromChatGPT()
                    ) : (
                        <CircularProgress size={20} />
                    )}
                </p>
                <button
                    onClick={() => {
                        isNewSentenceReq = false;
                        handleSend("What is the correct answer?");
                    }}
                    disabled={isTyping}
                >
                    Answer
                </button>
                <button
                    onClick={() => {
                        isNewSentenceReq = true;
                        handleSend("Give me another one.");
                    }}
                    disabled={isTyping}
                >
                    Another
                </button>
                <button
                    onClick={() => {
                        isNewSentenceReq = false;
                        handleSend(
                            "Please give me the vocabulary just this time."
                        );
                    }}
                    disabled={isTyping}
                >
                    Get Vocab
                </button>
            </div>
        </div>
    );
}

export default App;
