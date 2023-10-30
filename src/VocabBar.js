import React, { useState } from "react";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

const VocabBar = (props) => {
    const [isOpen, setOpen] = useState(false);
    const sidebarClass = isOpen ? "sidebar open" : "sidebar";
    const buttonClass = isOpen ? "sidebarButton open" : "sidebarButton";
    const { vocabList } = props;
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
                    <h2 style={{ textAlign: "center" }}>Vocab</h2>
                    {vocabList ? (
                        vocabList.map((vocabItem, index) => (
                            <div>
                                <div className="vocabCard" key={index}>
                                    <h2>{vocabItem.word}</h2>
                                    <p>Meaning</p>
                                    <div
                                        style={{
                                            borderTop: "1px solid lightgrey",
                                            margin: "10px 0",
                                        }}
                                    ></div>
                                </div>
                                <div className="vocabCard" key={index}>
                                    <h2>{vocabItem.word}</h2>
                                    <p>Meaning</p>
                                    <div
                                        style={{
                                            borderTop: "1px solid lightgrey",
                                            margin: "10px 0",
                                        }}
                                    ></div>
                                </div>
                                <div className="vocabCard" key={index}>
                                    <h2>{vocabItem.word}</h2>
                                    <p>Meaning</p>
                                    <div
                                        style={{
                                            borderTop: "1px solid lightgrey",
                                            margin: "10px 0",
                                        }}
                                    ></div>
                                </div>
                                <div className="vocabCard" key={index}>
                                    <h2>{vocabItem.word}</h2>
                                    <p>Meaning</p>
                                    <div
                                        style={{
                                            borderTop: "1px solid lightgrey",
                                            margin: "10px 0",
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Coming soon!</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default VocabBar;
