import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Bar } from 'react-chartjs-2'; // Added for Sparkline
import {
    Chart as ChartJS,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    CategoryScale, // Needed for Bar/Line charts
    LinearScale,
    BarElement,
} from "chart.js";
import { MdOutlineDashboard, MdDataExploration, MdInfoOutline, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { useNavigate } from "react-router-dom"; 

// Registering all necessary Chart.js elements
ChartJS.register(ArcElement, Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// --- HELPER: Sparkline Chart for Trend Visual ---
const Sparkline = ({ data, metricKey }) => {
    if (!data || data.length === 0) return null;

    const chartData = {
        labels: data.map((_, i) => i), // Simple index labels
        datasets: [
            {
                data: data,
                backgroundColor: 'rgba(167, 139, 250, 0.4)', // Purple
                borderColor: '#a78bfa',
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: { enabled: true, mode: 'index', intersect: false },
        },
        scales: {
            x: { display: false },
            y: { display: false },
        },
        elements: { point: { radius: 0 } },
    };

    return (
        <div style={{ height: '40px', width: '100px' }} className="flex-shrink-0">
            <Bar data={chartData} options={chartOptions} />
        </div>
    );
};

// --- HELPER: Overview KPI Tile (Updated for Business context) ---
function OverviewKpiTile({ title, value, context, icon: Icon, sparkData, metricKey }) {
    const isPositive = context && context.includes("Positive"); // Simple check for sentiment
    
    return (
        <div className="rounded-2xl p-4 shadow-xl flex flex-col justify-between" 
             style={{ background: "linear-gradient(180deg, rgba(167,139,250,0.1), rgba(12,14,26,0.7))", border: "1px solid rgba(255,255,255,0.04)" }}>
            
            <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-light text-gray-300">{title}</div>
                {Icon && <Icon className="text-purple-400" size={20} />}
            </div>

            <div className="flex items-end justify-between">
                <div className="text-4xl font-extrabold text-white">
                    {value.toLocaleString(undefined, { maximumFractionDigits: (title.includes("Average") ? 2 : 0) })}
                </div>
                {sparkData && (
                    <div className="h-10 w-24">
                        <Sparkline data={sparkData} metricKey={metricKey} />
                    </div>
                )}
            </div>
            
            <div className={`text-xs mt-3 ${isPositive ? 'text-green-400' : 'text-orange-400'} font-medium`}>
                {context || "No contextual information available."}
            </div>
        </div>
    );
}

// --- HELPER: Category Chart (Unchanged, removed for brevity) ---
// ... (The CategoryPieChart component remains the same)

const CategoryPieChart = ({ categories }) => { /* ... existing code ... */ 
    if (!categories || !categories.labels.length) return null;
    // ... Pie chart implementation
    return (
        <div className="rounded-xl p-4 shadow-lg h-full" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.65), rgba(6,8,18,0.45))" }}>
            <div className="text-lg font-semibold text-gray-300 mb-4">Distribution by Top Category</div>
            <div style={{ height: 320 }}>
                {/* Pie Chart Component */}
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
export default function Overview() {
    // ... (State and useEffect for data loading remains the same) ...
    const navigate = useNavigate();
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedData = localStorage.getItem("analytics_overview_data");
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                setSummaryData(parsedData);
            } catch (error) {
                console.error("Error parsing overview data:", error);
                setSummaryData(null);
            }
        }
        setLoading(false);
    }, []);

    // ... (Loading and Empty State rendering remains the same) ...

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-xl text-white" style={{ background: "#0b0f1a" }}>Loading Dashboard...</div>;
    }

    if (!summaryData) {
        return (
            <div className="min-h-screen p-10 flex flex-col items-center justify-center" style={{ background: "linear-gradient(180deg,#0b0f1a,#12062d)" }}>
                <div className="p-10 text-center rounded-xl bg-gray-900/50 border border-purple-900/50 max-w-lg">
                    <h2 className="text-3xl font-bold text-red-400 mb-4">No Overview Data Saved</h2>
                    <p className="text-gray-400 mb-6">
                        Please go to the **Analytics Workspace** to load a dataset, analyze the metrics, and click **"Save to Dashboard"** to populate this page.
                    </p>
                    <button onClick={() => navigate("/analytics")} className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center gap-2 mx-auto">
                        <MdDataExploration /> Go to Workspace
                    </button>
                </div>
            </div>
        );
    }
    
    const { kpis, analysisText, meta, categories } = summaryData;
    const metricKeys = Object.keys(kpis);
    const primaryMetricKey = metricKeys[0];
    const primaryKpi = kpis[primaryMetricKey];

    const lastSaved = new Date(meta.savedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Logic to simulate context for the third tile (based on the AI analysis)
    const anomalyContext = analysisText.includes("drop") 
        ? "⚠️ Potential Issue detected in recent periods." 
        : "✅ Trend is stable or showing positive momentum.";

    return (
        <div className="min-h-screen p-6" style={{ background: "linear-gradient(180deg,#0b0f1a,#12062d)" }}>
            
            {/* Header and Source Info */}
            <div className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-gray-800 gap-4">
                <div>
                    <div className="text-3xl font-bold text-white flex items-center gap-3">
                        <MdOutlineDashboard size={28} className="text-green-400"/> {meta.sourceName} - Performance Overview
                    </div>
                    <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                        <MdInfoOutline size={16} className="text-purple-400"/>
                        Snapshot saved **{lastSaved}** | Data Points: **{meta.rows}**
                    </div>
                </div>

                <button onClick={() => navigate("/analytics")} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center gap-2">
                    <MdDataExploration /> Edit Analysis
                </button>
            </div>

            {/* --- 1. KPI Summary (Top Row - Business Focus) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {primaryKpi && (
                    <>
                        {/* KPI 1: Total Metric + Trend */}
                        <OverviewKpiTile 
                            title={`Total ${primaryMetricKey}`} 
                            value={primaryKpi.total} 
                            context={anomalyContext.includes("Issue") ? "Underperforming vs. Average" : "Positive performance trend"}
                            icon={anomalyContext.includes("Issue") ? MdTrendingDown : MdTrendingUp}
                            sparkData={primaryKpi.sparkData}
                            metricKey={primaryMetricKey}
                        />

                        {/* KPI 2: Average Value + Secondary Metric */}
                        <OverviewKpiTile 
                            title={`Average ${primaryMetricKey} Value`} 
                            value={primaryKpi.avg} 
                            context={`Max Value: ${primaryKpi.max.toLocaleString()} | Min Value: ${primaryKpi.min.toLocaleString()}`}
                            icon={MdInfoOutline}
                        />
                         
                        {/* KPI 3: Key Insight/Anomaly */}
                        <OverviewKpiTile 
                            title={"Top Contributing Category"} 
                            value={categories?.labels[0] || "N/A"} 
                            context={`Accounts for ${((categories?.data[0] / primaryKpi.total) * 100).toFixed(1)}% of total ${primaryMetricKey}`}
                            icon={MdOutlineDashboard}
                        />
                    </>
                )}
            </div>

            {/* --- 2. Insights and Distribution --- */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* AI Summary Panel - CENTRAL FOCUS */}
                <div className="lg:w-3/5 p-6 rounded-xl shadow-lg flex-grow" 
                     style={{ background: "#1c2135", borderLeft: "4px solid #a78bfa" }}>
                    <div className="font-semibold text-2xl text-pink-400 mb-3 flex items-center gap-2">
                        <MdDataExploration size={24}/> Executive AI Analysis & Key Takeaways
                    </div>
                    <div className="text-base text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {analysisText.startsWith("Generating insights") 
                            ? "Analysis still pending generation. Please return to the Workspace to re-trigger."
                            : analysisText
                        }
                    </div>
                </div>

                {/* Category Chart Panel */}
                <div className="lg:w-2/5 flex-shrink-0">
                    <CategoryPieChart categories={categories} />
                </div>
            </div>
        </div>
    );
}