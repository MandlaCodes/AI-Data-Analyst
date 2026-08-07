import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiSend, FiCpu, FiStar } from "react-icons/fi"; // Switched FiSparkles to FiStar

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
                    text: `I've finished synthesizing "${activeDataset.name}". What insights or anomalies would you like to unpack together?` 
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

    const suggestedPrompts = [
        "What are the primary bottlenecks?",
        "Summarize top revenue drivers",
        "Identify high-risk deals"
    ];

    return (
        <div className={`transition-all duration-1000 transform ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
        } mt-20 mb-24 px-6 lg:px-10`}>
            
            <div className="max-w-5xl mx-auto relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 rounded-[3.5rem] blur-xl opacity-40 group-hover:opacity-75 transition duration-1000 pointer-events-none" />

                <div className="relative bg-[#080B14] border border-purple-500/40 rounded-[3.5rem] p-8 md:p-12 shadow-2xl overflow-hidden">
                    
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(188,19,254,0.15),rgba(255,255,255,0))] pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/10 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-md animate-pulse" />
                                <div className="relative p-4 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl text-white shadow-lg">
                                    <FiCpu size={26} className="animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-black uppercase tracking-wider text-sm">Metria Neural Analyst</h3>
                                    <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">Active Core</span>
                                </div>
                                <p className="text-slate-400 text-[11px] font-medium tracking-wide mt-0.5">Ask questions, request deep-dives, or query variables in real-time</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-purple-400 text-[10px] font-bold uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-2xl w-fit">
                            <FiStar size={14} /> Ready for query
                        </div>
                    </div>

                    <div className="relative z-10 space-y-6 max-h-[420px] overflow-y-auto pr-2 mb-8">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-6 rounded-3xl text-xs md:text-sm leading-relaxed shadow-lg ${
                                    msg.sender === 'user' 
                                        ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-br-sm font-semibold' 
                                        : 'bg-white/[0.04] border border-white/10 text-slate-200 rounded-bl-sm font-normal backdrop-blur-md'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isAnalyzing && (
                            <div className="flex justify-start">
                                <div className="bg-white/[0.04] border border-white/10 text-purple-300 p-5 rounded-3xl text-xs backdrop-blur-md animate-pulse flex items-center gap-3">
                                    <FiCpu className="animate-spin text-purple-400" size={16} /> Metria is scanning parameters & computing data vectors...
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 flex flex-wrap gap-2 mb-6">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest self-center mr-2">Suggested:</span>
                        {suggestedPrompts.map((promptText, pIdx) => (
                            <button
                                key={pIdx}
                                onClick={() => handleSend(promptText)}
                                className="bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm"
                            >
                                {promptText}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative z-10 flex gap-3">
                        <div className="relative flex-1">
                            <input 
                                type="text"
                                value={inputQuery}
                                onChange={(e) => setInputQuery(e.target.value)}
                                placeholder={`Ask Metria anything about ${activeDataset.name}...`}
                                className="w-full bg-black/60 border border-white/15 focus:border-purple-500 rounded-3xl px-7 py-5 text-xs md:text-sm text-white focus:outline-none shadow-inner transition-all placeholder:text-slate-500"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-8 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center shrink-0 hover:scale-[1.02] active:scale-95"
                        >
                            <FiSend size={18} />
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};