import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Button,
    Popover,
    Toolbar,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Fab from "@material-ui/core/Fab";


export default function Header({username, signOutUser, setShowSettings}) {

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    let timeoutId = null;

    const handlePopoverOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    return (<Box sx={{ flexGrow: 1 }}>
        <Toolbar
            sx={{ flexGrow: 1 }}
            style={{
                backgroundColor: "initial",
                marginBottom: "40px",
            }}
        >
            <h2
                color="inherit"
            >
                TENSAI
            </h2>
            <Box sx={{ flexGrow: 1 }} />
            <div>
                <Fab
                    aria-owns={
                        open ? "mouse-over-popover" : undefined
                    }
                    aria-haspopup="true"
                    onMouseEnter={handlePopoverOpen}
                    onMouseLeave={() => { }}
                >
                    <AccountCircleIcon
                        style={{ fontSize: "48px" }}
                    />
                </Fab>
                <Popover
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
                        onMouseEnter={() =>
                            clearTimeout(timeoutId)
                        }
                        onMouseLeave={() => {
                            timeoutId = setTimeout(
                                handlePopoverClose,
                                500
                            );
                        }}
                    >
                        <Box
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: "auto",
                            }}
                        >
                            <p>{username}</p>
                            <Button
                                onClick={() => {
                                    setShowSettings(true);
                                    handlePopoverClose();
                                }}
                            >
                                Settings
                            </Button>
                            <Button
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
    </Box>)

}