import React, { useState } from "react";
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Rating,
    Select,
} from "@mui/material";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";


const supabase = createClient(
    process.env.REACT_APP_SUPABASE_PROJECT_URL,
    process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
);

export default function SubmitField({ username, setShowSettings }) {
    const navigate = useNavigate();

    const languages = ["Japanese", "Chinese", "French", "Urdu"];
    const [selectedLanguage, setSelectedLanguage] = useState();
    const [selectedDifficulty, setSelectedDifficulty] = useState(1);

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

    return (
        <>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                }}
            >
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
                                <MenuItem key={index} value={lang} style={{display: "block", textAlign: "center"}}>
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
                            // Update Supabase data
                            // Refresh page
                            const { error } = await supabase
                                .from("users")
                                .update({
                                    language: selectedLanguage,
                                    difficulty: selectedDifficulty,
                                })
                                .eq("email", username);
                            if (error) console.log(error);
                            navigate(0)
                        }}
                    >
                        Begin
                    </Button>
                </Box>
            </div>
        </>
    );
}
