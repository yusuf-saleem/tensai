import React, { useState, useEffect } from "react";
import Typist from "react-typist";

const HelloLanguages = () => {
    const languages = [
        "今日は元気です。", // Japanese
        "¿Dónde está el baño?", // Spanish
        "Je suis un étudiant.", // French
        "Ich trinke Wasser.", // German
        "Mi piace il gelato.", // Italian
        "おはよう、元気ですか？", // Japanese
        "Hace sol en España.", // Spanish
        "J'aime les pommes.", // French
        "Ich habe einen Hund.", // German
        "Mi chiamo Maria.", // Italian
        "こんにちは、元気ですか？", // Japanese
        "Me gusta bailar.", // Spanish
        "Je mange du fromage.", // French
        "Ich spreche Deutsch.", // German
        "Mi piace la pizza.", // Italian
        "Bonjour, ça va ?", // French
        "Es ist kalt heute.", // German
        "Mi piace andare al mare.", // Italian
        "今天是星期五。", // Chinese (Simplified)
        "我喜欢吃饺子。", // Chinese (Simplified)
        "你好吗？", // Chinese (Simplified)
        "今天天气不错。", // Chinese (Simplified)
        "Hola, ¿cómo estás?", // Spanish
        "Je ne parle pas français.", // French
        "Ist das dein Buch?", // German
        "Mi casa es su casa.", // Spanish
        "È una bella giornata.", // Italian
    ];

    const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentLanguageIndex(
                (prevIndex) => (prevIndex + 1) % languages.length
            );
        }, 8000); // Change languages every 3 seconds (adjust as needed)

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <div>
            <Typist
                key={currentLanguageIndex} // Add a unique key to the Typist component
                cursor={{ show: true, blink: true }}
                onTypingDone={() => {
                    setTimeout(() => {
                        setCurrentLanguageIndex(
                            (prevIndex) => (prevIndex + 1) % languages.length
                        );
                    }, 1000); // Delay before moving to the next language
                }}
            >
                <span className="typist-font">
                    {languages[currentLanguageIndex]}
                </span>
                <Typist.Delay ms={1000} />
                <Typist.Backspace
                    count={13 + languages[currentLanguageIndex].length}
                    delay={100}
                />
            </Typist>
        </div>
    );
};

export default HelloLanguages;
