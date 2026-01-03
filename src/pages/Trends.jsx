import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    FiArrowRight, FiTrendingUp, FiCalendar, FiAlertTriangle, 
    FiZap, FiTarget, FiClock, FiDatabase, FiLayers, FiCheckCircle
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

                // --- GROUPING LOGIC ---
                // We reduce the array to a Map where the Key is the session_name.
                // Because the API typically returns newest first, the first time we see a 
                // name, it is the most recent one.
                const uniqueSessions = res.data.reduce((acc, current) => {
                    if (!acc.find(item => item.session_name === current.session_name)) {
                        acc.push(current);
                    }
                    return acc;
                }, []);

                setTrends(uniqueSessions);
            } catch (e) {
                console.error("Historical sync error:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrends();
    }, [userToken]);

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center ">
            <FaSpinner size={40} className="text-purple-500 animate-spin mb-4" />
            <div className="font-mono text-[10px] text-purple-400 tracking-widest uppercase animate-pulse">
                Filtering Unique Neural Threads...
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent text-slate-200 px-6 md:px-12 pb-20 font-sans selection:bg-purple-500/30">
            <div className="max-w-[1400px] mx-auto space-y-12 pt-8">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-emerald-500 font-mono text-[10px] uppercase tracking-[0.4em]">
                            <FiLayers className="animate-pulse" /> Unique Analysis Sessions: {trends.length}
                        </div>
                        <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none text-white">
                            History <span className="text-purple-500">Timeline.</span>
                        </h1>
                    </div>
                    <button 
                        onClick={() => navigate("/dashboard/analytics")} 
                        className="group flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-purple-600 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                        New Analysis <FiArrowRight />
                    </button>
                </div>

                {/* --- TIMELINE VIEW --- */}
                {trends.length === 0 ? (
                    <div className="text-center py-40 bg-white/[0.01] border border-dashed border-white/10 rounded-[3rem] space-y-6">
                        <FiTrendingUp size={48} className="mx-auto text-slate-700" />
                        <p className="text-white font-black text-xl uppercase italic">No Historical Data.</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* The Vertical Line */}
                        <div className="absolute left-[39px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-purple-500 via-white/10 to-transparent z-0" />

                        <div className="space-y-16">
                            {trends.map((trend, idx) => (
                                <div key={trend.id} className="relative flex items-start group">
                                    
                                    {/* Timeline Marker (The Node) */}
                                    <div className="flex-shrink-0 w-20 flex justify-center pt-2 relative z-10">
                                        <div className="w-10 h-10 rounded-full bg-[#020617] border-4 border-purple-500 flex items-center justify-center group-hover:bg-purple-500 transition-all duration-300">
                                            <FiCheckCircle size={16} className="text-white group-hover:scale-110" />
                                        </div>
                                    </div>

                                    {/* The Content Card */}
                                    <div className="flex-grow bg-[#0a0118]/40 border border-white/5 rounded-[2rem] p-8 group-hover:border-purple-500/30 transition-all duration-500 hover:translate-x-2 backdrop-blur-sm">
                                        <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-8 gap-4">
                                            <div>
                                                <div className="flex items-center gap-4 text-purple-400 font-mono text-[10px] uppercase tracking-widest mb-1">
                                                    <FiClock /> {new Date(trend.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                                <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">
                                                    {trend.session_name}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-6 py-3 rounded-full">
                                                <FiCalendar className="text-purple-500" /> {new Date(trend.date).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                            <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                                                <div className="flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                                                    <FiAlertTriangle /> Critical Risk
                                                </div>
                                                <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-rose-500/30 pl-4">
                                                    {trend.risk || "Neural scan detected no major risks."}
                                                </p>
                                            </div>

                                            <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                                                <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                                                    <FiZap /> High Opportunity
                                                </div>
                                                <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">
                                                    {trend.opportunity || "No expansion vectors identified."}
                                                </p>
                                            </div>

                                            <div className="p-6 bg-purple-500/5 rounded-3xl border border-purple-500/10">
                                                <div className="flex items-center gap-2 text-purple-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                                                    <FiTarget /> Strategic Action
                                                </div>
                                                <p className="text-sm text-white font-medium leading-relaxed italic border-l-2 border-purple-500 pl-4">
                                                    {trend.action || "Awaiting further core directives."}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-slate-500 font-mono text-[9px] uppercase tracking-widest">
                                            <span>Synthesis Confidence: {trend.confidence * 100}%</span>
                                            <span>ROI Impact: {trend.roi}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}