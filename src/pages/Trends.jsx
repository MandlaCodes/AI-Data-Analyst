import React, { useState, useEffect } from "react";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { FiTrendingUp, FiArrowUpRight, FiFilter, FiDownload } from "react-icons/fi";
import axios from "axios";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

export default function Trends() {
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("adt_token");
            try {
                const res = await axios.get(`${API_BASE_URL}/analysis/current`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // Transforming raw data into a time-series format for the chart
                // Note: In a real app, your backend would ideally provide grouped date data
                if (res.data?.results?.allDatasets?.[0]) {
                    const primaryData = res.data.results.allDatasets[0].data;
                    const numericKey = res.data.results.allDatasets[0].numericCols[0];
                    
                    // Taking a slice for visualization
                    const formatted = primaryData.slice(0, 15).map((item, idx) => ({
                        name: `Point ${idx + 1}`,
                        value: item[numericKey],
                        growth: (Math.random() * 10).toFixed(1)
                    }));
                    setChartData(formatted);
                }
            } catch (err) {
                console.error("Trends fetch failed", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="p-6 lg:p-10 space-y-8  min-h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <FiTrendingUp className="text-purple-500" /> Market Trends
                    </h1>
                    <p className="text-slate-500">Analyze performance trajectory and growth velocity.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm flex items-center gap-2">
                        <FiFilter /> Filter Period
                    </button>
                    <button className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-bold flex items-center gap-2">
                        <FiDownload /> Export CSV
                    </button>
                </div>
            </div>

            {/* Main Growth Chart */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold">Revenue Velocity</h3>
                        <p className="text-slate-500 text-sm">Comparison of projected vs actual growth</p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-xs font-bold">
                        <FiArrowUpRight /> +12.5% this month
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                itemStyle={{ color: '#c084fc' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#9333ea" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorValue)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Secondary Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                    <h4 className="font-bold mb-4 text-slate-300">Predictive Analysis</h4>
                    <p className="text-sm text-slate-500 mb-6">Based on current velocity, you are on track to exceed next month's target by 8%.</p>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full w-[78%]" />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        <span>Current Progress</span>
                        <span>78%</span>
                    </div>
                </div>
                
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                    <h4 className="font-bold mb-4 text-slate-300">Market Benchmark</h4>
                    <p className="text-sm text-slate-500 mb-6">Your performance compared to similar tier businesses in your industry.</p>
                    <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-white">Top 5%</div>
                        <div className="text-xs text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded">Outperforming</div>
                    </div>
                </div>
            </div>
        </div>
    );
}