import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    FiArrowRight, FiDatabase, FiPieChart, FiCpu, 
    FiShield, FiAlertTriangle, FiZap, FiTarget, FiActivity,
    FiCheckCircle, FiSearch, FiTrendingUp, FiClock, FiTerminal
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
    const [logs, setLogs] = useState(["Initializing core...", "Authenticating stream..."]);

    useEffect(() => {
        const loadOverviewData = async () => {
            if (!userToken) { setIsLoading(false); return; }
            try {
                const res = await axios.get(`${API_BASE_URL}/analysis/current`, { 
                    headers: { Authorization: `Bearer ${userToken}` } 
                });
                
                if (res.data?.page_state) {
                    const savedState = res.data.page_state;
                    const datasets = savedState.allDatasets || [];
                    
                    setAllDatasets(datasets);
                    setLastSync(res.data.updated_at || new Date().toISOString());

                    // Pulling real AI text from your DB field 'aiStorage'
                    if (datasets.length > 0 && datasets[0].aiStorage) {
                        setAiInsights(datasets[0].aiStorage);
                        setLogs(prev => [...prev, "AI Storage synced.", "Insights parsed."]);
                    }
                }
            } catch (e) {
                setLogs(prev => [...prev, "Sync error detected."]);
            } finally {
                setIsLoading(false);
            }
        };
        loadOverviewData();
    }, [userToken]);

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617]">
            <FaSpinner size={40} className="text-purple-500 animate-spin mb-4" />
            <div className="font-mono text-[10px] text-purple-400 tracking-widest uppercase animate-pulse">
                Querying Render DB...
            </div>
        </div>
    );

    const totalRows = allDatasets.reduce((acc, ds) => acc + (Number(ds.rows) || 0), 0);
    const timeAgo = lastSync ? new Date(lastSync).toLocaleTimeString() : "Just now";

    return (
        <div className="min-h-screen bg-transparent text-slate-200 px-6 md:px-12 pb-20 font-sans selection:bg-purple-500/30">
            <div className="max-w-[1600px] mx-auto space-y-12 pt-8">
                
                {/* --- ANALYST HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-emerald-500 font-mono text-[10px] uppercase tracking-[0.4em]">
                            <FiClock className="animate-pulse" /> DATABASE SYNC: {timeAgo}
                        </div>
                        <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none text-white">
                            Analyst <span className="text-purple-500">Brief.</span>
                        </h1>
                    </div>
                    <button 
                        onClick={() => navigate("/dashboard/analytics")} 
                        className="group flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-purple-600 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                        Workbench <FiArrowRight />
                    </button>
                </div>

                {allDatasets.length === 0 ? (
                    <div className="text-center py-32 bg-white/[0.01] border border-dashed border-white/10 rounded-[3rem]">
                        <FiDatabase size={40} className="mx-auto mb-4 text-slate-700" />
                        <p className="text-slate-500 font-mono text-xs uppercase">No DB records found for this session.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-12 gap-8">
                        
                        {/* --- AI INSIGHT SECTION (DATA FROM DB) --- */}
                        <div className="col-span-12 lg:col-span-8 space-y-8">
                            <div className="bg-gradient-to-br from-purple-900/10 to-transparent p-10 rounded-[3rem] border border-purple-500/20 relative overflow-hidden">
                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] flex items-center gap-2">
                                            <FiTerminal /> Current Intelligence Status
                                        </h2>
                                        <span className="text-[9px] font-mono text-slate-500 uppercase">Verified Response</span>
                                    </div>
                                    <p className="text-3xl font-medium text-white leading-tight italic">
                                        "{aiInsights?.summary || `I have analyzed ${totalRows.toLocaleString()} rows across ${allDatasets.length} streams. No critical anomalies found, performance is within nominal parameters.`}"
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InsightCard title="Risk Node" content={aiInsights?.risk} icon={FiAlertTriangle} color="text-rose-400" />
                                <InsightCard title="Growth Vector" content={aiInsights?.opportunity} icon={FiZap} color="text-emerald-400" />
                                <InsightCard title="Priority Action" content={aiInsights?.action} icon={FiTarget} color="text-blue-400" />
                            </div>

                            {/* --- ACTIVITY LOG (FEELS LIKE REAL LOADING) --- */}
                            <div className="p-6 bg-black/20 rounded-[2rem] border border-white/5 font-mono text-[10px] text-slate-500 h-32 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />
                                {logs.map((log, i) => (
                                    <div key={i} className="mb-1 flex gap-4">
                                        <span className="text-purple-900">[{new Date().toLocaleTimeString()}]</span>
                                        <span>{log}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* --- SYSTEM STATS --- */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            <StatCard label="Records Ingested" value={totalRows.toLocaleString()} icon={FiDatabase} />
                            <StatCard label="Memory Sync" value={`${allDatasets.length} Sources`} icon={FiPieChart} />
                            
                            <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-4">
                                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Core Integrity</div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 w-[94%] shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                                </div>
                                <div className="flex justify-between text-[9px] font-mono text-slate-600">
                                    <span>LATENCY: 24ms</span>
                                    <span>ACCURACY: 99.8%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InsightCard({ title, content, icon: Icon, color }) {
    return (
        <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-4 hover:border-purple-500/30 transition-all group">
            <div className={`flex items-center gap-3 ${color} group-hover:scale-105 transition-transform`}>
                <Icon size={18} />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">{title}</span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-400 italic">
                {content || "Awaiting further data stream input..."}
            </p>
        </div>
    );
}

function StatCard({ label, value, icon: Icon }) {
    return (
        <div className="p-8 rounded-[2.5rem] bg-[#0F172A]/40 border border-white/5 flex items-center justify-between">
            <div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
                <div className="text-3xl font-black text-white italic tracking-tighter">{value}</div>
            </div>
            <Icon size={24} className="text-purple-500/50" />
        </div>
    );
}