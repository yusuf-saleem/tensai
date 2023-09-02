import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import CircleIcon from "@mui/icons-material/Circle";
import SendIcon from "@mui/icons-material/Send";
import Avatar from "@material-ui/core/Avatar";

export default function SubmitField() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "40px",
        fontSize: "50px",
        margin: "5px 2px 5px",
      }}
    >
      <TextField
        id="text-entry"
        variant="standard"
        autoComplete="off"
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
          width: "50%",
          backgroundColor: "#F9F7F7",
          opacity: "60%",
          borderRadius: "50px",
          marginRight: "-40px",
        }}
        placeholder="Enter your translation..."
      />
      <Avatar
        style={{
          backgroundColor: "#F9F7F7",
          border: `1px solid`,
          color: "#DBE2EF",
          cursor: "pointer",
        }}
      >
        <SendIcon style={{ color: "black" }} />
      </Avatar>
    </div>
  );
}
