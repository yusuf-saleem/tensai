import React, { useState, useEffect } from "react";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { Button, TextField } from "@mui/material";

const VocabBar = (props) => {
    const { supabase } = props;
    // var { vocabList } = props;
    const [vocabList, setVocabList] = useState([]);
    const { email } = props;
    const { language } = props;
    const [isOpen, setOpen] = useState(false);
    const sidebarClass = isOpen ? "sidebar open" : "sidebar closed";
    const buttonClass = isOpen ? "sidebarButton open" : "sidebarButton";

    const [newWord, setNewWord] = useState("");
    const [newDefinition, setNewDefinition] = useState("");
    const [refreshData, setRefreshData] = useState(false);

    useEffect(() => {
        if (email && language) {
            async function fetchVocabList() {
                try {
                    const { data: vocabList, error: vocabError } =
                        await supabase
                            .from("words")
                            .select()
                            .eq("email", email)
                            .eq("language", language);

                    if (vocabError) {
                        console.error("Error fetching vocab:", vocabError);
                    } else {
                        setVocabList(vocabList);
                    }
                } catch (error) {
                    console.error("An error occurred:", error);
                }
            }
            fetchVocabList()
                .then((result) => {
                })
                .catch((error) => {
                    console.error(error);
                });
            setRefreshData(false);
        }
    }, [refreshData]);

    const handleNewWordChange = (event) => {
        setNewWord(event.target.value);
    };

    const handleNewDefinitionChange = (event) => {
        setNewDefinition(event.target.value);
    };

    return (
        <div className="sidebar-container">
            <button
                onClick={() => {
                    setOpen(!isOpen);
                }}
                style={{ outline: "none" }}
                className={buttonClass}
            >
                {isOpen ? (
                    <ArrowRightIcon fontSize="large" />
                ) : (
                    <ArrowLeftIcon fontSize="large" />
                )}
            </button>
            <div className={sidebarClass}>
                <div className="sidebar-content">
                    <div className="vocabcard-container">
                        <h2 style={{ textAlign: "center" }}>Vocab</h2>
                        {vocabList ? (
                            vocabList.map((vocabItem, index) => (
                                <div
                                    className="vocabCard"
                                    key={index}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <h2>{vocabItem.word}</h2>
                                    <p>{vocabItem.definition}</p>
                                    <div style={{ flex: 1 }}></div>
                                    <Button
                                        variant="outlined"
                                        onClick={async () => {
                                            try {
                                                const { data, error } =
                                                    await supabase
                                                        .from("words")
                                                        .delete()
                                                        .eq(
                                                            "word",
                                                            vocabItem.word
                                                        )
                                                        .eq("definition", vocabItem.definition)
                                                        .eq("email", email);

                                                if (error) {
                                                    console.error(
                                                        "Error deleting record:",
                                                        error.message
                                                    );
                                                } else {
                                                    setRefreshData(true);
                                                }
                                            } catch (error) {
                                                console.error(
                                                    "Error adding record:",
                                                    error.message
                                                );
                                            }
                                        }}
                                    >
                                        Remove
                                    </Button>
                                    <div
                                        style={{
                                            borderTop: "1px dotted lightgrey",
                                            margin: "10px 0",
                                        }}
                                    />
                                </div>
                            ))
                        ) : (
                            <></>
                        )}
                    </div>
                    <div className="vocab-submit-container" style={{}}>
                        <TextField
                            id="filled-multiline-flexible"
                            value={newWord}
                            label="New Word"
                            variant="filled"
                            fullWidth
                            inputProps={{ maxLength: 16 }}
                            onChange={handleNewWordChange}
                        />
                        <br />
                        <br />
                        <TextField
                            id="filled-multiline-static"
                            value={newDefinition}
                            label="Meaning"
                            multiline
                            variant="filled"
                            fullWidth
                            inputProps={{ maxLength: 128 }}
                            maxRows={3}
                            onChange={handleNewDefinitionChange}
                        />
                        <br />
                        <br />
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={async () => {
                                const newWordObject = {
                                    word: newWord,
                                    language: language,
                                    email: email,
                                    definition: newDefinition,
                                };
                                try {
                                    const { data, error } = await supabase
                                        .from("words")
                                        .insert([newWordObject]);

                                    if (error) {
                                        console.error(
                                            "Error inserting record:",
                                            error.message
                                        );
                                    } else {
                                        setRefreshData(true);
                                    }
                                } catch (error) {
                                    console.error(
                                        "Error adding record:",
                                        error.message
                                    );
                                }
                                setNewWord("");
                                setNewDefinition("");
                            }}
                        >
                            Submit
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default VocabBar;
