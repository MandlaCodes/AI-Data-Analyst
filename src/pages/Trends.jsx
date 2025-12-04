// src/pages/AIPredictions.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FiAlertTriangle, FiTarget, FiTrendingUp } from "react-icons/fi";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- UTILITIES ---
const formatValue = (value, fallback = 'N/A') => {
    if (typeof value === 'number') {
        // Simple formatting for currency/large numbers
        return value > 1000 ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value.toFixed(2);
    }
    if (value) return value;
    return fallback;
};

const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
        case 'critical':
        case 'urgent':
            return 'text-red-400 bg-red-900/30 border-red-700/50';
        case 'warning':
        case 'potential':
            return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
        case 'positive':
        case 'opportunity':
            return 'text-green-400 bg-green-900/30 border-green-700/50';
        default:
            return 'text-purple-400 bg-purple-900/30 border-purple-700/50';
    }
};

// --- MAIN COMPONENT ---
export default function AIPredictions() {
    const [savedData, setSavedData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPredictionsData = () => {
            setLoading(true);
            try {
                // We pull the latest analysis result from the same key
                const raw = localStorage.getItem("analytics_overview_data");
                if (raw) {
                    const data = JSON.parse(raw);
                    setSavedData(data);
                } else {
                    setSavedData(null);
                }
            } catch (err) {
                console.error("Failed to load predictions data from storage", err);
                setSavedData(null);
            } finally {
                setLoading(false);
            }
        };

        loadPredictionsData();
        const onStorage = (e) => {
            if (!e || e.key === "analytics_overview_data") {
                loadPredictionsData();
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // --- MEMOIZED DATA EXTRACTION ---
    const extractedData = useMemo(() => {
        if (!savedData || !savedData.kpis || Object.keys(savedData.kpis).length === 0) {
            return { isEmpty: true, suggestions: [], anomalies: [] };
        }

        const kpiKey = Object.keys(savedData.kpis)[0];
        const kpi = savedData.kpis[kpiKey];
        const sourceName = savedData.meta?.sourceName || "Dataset";
        
        // Ensure suggestions and anomalies are arrays
        const suggestions = savedData.suggestions || [];
        const anomalies = savedData.anomalies || [];
        
        const predictions = kpi.predictions || [];
        const spark = kpi.spark || [];
        const historicalData = spark.map(v => Number(v) || null);
        const pastLabels = kpi.sparkLabels || [];

        // Combine labels for charting
        const futureLabels = predictions.map(p => p.label) || [];
        const labels = [...pastLabels, ...futureLabels];

        // Prediction series setup
        const predictionValues = predictions.map(p => Number(p.value) || null);
        const predictedSeries = [...historicalData.map(() => null), ...predictionValues];

        // Anomaly points setup (only plot historical anomalies)
        const anomalyPoints = labels.map(() => null);
        anomalies.forEach(a => {
            const index = pastLabels.findIndex(l => l === a.date || l === a.label);
            if (index !== -1) {
                // Use historical data point or anomaly value
                anomalyPoints[index] = historicalData[index] || a.value;
            }
        });

        return {
            isEmpty: false,
            kpiKey,
            labels,
            historicalData,
            predictedSeries,
            anomalyPoints,
            sourceName,
            aiSummary: savedData.aiSummary || savedData.analysisText || "No comprehensive AI summary available.",
            suggestions,
            anomalies,
        };
    }, [savedData]);

    if (loading) return <div className="p-6 text-gray-300">Loading analysis data...</div>;
    
    if (extractedData.isEmpty) {
        return (
            <div className="w-full h-full p-6 text-white bg-[#12062d] rounded-lg min-h-screen">
                <h2 className="text-3xl font-bold text-purple-400">AI Strategy & Predictions</h2>
                <div className="mt-8 p-8 bg-gray-800/50 rounded-xl border border-purple-500/50">
                    <p className="text-lg">AI Report Unavailable.</p>
                    <p className="text-gray-400 mt-2">Please run an analysis in the Analytics section and ensure you **Save** the result to generate your AI Strategy Report.</p>
                </div>
            </div>
        );
    }

    const {
        kpiKey, labels, historicalData, predictedSeries, anomalyPoints,
        sourceName, aiSummary, suggestions, anomalies
    } = extractedData;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: "white" } },
            tooltip: { mode: "index", intersect: false },
            title: {
                display: true,
                text: `${kpiKey} Trend & Forecast`,
                color: "white",
                font: { size: 16 },
            },
        },
        scales: {
            x: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } },
            y: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } },
        },
    };

    const lineChartData = {
        labels: labels,
        datasets: [
            {
                label: "Historical Data",
                data: historicalData,
                borderColor: "rgba(75, 192, 192, 0.8)",
                backgroundColor: "rgba(75, 192, 192, 0.1)",
                tension: 0.3,
                fill: false,
            },
            {
                label: "Forecast",
                data: predictedSeries,
                borderColor: "rgba(128, 0, 255, 0.8)",
                backgroundColor: "rgba(128, 0, 255, 0.2)",
                borderDash: [5, 5],
                tension: 0.3,
                fill: 'origin',
            },
            {
                label: "Anomalies",
                data: anomalyPoints,
                borderColor: "rgba(255, 0, 0, 0.8)",
                backgroundColor: "rgba(255, 0, 0, 1)",
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: false,
            },
        ],
    };

    return (
        <div className="w-full h-full p-6 text-white bg-[#12062d] min-h-screen">
            <header className="mb-6 border-b border-purple-700/50 pb-4">
                <h1 className="text-3xl font-bold tracking-wide text-purple-400">
                    <span className="text-white">🧠</span> AI Strategy & Predictions
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    Executive summary and future outlook based on your **{sourceName}** data.
                </p>
            </header>

            {/* AI Summary Section */}
            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-purple-400">
                    <FiTarget className="text-lg" /> Comprehensive AI Summary
                </h3>
                <p className="text-gray-300 whitespace-pre-wrap">{aiSummary}</p>
            </div>

            {/* Top Recommendations/Suggestions */}
            <h2 className="text-2xl font-semibold mb-4 text-white">Top Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {suggestions.slice(0, 3).map((s, i) => (
                    <div key={i} className={`p-4 rounded-xl shadow-lg ${getSeverityColor(s.severity)}`}>
                        <div className="font-bold text-lg mb-1">{s.title || `Recommendation ${i + 1}`}</div>
                        <p className="text-sm opacity-80">{s.impact || s.description || "Detailed suggestion not available."}</p>
                    </div>
                ))}
                {suggestions.length === 0 && (
                    <div className="p-4 rounded-xl bg-gray-800/50 text-gray-400 md:col-span-3">
                        No immediate AI suggestions available. The system is monitoring for opportunities.
                    </div>
                )}
            </div>

            {/* Forecast Chart */}
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <FiTrendingUp className="text-xl" /> Key KPI Forecast ({kpiKey})
            </h2>
            <div className="bg-gray-900/50 p-6 rounded-xl w-full border border-gray-700" style={{ height: "450px" }}>
                <Line
                    data={lineChartData}
                    options={chartOptions}
                    height={450}
                />
            </div>

            {/* Anomaly & Warning Log */}
            {anomalies.length > 0 && (
                <div className="bg-gray-900/50 p-6 rounded-xl flex flex-col gap-3 mt-6 border border-red-700/50">
                    <h3 className="text-red-400 font-semibold text-xl flex items-center gap-2">
                        <FiAlertTriangle className="text-lg" /> Detected Anomalies & Warnings
                    </h3>
                    <ul className="list-disc list-inside text-gray-300 ml-4">
                        {anomalies.map((a, i) => (
                            <li key={i} className="text-sm text-red-300">
                                <span className="font-semibold">{a.title || a.issue}</span> 
                                {a.date && ` (Date: ${a.date})`}
                                {a.impact && ` — ${a.impact}`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}