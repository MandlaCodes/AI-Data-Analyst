/**
 * components/AIAnalysisPanel.js - EXECUTIVE INTELLIGENCE ENGINE
 * Updated: 2026-01-26 - FIX: Smooth Post-Payment Landing & Auto-Run Sequence
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaRedo, FaSearch, FaRobot, FaVolumeUp, FaLayerGroup
} from 'react-icons/fa';
import { 
    FiShield, FiZap, FiCpu, FiX, FiTarget, FiCheckCircle, FiFileText, FiTrendingUp, FiActivity, FiLock, FiArrowRight
} from 'react-icons/fi';

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

// --- SUB-COMPONENTS ---
const AudioWaveform = ({ color = "#bc13fe" }) => (
    <div className="flex items-center gap-1 h-4">
        {[...Array(4)].map((_, i) => (
            <motion.div
                key={i}
                animate={{ height: [4, 16, 8, 14, 4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                className="w-1 rounded-full"
                style={{ backgroundColor: color }}
            />
        ))}
    </div>
);

const InsightCard = ({ title, content, icon: Icon, isPurple, onClick }) => (
    <div 
        onClick={onClick}
        className="relative group bg-[#111116] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col transition-all duration-300 hover:border-white/20 hover:translate-y-[-4px] shadow-2xl cursor-pointer"
    >
        <div className="h-1.5 w-full opacity-80" style={{ backgroundColor: isPurple ? '#bc13fe' : '#a5b4fc' }} />
        <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl bg-white/5 ${isPurple ? 'text-[#bc13fe]' : 'text-indigo-400'}`}>
                    <Icon size={20} />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPurple ? 'bg-[#bc13fe]' : 'bg-indigo-400'}`} />
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Live Analysis</span>
                </div>
            </div>
            <h4 className="text-white font-bold text-lg mb-3 tracking-tight group-hover:text-indigo-300 transition-colors">{title}</h4>
            <p className="text-white text-sm leading-relaxed mb-8 line-clamp-4 font-medium">{content || "Analyzing data vectors..."}</p>
            <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-center gap-3 text-[10px] text-white uppercase tracking-[0.2em] font-bold">
                    <FiCheckCircle className={isPurple ? 'text-[#bc13fe]' : 'text-indigo-400'} /> Verified Insight
                </div>
                <div className="flex items-center gap-3 text-[10px] text-white uppercase tracking-[0.2em] font-bold">
                    <FiCheckCircle className={isPurple ? 'text-[#bc13fe]' : 'text-indigo-400'} /> ROI Aligned
                </div>
            </div>
            <button className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${isPurple ? 'bg-[#bc13fe]/10 text-[#bc13fe] border border-[#bc13fe]/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                View Deep Intel
            </button>
        </div>
    </div>
);

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
            } else { clearInterval(timer); }
        }, delay);
        return () => clearInterval(timer);
    }, [text, delay]);
    return <span>{displayedText}</span>;
};

// --- MAIN COMPONENT ---
const AIAnalysisPanel = ({ datasets = [], onUpdateAI }) => {
    const [loading, setLoading] = useState(false);
    const [analysisPhase, setAnalysisPhase] = useState(0);
    const [expandedCard, setExpandedCard] = useState(null); 
    const [isFullReportOpen, setIsFullReportOpen] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [intelligenceMode, setIntelligenceMode] = useState(null);
    const [showModeSelector, setShowModeSelector] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    
    // SMOOTH LANDING STATES
    const [isLandingAfterPayment, setIsLandingAfterPayment] = useState(false);
    const [profile, setProfile] = useState(null);
    const userToken = localStorage.getItem("adt_token");
    const panelRef = useRef(null);
    const initializeButtonRef = useRef(null);
    const aiInsights = datasets[0]?.aiStorage;

    // 1. DETECTION: Catch the redirect immediately
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('session') === 'success' || params.get('success') === 'true' || params.get('session_id')) {
            setIsLandingAfterPayment(true);
            // Clean URL to prevent re-triggering on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // 2. FRESH PROFILE LOGIC + AUTO-RUN
    useEffect(() => {
        const syncProfileAndAutoRun = async () => {
            if (!userToken) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                const freshProfile = res.data;
                setProfile(freshProfile);
                localStorage.setItem("adt_profile", JSON.stringify(freshProfile));

                if (isLandingAfterPayment) {
                    // Show success screen for 2.5 seconds
                    setTimeout(() => {
                        setIsLandingAfterPayment(false);
                        setShowPaywall(false);

                        // Trigger Auto-Run sequence after overlay closes
                        setTimeout(() => {
                            if (datasets.length > 0) {
                                // Decide mode based on dataset count
                                const autoMode = datasets.length > 1 ? 'correlation' : 'standalone';
                                handleSelectMode(autoMode);
                                
                                // Smooth scroll to the processing area
                                panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 600);
                    }, 2500);
                }
            } catch (err) {
                console.error("Profile sync failed:", err);
                setIsLandingAfterPayment(false);
                const stored = localStorage.getItem("adt_profile");
                if (stored) setProfile(JSON.parse(stored));
            }
        };
        syncProfileAndAutoRun();
    }, [userToken, isLandingAfterPayment]);

    const phases = useMemo(() => [
        "Initializing AI Analyst...",
        `Aligning with ${profile?.organization || 'Corporate'} standards...`,
        "Syncing Neural models...",
        intelligenceMode === 'correlation' ? "Mapping cross-dataset dependencies..." : 
        intelligenceMode === 'compare' ? "Calculating performance variance..." : "Auditing standalone silos...",
        "Simulating ROI Impact...",
        "Finalizing Strategic Report..."
    ], [profile, intelligenceMode]);

    useEffect(() => {
        if (!showPaywall) setIsRedirecting(false);
    }, [showPaywall]);

    useEffect(() => {
        window.speechSynthesis.getVoices();
    }, []);

    useEffect(() => {
        let interval;
        if (loading) {
            interval = setInterval(() => {
                setAnalysisPhase((prev) => (prev < phases.length - 1 ? prev + 1 : prev));
            }, 2000);
        } else { setAnalysisPhase(0); }
        return () => clearInterval(interval);
    }, [loading, phases.length]);

    const handleStartTrial = async () => {
        setIsRedirecting(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/billing/start-trial`, {}, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (res.data.checkout_url) {
                window.location.href = res.data.checkout_url;
            }
        } catch (err) {
            console.error("Billing redirect failed", err);
            setIsRedirecting(false);
        }
    };

    const toggleSpeech = (textOverride) => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        let contentToRead = textOverride;
        if (isFullReportOpen) {
            contentToRead = `Executive Summary: ${aiInsights.summary}. Discovery: ${aiInsights.root_cause}. Risks: ${aiInsights.risk}. Opportunity: ${aiInsights.opportunity}. Priority: ${aiInsights.action}.`;
        }

        const utterance = new SpeechSynthesisUtterance(contentToRead);
        const voices = window.speechSynthesis.getVoices();
        const britishVoice = voices.find(v => v.lang.startsWith('en-GB'));

        utterance.voice = britishVoice || voices[0];
        utterance.rate = 0.9; 
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const runAnalysis = async (selectedMode) => {
        if (datasets.length === 0 || !userToken) return;
        setLoading(true);
        try {
            const contextBundle = datasets.map(ds => ({ 
                id: ds.id, 
                name: ds.name, 
                metrics: ds.metrics 
            }));

            const response = await axios.post(`${API_BASE_URL}/ai/analyze`, { 
                context: contextBundle,
                strategy: selectedMode || 'standalone' 
            }, { 
                headers: { Authorization: `Bearer ${userToken}` } 
            });

            onUpdateAI(datasets[0].id, response.data);
        } catch (error) { 
            console.error("AI Analysis failed:", error); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleSelectMode = (mode) => {
        setIntelligenceMode(mode);
        setShowModeSelector(false);
        runAnalysis(mode);
    };

    const handleInitialClick = () => {
        if (!profile?.is_trial_active) {
            setShowPaywall(true);
            return;
        }
        if (datasets.length > 1) {
            setShowModeSelector(true);
        } else {
            handleSelectMode('standalone');
        }
    };

    return (
        <div ref={panelRef} className="relative overflow-hidden px-0 py-8 md:py-16 transition-all duration-700 min-h-[600px]">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[140px] rounded-full pointer-events-none" />

            {/* --- SMOOTH LANDING OVERLAY --- */}
            <AnimatePresence>
                {isLandingAfterPayment && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[20000] bg-[#0a0a0f] flex flex-col items-center justify-center text-center px-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            transition={{ type: "spring", damping: 20 }}
                            className="relative p-12 max-w-lg"
                        >
                            <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                            <div className="relative mb-8">
                                <motion.div 
                                    animate={{ rotate: 360 }} 
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-4 border border-dashed border-emerald-500/30 rounded-full"
                                />
                                <FiCheckCircle className="text-emerald-400 text-7xl mx-auto relative z-10" />
                            </div>
                            <h2 className="text-white text-3xl md:text-4xl font-black uppercase tracking-[0.3em] mb-4">Neural Link Established</h2>
                            <p className="text-indigo-400 text-sm font-bold uppercase tracking-[0.4em] animate-pulse">AI Data Analyst Activated</p>
                            
                            <div className="mt-12 flex items-center justify-center gap-2">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                <span className="text-[10px] text-white/40 uppercase tracking-widest ml-2">Initiating Auto-Run</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PAYWALL MODAL */}
            <AnimatePresence>
                {showPaywall && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10005] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="w-full max-w-lg bg-[#0f0f13] border border-white/10 rounded-[3rem] p-10 text-center shadow-3xl overflow-hidden relative"
                        >
                            <button onClick={() => setShowPaywall(false)} className="absolute top-8 right-8 text-white/40 hover:text-white p-2 rounded-full hover:bg-white/5"><FiX size={24} /></button>
                            <div className="mb-8 flex justify-center">
                                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20">
                                    <FiLock className="text-indigo-400 text-3xl" />
                                </div>
                            </div>
                            <h2 className="text-white text-3xl font-black mb-4 tracking-tight uppercase">Neural Core Locked</h2>
                            <p className="text-white/60 mb-10 leading-relaxed">Advanced synergy audits and correlation mapping require an active Pro license.</p>
                            <div className="space-y-4">
                                <button onClick={handleStartTrial} className="w-full py-6 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 group shadow-xl shadow-indigo-500/20">
                                    {isRedirecting ? "Connecting..." : <>Start 7 Days Free <FiArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
                                </button>
                                <button onClick={() => setShowPaywall(false)} className="w-full py-4 text-white/30 hover:text-white/60 text-[11px] font-bold uppercase tracking-[0.2em]">Review data first</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODE SELECTOR */}
            <AnimatePresence>
                {showModeSelector && datasets.length > 1 && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4"
                    >
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl bg-[#111116] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10"><FaLayerGroup className="text-indigo-400" size={26} /></div>
                                    <h2 className="text-white font-black text-lg md:text-2xl tracking-tight">Intelligence Strategy</h2>
                                </div>
                                <button onClick={() => setShowModeSelector(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white"><FiX size={18} /></button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <button onClick={() => handleSelectMode('correlation')} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-400 hover:bg-indigo-500/5 transition-all text-left group">
                                    <FiZap className="text-indigo-400 mb-3" size={22} /><h4 className="text-white font-bold mb-1">Cross-Correlation</h4><p className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Map cross-stream dependencies</p>
                                </button>
                                <button onClick={() => handleSelectMode('compare')} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-400 hover:bg-emerald-500/5 transition-all text-left group">
                                    <FiTarget className="text-emerald-400 mb-3" size={22} /><h4 className="text-white font-bold mb-1">Comparative Benchmark</h4><p className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Analyze performance deltas</p>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER AREA */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                        <FiCpu className="text-indigo-400 w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-[13px] font-black uppercase tracking-[0.6em] text-white">
                            {profile?.organization || "STRATEGIC"} <span className="text-indigo-400">INTELLIGENCE</span>
                        </h2>
                    </div>
                </div>
                {aiInsights && !loading && (
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsFullReportOpen(true)} className="flex items-center gap-3 px-10 py-4 bg-indigo-500 text-white rounded-xl text-[15px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                           <FiFileText /> View full report
                        </button>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT SWITCHER */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-48 flex flex-col items-center justify-center relative z-10"> 
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                            <FiCpu className="text-indigo-400 mb-10 w-20 h-20 opacity-40" />
                        </motion.div>
                        <h3 className="text-white/80 text-[12px] font-bold uppercase tracking-[0.8em] text-center">{phases[analysisPhase]}</h3>
                    </motion.div>
                ) : aiInsights ? (
                    <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 relative z-10">
                        <div className="p-12 md:p-16 rounded-[3rem] bg-[#111116] border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="h-1 w-12 bg-indigo-400 rounded-full" />
                                    <span className="text-indigo-400 text-[12px] font-black uppercase tracking-[0.6em]">EXECUTIVE SUMMARY</span>
                                </div>
                                <div className="text-2xl md:text-3xl text-white font-medium leading-[1.5] tracking-tight max-w-5xl mb-12">
                                    <TypewriterText text={aiInsights.summary} />
                                </div>
                                <div className="flex flex-wrap gap-4 pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><FiTrendingUp size={18} /></div>
                                        <div>
                                            <p className="text-[9px] text-white/40 uppercase tracking-widest font-black">Projected ROI Impact</p>
                                            <p className="text-white font-bold text-sm uppercase">{aiInsights.roi_impact || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InsightCard title="Primary Root Cause" content={aiInsights.root_cause} icon={FaSearch} isPurple={false} onClick={() => setExpandedCard("root")} />
                            <InsightCard title="Risk Exposure" content={aiInsights.risk} icon={FiShield} isPurple={true} onClick={() => setExpandedCard("risk")} />
                            <InsightCard title="Growth Opportunity" content={aiInsights.opportunity} icon={FaRobot} isPurple={false} onClick={() => setExpandedCard("opp")} />
                            <InsightCard title="Recommended Action" content={aiInsights.action} icon={FiTarget} isPurple={true} onClick={() => setExpandedCard("action")} />
                        </div>
                    </motion.div>
                ) : (
                    <div className="py-48 flex flex-col items-center justify-center relative z-10">
                        <button 
                            ref={initializeButtonRef}
                            onClick={handleInitialClick}
                            className="px-12 py-6 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
                        >
                            Initialize Analysis
                        </button>
                    </div>
                )}
            </AnimatePresence>

            {/* FULL REPORT MODAL */}
            <AnimatePresence>
                {isFullReportOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10001] bg-[#0b0b11]/95 backdrop-blur-2xl p-6 md:p-10 md:pl-[320px] flex flex-col overflow-y-auto">
                        <div className="max-w-6xl mx-auto w-full">
                            <div className="flex justify-between items-center mb-12">
                                <h2 className="text-white text-2xl md:text-4xl font-black uppercase tracking-tight">Full Intelligence Briefing</h2>
                                <button onClick={() => setIsFullReportOpen(false)} className="text-white/60 hover:text-white"><FiX size={34} /></button>
                            </div>
                            <div className="space-y-12">
                                <Section label="Executive Summary" text={aiInsights.summary} />
                                <Section label="Primary Root Cause" text={aiInsights.root_cause} />
                                <Section label="Risk Exposure" text={aiInsights.risk} />
                                <Section label="Opportunity" text={aiInsights.opportunity} />
                                <Section label="Recommended Action" text={aiInsights.action} />
                            </div>
                            <div className="flex justify-end mt-12 gap-6 pb-20">
                                <button onClick={() => toggleSpeech()} className="flex items-center gap-3 px-10 py-4 bg-indigo-500 text-white rounded-xl text-[13px] font-black uppercase tracking-widest transition-all">
                                    <FaVolumeUp /> {isSpeaking ? "Stop" : "Read Briefing"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Section = ({ label, text }) => (
    <div className="border-l-2 border-indigo-500/20 pl-8">
        <h3 className="text-indigo-400 text-[12px] uppercase tracking-[0.5em] font-black mb-3">{label}</h3>
        <p className="text-white text-xl leading-relaxed font-light">{text}</p>
    </div>
);

export default AIAnalysisPanel;