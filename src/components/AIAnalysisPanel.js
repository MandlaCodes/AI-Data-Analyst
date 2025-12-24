/**
 * components/AIAnalysisPanel.js
 */
import React, { useState } from 'react';
import axios from 'axios';
import { 
    FaSpinner, 
    FaRobot, 
    FaMagic, 
    FaLightbulb, 
    FaCheckCircle, 
    FaExclamationTriangle,
    FaBrain 
} from 'react-icons/fa';
import { 
    FiTrendingUp, 
    FiAlertCircle, 
    FiArrowRight 
} from 'react-icons/fi';

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

const AIAnalysisPanel = ({ dataset, onUpdateAI }) => {
    const [loading, setLoading] = useState(false);
    const userToken = localStorage.getItem("adt_token");

    // Safety Guard: If dataset is missing during load, render nothing
    if (!dataset) return null;

    const runAnalysis = async () => {
        if (!dataset || !userToken) return;
        setLoading(true);

        try {
            const context = {
                name: dataset.name,
                metrics: dataset.metrics,
                rows: dataset.rows,
                columns: dataset.cols,
                categorySample: dataset.categoryCol?.header || "N/A"
            };

            const response = await axios.post(
                `${API_BASE_URL}/ai/analyze`,
                { context },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            onUpdateAI(dataset.id, response.data);
        } catch (error) {
            console.error("AI Analysis failed:", error);
            alert("Failed to reach MetriaAI. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    // Using Optional Chaining for safety
    const insights = dataset?.aiStorage;

    return (
        <div className="bg-[#0F172A] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 blur-[100px] pointer-events-none group-hover:bg-purple-600/20 transition-all duration-700" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-900/20">
                        <FaBrain size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">MetriaAI Strategist</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Deep Analysis • {dataset.name}</p>
                    </div>
                </div>

                <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className="relative flex items-center gap-3 px-8 py-4 bg-white hover:bg-purple-50 text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                >
                    {loading ? (
                        <FaSpinner className="animate-spin" />
                    ) : (
                        <FaMagic className="group-hover/btn:rotate-12 transition-transform" />
                    )}
                    {loading ? "Processing..." : "Run AI Insights"}
                </button>
            </div>

            {insights ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="p-6 rounded-[2rem] bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-all group/card">
                        <div className="flex items-center gap-3 mb-4 text-red-400">
                            <FaExclamationTriangle size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Risk Factors</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">
                            {insights.risk}
                        </p>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-green-500/5 border border-green-500/10 hover:border-green-500/30 transition-all">
                        <div className="flex items-center gap-3 mb-4 text-green-400">
                            <FiTrendingUp size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Opportunities</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">
                            {insights.opportunity}
                        </p>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 transition-all">
                        <div className="flex items-center gap-3 mb-4 text-purple-400">
                            <FaLightbulb size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Strategic Action</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">
                            {insights.action}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest cursor-pointer hover:gap-3 transition-all">
                            Execute Plan <FiArrowRight />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                    <FaRobot size={40} className="text-slate-800 mb-4" />
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                        Awaiting Strategic Command
                    </p>
                    <p className="text-slate-600 text-[10px] mt-2 text-center max-w-[200px]">
                        Click the button above to generate AI-driven insights for this dataset.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AIAnalysisPanel;