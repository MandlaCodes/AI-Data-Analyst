/**
 * components/AIAnalysisPanel.js - UNIVERSAL DATA ENGINE
 * Updated: 2026-01-05 - Unified Card Expansion Design
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaBrain, FaRedo, FaSearch, FaDollarSign, FaRobot, FaCreditCard
} from 'react-icons/fa';
import { 
    FiTrendingUp, FiShield, FiZap, FiActivity, FiLayers, 
    FiFileText, FiCpu, FiNavigation, FiMaximize2, FiX, FiTerminal, FiTarget, FiArrowRight
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
    const panelRef = useRef(null);
    
    const userToken = localStorage.getItem("adt_token");

    const userProfile = useMemo(() => {
        const stored = localStorage.getItem("adt_profile");
        return stored ? JSON.parse(stored) : null;
    }, []);

    useEffect(() => {
        if (expandedInsight && panelRef.current) {
            panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [expandedInsight]);

    const finContext = useMemo(() => {
        const dataString = JSON.stringify(datasets);
        const symbols = ['$', 'R', '£', '€', '¥', '₹', '₱', '₩', 'A$', 'C$'];
        const detected = symbols.filter(s => dataString.includes(s));
        return {
            primary: detected[0] || null,
            isMulti: detected.length > 1,
            allDetected: detected
        };
    }, [datasets]);

    const phases = useMemo(() => [
        "Starting AI Analyst...",
        `Checking ${userProfile?.organization || 'System'} standards...`,
        finContext.primary ? `Prioritizing ${finContext.primary} notation...` : "Scanning data patterns...",
        "Identifying correlations...",
        "Calculating ROI impacts...",
        "Finalizing intelligence report..."
    ], [userProfile, finContext]);

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
                currency_hint: finContext.primary
            }));

            let systemRule = "Analyze this data accurately.";
            if (finContext.isMulti) {
                systemRule = `Multiple currencies detected (${finContext.allDetected.join(', ')}). Maintain specific symbols for each value.`;
            } else if (finContext.primary) {
                systemRule = `The user is working in ${finContext.primary}. Ensure ALL financial projections use the ${finContext.primary} symbol. Do not use USD/$.`;
            }

            const response = await axios.post(
                `${API_BASE_URL}/ai/analyze`,
                { 
                    context: datasets.length === 1 ? contextBundle[0] : contextBundle,
                    mode: datasets.length > 1 ? "comparison" : "single",
                    system_instructions: systemRule
                },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            let sanitizedData = { ...response.data };
            if (!finContext.allDetected.includes('$') && finContext.primary && sanitizedData.roi_impact) {
                sanitizedData.roi_impact = sanitizedData.roi_impact.replace(/\$/g, finContext.primary);
            }

            onUpdateAI(datasets[0].id, sanitizedData);
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
            ref={panelRef}
            className="relative overflow-hidden bg-black border border-white/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-700 group/panel"
            style={{ minHeight: '600px' }} 
        >
            <div className="absolute inset-0 opacity-40 pointer-events-none"
                 style={{ background: `radial-gradient(circle at 10% 10%, rgba(188, 19, 254, 0.1), transparent 70%)` }} />

            {/* Header */}
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
                                {loading ? "Scanning" : "Ready"} // {finContext.isMulti ? "Multi-Context" : (finContext.primary || "Global Standard")}
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
                            <FaRedo /> Re-Scan Data
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="py-32 md:py-48 flex flex-col items-center justify-center relative z-10 text-center"
                    > 
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                            <FiCpu className="text-purple-500 mb-6 md:mb-8 w-12 h-12 md:w-16 md:h-16" />
                        </motion.div>
                        <h3 className="text-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] px-4 leading-relaxed">{phases[analysisPhase]}</h3>
                    </motion.div>
                ) : insights ? (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 md:space-y-8 relative z-10"
                    >
                        {/* Summary Card */}
                        <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-white/[0.04] border border-white/10 relative overflow-hidden group/card cursor-pointer"
                             onClick={() => setExpandedInsight({ title: "Strategic Overview", content: insights.summary, icon: <FiFileText /> })}>
                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                <span className="text-purple-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] block">Strategic Overview</span>
                                <FiMaximize2 className="text-white/20 group-hover/card:text-white/50 transition-colors" />
                            </div>
                            <div className="text-lg md:text-3xl text-white font-light leading-snug tracking-tight break-words">
                                <TypewriterText text={insights.summary || "Generating overview..."} />
                            </div>
                            <div className="absolute bottom-0 left-6 right-6 md:left-10 md:right-10 h-1 rounded-t-full bg-purple-500 shadow-[0_0_20px_#bc13fe]" />
                        </div>

                        {/* Responsive Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div 
                                className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex flex-col gap-4 cursor-pointer hover:bg-white/[0.06] transition-all duration-300 group/card" 
                                onClick={() => setExpandedInsight({ title: "Main Discovery", content: insights.root_cause, icon: <FaSearch /> })}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="text-purple-500"><FaSearch className="w-5 h-5 md:w-6 md:h-6"/></div>
                                    <FiMaximize2 className="text-white/20 group-hover/card:text-white/50 transition-colors" />
                                </div>
                                <p className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Main Discovery</p>
                                <div className="text-white/80 text-sm leading-relaxed font-light line-clamp-3">
                                    {insights.root_cause}
                                </div>
                            </div>

                            <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex flex-col gap-4 group/card cursor-pointer"
                                 onClick={() => setExpandedInsight({ title: "Financial Impact", content: `Projected ROI Impact: ${insights.roi_impact}. This calculation is based on detected data patterns and organizational standards.`, icon: <FaCreditCard /> })}>
                                <div className="flex justify-between items-start">
                                    <div className="text-emerald-400"><FaCreditCard className="w-5 h-5 md:w-6 md:h-6"/></div>
                                    <FiMaximize2 className="text-white/20 group-hover/card:text-white/50 transition-colors" />
                                </div>
                                <p className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Impact ({finContext.primary || 'Value'})</p>
                                <div className="text-white text-2xl md:text-4xl font-black tracking-tighter">{insights.roi_impact || "0.00"}</div>
                            </div>
                        </div>

                        {/* Action Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            {[
                                { label: "Risks to Watch", text: insights.risk, icon: <FiShield />, isPurple: true },
                                { label: "Next Big Move", text: insights.opportunity, icon: <FiZap />, isPurple: false },
                                { label: "Top Action", text: insights.action, icon: <FiTarget />, isPurple: true }
                            ].map((item, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setExpandedInsight({ title: item.label, content: item.text, icon: item.icon })}
                                    className={`group/card p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border flex flex-col min-h-[180px] cursor-pointer transition-all hover:bg-white/[0.05] ${item.isPurple ? 'border-purple-500/30' : 'border-white/10'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2 rounded-lg ${item.isPurple ? 'bg-purple-600 text-white' : 'bg-white text-black'}`}>{item.icon}</div>
                                        <FiMaximize2 className="text-white/20 group-hover/card:text-white/50 transition-colors" />
                                    </div>
                                    <h4 className="text-white text-[9px] font-black uppercase tracking-widest mb-2">{item.label}</h4>
                                    <p className="text-white/60 text-xs line-clamp-3">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <div className="py-32 md:py-52 text-center border border-dashed border-white/10 rounded-[2rem] md:rounded-[3rem]"> 
                        <FaRobot className="text-white/5 mx-auto mb-6 w-10 h-10" />
                        <button onClick={runAnalysis} className="px-8 py-4 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                            Initialize Deep Scan
                        </button>
                    </div>
                )}
            </AnimatePresence>

            {/* EXPANDED VIEW OVERLAY */}
            <AnimatePresence>
                {expandedInsight && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-8 md:p-16 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-12">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/20 border border-purple-500/50 rounded-xl text-purple-500">
                                    {expandedInsight.icon}
                                </div>
                                <h3 className="text-white text-xl md:text-2xl font-black uppercase tracking-tighter">{expandedInsight.title}</h3>
                            </div>
                            <button onClick={() => setExpandedInsight(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
                            <p className="text-white/90 text-2xl md:text-4xl leading-relaxed font-light tracking-tight">
                                {expandedInsight.content}
                            </p>
                        </div>

                        <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Metria Intelligence Core // Verified</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-0 left-6 right-6 md:left-10 md:right-10 h-1 rounded-t-full bg-white shadow-[0_0_20px_white]" />
        </div>
    );
};

export default AIAnalysisPanel;