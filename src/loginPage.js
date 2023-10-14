import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import Typist from "react-typist";
import Footer from "./footer";
import HelloLanguages from "./typer"


const supabase = createClient(
    process.env.REACT_APP_SUPABASE_PROJECT_URL,
    process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
);

export default function App() {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0);

    const languages = [
        "English",
        "Spanish",
        "French",
        "German",
        "Italian",
        "Japanese",
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentLanguageIndex(
                (prevIndex) => (prevIndex + 1) % languages.length
            );
        }, 3000); // Change languages every 3 seconds (adjust as needed)

        return () => {
            clearInterval(interval);
        };
    }, []);

    const currentLanguage = languages[currentLanguageIndex];

    if (!session) {
        return (
            <div className="App">
                <div
                    style={{
                        height: "500px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <h1
                        style={{
                            fontFamily: "'Rubik Mono One', sans-serif",
                        }}
                    >
                        TENS<span style={{ color: "#526D82" }}>AI</span>
                    </h1>
                    <h2 style={{ color: "#526d82" }}>
                        Language learning powered by AI.
                    </h2>
                    <br />
                    <br />
                </div>
                <div
                    style={{
                        height: "300px",
                        backgroundColor: "white",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "initial",
                        padding: "60px 240px",
                    }}
                >
                    <HelloLanguages></HelloLanguages>
                    <h2>
                        Think you know a language well?
                    </h2>
                    <h3>
                        Tensai generates random sentences.
                    </h3>
                    <h3 style={{fontWeight: "bold"}}>
                        You attempt to translate them!
                    </h3>
                </div>
                <Footer />
            </div>
        );
    } else {
        navigate("/dashboard");
    }
}
