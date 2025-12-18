import React, { useState } from "react";
import { FiX, FiActivity } from "react-icons/fi";
import { FaBrain, FaChartLine, FaLightbulb, FaRobot } from 'react-icons/fa';

const MOCK_AI_INSIGHTS = {
    summary: "Neural synchronization complete. Data streams indicate a localized performance peak in current metrics, suggesting high-probability growth if scaling maintains current momentum.",
    keyFindings: [
        { icon: FaChartLine, title: "Efficiency Peak", detail: "Significant correlation detected between active streams and efficiency output (+12.4%)." },
        { icon: FaLightbulb, title: "Anomaly Check", detail: "3 clusters identified as outliers; recommend localized pruning of low-health rows." }
    ],
    recommendations: ["Synchronize secondary streams", "Run regression on outliers", "Scale active channels"]
};

export function AIAnalysisPanel({ isOpen, onClose, datasets }) {
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const handleRunAnalysis = async () => {
        if (!datasets || datasets.length === 0) return;
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1800));
        setAnalysisResult(MOCK_AI_INSIGHTS);
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex justify-end bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg h-full bg-[#05070A] border-l border-white/10 shadow-[-50px_0_100px_rgba(0,0,0,0.9)] flex flex-col animate-in slide-in-from-right duration-500">
                <div className="p-10 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Neural_Analysis</h2>
                            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.4em]">Engine v4.0.2</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                            <FiX size={20}/>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar pr-2">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-600/20 blur-[60px] animate-pulse" />
                                    <FaRobot size={60} className="text-purple-500 animate-bounce" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Scanning Streams...</p>
                            </div>
                        ) : analysisResult ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Executive Summary</span>
                                    </div>
                                    <p className="text-slate-200 text-sm font-medium leading-relaxed italic">{analysisResult.summary}</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Key Discoveries</h3>
                                    {analysisResult.keyFindings.map((finding, i) => (
                                        <div key={i} className="flex gap-5 p-5 rounded-3xl bg-white/[0.02] border border-white/5">
                                            <div className="shrink-0 p-3 bg-slate-900 rounded-xl border border-white/5 text-cyan-400">
                                                <finding.icon size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black text-xs uppercase tracking-wider mb-1">{finding.title}</h4>
                                                <p className="text-slate-500 text-[11px] leading-relaxed">{finding.detail}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Actionable Logs</h3>
                                    <div className="space-y-2">
                                        {analysisResult.recommendations.map((rec, i) => (
                                            <div key={i} className="flex items-center gap-3 text-[11px] text-slate-300 px-4 py-3 bg-white/5 rounded-2xl">
                                                <FiActivity className="text-purple-500" /> {rec}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-purple-600/10 blur-[60px]" />
                                    <FaBrain size={70} className="relative text-slate-800" />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">System Idle</h3>
                                <p className="text-slate-500 text-[10px] mb-8 tracking-wide">Select datasets to initialize neural synthesis.</p>
                                <button 
                                    onClick={handleRunAnalysis} 
                                    disabled={!datasets || datasets.length === 0}
                                    className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:shadow-[0_10px_30px_rgba(255,255,255,0.2)] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                >
                                    Initialize Synthesis
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AIAnalysisPanel;