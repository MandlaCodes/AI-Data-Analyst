/**
 * components/AIAnalysisPanel.js - EXECUTIVE INTELLIGENCE ENGINE
 * Updated: 2026-01-10 - Production Grade British Female Voice Sync
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaRedo, FaSearch, FaRobot, FaCreditCard, FaVolumeUp, FaStop
} from 'react-icons/fa';
import { 
    FiShield, FiZap, FiCpu, FiX, FiTarget, FiCheckCircle, FiFileText
} from 'react-icons/fi';

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

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

const AIAnalysisPanel = ({ datasets = [], onUpdateAI }) => {
    const [loading, setLoading] = useState(false);
    const [analysisPhase, setAnalysisPhase] = useState(0);
    const [expandedCard, setExpandedCard] = useState(null); 
    const [isFullReportOpen, setIsFullReportOpen] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const panelRef = useRef(null);
    
    const userToken = localStorage.getItem("adt_token");
    const userProfile = useMemo(() => {
        const stored = localStorage.getItem("adt_profile");
        return stored ? JSON.parse(stored) : null;
    }, []);

    const aiInsights = datasets[0]?.aiStorage;

    const phases = useMemo(() => [
        "Initializing AI Analyst...",
        `Aligning with ${userProfile?.organization || 'Corporate'} standards...`,
        "Syncing Neural models...",
        "Identifying correlations...",
        "Simulating ROI...",
        "Finalizing report..."
    ], [userProfile]);

    // PRE-FETCH VOICES (Critical for Chrome/Production)
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

    const toggleSpeech = (textOverride) => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        let contentToRead = textOverride;
        if (isFullReportOpen) {
            // Expression-rich text with punctuation for natural pausing
            contentToRead = `Right... Let's take a look at the strategic briefing. First, the Executive Summary: ${aiInsights.summary}. Moving on... our primary discovery found that ${aiInsights.root_cause}. Regarding the potential risks, we've identified the following: ${aiInsights.risk}. On a more positive note; the growth opportunity is significant: ${aiInsights.opportunity}. Finally, our tactical priority will be: ${aiInsights.action}. That concludes the board briefing.`;
        }

        const utterance = new SpeechSynthesisUtterance(contentToRead);
        const voices = window.speechSynthesis.getVoices();
        
        // STRICT BRITISH FEMALE FILTERING
        const britishVoice = voices.find(v => 
            (v.lang === 'en-GB' || v.lang.startsWith('en-GB')) && 
            (v.name.includes('Female') || v.name.includes('UK') || v.name.includes('Hazel') || v.name.includes('Serena') || v.name.includes('Google'))
        );

        // Fallback to any British voice if female is not explicit, otherwise any voice
        utterance.voice = britishVoice || voices.find(v => v.lang.includes('en-GB')) || voices[0];
        
        // Humanizing parameters
        utterance.rate = 0.85; // Slightly slower for that professional, deliberate British cadence
        utterance.pitch = 1.1; // Slightly higher to remove the 'drone' effect
        utterance.volume = 1.0;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const runAnalysis = async () => {
        if (datasets.length === 0 || !userToken) return;
        setLoading(true);
        try {
            const contextBundle = datasets.map(ds => ({ id: ds.id, name: ds.name, metrics: ds.metrics }));
            const response = await axios.post(`${API_BASE_URL}/ai/analyze`, { context: contextBundle }, { headers: { Authorization: `Bearer ${userToken}` } });
            onUpdateAI(datasets[0].id, response.data);
        } catch (error) { console.error("AI Analysis failed:", error); } 
        finally { setLoading(false); }
    };

    return (
        <div ref={panelRef} className="relative overflow-hidden p-8 md:p-16 transition-all duration-700 min-h-[600px]">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[140px] rounded-full pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                        <FiCpu className="text-indigo-400 w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-[13px] font-black uppercase tracking-[0.6em] text-white">
                            {userProfile?.organization || "STRATEGIC"} <span className="text-indigo-400">INTELLIGENCE</span>
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{loading ? "Computing Logic" : "Decision Support Active"}</span>
                        </div>
                    </div>
                </div>
                {aiInsights && !loading && (
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsFullReportOpen(true)} className="flex items-center gap-3 px-8 py-4 bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg shadow-indigo-500/20">
                           <FiFileText /> View full report
                        </button>
                        <button onClick={runAnalysis} className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                            <FaRedo className="text-[9px]" /> Refresh
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
                        <div className="p-12 md:p-16 rounded-[3rem] bg-[#111116] border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="h-1 w-12 bg-indigo-400 rounded-full" />
                                <span className="text-indigo-400 text-[12px] font-black uppercase tracking-[0.6em]">EXECUTIVE SUMMARY</span>
                            </div>
                            <div className="text-2xl md:text-3xl text-white font-medium leading-[1.5] tracking-tight max-w-5xl">
                                <TypewriterText text={aiInsights.summary} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-10 md:p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-xl relative overflow-hidden">
                                <div className="p-4 w-fit bg-indigo-500/10 rounded-2xl text-indigo-400 mb-8 border border-indigo-500/20"><FaSearch size={20} /></div>
                                <h4 className="text-[13px] font-black text-white uppercase tracking-[0.4em] mb-4">PRIMARY DISCOVERY</h4>
                                <div className="text-white text-2xl leading-[1.6] font-semibold">{aiInsights.root_cause}</div>
                            </div>
                            <div className="p-10 md:p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-xl relative overflow-hidden">
                                <div className="p-4 w-fit bg-emerald-500/10 rounded-2xl text-emerald-400 mb-8 border border-emerald-500/20"><FaCreditCard size={20} /></div>
                                <h4 className="text-[13px] font-black text-white uppercase tracking-[0.4em] mb-4">ESTIMATED IMPACT</h4>
                                <div className="text-white text-2xl leading-[1.6] font-semibold">Valuation: <span className="text-emerald-400">{aiInsights.roi_impact || "Calculating..."}</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InsightCard title="Risk Matrix" content={aiInsights?.risk} icon={FiShield} isPurple onClick={() => setExpandedCard({ title: "Risk Matrix", content: aiInsights?.risk, icon: FiShield, color: "text-[#bc13fe]" })} />
                            <InsightCard title="Growth Vectors" content={aiInsights?.opportunity} icon={FiZap} onClick={() => setExpandedCard({ title: "Growth Vectors", content: aiInsights?.opportunity, icon: FiZap, color: "text-indigo-400" })} />
                            <InsightCard title="Tactical Priority" content={aiInsights?.action} icon={FiTarget} isPurple onClick={() => setExpandedCard({ title: "Tactical Priority", content: aiInsights?.action, icon: FiTarget, color: "text-[#bc13fe]" })} />
                        </div>
                    </motion.div>
                ) : (
                    <div className="py-56 text-center border border-dashed border-white/10 rounded-[4rem]"> 
                        <FaRobot className="text-white/20 w-16 h-16 mx-auto mb-10" />
                        <button onClick={runAnalysis} className="px-16 py-6 bg-indigo-400 text-black rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white transition-all">Generate Intelligence Report</button>
                    </div>
                )}
            </AnimatePresence>

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
                                    <div className={`p-5 bg-white/5 rounded-2xl ${isFullReportOpen ? 'text-indigo-400' : (expandedCard ? expandedCard.color : '')}`}>
                                        {isFullReportOpen ? <FiFileText size={30} /> : (expandedCard && <expandedCard.icon size={30} />)}
                                    </div>
                                    <h3 className="text-white text-3xl font-bold uppercase tracking-tight">{isFullReportOpen ? "Full Strategic Report" : (expandedCard && expandedCard.title)}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => toggleSpeech(isFullReportOpen ? "" : (expandedCard ? expandedCard.content : ""))}
                                        className={`flex items-center gap-4 px-8 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest border transition-all ${isSpeaking ? 'bg-[#bc13fe]/20 text-[#bc13fe] border-[#bc13fe]/30' : 'bg-white/5 text-white border-white/10 hover:bg-white hover:text-black'}`}
                                    >
                                        {isSpeaking ? <><AudioWaveform /> Stop Analysis</> : <><FaVolumeUp /> Voice Briefing</>}
                                    </button>
                                    <button onClick={() => { setExpandedCard(null); setIsFullReportOpen(false); window.speechSynthesis.cancel(); setIsSpeaking(false); }} className="p-5 bg-white/5 rounded-full text-white border border-white/10 hover:bg-red-500/20 transition-all"><FiX size={26} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 md:p-20 bg-[#050505]/80">
                                {isFullReportOpen ? (
                                    <div className="space-y-16 max-w-4xl mx-auto">
                                        <div className="space-y-4">
                                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">01 Executive Summary</span>
                                            <p className="text-white text-3xl font-light leading-relaxed">{aiInsights.summary}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-4">
                                                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">02 Primary Discovery</span>
                                                <p className="text-white/80 text-xl leading-relaxed font-medium">{aiInsights.root_cause}</p>
                                            </div>
                                            <div className="space-y-4">
                                                <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">03 Risk Matrix</span>
                                                <p className="text-white/80 text-xl leading-relaxed font-medium">{aiInsights.risk}</p>
                                            </div>
                                            <div className="space-y-4">
                                                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em]">04 Growth Opportunity</span>
                                                <p className="text-white/80 text-xl leading-relaxed font-medium">{aiInsights.opportunity}</p>
                                            </div>
                                            <div className="space-y-4">
                                                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">05 Tactical Priority</span>
                                                <p className="text-white/80 text-xl leading-relaxed font-medium">{aiInsights.action}</p>
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