import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    FiArrowRight, FiDatabase, FiPieChart, 
    FiAlertTriangle, FiZap, FiTarget, 
    FiTrendingUp, FiTerminal, FiActivity
} from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import axios from "axios";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";
const AUTH_TOKEN_KEY = "adt_token";

export default function Overview({ profile }) {
    const navigate = useNavigate();
    const userToken = profile?.token || localStorage.getItem(AUTH_TOKEN_KEY);
    
    const [allDatasets, setAllDatasets] = useState([]);
    const [aiInsights, setAiInsights] = useState(null);
    const [lastSync, setLastSync] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sentiment, setSentiment] = useState("neutral"); // neutral, positive, warning
    const [logs, setLogs] = useState(["Initializing neural core...", "Scanning historical threads..."]);

    useEffect(() => {
        const loadOverviewData = async () => {
            if (!userToken) { setIsLoading(false); return; }
            try {
                // Parallel fetch for speed
                const [currentRes, trendsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/analysis/current`, { 
                        headers: { Authorization: `Bearer ${userToken}` } 
                    }),
                    axios.get(`${API_BASE_URL}/analysis/trends`, { 
                        headers: { Authorization: `Bearer ${userToken}` } 
                    })
                ]);
                
                if (currentRes.data?.page_state) {
                    const savedState = currentRes.data.page_state;
                    const datasets = savedState.allDatasets || [];
                    const currentInsight = savedState.ai_insight || {};
                    
                    setAllDatasets(datasets);
                    setAiInsights(currentInsight);
                    setLastSync(currentRes.data.updated_at);

                    // --- SENTIMENT DRIFT ENGINE ---
                    if (trendsRes.data && trendsRes.data.length > 1) {
                        const previousRecord = trendsRes.data[1]; // The most recent history
                        const prevInsight = previousRecord.ai_insight || {};

                        if (currentInsight.risk !== prevInsight.risk) {
                            setSentiment("warning");
                            setLogs(prev => [...prev, "⚠ CRITICAL: Risk profile divergence detected.", "Updating defense parameters..."]);
                        } else if (currentInsight.opportunity !== prevInsight.opportunity) {
                            setSentiment("positive");
                            setLogs(prev => [...prev, "✦ STRATEGIC: New growth vectors unlocked.", "Optimizing for expansion..."]);
                        } else {
                            setLogs(prev => [...prev, "Neural sync stable.", "No significant drift detected."]);
                        }
                    } else {
                        setLogs(prev => [...prev, "System baseline established.", "Monitoring live streams..."]);
                    }
                }
            } catch (e) {
                console.error("Overview Load Error:", e);
                setLogs(prev => [...prev, "Neural sync interrupted. Retrying..."]);
            } finally {
                // Artificial delay for smooth entry transition
                setTimeout(() => setIsLoading(false), 800);
            }
        };
        loadOverviewData();
    }, [userToken]);

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617]">
            <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl animate-pulse" />
                <FaSpinner size={40} className="text-purple-500 animate-spin mb-4 relative z-10" />
            </div>
            <div className="font-mono text-[10px] text-purple-400 tracking-[0.5em] uppercase animate-pulse">
                Synchronizing Intelligence...
            </div>
        </div>
    );

    const totalRows = allDatasets.reduce((acc, ds) => acc + (Number(ds.rows) || 0), 0);
    const timeAgo = lastSync ? new Date(lastSync).toLocaleTimeString() : "Live";

    return (
        <div className="min-h-screen bg-transparent text-slate-200 px-6 md:px-12 pb-20 font-sans selection:bg-purple-500/30 animate-in fade-in duration-1000">
            <div className="max-w-[1600px] mx-auto space-y-12 pt-8">
                
                {/* --- HEADER SECTION --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-emerald-500 font-mono text-[10px] uppercase tracking-[0.4em]">
                            <span className={`flex h-2 w-2 rounded-full ${sentiment === 'warning' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                            ENGINE_CONNECTED // LAST_SYNC: {timeAgo}
                        </div>
                        <h1 className="text-7xl font-black uppercase italic tracking-tighter leading-none text-white">
                            Analyst <span className="text-purple-500">Brief.</span>
                        </h1>
                    </div>
                    <button 
                        onClick={() => navigate("/dashboard/analytics")} 
                        className="group flex items-center gap-3 px-10 py-5 bg-white text-black hover:bg-purple-600 hover:text-white rounded-2xl transition-all duration-500 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-white/5"
                    >
                        Enter Workbench <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>

                {allDatasets.length === 0 ? (
                    <EmptyState onAction={() => navigate("/dashboard/analytics")} />
                ) : (
                    <div className="grid grid-cols-12 gap-8">
                        
                        {/* --- PRIMARY BRIEFING AREA --- */}
                        <div className="col-span-12 lg:col-span-8 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                            
                            {/* MAIN INTELLIGENCE BOX */}
                            <div className={`p-12 rounded-[3.5rem] border transition-all duration-1000 relative overflow-hidden group ${
                                sentiment === 'warning' ? 'bg-rose-950/20 border-rose-500/30' : 
                                sentiment === 'positive' ? 'bg-emerald-950/20 border-emerald-500/30' : 
                                'bg-white/[0.02] border-white/10'
                            }`}>
                                <div className="relative z-10 space-y-8">
                                    <div className="flex justify-between items-center">
                                        <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2 ${
                                            sentiment === 'warning' ? 'text-rose-400' : 'text-purple-400'
                                        }`}>
                                            <FiTerminal /> Neural Summary
                                        </h2>
                                        <div className="flex gap-2">
                                            <span className="h-1 w-8 bg-purple-500/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 animate-progress" />
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-4xl md:text-5xl font-medium leading-[1.1] italic text-white tracking-tight">
                                        "{aiInsights?.summary || `I have processed your active data streams. Currently monitoring ${totalRows.toLocaleString()} nodes for ${profile?.industry || 'enterprise'} anomalies.`}"
                                    </p>

                                    <div className="flex items-center gap-6 pt-4">
                                        <div className="flex -space-x-3">
                                            {allDatasets.slice(0, 3).map((d, i) => (
                                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center text-[10px] font-bold" style={{color: d.color}}>
                                                    {d.name[0]}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                            Synthesizing {allDatasets.length} Streams
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Background Elements */}
                                <div className={`absolute -right-20 -top-20 w-96 h-96 rounded-full blur-[140px] transition-colors duration-1000 ${
                                    sentiment === 'warning' ? 'bg-rose-600/20' : 'bg-purple-600/10'
                                }`} />
                            </div>

                            {/* SUB-INSIGHT CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InsightCard title="Risk Node" content={aiInsights?.risk} icon={FiAlertTriangle} color="text-rose-400" active={sentiment === 'warning'} delay="delay-100" />
                                <InsightCard title="Growth Vector" content={aiInsights?.opportunity} icon={FiZap} color="text-emerald-400" active={sentiment === 'positive'} delay="delay-200" />
                                <InsightCard title="Priority Action" content={aiInsights?.action} icon={FiTarget} color="text-blue-400" delay="delay-300" />
                            </div>

                            {/* SYSTEM CONSOLE LOGS */}
                            <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 font-mono text-[10px] text-slate-500 h-40 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent pointer-events-none z-10" />
                                <div className="space-y-2">
                                    {logs.slice().reverse().map((log, i) => (
                                        <div key={i} className="flex gap-4 animate-in slide-in-from-left-4 duration-500">
                                            <span className="text-white/10">[{new Date().toLocaleTimeString()}]</span>
                                            <span className={log.includes('⚠') ? 'text-rose-400' : log.includes('✦') ? 'text-emerald-400' : 'group-hover:text-slate-300 transition-colors'}>
                                                {log}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* --- SIDEBAR STATS --- */}
                        <div className="col-span-12 lg:col-span-4 space-y-6 animate-in slide-in-from-right-8 duration-1000">
                            <StatCard label="Total Ingested Rows" value={totalRows.toLocaleString()} icon={FiDatabase} />
                            
                            <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Neural Load Factor</div>
                                    <div className="text-[10px] font-mono text-purple-400">OPTIMAL // 94%</div>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400 animate-pulse" style={{ width: '94%' }} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-[9px] font-mono text-slate-600 bg-white/5 p-3 rounded-xl border border-white/5">
                                        LATENCY: <span className="text-emerald-500">22MS</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-600 bg-white/5 p-3 rounded-xl border border-white/5">
                                        UPTIME: <span className="text-emerald-500">99.9%</span>
                                    </div>
                                </div>
                            </div>

                            <div 
                                onClick={() => navigate("/dashboard/trends")}
                                className="p-8 rounded-[3rem] bg-indigo-500/5 border border-indigo-500/20 flex flex-col gap-6 group cursor-pointer hover:bg-indigo-500/10 transition-all duration-500 hover:border-indigo-500/40"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400">
                                        <FiTrendingUp size={20} />
                                    </div>
                                    <FiArrowRight className="text-indigo-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Trends Portal</div>
                                    <div className="text-sm text-slate-400 font-medium">Review the historical evolution of your data insights.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- SUBCOMPONENTS ---

function InsightCard({ title, content, icon: Icon, color, active, delay }) {
    return (
        <div className={`p-8 rounded-[2.5rem] bg-white/[0.01] border transition-all duration-500 group animate-in zoom-in-95 ${delay} ${
            active ? 'border-white/20 bg-white/[0.03] shadow-2xl' : 'border-white/5 hover:border-white/10'
        }`}>
            <div className={`flex items-center gap-3 ${color} group-hover:scale-110 transition-transform mb-6`}>
                <div className="p-2 rounded-lg bg-current/10">
                    <Icon size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{title}</span>
            </div>
            <p className="text-[13px] font-medium leading-relaxed text-slate-400 italic">
                {content || "Analyzing live data stream for actionable intelligence..."}
            </p>
        </div>
    );
}

function StatCard({ label, value, icon: Icon }) {
    return (
        <div className="p-8 rounded-[3rem] bg-[#0F172A]/40 border border-white/5 flex items-center justify-between hover:bg-[#0F172A]/60 transition-all duration-500 group">
            <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</div>
                <div className="text-4xl font-black text-white italic tracking-tighter group-hover:text-purple-400 transition-colors">{value}</div>
            </div>
            <div className="p-4 rounded-3xl bg-white/5 text-purple-500/50 group-hover:text-purple-500 group-hover:bg-purple-500/10 transition-all">
                <Icon size={24} />
            </div>
        </div>
    );
}

function EmptyState({ onAction }) {
    return (
        <div className="text-center py-40 bg-white/[0.01] border border-dashed border-white/10 rounded-[4rem] animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl animate-pulse" />
                <FiDatabase size={48} className="mx-auto text-slate-700 relative z-10" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Neural Core Offline</h3>
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-10 max-w-xs mx-auto">No data streams detected. Initialize the workbench to generate intelligence.</p>
            <button 
                onClick={onAction}
                className="px-12 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-purple-500/20"
            >
                Start Data Stream +
            </button>
        </div>
    );
}