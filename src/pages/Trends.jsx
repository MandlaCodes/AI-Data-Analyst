import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    FiArrowRight, FiTrendingUp, FiCalendar, FiAlertTriangle, 
    FiZap, FiTarget, FiClock, FiDatabase, FiLayers
} from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import axios from "axios";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";
const AUTH_TOKEN_KEY = "adt_token";

export default function TrendsPage({ profile }) {
    const navigate = useNavigate();
    const userToken = profile?.token || localStorage.getItem(AUTH_TOKEN_KEY);
    
    const [trends, setTrends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrends = async () => {
            if (!userToken) { setIsLoading(false); return; }
            try {
                const res = await axios.get(`${API_BASE_URL}/analysis/trends`, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                setTrends(res.data);
            } catch (e) {
                console.error("Historical sync error:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrends();
    }, [userToken]);

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617]">
            <FaSpinner size={40} className="text-purple-500 animate-spin mb-4" />
            <div className="font-mono text-[10px] text-purple-400 tracking-widest uppercase animate-pulse">
                Synthesizing Neural History...
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent text-slate-200 px-6 md:px-12 pb-20 font-sans selection:bg-purple-500/30">
            <div className="max-w-[1600px] mx-auto space-y-12 pt-8">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-emerald-500 font-mono text-[10px] uppercase tracking-[0.4em]">
                            <FiLayers className="animate-pulse" /> Intelligence Thread: {trends.length} Points
                        </div>
                        <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none text-white">
                            Neural <span className="text-purple-500">Trends.</span>
                        </h1>
                    </div>
                    <button 
                        onClick={() => navigate("/dashboard/analytics")} 
                        className="group flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-purple-600 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                        New Analysis <FiArrowRight />
                    </button>
                </div>

                {/* --- EMPTY STATE --- */}
                {trends.length === 0 ? (
                    <div className="text-center py-40 bg-white/[0.01] border border-dashed border-white/10 rounded-[3rem] space-y-6">
                        <FiTrendingUp size={48} className="mx-auto text-slate-700" />
                        <div className="space-y-2">
                            <p className="text-white font-black text-xl uppercase italic">No Historical Data Detected.</p>
                            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                                Run and save an analysis in the Workbench to begin tracking evolution.
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate("/dashboard/analytics")} 
                            className="inline-flex items-center gap-3 px-10 py-5 bg-purple-600 text-white rounded-2xl hover:bg-purple-500 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                            Open Workbench <FiZap />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-12 relative">
                        {/* Vertical Timeline Line */}
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-white/5 to-transparent" />

                        {trends.map((trend, idx) => (
                            <div key={trend.id} className="relative pl-24 group">
                                {/* Dot */}
                                <div className="absolute left-6 top-0 w-4 h-4 rounded-full bg-[#020617] border-2 border-purple-500 group-hover:scale-150 transition-transform z-10 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                
                                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 hover:border-purple-500/30 transition-all">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                        <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">
                                            {trend.session_name}
                                        </h3>
                                        <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px] uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full">
                                            <FiCalendar /> {new Date(trend.date).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-rose-400 font-black text-[9px] uppercase tracking-widest">
                                                <FiAlertTriangle /> Detected Risk
                                            </div>
                                            <p className="text-sm text-slate-400 leading-relaxed italic">"{trend.risk}"</p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-emerald-400 font-black text-[9px] uppercase tracking-widest">
                                                <FiZap /> Opportunity
                                            </div>
                                            <p className="text-sm text-slate-400 leading-relaxed italic">"{trend.opportunity}"</p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-blue-400 font-black text-[9px] uppercase tracking-widest">
                                                <FiTarget /> Strategic Action
                                            </div>
                                            <p className="text-sm text-slate-300 font-medium leading-relaxed italic">"{trend.action}"</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}