import React, { useState } from "react";
import { Box, Button, Popover, Toolbar } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Fab from "@material-ui/core/Fab";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    customFab: {
        "&:hover": {
            backgroundColor: "transparent", 
        },
        "&:focus": {
            outline: "none", 
            backgroundColor: "transparent", 
        },
    },
}));

export default function Header({ username, signOutUser, setShowSettings }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const classes = useStyles();

    const hrStyle = {
        borderTop: '1px solid #DDE6ED',
        width: '100%', // Adjust the width to your preference
        margin: '10px 0', // Add margin for spacing
      };

    const handlePopoverOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Toolbar
                sx={{ flexGrow: 1 }}
                style={{
                    backgroundColor: "initial",
                    marginBottom: "40px",
                    marginTop: "6px",
                }}
            >
                <h1
                    style={{
                        fontFamily: "'Rubik Mono One', sans-serif",
                        letterSpacing: "0px",
                        fontSize: "36px",
                        color: "#213547",
                    }}
                >
                    TENS<span style={{ color: "#526D82" }}>AI</span>
                </h1>
                <Box sx={{ flexGrow: 1 }} />
                <div>
                    <Fab
                        elevation={0}
                        className={classes.customFab}
                        aria-owns={open ? "mouse-over-popover" : undefined}
                        aria-haspopup="false"
                        onClick={handlePopoverOpen}
                    >
                        <AccountCircleIcon style={{ fontSize: "48px" }} />
                    </Fab>
                    <Popover
                        className={classes.roundedPopover}
                        id="mouse-over-popover"
                        open={open}
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "left",
                        }}
                        onClose={handlePopoverClose}
                    >
                        <div
                            onMouseLeave={() => {
                                setTimeout(handlePopoverClose, 500);
                            }}
                        >
                            <Box
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    width: "auto",
                                    padding: "16px",
                                    backgroundColor: "",
                                }}
                            >
                                <h3>{username}</h3>
                                <hr style={hrStyle} />
                                <Button
                                    style={{
                                        color: "#9DB2BF",
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        width: "100%"
                                    }}
                                    onClick={() => {
                                        setShowSettings(true);
                                        handlePopoverClose();
                                    }}
                                >
                                    Settings
                                </Button>
                                <Button
                                    style={{
                                        color: "#9DB2BF",
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        width: "100%"
                                    }}
                                    onClick={() => {
                                        signOutUser();
                                        handlePopoverClose();
                                    }}
                                >
                                    Sign Out
                                </Button>
                            </Box>
                        </div>
                    </Popover>
                </div>
            </Toolbar>
        </Box>
    );
}
