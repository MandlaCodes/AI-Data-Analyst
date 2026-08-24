/**
 * components/AIAnalysisPanel.js - NEURAL INTELLIGENCE ENGINE
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaRedo, FaSearch, FaRobot, FaCreditCard, FaVolumeUp, FaCopy
} from 'react-icons/fa';
import { 
    FiShield, FiZap, FiCpu, FiX, FiTarget, FiCheckCircle, FiFileText
} from 'react-icons/fi';

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";
const PADDLE_PRICE_ID = "pri_01kz4eavw3bf6rddns5qn88w5y"; 

// Sub-component: Audio Waveform
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

// Sub-component: Insight Card
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
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Live Stream</span>
                </div>
            </div>
            <h4 className="text-white font-bold text-lg mb-3 tracking-tight group-hover:text-indigo-300 transition-colors">{title}</h4>
            <p className="text-white text-sm leading-relaxed mb-8 line-clamp-4 font-medium">{content || "Analyzing dataset metrics..."}</p>
            <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-center gap-3 text-[10px] text-white uppercase tracking-[0.2em] font-bold">
                    <FiCheckCircle className={isPurple ? 'text-[#bc13fe]' : 'text-indigo-400'} /> Verified Metrics
                </div>
                <div className="flex items-center gap-3 text-[10px] text-white uppercase tracking-[0.2em] font-bold">
                    <FiCheckCircle className={isPurple ? 'text-[#bc13fe]' : 'text-indigo-400'} /> High Confidence
                </div>
            </div>
            <button className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${isPurple ? 'bg-[#bc13fe]/10 text-[#bc13fe] border border-[#bc13fe]/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                View Strategy Brief
            </button>
        </div>
    </div>
);

// Sub-component: Typewriter
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

const AIAnalysisPanel = ({ datasets = [], onUpdateAI }) => {
    const [loading, setLoading] = useState(false);
    const [analysisPhase, setAnalysisPhase] = useState(0);
    const [expandedCard, setExpandedCard] = useState(null); 
    const [isFullReportOpen, setIsFullReportOpen] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [copied, setCopied] = useState(false);
    const [localAiInsights, setLocalAiInsights] = useState(null);
    
    // Multi-stream configuration state
    const [selectedMultiStreamMode, setSelectedMultiStreamMode] = useState(null);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

    const panelRef = useRef(null);
    
    const userToken = localStorage.getItem("adt_token");
    const userProfile = useMemo(() => {
        try {
            const stored = localStorage.getItem("adt_profile");
            return stored ? JSON.parse(stored) : {};
        } catch (e) { return {}; }
    }, []);

    const activeDataset = datasets[0];

    // Resilient state hook to capture cached data from database/local storage on refresh
    useEffect(() => {
        if (activeDataset) {
            const recoveredInsights = activeDataset.aiStorage || activeDataset.analysis || (activeDataset.summary ? activeDataset : null);
            setLocalAiInsights(recoveredInsights);
        } else {
            setLocalAiInsights(null);
        }
    }, [activeDataset?.id, activeDataset]);

    const aiInsights = localAiInsights || activeDataset?.aiStorage || activeDataset?.analysis;

    // Loading phase step descriptions
    const phases = useMemo(() => [
        "Initializing Data Engine...",
        "Evaluating core dataset metrics and parameters...",
        "Analyzing statistical variance and performance...",
        "Identifying primary bottlenecks and anomalies...",
        "Simulating strategic scenarios and financial impact...",
        "Assembling executive synthesis report..."
    ], []);

    // Reset multi-stream mode if dataset selection drops back to 1 or 0
    useEffect(() => {
        if (datasets.length <= 1) {
            setSelectedMultiStreamMode(null);
        }
    }, [datasets.length]);

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

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    const toggleSpeech = (textOverride) => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        let contentToRead = textOverride;
        if (isFullReportOpen && aiInsights) {
            contentToRead = `Executive strategy update. Summary: ${aiInsights.summary}. Primary bottleneck: ${aiInsights.root_cause}. Identified risks: ${aiInsights.risk}. Opportunity: ${aiInsights.opportunity}. Action items: ${aiInsights.action}.`;
        }

        const utterance = new SpeechSynthesisUtterance(contentToRead);
        const voices = window.speechSynthesis.getVoices();
        const britishVoice = voices.find(v => (v.lang.includes('en-GB')) && (v.name.includes('Female') || v.name.includes('UK') || v.name.includes('Google')));
        
        utterance.voice = britishVoice || voices.find(v => v.lang.includes('en-GB')) || voices[0];
        utterance.rate = 0.85; 
        utterance.pitch = 1.1;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    // Core execution function supporting both single datasets and multi-stream cross-analyses
    const executeAnalysisCall = async () => {
        if (!activeDataset) return;
        setLoading(true);
        try {
            let payloadBody = {};
            const isMultiStream = Array.isArray(datasets) && datasets.length > 1;

            if (isMultiStream) {
                const datasetContexts = datasets.map(d => {
                    const rawRows = d.data || d.rows || d.values || d.content || [];
                    return Array.isArray(rawRows) ? rawRows.map(row => {
                        if (Array.isArray(row)) {
                            return row.reduce((acc, val, i) => ({ ...acc, [`col_${i}`]: val }), {});
                        }
                        return row;
                    }) : [];
                }).filter(stream => stream.length > 0);

                payloadBody = { 
                    mode: selectedMultiStreamMode,
                    contexts: datasetContexts.length > 0 ? datasetContexts : [activeDataset.data || activeDataset.rows || []] 
                };
            } else {
                let payloadContext = [];
                if (Array.isArray(activeDataset.data)) {
                    payloadContext = activeDataset.data;
                } else if (Array.isArray(activeDataset.rows)) {
                    payloadContext = activeDataset.rows;
                } else if (Array.isArray(activeDataset)) {
                    payloadContext = activeDataset;
                }
                payloadBody = { context: payloadContext };
            }

            const response = await axios.post(
                `${API_BASE_URL}/ai/analyze`, 
                payloadBody, 
                { 
                    headers: { 
                        'Authorization': `Bearer ${userToken}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );

            if (response.data) {
                setLocalAiInsights(response.data);
                onUpdateAI(activeDataset.id, response.data);
            }
        } catch (error) { 
            console.error("AI Analysis failed:", error.response?.data || error.message); 
        } finally { 
            setLoading(false); 
        }
    };

    const runAnalysis = async () => {
        if (datasets.length === 0 || !userToken) {
            console.warn("Analysis aborted: No datasets or missing token.");
            return;
        }

        if (datasets.length > 1 && !selectedMultiStreamMode) {
            setIsSelectionModalOpen(true);
            return;
        }

        const isSubscribed = userProfile?.isPro || userProfile?.is_pro || userProfile?.isSubscribed;

        if (!isSubscribed) {
            const userId = userProfile?.user_id || userProfile?.id || userProfile?.userId;

            if (!userId) {
                alert("User session missing ID. Please log in again.");
                return;
            }

            if (window.Paddle) {
                const checkoutOptions = {
                    items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
                    customData: { user_id: String(userId) }
                };

                if (userProfile?.email) {
                    checkoutOptions.customer = { email: userProfile.email };
                }

                window.Paddle.Checkout.open(checkoutOptions);
            } else {
                alert("Payment gateway is initializing, please try again in a moment.");
            }
            return; 
        }

        await executeAnalysisCall();
    };

    const handleSelectOption = (mode) => {
        setSelectedMultiStreamMode(mode);
        setIsSelectionModalOpen(false);
    };

    useEffect(() => {
        if (window.Paddle) {
            window.Paddle.Update({
                eventCallback: (event) => {
                    if (event.name === "checkout.completed") {
                        if (window.Paddle.Checkout) {
                            window.Paddle.Checkout.close();
                        }

                        const currentProfile = JSON.parse(localStorage.getItem("adt_profile") || "{}");
                        currentProfile.isPro = true;
                        currentProfile.is_pro = true;
                        localStorage.setItem("adt_profile", JSON.stringify(currentProfile));

                        setTimeout(() => {
                            executeAnalysisCall();
                        }, 500);
                    }
                }
            });
        }
    }, [datasets, userToken, selectedMultiStreamMode]);

    return (
        <div ref={panelRef} className="relative overflow-hidden p-8 md:p-16 transition-all duration-700 min-h-[600px]">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[140px] rounded-full pointer-events-none" />

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                        <FiCpu className="text-indigo-400 w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-[13px] font-black uppercase tracking-[0.6em] text-white">
                            {userProfile?.organization || "ORGANIZATION"} <span className="text-indigo-400">INTELLIGENCE</span>
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{loading ? "Synthesizing Data" : "Neural Decision Engine Active"}</span>
                        </div>
                    </div>
                </div>
                {aiInsights && !loading && (
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsFullReportOpen(true)} className="flex items-center gap-3 px-8 py-4 bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg shadow-indigo-500/20">
                           <FiFileText /> View Full Brief
                        </button>
                        <button onClick={runAnalysis} className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                            <FaRedo className="text-[9px]" /> Sync Live Feed
                        </button>
                    </div>
                )}
            </div>

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
                        
                        {/* Executive Summary Card */}
                        <div className="p-12 md:p-16 rounded-[3rem] bg-[#111116] border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="flex justify-between items-start mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-1 w-12 bg-indigo-400 rounded-full" />
                                    <span className="text-indigo-400 text-[12px] font-black uppercase tracking-[0.6em]">EXECUTIVE SUMMARY BRIEF</span>
                                </div>
                                <button 
                                    onClick={() => handleCopy(aiInsights.summary)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-all font-bold uppercase tracking-wider"
                                >
                                    <FaCopy size={12} /> {copied ? "Copied!" : "Copy Brief"}
                                </button>
                            </div>
                            <div className="text-2xl md:text-3xl text-white font-medium leading-[1.5] tracking-tight max-w-5xl">
                                <TypewriterText text={aiInsights.summary} />
                            </div>
                        </div>

                        {/* Middle Stat Panels */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-10 md:p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-xl relative overflow-hidden">
                                <div className="p-4 w-fit bg-indigo-500/10 rounded-2xl text-indigo-400 mb-8 border border-indigo-500/20"><FaSearch size={20} /></div>
                                <h4 className="text-[13px] font-black text-white uppercase tracking-[0.4em] mb-4">PRIMARY BOTTLENECK & DISCOVERY</h4>
                                <div className="text-white text-2xl leading-[1.6] font-semibold">{aiInsights.root_cause}</div>
                            </div>
                            <div className="p-10 md:p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-xl relative overflow-hidden">
                                <div className="p-4 w-fit bg-emerald-500/10 rounded-2xl text-emerald-400 mb-8 border border-emerald-500/20"><FaCreditCard size={20} /></div>
                                <h4 className="text-[13px] font-black text-white uppercase tracking-[0.4em] mb-4">PROJECTED FINANCIAL & ROI IMPACT</h4>
                                <div className="text-white text-2xl leading-[1.6] font-semibold">Value Delta: <span className="text-emerald-400">{aiInsights.roi_impact || "Recalculating yield..."}</span></div>
                            </div>
                        </div>

                        {/* Bottom Action / Risk Matrix */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InsightCard title="Identified Risks" content={aiInsights?.risk} icon={FiShield} isPurple onClick={() => setExpandedCard({ title: "Identified Risks", content: aiInsights?.risk, icon: FiShield, color: "text-[#bc13fe]" })} />
                            <InsightCard title="Strategic Opportunities" content={aiInsights?.opportunity} icon={FiZap} onClick={() => setExpandedCard({ title: "Strategic Opportunities", content: aiInsights?.opportunity, icon: FiZap, color: "text-indigo-400" })} />
                            <InsightCard title="Immediate Priority Action" content={aiInsights?.action} icon={FiTarget} isPurple onClick={() => setExpandedCard({ title: "Immediate Priority Action", content: aiInsights?.action, icon: FiTarget, color: "text-[#bc13fe]" })} />
                        </div>
                    </motion.div>
                ) : (
                    <div className="py-56 text-center border border-dashed border-white/10 rounded-[4rem]"> 
                        <FaRobot className="text-white/20 w-16 h-16 mx-auto mb-10 animate-bounce" />
                        <button onClick={runAnalysis} className="px-16 py-6 bg-indigo-400 text-black rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_30px_rgba(129,140,248,0.3)]">
                            {datasets.length > 1 && !selectedMultiStreamMode ? "Select Cross-Stream Mode" : "Generate Strategic Brief"}
                        </button>
                    </div>
                )}
            </AnimatePresence>

            {/* Multi-Stream Option Selection Modal */}
            <AnimatePresence>
                {isSelectionModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSelectionModalOpen(false)} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-[3rem] p-10 flex flex-col gap-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center border-b border-white/5 pb-6">
                                <h3 className="text-white text-xl font-bold uppercase tracking-wider">Select Cross-Stream Analysis Mode</h3>
                                <button onClick={() => setIsSelectionModalOpen(false)} className="p-3 bg-white/5 rounded-full text-white border border-white/10 hover:bg-red-500/20 transition-all"><FiX size={20} /></button>
                            </div>
                            <p className="text-white/60 text-sm">Multiple datasets detected. Choose how you want the intelligence engine to process them before generating your brief:</p>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    onClick={() => handleSelectOption('compare')}
                                    className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-400 text-left transition-all group"
                                >
                                    <div className="text-white font-bold text-base mb-1 group-hover:text-indigo-400">Comparative Analysis</div>
                                    <div className="text-white/40 text-xs">Evaluate variances, performance gaps, and side-by-side metric deviations across streams.</div>
                                </button>
                                <button 
                                    onClick={() => handleSelectOption('merge')}
                                    className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-400 text-left transition-all group"
                                >
                                    <div className="text-white font-bold text-base mb-1 group-hover:text-indigo-400">Unified Synthesis</div>
                                    <div className="text-white/40 text-xs">Combine metrics into a singular unified model to locate global bottlenecks and macro trends.</div>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal for Reports / Insights */}
            <AnimatePresence>
                {(expandedCard || isFullReportOpen) && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setExpandedCard(null); setIsFullReportOpen(false); window.speechSynthesis.cancel(); setIsSpeaking(false); }} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-6xl max-h-[85vh] bg-[#0a0a0f] border border-white/10 rounded-[3.5rem] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(188,19,254,0.1)]"
                        >
                            <div className="p-8 md:p-12 flex justify-between items-center border-b border-white/5 bg-[#111116]">
                                <div className="flex items-center gap-6">
                                    <div className={`p-5 bg-white/5 rounded-2xl ${isFullReportOpen ? 'text-[#a5b4fc]' : (expandedCard ? expandedCard.color : '')}`}>
                                        {isFullReportOpen ? <FiFileText size={30} /> : (expandedCard && <expandedCard.icon size={30} />)}
                                    </div>
                                    <h3 className="text-white text-3xl font-bold uppercase tracking-tight">{isFullReportOpen ? "Full Strategic Brief" : (expandedCard && expandedCard.title)}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => toggleSpeech(isFullReportOpen ? "" : (expandedCard ? expandedCard.content : ""))}
                                        className={`flex items-center gap-4 px-8 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest border transition-all ${isSpeaking ? 'bg-[#bc13fe]/20 text-[#bc13fe] border-[#bc13fe]/30' : 'bg-white/5 text-white border-white/10 hover:bg-white hover:text-black'}`}
                                    >
                                        {isSpeaking ? <><AudioWaveform /> Mute Briefing</> : <><FaVolumeUp /> Voice Strategy</>}
                                    </button>
                                    <button onClick={() => { setExpandedCard(null); setIsFullReportOpen(false); window.speechSynthesis.cancel(); setIsSpeaking(false); }} className="p-5 bg-white/5 rounded-full text-white border border-white/10 hover:bg-red-500/20 transition-all"><FiX size={26} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 md:p-20 bg-[#050505]/80">
                                {isFullReportOpen ? (
                                    <div className="space-y-16 max-w-4xl mx-auto font-sans">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">01 Executive Summary</span>
                                                <button 
                                                    onClick={() => handleCopy(aiInsights?.summary)}
                                                    className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300"
                                                >
                                                    <FaCopy /> Copy Summary
                                                </button>
                                            </div>
                                            <p className="text-white text-3xl font-light leading-relaxed">{aiInsights?.summary}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-4">
                                                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">02 Primary Bottlenecks</span>
                                                <p className="text-white/80 text-xl leading-relaxed font-medium">{aiInsights?.root_cause}</p>
                                            </div>
                                            <div className="space-y-4">
                                                <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">03 Operational & Data Risks</span>
                                                <p className="text-white/80 text-xl leading-relaxed font-medium">{aiInsights?.risk}</p>
                                            </div>
                                            <div className="space-y-4">
                                                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em]">04 Growth Opportunities</span>
                                                <p className="text-white/80 text-xl leading-relaxed font-medium">{aiInsights?.opportunity}</p>
                                            </div>
                                            <div className="space-y-4">
                                                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">05 Strategic Action Items</span>
                                                <p className="text-white/80 text-xl leading-relaxed font-medium">{aiInsights?.action}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    expandedCard && <p className="text-white/95 text-3xl md:text-5xl leading-[1.45] font-light tracking-tight">{expandedCard.content}</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIAnalysisPanel;