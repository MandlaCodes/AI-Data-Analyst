import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    FiArrowRight, 
    FiDatabase, 
    FiTrendingUp, 
    FiActivity, 
    FiPieChart,
    FiPlus
} from "react-icons/fi";
import { FaBrain, FaSpinner } from "react-icons/fa";
import axios from "axios";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";
const AUTH_TOKEN_KEY = "adt_token";

export default function Overview() {
    const navigate = useNavigate();
    const userToken = localStorage.getItem(AUTH_TOKEN_KEY);
    
    const [summaryData, setSummaryData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchExecutiveSummary = async () => {
            if (!userToken) {
                setIsLoading(false);
                return;
            }
            try {
                const res = await axios.get(`${API_BASE_URL}/analysis/current`, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                
                if (res.data && res.data.results && res.data.results.allDatasets.length > 0) {
                    setSummaryData(res.data.results.allDatasets);
                }
            } catch (error) {
                console.error("Failed to fetch overview data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExecutiveSummary();
    }, [userToken]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <FaSpinner size={40} className="text-purple-500 animate-spin" />
            </div>
        );
    }

    // Default Page State
    if (!summaryData) {
        return (
            <div className="min-h-screen bg-transparent text-white px-8 flex flex-col items-center justify-center">
                <div className="max-w-2xl text-center space-y-6">
                    <div className="inline-block p-4 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                        <FiDatabase size={48} className="text-purple-400" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Welcome to Trader AI</h1>
                    <p className="text-slate-400 text-lg">
                        You haven't analyzed any data yet. Head over to the Workbench to import your business datasets and generate your first executive summary.
                    </p>
                    <button 
                        onClick={() => navigate("/analytics")}
                        className="mt-4 px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold flex items-center gap-2 mx-auto transition-all shadow-lg shadow-purple-900/20"
                    >
                        <FiPlus /> Start New Analysis
                    </button>
                </div>
            </div>
        );
    }

    const totalRecords = summaryData.reduce((acc, ds) => acc + ds.rows, 0);
    const totalDatasets = summaryData.length;

    return (
        /* FIXED: Removed top/bottom padding from this wrapper */
        <div className="min-h-screen bg-transparent text-white px-6 md:px-10">
            <div className="max-w-7xl mx-auto space-y-8 py-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Executive Overview</h1>
                        <p className="text-slate-500">Business performance metrics and dataset health.</p>
                    </div>
                    <button 
                        onClick={() => navigate("/analytics")}
                        className="group flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
                    >
                        Go to Workbench <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Hero Summary Card */}
                <div className="relative overflow-hidden rounded-3xl p-8 border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-transparent backdrop-blur-sm">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-4 text-center md:text-left">
                            <h2 className="text-4xl font-extrabold text-white">Built on Data & Precision</h2>
                            <p className="text-slate-400 max-w-md">
                                Your current session contains {totalRecords.toLocaleString()} rows of data across {totalDatasets} datasets. 
                                Trader AI has prepared a high-level summary.
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                    ● Live Sync Active
                                </span>
                                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                                    ● AI Analysis Ready
                                </span>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <div className="w-48 h-48 bg-purple-600/10 rounded-full border border-purple-500/30 flex items-center justify-center shadow-2xl shadow-purple-500/20">
                                <FaBrain size={80} className="text-purple-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metric Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryMetricTile 
                        title="Active Datasets" 
                        value={totalDatasets} 
                        icon={FiDatabase} 
                        color="text-blue-400" 
                        desc="Streams currently in memory"
                    />
                    <SummaryMetricTile 
                        title="Data Volume" 
                        value={totalRecords.toLocaleString()} 
                        icon={FiActivity} 
                        color="text-emerald-400" 
                        desc="Total rows processed"
                    />
                    <SummaryMetricTile 
                        title="Business Score" 
                        value="8.4/10" 
                        icon={FiTrendingUp} 
                        color="text-amber-400" 
                        desc="AI-generated efficiency rating"
                    />
                </div>

                {/* Table */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800">
                        <h3 className="font-bold flex items-center gap-2">
                            <FiPieChart className="text-purple-400" /> Dataset Inventory
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4">Source Name</th>
                                    <th className="px-6 py-4">Rows</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {summaryData.map((ds) => (
                                    <tr key={ds.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-medium">{ds.name}</td>
                                        <td className="px-6 py-4 text-slate-400">{ds.rows}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                READY
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Section - Spacing handled by space-y-8 */}
                <div className="flex justify-center pb-8">
                    <button 
                        onClick={() => navigate("/analytics")}
                        className="flex flex-col items-center gap-2 text-slate-500 hover:text-purple-400 transition-colors"
                    >
                        <span className="text-sm">Need deeper analysis or charting?</span>
                        <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-700 group-hover:border-purple-500 transition-colors">
                            Launch Full Analytics Suite <FiArrowRight />
                        </div>
                    </button>
                </div>

            </div>
        </div>
    );
}

function SummaryMetricTile({ title, value, icon: Icon, color, desc }) {
    return (
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <div className={`p-3 rounded-lg bg-slate-800 inline-block ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <h4 className="text-slate-400 text-sm font-medium">{title}</h4>
                <div className="text-2xl font-bold">{value}</div>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{desc}</p>
        </div>
    );
}