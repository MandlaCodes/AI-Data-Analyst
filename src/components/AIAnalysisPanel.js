import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiUser, FiMaximize2, FiMinimize2, FiCpu, FiActivity } from "react-icons/fi";
import { FaChartLine, FaLightbulb, FaRobot } from 'react-icons/fa';

/**
 * Typewriter Component
 * Handles the humanized typing effect.
 * Auto-scroll triggers have been removed.
 */
const Typewriter = ({ text, speed = 15, onComplete }) => {
    const [displayedText, setDisplayedText] = useState("");
    const hasCompleted = useRef(false);
    
    useEffect(() => {
        setDisplayedText(""); 
        hasCompleted.current = false;
        let i = 0;
        const timer = setInterval(() => {
            setDisplayedText(text.substring(0, i + 1));
            i++;
            if (i >= text.length) {
                clearInterval(timer);
                if (onComplete && !hasCompleted.current) {
                    hasCompleted.current = true;
                    onComplete();
                }
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return <span>{displayedText}</span>;
};

const MOCK_AI_INSIGHTS = {
    summary: "I've completed a deep-layer scan of the provided dataset streams. The metrics indicate a strong upward correlation between resource input and output efficiency, peaking mid-cycle. I've also identified a series of categorical outliers that might require your immediate attention to prevent skewed averages in your next reporting phase.",
    keyFindings: [
        { icon: FaChartLine, title: "Velocity Peak", detail: "Transaction speed increased by 22% during the identified peak window." },
        { icon: FaLightbulb, title: "Data Integrity", detail: "Three null-value clusters were automatically bypassed to maintain trend accuracy." }
    ]
};

const AIAnalysisPanel = ({ datasets, onComplete }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [query, setQuery] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [showFindings, setShowFindings] = useState(false);
    const [isFull, setIsFull] = useState(false);
    const scrollRef = useRef(null);

    // Initial Trigger: Start analyzing as soon as dataset is provided
    useEffect(() => {
        if (datasets?.length > 0 && !analysisResult) {
            startInitialAnalysis();
        }
    }, [datasets]);

    const startInitialAnalysis = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setAnalysisResult(MOCK_AI_INSIGHTS);
        setIsLoading(false);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = query;
        setQuery("");
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setChatHistory(prev => [...prev, { 
            role: 'assistant', 
            content: `I've cross-referenced "${userMsg}" with the active data nodes. The correlation is statistically significant ($p < 0.05$). Would you like me to visualize this specific subset?` 
        }]);
        setIsLoading(false);
    };

    const containerClasses = isFull 
        ? "fixed inset-0 z-[9999] bg-[#020617] w-screen h-screen flex flex-col"
        : "w-full h-full bg-[#020617]/80 backdrop-blur-md flex flex-col border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500";

    return (
        <div className={containerClasses}>
            {/* HEADER */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
                            <FaRobot className="text-purple-400" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#020617] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black text-white tracking-[0.3em] uppercase italic">Neural Insight v4</h2>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Processing Live Stream
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setIsFull(!isFull)}
                    className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                >
                    {isFull ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
                </button>
            </div>

            {/* MAIN CONVERSATION AREA */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
                {analysisResult && (
                    <div className="max-w-3xl mx-auto space-y-10">
                        <div className="flex gap-5">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 flex-shrink-0 flex items-center justify-center border border-white/10 text-purple-400">
                                <FiCpu size={18} />
                            </div>
                            <div className="space-y-6 flex-1 pt-1">
                                <div className="text-slate-200 text-base md:text-lg leading-relaxed font-medium">
                                    <Typewriter 
                                        text={analysisResult.summary} 
                                        onComplete={() => {
                                            setShowFindings(true);
                                            // onComplete is still called to update readyState, 
                                            // but the cinematic scroll logic has been removed from Visualizer.js
                                            if (onComplete) onComplete();
                                        }}
                                    />
                                </div>
                                
                                {showFindings && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                                        {analysisResult.keyFindings.map((f, i) => (
                                            <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 transition-colors">
                                                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                                                    <f.icon size={20}/>
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-black text-[10px] uppercase tracking-widest">{f.title}</h4>
                                                    <p className="text-slate-500 text-[11px] leading-tight">{f.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                                    msg.role === 'user' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 text-purple-400 border-white/10'
                                }`}>
                                    {msg.role === 'user' ? <FiUser size={18}/> : <FiActivity size={18}/>}
                                </div>
                                <div className={`max-w-[80%] p-5 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-purple-600/20 text-white border border-purple-500/30' 
                                        : 'bg-white/5 text-slate-300 border border-white/5'
                                }`}>
                                    {msg.role === 'assistant' ? <Typewriter text={msg.content} speed={10} /> : msg.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-5">
                                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-purple-500 border border-white/10 animate-pulse">
                                    <FiCpu size={18} />
                                </div>
                                <div className="bg-white/5 px-5 py-4 rounded-2xl border border-white/5 flex gap-1.5 items-center">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* INPUT DRAWER */}
            <div className="p-6 md:p-8 bg-black/40 border-t border-white/5">
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative">
                    <input 
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Inquire about data trends..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-7 pr-16 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all placeholder:text-slate-600"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !query.trim()}
                        className="absolute right-2.5 top-2.5 bottom-2.5 px-5 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <FiSend size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIAnalysisPanel;