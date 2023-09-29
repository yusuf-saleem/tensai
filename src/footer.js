import React from "react";

export default function Footer() {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                position: "relative",
            }}
        >
            <p
                style={{
                    position: "fixed",
                    bottom: 10,
                    left: 0,
                    width: "100%",
                    textAlign: "center",
                }}
            >
                © 2023 Yusuf Saleem.
            </p>
        </div>
    );
}
