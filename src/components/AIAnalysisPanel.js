/**
 * components/AIAnalysisPanel.js
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaBrain, FaRocket, FaCheck, FaLink
} from 'react-icons/fa';
import { 
    FiTrendingUp, FiShield, FiZap, FiActivity, FiLayers 
} from 'react-icons/fi';

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

const TypewriterText = ({ text, delay = 10 }) => {
    const [displayedText, setDisplayedText] = useState("");
    useEffect(() => {
        setDisplayedText(""); 
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => prev + text.charAt(i));
                i++;
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
    const userToken = localStorage.getItem("adt_token");

    const phases = [
        "Initializing Neural Core...",
        "Scanning Data Footprints...",
        "Detecting Cross-Stream Correlations...",
        "Mapping Strategic Vectors...",
        "Synthesizing Growth Alpha...",
        "Finalizing Intelligence Report..."
    ];

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
                categorySample: ds.categoryCol?.header || "N/A"
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

    const formatAnalystText = (text) => {
        if (!text) return [];
        return text.split(/[.!?]/).filter(s => s.trim().length > 10).map(s => s.trim());
    };

    return (
        <div className="relative overflow-hidden bg-[#0F172A] border border-white/10 rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse" />
                        <div className="relative p-5 bg-slate-900 border border-purple-500/30 rounded-3xl">
                            {isMulti ? <FiLayers size={28} className="text-indigo-400" /> : <FaBrain size={28} className="text-purple-400" />}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                                {isMulti ? "Metria Multi-Stream Synthesis" : "Metria Neural Analyst"}
                            </h2>
                            <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full uppercase tracking-widest ${isMulti ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
                                {isMulti ? `${datasets.length} STREAMS CONNECTED` : 'SINGLE STREAM'}
                            </span>
                        </div>
                        <p className="text-slate-500 text-xs font-mono tracking-[0.3em] mt-1 uppercase">
                            {isMulti ? "Comparing active datasets for cross-platform insights" : `Analyzing ${datasets[0].name}`}
                        </p>
                    </div>
                </div>

                {!insights && !loading && (
                    <button
                        onClick={runAnalysis}
                        className="group/btn relative px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            <FiZap className="fill-current" /> {isMulti ? "Run Comparative Analysis" : "Execute Intelligence Scan"}
                        </span>
                    </button>
                )}
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-8">
                    <div className="relative">
                        <div className="w-24 h-24 border-2 border-purple-500/20 rounded-full animate-ping absolute" />
                        <div className="w-24 h-24 border-t-2 border-purple-500 rounded-full animate-spin relative flex items-center justify-center">
                            <FiActivity className="text-purple-500 animate-pulse" size={30} />
                        </div>
                    </div>
                    <div className="text-center space-y-4">
                        <h3 className="text-white text-lg font-black uppercase tracking-[0.4em]">{phases[analysisPhase]}</h3>
                        <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden mx-auto border border-white/10">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 transition-all duration-1000 ease-out"
                                style={{ width: `${((analysisPhase + 1) / phases.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            ) : insights ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 hover:border-red-500/20 transition-all">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-500"><FiShield size={20} /></div>
                            <span className="text-[9px] font-black px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md uppercase">Vulnerability</span>
                        </div>
                        <h4 className="text-white text-sm font-black uppercase tracking-widest mb-6">{isMulti ? "System Conflict" : "Risk Vectors"}</h4>
                        <ul className="space-y-4">
                            {formatAnalystText(insights.risk).map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-400 leading-relaxed"><div className="mt-1.5 h-1 w-1 rounded-full bg-red-500/50 shrink-0" />
                                    <span><TypewriterText text={item} /></span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 hover:border-green-500/20 transition-all">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-green-500/10 rounded-xl text-green-500"><FiTrendingUp size={20} /></div>
                            <span className="text-[9px] font-black px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md uppercase">Growth</span>
                        </div>
                        <h4 className="text-white text-sm font-black uppercase tracking-widest mb-6">{isMulti ? "Cross-Stream Synergies" : "Upside Potential"}</h4>
                        <ul className="space-y-4">
                            {formatAnalystText(insights.opportunity).map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-400 leading-relaxed"><div className="mt-1.5 h-1 w-1 rounded-full bg-green-500/50 shrink-0" />
                                    <span><TypewriterText text={item} /></span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-all">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><FaRocket size={18} /></div>
                            <span className="text-[9px] font-black px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md uppercase">Strategy</span>
                        </div>
                        <h4 className="text-white text-sm font-black uppercase tracking-widest mb-6">{isMulti ? "Unified Roadmap" : "Execution Roadmap"}</h4>
                        <div className="space-y-4">
                            {formatAnalystText(insights.action).map((item, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <div className="mt-1 p-1 bg-purple-500/20 rounded-full text-purple-400"><FaCheck size={8} /></div>
                                    <p className="text-sm text-slate-300 italic">"<TypewriterText text={item} />"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] bg-slate-900/50">
                    <FaBrain size={48} className="text-slate-800 mb-4" />
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em]">Cognitive Engine Idle</p>
                    {isMulti && (
                        <div className="mt-4 flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                            <FaLink /> Comparison Mode Ready
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIAnalysisPanel;