import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Button from "@mui/material/Button";
import { Auth } from "@supabase/auth-ui-react";
import Footer from "./footer";
import HelloLanguages from "./typer";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_PROJECT_URL,
    process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
);

const primary = {
    main: "#9DB2BF",
    light: "#DDE6ED",
    dark: "#526D82",
    contrastText: "#27374D",
};

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

    if (!session) {
        return (
            <ThemeProvider theme={theme}>
                <div className="App">
                    <div
                        style={{
                            height: "500px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#dbe2ef",
                        }}
                    >
                        <h1
                            style={{
                                fontFamily: "'Rubik Mono One', sans-serif",
                                color: "#213547",
                            }}
                        >
                            TENS<span style={{ color: "#526D82" }}>AI</span>
                        </h1>
                        <h2 style={{ color: "#526d82" }}>
                            Language learning powered by AI.
                        </h2>
                        <br />
                        <br />
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => {
                                navigate("/login");
                            }}
                        >
                            Get Started
                        </Button>
                    </div>
                    <div className="section">
                        <HelloLanguages></HelloLanguages>
                        <h2 style={{ fontWeight: "lighter" }}>
                            Think you know a language well?
                        </h2>
                        <h3>Tensai generates random sentences.</h3>
                        <h3 style={{ fontWeight: "bold" }}>
                            You attempt to translate them!
                        </h3>
                    </div>
                    <div style={{backgroundColor: "white"}}>
                        <Footer />
                    </div>
                </div>
            </ThemeProvider>
        );
    } else {
        navigate("/dashboard");
    }
}
