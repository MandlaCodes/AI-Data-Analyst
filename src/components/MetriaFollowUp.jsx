import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiSend, FiPlus } from "react-icons/fi";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

export const MetriaFollowUp = ({ activeDataset, authToken }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputQuery, setInputQuery] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (!activeDataset) {
            setIsVisible(false);
            setMessages([]);
            return;
        }

        const timer = setTimeout(() => {
            setIsVisible(true);
            setMessages([
                { 
                    sender: "metria", 
                    text: `Analysis complete for "${activeDataset.name}". What would you like to know?` 
                }
            ]);
        }, 1200);

        return () => clearTimeout(timer);
    }, [activeDataset]);

    const handleSend = async (queryText) => {
        const textToSend = queryText || inputQuery;
        if (!textToSend.trim() || !activeDataset) return;

        setMessages(prev => [...prev, { sender: "user", text: textToSend }]);
        setInputQuery("");
        setIsAnalyzing(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/ai/query`, {
                query: textToSend,
                dataset_name: activeDataset.name,
                metrics: activeDataset.metrics,
                data_sample: activeDataset.data
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            setMessages(prev => [...prev, { sender: "metria", text: res.data.answer }]);
        } catch (err) {
            setMessages(prev => [...prev, { sender: "metria", text: "Neural synthesis encountered an error. Please try again." }]);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!activeDataset) return null;

    return (
        <div className={`transition-all duration-1000 transform ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
        } my-32 px-6 lg:px-10 w-full`}>
            
            <div className="w-full mx-auto flex flex-col items-center">
                
                {/* Centered Heading */}
                <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-10 text-center">
                    The floor is yours, <span className="font-medium">Mandla</span>
                </h2>

                {/* Conversation History Feed (Appears if user chats) */}
                {messages.length > 1 && (
                    <div className="w-full max-w-5xl space-y-4 mb-8 max-h-[380px] overflow-y-auto pr-2">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-5 rounded-3xl text-xs md:text-sm leading-relaxed shadow-lg ${
                                    msg.sender === 'user' 
                                        ? 'bg-purple-600 text-white rounded-br-sm' 
                                        : 'bg-white/[0.04] border border-white/10 text-slate-200 rounded-bl-sm backdrop-blur-md'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isAnalyzing && (
                            <div className="flex justify-start">
                                <div className="bg-white/[0.04] border border-white/10 text-purple-300 p-4 rounded-3xl text-xs backdrop-blur-md animate-pulse">
                                    Metria is synthesizing parameters...
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Full-Width Pill Input Bar */}
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                    className="w-full bg-[#12141C] border border-white/10 hover:border-white/20 focus-within:border-purple-500 rounded-full px-5 py-4 flex items-center gap-4 shadow-2xl transition-all"
                >
                    <button 
                        type="button" 
                        className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0"
                    >
                        <FiPlus size={18} />
                    </button>
                    
                    <input 
                        type="text"
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        placeholder={`Ask Metria about ${activeDataset.name}...`}
                        className="flex-1 bg-transparent border-none text-xs md:text-sm text-white focus:outline-none placeholder:text-slate-500"
                    />

                    <button 
                        type="submit" 
                        className="p-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md flex items-center justify-center shrink-0"
                    >
                        <FiSend size={14} />
                    </button>
                </form>

            </div>
        </div>
    );
};