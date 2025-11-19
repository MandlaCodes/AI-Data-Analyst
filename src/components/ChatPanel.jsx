import React, { useState, useRef, useEffect } from "react";
import Spinner from "./Spinner";

export default function ChatPanel({ profile }) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `Hello ${profile?.businessName}! I'm your AI analyst. What would you like to understand today?`,
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const aiMessage = {
        sender: "ai",
        text: "Analyzing your data… here's your insight: (AI response placeholder)",
      };

      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 1500);
  }

  return (
    <div className="w-full flex flex-col">
      <div className="p-6 rounded-3xl bg-black/30 border border-gray-800 shadow-xl backdrop-blur-xl">
        <h1 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-text">
          AI Ask
        </h1>

        <div className="h-[65vh] overflow-y-auto space-y-4 p-4 rounded-xl bg-gray-900/30 border border-gray-800 backdrop-blur-md">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[75%] p-4 rounded-2xl text-white shadow-md border backdrop-blur-sm ${
                m.sender === "user"
                  ? "ml-auto bg-purple-700/40 border-purple-500/50 hover:scale-105 transform transition"
                  : "bg-gray-800/50 border-gray-700 hover:scale-105 transform transition"
              }`}
            >
              {m.text}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 animate-pulse">
              <Spinner />
              <span className="text-gray-300">AI is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef}></div>
        </div>

        <div className="flex gap-3 mt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-gray-800/70 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 backdrop-blur-sm transition"
            placeholder="Ask a question about your business…"
          />
          <button
            onClick={sendMessage}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow-lg text-white font-semibold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
