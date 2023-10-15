import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Footer from "./footer";

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_PROJECT_URL,
    process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
);

export default function App() {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (!session) {
        return (
            <div className="App">
                <header className="App-header">
                    <h1
                        style={{
                            fontFamily: "'Rubik Mono One', sans-serif",
                            color: "#213547",
                        }}
                    >
                        TENS<span style={{ color: "#526D82" }}>AI</span>
                    </h1>
                    <h2>Language learning powered by AI.</h2>
                    <br />
                    <br />
                    <h3>Please Log In</h3>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: "max-content" }}>
                            <Auth
                                supabaseClient={supabase}
                                onlyThirdPartyProviders="true"
                                redirectTo={window.location.origin + `/dashboard`}
                                appearance={{
                                    theme: ThemeSupa,
                                    variables: {
                                        default: {
                                            colors: {
                                                defaultButtonText: "#27374D",
                                                defaultButtonBackground:
                                                    "white",
                                                defaultButtonBackgroundHover:
                                                    "#9DB2BF",
                                            },
                                        },
                                    },
                                }}
                                providers={["google", "discord"]}
                            />
                        </div>

                        <Footer />
                    </div>
                </header>
            </div>
        );
    } else {
        navigate("/dashboard");
    }
}
