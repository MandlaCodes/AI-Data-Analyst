import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiSend, FiCpu, FiHelpCircle } from "react-icons/fi";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

export const MetriaFollowUp = ({ activeDataset, authToken }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputQuery, setInputQuery] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Trigger the "teacher follow-up" animation a moment after the dataset loads
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
                    text: `I've finished synthesizing "${activeDataset.name}". Do you have any questions about these metrics or want to dive deeper into specific trends?` 
                }
            ]);
        }, 1200); // 1.2s delay so it feels like a natural follow-up prompt after reading the brief

        return () => clearTimeout(timer);
    }, [activeDataset]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputQuery.trim() || !activeDataset) return;

        const userMsg = inputQuery;
        setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
        setInputQuery("");
        setIsAnalyzing(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/ai/query`, {
                query: userMsg,
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
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        } mt-16 mb-20 px-6 lg:px-10`}>
            <div className="max-w-4xl mx-auto bg-[#0F172A] border border-purple-500/30 rounded-[3rem] p-8 md:p-10 shadow-[0_0_50px_rgba(188,19,254,0.08)] relative overflow-hidden">
                
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center gap-3 pb-6 border-b border-white/5 mb-6">
                    <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400">
                        <FiHelpCircle size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase tracking-wider text-xs">Metria Neural Follow-Up</h3>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Interactive Analyst Session</p>
                    </div>
                </div>

                {/* Conversation Feed */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 mb-6">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                                msg.sender === 'user' 
                                    ? 'bg-purple-600 text-white rounded-br-none font-medium' 
                                    : 'bg-black/40 border border-white/10 text-slate-300 rounded-bl-none font-light'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isAnalyzing && (
                        <div className="flex justify-start">
                            <div className="bg-black/40 border border-white/10 text-slate-400 p-4 rounded-2xl text-xs animate-pulse flex items-center gap-2">
                                <FiCpu className="animate-spin text-purple-400" size={14} /> Metria is querying dataset parameters...
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSend} className="flex gap-3 pt-2">
                    <input 
                        type="text"
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        placeholder="Ask a follow-up question (e.g., 'Why did sales drop in July?')..."
                        className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-xs md:text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                    />
                    <button type="submit" className="bg-white text-black hover:bg-purple-600 hover:text-white px-7 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center shadow-lg">
                        <FiSend size={16} />
                    </button>
                </form>

            </div>
        </div>
    );
};