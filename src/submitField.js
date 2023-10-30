import React from "react";
import TextField from "@mui/material/TextField";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import SendIcon from "@mui/icons-material/Send";
import CircularProgress from "@material-ui/core/CircularProgress";

// import {CheckIcon, ClearIcon, SendIcon} from "@mui/icons-material";

import Avatar from "@material-ui/core/Avatar";

export default function SubmitField({
    awaitingGPT,
    currentSentence,
    enteredText,
    onTextChange,
    onSendIconClick,
    onSubmit,
    disabled,
    result,
    turnOver,
    lockUI,
}) {
    return (
        <div
            style={{
                textAlign: "center",
                justifyContent: "center",
                alignContent: "center",
                alignItems: "center",
            }}
        >
            <h2 id="sentence" style={{ color: "#213547", width: "100%" }}>
                {!awaitingGPT || turnOver ? (
                    currentSentence
                ) : (
                    <CircularProgress size={30} />
                )}
            </h2>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            ></form>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    height: "40px",
                    margin: "5px 2px 5px",
                    justifyContent: "center",
                }}
            >
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSendIconClick();
                    }}
                    className="submitField"
                >
                    <TextField
                        id="text-entry"
                        value={enteredText}
                        onChange={onTextChange}
                        onSubmit={onSendIconClick}
                        variant="standard"
                        autoComplete="off"
                        disabled={disabled}
                        InputProps={{
                            disableUnderline: true,
                            style: {
                                marginLeft: "20px",
                                marginTop: "4px",
                                fontWeight: "bolder",
                                color: "black",
                            },
                        }}
                        style={{
                            height: "inherit",
                            width: "100%",
                            backgroundColor: "#F9F7F7",
                            opacity: "60%",
                            borderRadius: "50px",
                            marginRight: "-0px",
                            justifyContent: "center",
                        }}
                        placeholder="Enter translation..."
                    />
                </form>
                <Avatar
                    onClick={() => {
                        onSendIconClick();
                    }}
                    style={{
                        backgroundColor: "#F9F7F7",
                        border: `1px solid`,
                        color: "#DBE2EF",
                        cursor: "pointer",
                    }}
                >
                    {result === "incorrect" ? (
                        <ClearIcon style={{ color: "red" }} />
                    ) : result === "correct" ? (
                        <CheckIcon style={{ color: "green" }} />
                    ) : (
                        <SendIcon style={{ color: "black" }} />
                    )}
                </Avatar>
            </div>
        </div>
    );
}
