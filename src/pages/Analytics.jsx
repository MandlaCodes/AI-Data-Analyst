import React, { useState, useEffect, useMemo, useRef } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";
import { FiDownload, FiUploadCloud, FiRefreshCw, FiSave, FiXCircle, FiGrid } from "react-icons/fi";
import { MdOutlineAnalytics, MdDataExploration, MdDeleteForever } from "react-icons/md";
import axios from "axios";

// --- CHART.JS REGISTRATION ---
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// --- COMPONENT: KPI TILE (Updated Design) ---
function KpiTile({ title, value, subtitle, sparkData, sparkType = "line" }) {
    const sparkOptions = {
        responsive: true,
        maintainAspectRatio: false,
        elements: { point: { radius: 0 } },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
    };

    const sparkProps = {
        labels: sparkData ? sparkData.map((_, i) => i) : [],
        datasets: [
            {
                data: sparkData || [0],
                borderColor: "rgba(167,139,250,0.95)",
                backgroundColor: "rgba(167,139,250,0.12)",
                tension: 0.4,
            },
        ],
    };

    return (
        <div className="rounded-2xl p-4 shadow-xl" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.7), rgba(8,10,20,0.55))", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs text-gray-300">{title}</div>
                    <div className="text-2xl font-semibold text-white">{value.toLocaleString()}</div>
                    {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
                </div>
                <div className="w-28 h-12">
                    {sparkType === "line" ? <Line data={sparkProps} options={sparkOptions} /> : <Bar data={sparkProps} options={sparkOptions} />}
                </div>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function Analytics() {
    const profile = JSON.parse(localStorage.getItem("adt_profile") || "null") || { user_id: "test-user" };

    // --- NEW MULTI-ANALYSIS STATE ---
    const [analyses, setAnalyses] = useState([]); // Array to hold all imported analyses
    const [activeAnalysisId, setActiveAnalysisId] = useState(null); // ID of the currently viewed analysis

    // --- IMPORT MODAL STATE ---
    const [showModal, setShowModal] = useState(false);
    const [selectedApps, setSelectedApps] = useState([]);
    const [sheetsList, setSheetsList] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [csvToImport, setCsvToImport] = useState(null);
    const [loadingSheetValues, setLoadingSheetValues] = useState(false);
    const [sourceName, setSourceName] = useState(""); // Temporary state for new import name

    // --- UI/CHART STATE ---
    const [chartType, setChartType] = useState("line");
    const [showSavedToast, setShowSavedToast] = useState(false);
    const rightPanelRef = useRef(null);
    const [chartHeight, setChartHeight] = useState(260);

    // --- ACTIVE ANALYSIS COMPUTATION ---
    const activeAnalysis = useMemo(() => {
        return analyses.find(a => a.id === activeAnalysisId);
    }, [analyses, activeAnalysisId]);
    
    // Derived states from activeAnalysis for easier access
    const {
        sheetData = [],
        numericCols = [],
        kpis = {},
        categories = { labels: [], data: [] },
        recentRows = [],
        aiText = "AI insights will appear here once generated.",
        sourceName: currentSourceName = "Analytics Workspace"
    } = activeAnalysis || {};
    

    // --- DATA PERSISTENCE (LOAD & SAVE ALL ANALYSES) ---
    useEffect(() => {
        const savedAnalyses = localStorage.getItem("adt_multi_analyses");
        if (savedAnalyses) {
            try {
                const loadedAnalyses = JSON.parse(savedAnalyses);
                setAnalyses(loadedAnalyses);
                if (loadedAnalyses.length > 0) {
                    // Set the latest analysis as active
                    setActiveAnalysisId(loadedAnalyses[loadedAnalyses.length - 1].id);
                }
            } catch {
                localStorage.removeItem("adt_multi_analyses");
            }
        }
    }, []);

    useEffect(() => {
        if (analyses.length > 0) {
            localStorage.setItem("adt_multi_analyses", JSON.stringify(analyses));
        } else {
             localStorage.removeItem("adt_multi_analyses");
             setActiveAnalysisId(null);
        }
    }, [analyses]);


    // --- HELPERS (Copied from original, using current active data) ---
    function sanitizeCellValue(value) {
        if (value === null || value === undefined || value === "") return "";
        const str = String(value).trim();
        const datePattern1 = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
        const datePattern2 = /^\d{4}-\d{2}-\d{2}$/;
        const datePattern3 = /^\d{1,2}-\d{1,2}-\d{2,4}$/;
        if (datePattern1.test(str) || datePattern2.test(str) || datePattern3.test(str)) return str;
        const numericStr = str.replace(/[^0-9.-]/g, "");
        if (numericStr && !isNaN(Number(numericStr))) return Number(numericStr);
        return str;
    }

    const detectNumericColumns = (values) => {
        if (!values || !values.length) return [];
        return values[0]
            .map((_, colIndex) => {
                const sampleVals = values.slice(1, 6).map((r) => r[colIndex]);
                const isNumeric = sampleVals.some((v) => !isNaN(sanitizeCellValue(v)));
                return isNumeric ? colIndex : null;
            })
            .filter((i) => i !== null);
    };

    const parseCSVFile = async (file) => {
        const text = await file.text();
        const rows = text.split(/\r?\n/).filter(Boolean);
        if (!rows.length) return [];
        return rows.map((r) => r.split(",").map((c) => c.trim()));
    };

    // --- CORE LOGIC: COMPUTE KPIs & CATEGORIES ---
    const computeKpis = (values, numericIndexes) => {
        const k = {};
        const headers = values[0] || [];

        numericIndexes.forEach((colIndex) => {
            const colName = headers[colIndex] || `col_${colIndex}`;
            const arr = values.slice(1).map((r) => {
                const v = r[colIndex];
                const n = sanitizeCellValue(v);
                return isNaN(n) ? 0 : n;
            });
            const total = arr.reduce((a, b) => a + b, 0);
            const avg = arr.length ? total / arr.length : 0;
            const max = arr.length ? Math.max(...arr) : 0;
            const min = arr.length ? Math.min(...arr) : 0;
            const spark = arr.slice(-12);
            k[colName] = { total, avg, max, min, spark };
        });

        const firstStringIndex = values[0]?.findIndex((_, i) => !numericIndexes.includes(i) && i !== 0) ?? -1;
        let cats = { labels: [], data: [] };
        if (firstStringIndex >= 0) {
            const byCat = {};
            values.slice(1).forEach((r) => {
                const cat = r[firstStringIndex] || "Unknown";
                const weightIndex = numericIndexes[0];
                const weight = weightIndex !== undefined ? sanitizeCellValue(r[weightIndex]) : 1;
                byCat[cat] = (byCat[cat] || 0) + (isNaN(Number(weight)) ? 0 : Number(weight));
            });
            cats = { labels: Object.keys(byCat), data: Object.values(byCat) };
        } 
        
        return { kpis: k, categories: cats };
    };

    const generateAnalysisObject = (values, name) => {
        const numeric = detectNumericColumns(values);
        const { kpis, categories } = computeKpis(values, numeric);

        const headers = values[0] || [];
        const asObjects = values.slice(1).map((r, idx) => {
            const obj = {};
            headers.forEach((h, i) => (obj[h || `col${i}`] = r[i] ?? ""));
            obj._id = `r-${idx}-${Math.random().toString(36).slice(2, 6)}`;
            return obj;
        });
        const recentRows = asObjects.slice(-12).reverse();
        
        return {
            id: `analysis-${Date.now()}`,
            sourceName: name,
            sheetData: values,
            numericCols: numeric,
            kpis,
            categories,
            recentRows,
            aiText: "Generating insights…", // Will be updated on first load or manual refresh
        };
    };

    // --- IMPORT FETCHING (Google Sheets & CSV) ---
    useEffect(() => {
        if (!showModal || !selectedApps.includes("google_sheets")) {
            setSheetsList([]);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/sheets-list/${profile.user_id}`);
                if (!cancelled) setSheetsList(res.data.sheets || []);
            } catch {
                if (!cancelled) setSheetsList([]);
            }
        })();
        return () => (cancelled = true);
    }, [showModal, selectedApps, profile.user_id]);

    const importSelected = async () => {
        let importedRows = [];
        let sourceNameUsed = sourceName || "Imported Dataset";

        if (selectedApps.includes("google_sheets") && selectedSheet) {
            const sheet = sheetsList.find(s => s.id === selectedSheet);
            sourceNameUsed = sourceNameUsed !== "Imported Dataset" ? sourceNameUsed : (sheet ? sheet.name : "Google Sheet");
            try {
                setLoadingSheetValues(true);
                const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/sheets/${profile.user_id}/${selectedSheet}`);
                importedRows = res.data.values || [];
            } catch (err) {
                console.error("Sheet fetch failed", err);
            } finally {
                setLoadingSheetValues(false);
            }
        }
        
        if (selectedApps.includes("other") && csvToImport) {
            sourceNameUsed = sourceNameUsed !== "Imported Dataset" ? sourceNameUsed : (csvToImport.name.replace(/\.csv$/, '') || "CSV Upload");
            try {
                importedRows = await parseCSVFile(csvToImport);
            } catch (err) {
                console.error("CSV parse failed", err);
            }
        }

        if (!importedRows.length) {
            // Only clear modal state if no data was successfully imported
            setShowModal(false);
            setSelectedApps([]);
            setSelectedSheet("");
            setCsvToImport(null);
            setSourceName("");
            return;
        }

        // --- NEW LOGIC: GENERATE & ADD ANALYSIS OBJECT ---
        const cleaned = importedRows.map((row, idx) => (idx === 0 ? row : row.map((cell) => sanitizeCellValue(cell))));
        const newAnalysis = generateAnalysisObject(cleaned, sourceNameUsed);
        
        setAnalyses(prev => [...prev, newAnalysis]);
        setActiveAnalysisId(newAnalysis.id);
        
        // Clear modal states
        setShowModal(false);
        setSelectedApps([]);
        setSelectedSheet("");
        setCsvToImport(null);
        setSourceName("");
    };

    // --- Chart Generation (Uses activeAnalysis data) ---
    const generateCharts = () => {
        if (!sheetData.length || numericCols.length === 0) return null;
        const labels = sheetData.slice(1).map((r) => (r[0] === undefined || r[0] === null ? "" : String(r[0])));
        
        return numericCols.map((colIndex, i) => {
            const label = sheetData[0][colIndex] || `col ${colIndex}`;
            const dataSeries = sheetData.slice(1).map((r) => {
                const v = r[colIndex];
                const n = sanitizeCellValue(v);
                return isNaN(n) ? 0 : n;
            });
            const chartData = {
                labels,
                datasets: [
                    {
                        label,
                        data: dataSeries,
                        borderColor: "rgba(167,139,250,0.95)",
                        backgroundColor: chartType === "bar" ? "rgba(167,139,250,0.18)" : "rgba(167,139,250,0.06)",
                        tension: 0.35,
                        fill: chartType !== "bar",
                    },
                ],
            };
            return (
                <div key={i} className="rounded-2xl p-4 shadow-lg" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.65), rgba(6,8,18,0.45))" }}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="text-sm text-gray-300">{label}</div>
                            <div className="text-xs text-gray-400">Auto chart — {chartType}</div>
                        </div>
                        <div className="text-xs text-gray-400">values: {dataSeries.length}</div>
                    </div>
                    <div style={{ height: chartHeight }}>
                        {chartType === "line" ? <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /> : <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
                    </div>
                </div>
            );
        });
    };

    // --- Category Chart (Uses activeAnalysis data) ---
    const generateCategoryChart = () => {
        if (!categories.labels.length || !categories.data.length) return null;
        const pieData = {
            labels: categories.labels,
            datasets: [
                {
                    label: 'Distribution by Category',
                    data: categories.data,
                    backgroundColor: [
                        'rgba(167, 139, 250, 0.7)',
                        'rgba(34, 197, 94, 0.7)',
                        'rgba(249, 115, 22, 0.7)',
                        'rgba(234, 179, 8, 0.7)',
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(244, 63, 94, 0.7)',
                    ],
                    borderColor: '#1f2937',
                    borderWidth: 1,
                },
            ],
        };
        const pieOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'rgb(209, 213, 219)' }
                },
                tooltip: {
                    callbacks: {
                        label: ({ label, raw }) => `${label}: ${raw.toLocaleString()}`,
                    }
                }
            },
        };

        return (
            <div className="rounded-2xl p-4 shadow-lg h-full" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.65), rgba(6,8,18,0.45))" }}>
                <div className="text-sm font-semibold text-gray-300 mb-2">Category Distribution</div>
                <div style={{ height: 300 }}>
                    <Pie data={pieData} options={pieOptions} />
                </div>
                <p className="text-xs text-gray-500 mt-2">Distribution is based on the first categorical column found.</p>
            </div>
        );
    };

    // --- AI Insight Generation (Updates the active analysis) ---
    const generateAIInsights = async () => {
        if (!activeAnalysisId || !Object.keys(kpis).length) {
            // No active analysis or metrics available
            return;
        }

        setAnalyses(prev => prev.map(a => a.id === activeAnalysisId ? { ...a, aiText: "Generating insights…" } : a));

        try {
            const payload = { kpis, categories, rowCount: sheetData.length - 1 };
            const res = await axios.post("https://ai-data-analyst-backend-1nuw.onrender.com/ai/analyze", payload);
            const insights = res.data.analysis || "No insights returned.";
            
            setAnalyses(prev => prev.map(a => a.id === activeAnalysisId ? { ...a, aiText: insights } : a));

            setTimeout(() => {
                if (rightPanelRef.current) {
                    rightPanelRef.current.scrollTop = rightPanelRef.current.scrollHeight;
                }
            }, 50);
        } catch (err) {
            console.error(err);
            setAnalyses(prev => prev.map(a => a.id === activeAnalysisId ? { ...a, aiText: "Failed to generate insights from backend." } : a));
        }
    };

    // --- Save to Overview (Saves the active analysis) ---
    const handleSave = () => {
        if (!activeAnalysis || !Object.keys(kpis).length) {
            return;
        }

        const payload = {
            kpis, 
            categories, 
            suggestions: [], 
            anomalies: [], 
            analysisText: aiText || "No summary generated.", 
            meta: {
                sourceName: currentSourceName,
                rows: Math.max(0, sheetData.length - 1),
                columns: (sheetData[0] && sheetData[0].length) || 0,
                savedAt: new Date().toISOString(),
                user: profile.user_id,
            }
        };

        try {
            localStorage.setItem("analytics_overview_data", JSON.stringify(payload));
            setShowSavedToast(true);
            setTimeout(() => setShowSavedToast(false), 2000);
        } catch (err) {
            console.error("Failed to save overview payload:", err);
            // Set error message on the active analysis's AI text
            setAnalyses(prev => prev.map(a => a.id === activeAnalysisId ? { ...a, aiText: "Failed to save metrics to Overview." } : a));
        }
    };
// --- Save Active Analysis to Backend ---
const saveDashboardToBackend = async () => {
    if (!activeAnalysis || !Object.keys(kpis).length) return;

    const payload = {
        user_id: profile.user_id,
        layout_data: JSON.stringify({
            kpis,
            categories,
            aiText,
            sheetData,
            numericCols,
            sourceName: currentSourceName,
            recentRows
        }),
    };

    try {
        const res = await axios.post(
            "https://ai-data-analyst-backend-1nuw.onrender.com/api/dashboard/save",
            payload
        );
        if (res.status === 200) {
            console.log("Dashboard saved to backend:", res.data.dashboard);
            alert("Dashboard saved successfully to your account!");
        } else {
            console.error("Failed to save dashboard:", res.data);
            alert("Failed to save dashboard to backend.");
        }
    } catch (err) {
        console.error("Error saving dashboard:", err);
        alert("Error saving dashboard to backend.");
    }
};

    // --- Delete Analysis ---
    const handleDeleteAnalysis = (idToDelete) => {
        const updatedAnalyses = analyses.filter(a => a.id !== idToDelete);
        setAnalyses(updatedAnalyses);

        if (activeAnalysisId === idToDelete) {
            // If the deleted one was active, set a new active ID (e.g., the first one)
            setActiveAnalysisId(updatedAnalyses.length > 0 ? updatedAnalyses[0].id : null);
        }
    };

    // --- Clear All Data ---
    const handleClearAll = () => {
        setAnalyses([]); // Clears all
        setActiveAnalysisId(null);
        localStorage.removeItem("adt_multi_analyses");
        localStorage.removeItem("analytics_page_state"); // Also clear the legacy key
    };

    // --- Export CSV (Uses activeAnalysis data) ---
    const exportCSV = () => {
        if (!sheetData.length) return;
        const csv = sheetData.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${currentSourceName.replace(/\s/g, '_') || 'export'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- Chart Height Adjuster (Kept original logic) ---
    useEffect(() => {
        const onResize = () => {
            const w = window.innerWidth;
            if (w < 640) setChartHeight(190);
            else if (w < 1024) setChartHeight(220);
            else setChartHeight(260);
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // --- RENDER ---
    return (
        <div className="min-h-screen flex" style={{ background: "linear-gradient(180deg,#0b0f1a,#12062d)" }}>
            
            {/* 1. Left Sidebar: Data Source Management */}
            <div className="w-64 flex-shrink-0 bg-gray-900/50 p-4 border-r border-purple-900/50 flex flex-col shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-purple-400 flex items-center gap-2"><FiGrid size={20}/> All Analyses</h3>
                
                <button
                    onClick={() => { setShowModal(true); setSourceName(""); setSelectedSheet(""); setCsvToImport(null); setSelectedApps([]); }}
                    className="flex items-center justify-center gap-2 px-3 py-2 mb-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow"
                >
                    <FiUploadCloud /> New Import
                </button>
                
                <div className="flex-grow overflow-y-auto space-y-2">
                    {analyses.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No reports loaded. Click 'New Import' to begin.</p>
                    ) : (
                        analyses.map((a) => (
                            <div 
                                key={a.id}
                                onClick={() => setActiveAnalysisId(a.id)}
                                className={`p-3 rounded-lg cursor-pointer transition flex justify-between items-start text-sm ${
                                    a.id === activeAnalysisId
                                        ? 'bg-purple-700 border border-purple-500 font-semibold'
                                        : 'bg-gray-800 hover:bg-gray-700'
                                }`}
                            >
                                <span className="truncate">{a.sourceName}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteAnalysis(a.id); }}
                                    className="p-1 text-red-300 hover:text-red-500 transition ml-2"
                                    title="Delete Analysis"
                                >
                                    <FiXCircle size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {analyses.length > 0 && (
                    <button onClick={handleClearAll} className="mt-4 px-3 py-2 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 transition text-sm flex items-center justify-center gap-2">
                        <MdDeleteForever size={16}/> Clear All Analyses
                    </button>
                )}
            </div>
            
            {/* 2. Main Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
                {/* Header (Dynamic based on active analysis) */}
                <div className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-gray-800 gap-4">
                    <div>
                        <div className="text-3xl font-bold text-white flex items-center gap-3">
                            <MdOutlineAnalytics size={28} className="text-purple-400"/> {currentSourceName}
                        </div>
                        <div className="text-sm text-gray-400">
                            Analysis Mode: **Cross-Analysis Layout** | Rows: {Math.max(0, sheetData.length - 1)} | Columns: {(sheetData[0] && sheetData[0].length) || 0}
                        </div>
                        {activeAnalysis && <div className="text-xs text-gray-500 mt-1">Active report: **{currentSourceName}**</div>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition flex items-center gap-2" disabled={!activeAnalysis}>
                            <FiDownload /> Export CSV
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition flex items-center gap-2" disabled={!Object.keys(kpis).length}>
                            <FiSave /> Save to Dashboard
                        </button>
                    </div>
                </div>

                {/* Main Body */}
                {activeAnalysis ? (
                    <div className="flex gap-6">
                        
                        {/* LEFT COLUMN: Data Overview and Charts */}
                        <div className="flex-grow">
                            
                            {/* KPIs */}
                            {Object.keys(kpis).length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                                    {Object.entries(kpis).map(([k, v]) => (
                                        <KpiTile key={k} title={k} value={v.total} subtitle={`Avg: ${v.avg.toFixed(2)} | Max: ${v.max} | Min: ${v.min}`} sparkData={v.spark} />
                                    ))}
                                </div>
                            )}

                            {/* Charts */}
                            {Object.keys(kpis).length > 0 && (
                                <>
                                    <div className='flex gap-4 items-center mb-4'>
                                        <div className="text-lg font-semibold text-white">Data Visualizations</div>
                                        <button 
                                            onClick={() => setChartType('line')} 
                                            className={`px-3 py-1 rounded-full text-sm ${chartType === 'line' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Line</button>
                                        <button 
                                            onClick={() => setChartType('bar')} 
                                            className={`px-3 py-1 rounded-full text-sm ${chartType === 'bar' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Bar</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">{generateCharts()}</div>
                                </>
                            )}

                            {/* Recent Rows Preview */}
                            {recentRows.length > 0 && (
                                <div className="p-4 rounded-xl shadow-lg text-white" style={{ background: "linear-gradient(180deg,#0c0e1a,#060812)" }}>
                                    <div className="font-semibold mb-2">Recent Rows (last {recentRows.length})</div>
                                    <div className="overflow-x-auto">
                                        <table className="table-auto border-collapse border border-gray-700 text-sm w-full">
                                            <thead>
                                                <tr>
                                                    {Object.keys(recentRows[0]).filter(h => h !== '_id').map((h) => (
                                                        <th key={h} className="border border-gray-700 px-2 py-1 text-left">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentRows.map((row) => (
                                                    <tr key={row._id}>
                                                        {Object.keys(row).filter(h => h !== '_id').map((h) => (
                                                            <td key={h} className="border border-gray-700 px-2 py-1">{row[h]}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: AI Insights and Category Pivot */}
                        <div ref={rightPanelRef} className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-6">
                            
                            {/* AI insights */}
                            <div className="p-4 rounded-xl shadow-lg text-white max-h-[40vh] overflow-y-auto" style={{ background: "linear-gradient(180deg,#0c0e1a,#060812)" }}>
                                <div className="font-semibold mb-2 flex items-center justify-between">
                                    <span><MdDataExploration size={16} className="inline mr-1 text-pink-400"/> AI Analysis & Summary</span>
                                    <button onClick={generateAIInsights} className="px-3 py-1 rounded bg-purple-600 text-white text-xs flex items-center gap-1 hover:bg-purple-700">
                                        <FiRefreshCw size={10}/> {aiText.includes("Generating") ? "Processing..." : "Re-Analyze"}
                                    </button>
                                </div>
                                <div className="text-sm text-gray-300 whitespace-pre-wrap">{aiText}</div>
                            </div>

                            {/* Category Chart */}
                            {generateCategoryChart()}
                        </div>
                    </div>
                ) : (
                    <div className="p-10 text-center rounded-xl bg-gray-900/50 border border-purple-900/50">
                        <h2 className="text-2xl font-bold text-purple-400 mb-2">Cross-Analysis Workspace</h2>
                        <p className="text-gray-400 mb-4">You have no active reports. Import your first Google Sheet or CSV file to begin your analysis.</p>
                        <button onClick={() => setShowModal(true)} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center gap-2 mx-auto">
                            <FiUploadCloud /> Start New Import
                        </button>
                    </div>
                )}
            </div>

            {/* saved toast */}
            {showSavedToast && <div className="fixed bottom-4 right-4 px-4 py-2 bg-green-600 rounded shadow text-white text-sm">Overview saved successfully!</div>}

            {/* Import Modal (Completed) */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
                    <div className="bg-gray-900 p-8 rounded-xl max-w-lg w-full shadow-2xl border border-purple-700">
                        <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><FiUploadCloud /> Select Data Source</h3>
                        
                        <div className="flex flex-col gap-4">
                            
                            {/* Source Selection - Google Sheets */}
                            <div>
                                <label className="text-gray-300 flex items-center gap-2 mb-2 cursor-pointer">
                                    <input type="checkbox" value="google_sheets" checked={selectedApps.includes("google_sheets")} onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedApps((prev) => prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]);
                                        setCsvToImport(null); // Deselect CSV on Sheets selection
                                    }} className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300" /> 
                                    <span className="text-base font-medium">Google Sheets</span>
                                </label>
                                {selectedApps.includes("google_sheets") && (
                                    <div className="pl-6">
                                        <select 
                                            value={selectedSheet} 
                                            onChange={(e) => setSelectedSheet(e.target.value)} 
                                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-indigo-500 focus:border-indigo-500"
                                            disabled={loadingSheetValues || sheetsList.length === 0}
                                        >
                                            <option value="">{sheetsList.length === 0 ? "Loading sheets..." : "Select a Sheet"}</option>
                                            {sheetsList.map((sheet) => (
                                                <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
                                            ))}
                                        </select>
                                        {sheetsList.length === 0 && !loadingSheetValues && <p className="text-xs text-red-400 mt-1">Error: No accessible sheets found. Ensure connection is valid.</p>}
                                        {loadingSheetValues && <p className="text-xs text-indigo-400 mt-1">Fetching sheet list...</p>}
                                    </div>
                                )}
                            </div>

                            <hr className="border-gray-700" />
                            
                            {/* Source Selection - CSV Upload */}
                            <div>
                                <label className="text-gray-300 flex items-center gap-2 mb-2 cursor-pointer">
                                    <input type="checkbox" value="other" checked={selectedApps.includes("other")} onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedApps((prev) => prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]);
                                        setSelectedSheet(""); // Deselect Sheet on CSV selection
                                    }} className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300" /> 
                                    <span className="text-base font-medium">Upload CSV File</span>
                                </label>
                                {selectedApps.includes("other") && (
                                    <div className="pl-6">
                                        <input 
                                            type="file" 
                                            accept=".csv" 
                                            onChange={(e) => setCsvToImport(e.target.files[0])} 
                                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 transition"
                                        />
                                        {csvToImport && <p className="text-xs text-gray-400 mt-1">Selected: **{csvToImport.name}**</p>}
                                    </div>
                                )}
                            </div>

                            <hr className="border-gray-700" />
                            
                            {/* Analysis Name Input */}
                            <div>
                                <label htmlFor="sourceName" className="text-sm font-medium text-gray-300 mb-1 block">Analysis Name (Optional)</label>
                                <input 
                                    id="sourceName"
                                    type="text" 
                                    value={sourceName} 
                                    onChange={(e) => setSourceName(e.target.value)}
                                    placeholder="e.g., Q3 Sales Report"
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
                                />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={importSelected} 
                                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
                                disabled={loadingSheetValues || (selectedApps.includes("google_sheets") && !selectedSheet) || (selectedApps.includes("other") && !csvToImport) || selectedApps.length === 0 || selectedApps.length > 1}
                            >
                                {loadingSheetValues ? "Loading Data..." : "Import & Analyze"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}