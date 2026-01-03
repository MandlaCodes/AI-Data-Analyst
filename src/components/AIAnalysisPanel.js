/**
 * components/AIAnalysisPanel.js - FLEXIBLE TEXT EDITION
 * Updated: 2026-01-03
 */
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaBrain, FaRedo, FaSearch, FaDollarSign, FaRobot
} from 'react-icons/fa';
import { 
    FiTrendingUp, FiShield, FiZap, FiActivity, FiLayers, 
    FiFileText, FiCpu, FiNavigation, FiMaximize2, FiX, FiTerminal, FiTarget
} from 'react-icons/fi';

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

const TypewriterText = ({ text, delay = 5 }) => {
    const [displayedText, setDisplayedText] = useState("");
    useEffect(() => {
        setDisplayedText(""); 
        if (!text) return;
        let currentIndex = 0;
        const timer = setInterval(() => {
            if (currentIndex < text.length) {
                setDisplayedText(text.substring(0, currentIndex + 1));
                currentIndex++;
            } else {
                clearInterval(timer);
            }
        }, delay);
        return () => clearInterval(timer);
    }, [text, delay]);
    return <span>{displayedText}</span>;
};

const AIAnalysisPanel = ({ datasets = [], onUpdateAI }) => {
    const [loading, setLoading] = useState(false);
    const [analysisPhase, setAnalysisPhase] = useState(0);
    const [expandedInsight, setExpandedInsight] = useState(null); 
    
    const userToken = localStorage.getItem("adt_token");

    const userProfile = useMemo(() => {
        const stored = localStorage.getItem("adt_profile");
        return stored ? JSON.parse(stored) : null;
    }, []);

    const phases = useMemo(() => [
        "Starting AI Analyst...",
        `Checking ${userProfile?.organization || 'System'} standards...`,
        "Scanning your data...",
        "Finding patterns...",
        "Calculating potential profit...",
        "Finishing report..."
    ], [userProfile]);

    useEffect(() => {
        let interval;
        if (loading) {
            interval = setInterval(() => {
                setAnalysisPhase((prev) => (prev < phases.length - 1 ? prev + 1 : prev));
            }, 2000);
        } else {
            setAnalysisPhase(0);
        }
        return () => clearInterval(interval);
    }, [loading, phases.length]);

    if (!datasets || datasets.length === 0) return null;

    const runAnalysis = async () => {
        if (datasets.length === 0 || !userToken) return;
        setLoading(true);
        try {
            const contextBundle = datasets.map(ds => ({
                id: ds.id,
                name: ds.name,
                metrics: ds.metrics,
                rows: ds.rows,
                columns: ds.cols,
            }));

            const response = await axios.post(
                `${API_BASE_URL}/ai/analyze`,
                { 
                    context: datasets.length === 1 ? contextBundle[0] : contextBundle,
                    mode: datasets.length > 1 ? "comparison" : "single"
                },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            onUpdateAI(datasets[0].id, response.data);
        } catch (error) {
            console.error("AI Analysis failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const insights = datasets[0]?.aiStorage;
    const isMulti = datasets.length > 1;

    return (
        <div 
            className="relative overflow-hidden bg-black border border-white/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-700 group/panel"
            style={{ minHeight: '500px' }} 
        >
            <div className="absolute inset-0 opacity-40 pointer-events-none"
                 style={{ background: `radial-gradient(circle at 10% 10%, rgba(188, 19, 254, 0.1), transparent 70%)` }} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 md:mb-16 relative z-10">
                <div className="flex items-center gap-4 md:gap-6 w-full">
                    <div className="h-12 w-12 md:h-14 md:w-14 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                        {isMulti ? <FiLayers className="text-white w-6 h-6 md:w-7 md:h-7" /> : <FiTerminal className="text-purple-500 w-6 h-6 md:w-7 md:h-7" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-white/90 truncate">
                            {userProfile?.organization || "Metria"} <span className="text-purple-500">AI Analyst</span>
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${loading ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="text-[7px] md:text-[8px] text-white/40 font-bold uppercase tracking-widest whitespace-nowrap">
                                {loading ? "Scanning" : "Ready"} // {isMulti ? "Merged View" : "Deep Scan"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    {insights && !loading && (
                        <button 
                            onClick={runAnalysis} 
                            className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all"
                        >
                            <FaRedo /> Update Analysis
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-32 md:py-48 flex flex-col items-center justify-center relative z-10 text-center"> 
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                        <FiCpu className="text-purple-500 mb-6 md:mb-8 w-12 h-12 md:w-16 md:h-16" />
                    </motion.div>
                    <h3 className="text-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] px-4 leading-relaxed">{phases[analysisPhase]}</h3>
                </div>
            ) : insights ? (
                <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                    
                    <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-white/[0.04] border border-white/10 relative overflow-hidden h-auto">
                        <span className="text-purple-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] block mb-4 md:mb-6">Main Summary</span>
                        <div className="text-lg md:text-3xl text-white font-light leading-snug italic tracking-tight break-words">
                            <TypewriterText text={insights.summary || "Generating overview..."} />
                        </div>
                        <div className="absolute bottom-0 left-6 right-6 md:left-10 md:right-10 h-1 rounded-t-full bg-purple-500 shadow-[0_0_20px_#bc13fe]" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex flex-col gap-4 overflow-hidden h-auto group cursor-pointer" onClick={() => setExpandedInsight({ title: "Main Discovery", content: insights.root_cause, icon: <FaSearch className="w-5 h-5"/> })}>
                            <div className="flex justify-between items-start">
                                <div className="text-purple-500"><FaSearch className="w-5 h-5 md:w-6 md:h-6"/></div>
                                <div className="text-white/20 group-hover:text-white transition-colors">
                                    <FiMaximize2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Main Discovery</p>
                                <div className="text-white/80 text-sm leading-relaxed italic break-words">
                                    <TypewriterText text={insights.root_cause || "Analyzing root causes..."} />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex flex-col gap-4 overflow-hidden h-auto">
                            <div className="text-emerald-400"><FaDollarSign className="w-5 h-5 md:w-6 md:h-6"/></div>
                            <div className="min-w-0">
                                <p className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Money Impact</p>
                                <div className="text-white text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-tight break-words py-1">
                                    <TypewriterText text={insights.roi_impact || "$0.00"} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        {[
                            { label: "Risks to Watch", text: insights.risk, icon: <FiShield />, isPurple: true },
                            { label: "Next Big Move", text: insights.opportunity, icon: <FiZap />, isPurple: false },
                            { label: "Top Action", text: insights.action, icon: <FiTarget />, isPurple: true }
                        ].map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setExpandedInsight({ title: item.label, content: item.text, icon: item.icon })}
                                className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border flex flex-col min-h-[200px] h-auto relative overflow-hidden cursor-pointer transition-all hover:translate-y-[-4px] ${
                                    item.isPurple ? 'bg-purple-900/10 border-purple-500/30' : 'bg-white/[0.04] border-white/20'
                                }`}
                            >
                                <div className="relative z-10 flex-1">
                                    <div className={`p-2.5 md:p-3 w-fit rounded-xl border mb-4 md:mb-6 ${item.isPurple ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white border-white text-black'}`}>
                                        {item.icon}
                                    </div>
                                    <h4 className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] mb-3 md:mb-4">{item.label}</h4>
                                    <div className="text-white/70 text-xs md:text-sm leading-relaxed italic font-light break-words pb-4">
                                        <TypewriterText text={item.text || "Calculating..."} />
                                    </div>
                                </div>
                                <div className={`absolute bottom-0 left-6 right-6 md:left-8 md:right-8 h-1 rounded-t-full ${item.isPurple ? 'bg-purple-500 shadow-[0_0_15px_#bc13fe]' : 'bg-white shadow-[0_0_15px_white]'}`} />
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 md:pt-8 border-t border-white/5">
                        <span className="text-[7px] md:text-[9px] font-black text-white/20 uppercase tracking-[0.3em] md:tracking-[0.4em]">System v4.2.0</span>
                        <span className="text-[7px] md:text-[9px] font-black text-purple-500 uppercase tracking-[0.3em] md:tracking-[0.4em]">Confidence: {Math.round((insights.confidence || 0) * 100)}%</span>
                    </div>
                </div>
            ) : (
                <div className="py-32 md:py-52 text-center border border-dashed border-white/10 rounded-[2rem] md:rounded-[3rem] px-4"> 
                    <FaRobot className="text-white/5 mx-auto mb-6 w-10 h-10 md:w-12 md:h-12" />
                    <p className="text-white/20 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] mb-8">AI Analysis Required</p>
                    <button 
                        onClick={runAnalysis}
                        className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(188,19,254,0.2)]"
                    >
                        Initialize Deep Scan
                    </button>
                </div>
            )}
            
            <AnimatePresence>
                {expandedInsight && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[500] flex flex-row bg-black/98 backdrop-blur-2xl"
                    >
                        {/* SIDEBAR SPACER: This creates the gap so content doesn't go under your sidebar */}
                        <div className="hidden lg:block w-64 xl:w-72 flex-shrink-0" />

                        <div className="flex-1 flex items-center justify-center p-4 md:p-12 lg:p-20 overflow-hidden">
                            <motion.div 
                                initial={{ scale: 0.95, y: 30, opacity: 0 }} 
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] md:rounded-[4rem] flex flex-col p-8 md:p-16 lg:p-24 shadow-[0_0_100px_rgba(188,19,254,0.15)] max-h-[90vh]"
                            >
                                <button onClick={() => setExpandedInsight(null)} className="absolute top-6 right-6 md:top-10 md:right-10 p-3 bg-white/5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                                    <FiX className="w-6 h-6 md:w-8 md:h-8" />
                                </button>
                                
                                <div className="flex items-center gap-4 md:gap-8 mb-10 md:mb-14">
                                    <div className="p-4 md:p-6 bg-purple-600/10 rounded-2xl md:rounded-3xl border border-purple-500/30 text-purple-500 shrink-0">
                                        {React.cloneElement(expandedInsight.icon, { className: "w-8 h-8 md:w-12 md:h-12" })}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-purple-500 text-[10px] md:text-xs font-black uppercase tracking-[0.5em] mb-2">Expanded Insight</p>
                                        <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-white truncate">{expandedInsight.title}</h3>
                                    </div>
                                </div>

                                <div className="overflow-y-auto custom-scrollbar pr-4 flex-1">
                                    <p className="text-white/90 text-xl md:text-4xl leading-[1.4] font-light italic break-words selection:bg-purple-500/30">
                                        {expandedInsight.content}
                                    </p>
                                </div>

                                <div className="mt-10 md:mt-16 pt-8 border-t border-white/5 flex justify-between items-center text-white/20">
                                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Protocol_{expandedInsight.title?.replace(/\s+/g, '_')}</span>
                                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Metria_OS_Core</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-0 left-6 right-6 md:left-10 md:right-10 h-1 rounded-t-full bg-white shadow-[0_0_20px_white]" />
        </div>
    );
};

export default AIAnalysisPanel;