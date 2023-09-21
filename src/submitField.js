import React from "react";
import TextField from "@mui/material/TextField";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import SendIcon from "@mui/icons-material/Send";
// import {CheckIcon, ClearIcon, SendIcon} from "@mui/icons-material";

import Avatar from "@material-ui/core/Avatar";

export default function SubmitField({
    enteredText,
    onTextChange,
    onSendIconClick,
    disabled,
    result,
}) {
    return (
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
                style={{
                    height: "inherit",
                    width: "50%",
                    backgroundColor: "#F9F7F7",
                    opacity: "60%",
                    borderRadius: "50px",
                    marginRight: "-40px",
                    justifyContent: "center",
                }}
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
                    placeholder="Enter your translation..."
                />
            </form>
            <Avatar
                onClick={onSendIconClick}
                disabled={true}
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
    );
}
