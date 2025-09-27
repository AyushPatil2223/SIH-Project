import React, { useState } from "react";

const Chatbot = () => {
    const [messages, setMessages] = useState([
        { sender: "bot", text: "👋 Hi, I’m your Ocean Data Assistant. Ask me about surface temperature!" },
    ]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([
            ...messages,
            { sender: "user", text: input },
            { sender: "bot", text: "🌡️ Surface temperature is 28.5 °C" },
        ]);
        setInput("");
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-700 via-blue-500 to-cyan-300 p-6">
            <div className="w-4/6 max-w-3xl h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 text-center font-semibold text-lg shadow-md">
                    🌊 Ocean Data Chatbot
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`px-4 py-2 rounded-2xl max-w-md shadow-md ${msg.sender === "user"
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-none"
                                    : "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="flex p-4 border-t bg-white">
                    <input
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Type your question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="ml-3 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl shadow-md hover:opacity-90 transition"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
