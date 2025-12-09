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
import { motion, AnimatePresence } from "framer-motion";

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

const BACKEND_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

// --- COMPONENT: KPI TILE ---
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

// --- COMPONENT: Import Modal (Completed) ---
const ImportModal = ({
    showModal,
    setShowModal,
    selectedApps,
    setSelectedApps,
    sheetsList,
    selectedSheet,
    setSelectedSheet,
    csvToImport,
    setCsvToImport,
    loadingSheetValues,
    sourceName,
    setSourceName,
    importSelected,
    profile // kept for consistency, though not directly used here
}) => {
    // Check if the user is connected to Google Sheets (based on local storage)
    // NOTE: This relies on the Integrations page setting this flag correctly.
    const googleSheetsConnected = JSON.parse(localStorage.getItem('adt_profile'))?.google_sheets_connected === true;

    return (
        <AnimatePresence>
            {showModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 50 }}
                        className="w-full max-w-lg rounded-2xl bg-gray-900 p-6 shadow-2xl border border-purple-600/50"
                    >
                        <h3 className="text-2xl font-bold text-white mb-4 border-b border-gray-800 pb-2">
                            Import New Data Source
                        </h3>

                        <div className="space-y-4 mb-6">
                            {/* Source Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Analysis Name (Optional)</label>
                                <input
                                    type="text"
                                    value={sourceName}
                                    onChange={(e) => setSourceName(e.target.value)}
                                    placeholder="e.g., Q3 Sales Report"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            {/* Source Selection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Select Source Type</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setSelectedApps(["google_sheets"])}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                                            selectedApps.includes("google_sheets") ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        } ${!googleSheetsConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={!googleSheetsConnected}
                                    >
                                        Google Sheets
                                    </button>
                                    <button
                                        onClick={() => setSelectedApps(["other"])}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                                            selectedApps.includes("other") ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        CSV / Other
                                    </button>
                                </div>
                                {!googleSheetsConnected && (
                                    <p className="text-xs text-red-400">
                                        Google Sheets is not connected. Go to **Integrations** to link your account.
                                    </p>
                                )}
                            </div>

                            {/* Google Sheets Selector */}
                            {selectedApps.includes("google_sheets") && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Select Sheet</label>
                                    {loadingSheetValues ? (
                                        <p className="text-purple-400 flex items-center gap-2">
                                            <FiRefreshCw className="animate-spin" /> Loading sheet list...
                                        </p>
                                    ) : sheetsList.length > 0 ? (
                                        <select
                                            value={selectedSheet}
                                            onChange={(e) => setSelectedSheet(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="">-- Select a Spreadsheet --</option>
                                            {sheetsList.map((sheet) => (
                                                <option key={sheet.id} value={sheet.id}>
                                                    {sheet.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-red-400 text-sm">
                                            Could not load any Google Sheets. Ensure your account has sheets and the connection is active.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* CSV Uploader */}
                            {selectedApps.includes("other") && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Upload CSV or JSON File</label>
                                    <input
                                        type="file"
                                        accept=".csv, application/json"
                                        onChange={(e) => setCsvToImport(e.target.files[0])}
                                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                    />
                                    {csvToImport && <p className="text-xs text-gray-500 mt-1">Selected: {csvToImport.name}</p>}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-4 border-t border-gray-800 pt-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-xl text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={importSelected}
                                disabled={loadingSheetValues || (!selectedSheet && !csvToImport)}
                                className="px-4 py-2 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/50 disabled:bg-gray-600 disabled:shadow-none"
                            >
                                {loadingSheetValues ? "Fetching Data..." : "Import Data"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// --- MAIN COMPONENT ---
export default function Analytics() {
    // Ensure we load the most current profile state, which includes the user_id
    const profile = JSON.parse(localStorage.getItem("adt_profile") || "null") || { user_id: "test-user" };
    // CRITICAL: Get the token here for use in API calls
    const token = localStorage.getItem("adt_token"); 

    // --- NEW MULTI-ANALYSIS STATE ---
    const [analyses, setAnalyses] = useState([]); 
    const [activeAnalysisId, setActiveAnalysisId] = useState(null); 

    // --- IMPORT MODAL STATE ---
    const [showModal, setShowModal] = useState(false);
    const [selectedApps, setSelectedApps] = useState([]);
    const [sheetsList, setSheetsList] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [csvToImport, setCsvToImport] = useState(null);
    const [loadingSheetValues, setLoadingSheetValues] = useState(false);
    const [sourceName, setSourceName] = useState(""); 

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
                    // Set active to the last loaded analysis
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


    // --- HELPERS ---
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
        // Simple CSV parser: assumes standard comma separation, handles quoted fields poorly, but works for basic data
        return rows.map((r) => r.split(",").map((c) => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"')));
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

        // Try to find the first non-numeric column (excluding column 0 which is often an index)
        const firstStringIndex = values[0]?.findIndex((_, i) => !numericIndexes.includes(i) && i !== 0) ?? -1;
        let cats = { labels: [], data: [] };
        if (firstStringIndex >= 0 && numericIndexes.length > 0) {
            const byCat = {};
            // Use the first numeric column as the weight
            const weightIndex = numericIndexes[0]; 

            values.slice(1).forEach((r) => {
                const cat = r[firstStringIndex] || "Unknown";
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
    // ✅ FIX 1: Corrected API path and added Auth Header for sheets list
    useEffect(() => {
        const currentToken = localStorage.getItem("adt_token"); 

        if (!showModal || !selectedApps.includes("google_sheets") || !currentToken) {
            setSheetsList([]);
            return;
        }
        
        let cancelled = false;
        setLoadingSheetValues(true);
        (async () => {
            try {
                // FIX: Removed {profile.user_id} from the path. Backend uses JWT for auth.
                const res = await axios.get(
                    `${BACKEND_BASE_URL}/sheets-list`, 
                    {
                        headers: {
                            'Authorization': `Bearer ${currentToken}` 
                        }
                    }
                );
                if (!cancelled) setSheetsList(res.data.sheets || []);
            } catch(err) {
                console.error("Failed to fetch sheets list with token:", err);
                // The error could be a 401/400 if the token is bad, or a network error.
                if (!cancelled) setSheetsList([]);
            } finally {
                if (!cancelled) setLoadingSheetValues(false);
            }
        })();
        return () => (cancelled = true);
    }, [showModal, selectedApps]); // Removed profile.user_id as it's not needed for the JWT authenticated endpoint


    // ✅ FIX 2: Added Auth Header to fetch Google Sheet Data
    const importSelected = async () => {
        let importedRows = [];
        let sourceNameUsed = sourceName || "Imported Dataset";
        
        const currentToken = localStorage.getItem("adt_token"); 

        if (selectedApps.includes("google_sheets") && selectedSheet) {
            if (!currentToken) {
                console.error("Cannot fetch sheet data: Auth token is missing.");
                return; 
            }

            const sheet = sheetsList.find(s => s.id === selectedSheet);
            sourceNameUsed = sourceNameUsed !== "Imported Dataset" ? sourceNameUsed : (sheet ? sheet.name : "Google Sheet");
            try {
                setLoadingSheetValues(true);
                // FIX: Updated endpoint path to use the sheet_id and added Auth header
                const res = await axios.get(
                    `${BACKEND_BASE_URL}/sheets/${selectedSheet}`, 
                    {
                        headers: {
                            'Authorization': `Bearer ${currentToken}` 
                        }
                    }
                );
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

        // Trigger AI analysis automatically after import
        // NOTE: We pass the data directly since the activeAnalysis state might not update immediately
        setTimeout(() => generateAIInsights(newAnalysis), 100);
    };

    // --- Chart Generation (Uses activeAnalysis data) ---
    const generateCharts = () => {
        if (!sheetData.length || numericCols.length === 0) return null;
        // Use column 0 for labels, assuming it's the category/time field
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
                        {chartType === "line" ? <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: 'rgb(209, 213, 219)' } } }, y: { ticks: { color: 'rgb(209, 213, 219)' } } } } /> : <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: 'rgb(209, 213, 219)' } }, y: { ticks: { color: 'rgb(209, 213, 219)' } } } }} />}
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
                <p className="text-xs text-gray-500 mt-2">Distribution is based on the first categorical column found, weighted by the first numeric column.</p>
            </div>
        );
    };

    // --- AI Insight Generation (Updates the active analysis) ---
    const generateAIInsights = async (analysisToAnalyze = activeAnalysis) => {
        if (!analysisToAnalyze || !Object.keys(analysisToAnalyze.kpis).length) {
            return;
        }
        const analysisId = analysisToAnalyze.id;
        const { kpis, categories, sheetData } = analysisToAnalyze;
        const rowCount = sheetData.length - 1;

        setAnalyses(prev => prev.map(a => a.id === analysisId ? { ...a, aiText: "Generating insights…" } : a));

        try {
            const payload = { kpis, categories, rowCount };
            const res = await axios.post(`${BACKEND_BASE_URL}/ai/analyze`, payload); 
            const insights = res.data.analysis || "No insights returned.";
            
            setAnalyses(prev => prev.map(a => a.id === analysisId ? { ...a, aiText: insights } : a));

            setTimeout(() => {
                if (rightPanelRef.current) {
                    rightPanelRef.current.scrollTop = rightPanelRef.current.scrollHeight;
                }
            }, 50);
        } catch (err) {
            console.error(err);
            setAnalyses(prev => prev.map(a => a.id === analysisId ? { ...a, aiText: "Failed to generate insights from backend." } : a));
        }
    };

    // --- Save to Overview ---
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
            setAnalyses(prev => prev.map(a => a.id === activeAnalysisId ? { ...a, aiText: "Failed to save metrics to Overview." } : a));
        }
    };
    
    // --- Save Active Analysis to Backend (Dashboard Manager) ---
    const saveDashboardToBackend = async () => {
        if (!activeAnalysis || !Object.keys(kpis).length) return;

        const payload = {
            name: currentSourceName, // Use source name as dashboard name
            layout: { // Send the entire analysis object for easy reloading later
                kpis,
                categories,
                aiText,
                sheetData,
                numericCols,
                sourceName: currentSourceName,
                recentRows
            },
        };

        try {
            const res = await axios.post(
                `${BACKEND_BASE_URL}/api/dashboard/save`,
                payload,
                // Assuming this POST endpoint is protected and requires a token
                {
                    headers: {
                        'Authorization': `Bearer ${token}` 
                    }
                }
            );
            if (res.status === 200) {
                console.log("Dashboard saved to backend:", res.data.id);
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
            setActiveAnalysisId(updatedAnalyses.length > 0 ? updatedAnalyses[0].id : null);
        }
    };

    // --- Clear All Data ---
    const handleClearAll = () => {
        if (window.confirm("Are you sure you want to clear ALL saved analyses? This cannot be undone.")) {
            setAnalyses([]); 
            setActiveAnalysisId(null);
            localStorage.removeItem("adt_multi_analyses");
        }
    };

    // --- Export CSV ---
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

    // --- Chart Height Adjuster ---
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
                                className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition border ${
                                    a.id === activeAnalysisId
                                        ? 'bg-purple-700/30 border-purple-500 text-white shadow-lg'
                                        : 'bg-gray-800/50 border-gray-800 text-gray-300 hover:bg-gray-700/50'
                                }`}
                            >
                                <span className="text-sm font-medium truncate">{a.sourceName}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteAnalysis(a.id); }}
                                    className="p-1 rounded-full text-gray-400 hover:text-red-400 hover:bg-gray-700"
                                    title="Delete Analysis"
                                >
                                    <MdDeleteForever size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
                
                {analyses.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="flex items-center justify-center gap-2 px-3 py-2 mt-4 text-sm text-red-400 border border-red-800/50 rounded-lg hover:bg-red-900/20 transition"
                    >
                        <FiXCircle /> Clear All Data
                    </button>
                )}
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-grow p-6 overflow-y-auto">
                <h1 className="text-3xl font-extrabold text-white mb-6">
                    {currentSourceName}
                </h1>

                {activeAnalysis ? (
                    <div className="space-y-8">
                        
                        {/* 2.1. Top Bar: Actions */}
                        <div className="flex justify-between items-center border-b border-gray-800 pb-4 sticky top-0 bg-gradient-to-b from-[#0b0f1a] to-transparent z-10 pt-2">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => generateAIInsights(activeAnalysis)}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition shadow-md shadow-purple-500/50"
                                >
                                    <MdOutlineAnalytics /> Re-Analyze Data
                                </button>
                                <button
                                    onClick={exportCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition"
                                >
                                    <FiDownload /> Export CSV
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition"
                                    title="Save KPIs and AI Text to the Overview Page"
                                >
                                    <FiSave /> Save to Overview
                                </button>
                                <button
                                    onClick={saveDashboardToBackend}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                                    title="Save Analysis to the Dashboard Manager"
                                >
                                    <FiSave /> Save Dashboard
                                </button>
                            </div>
                            <div className="flex gap-2 text-sm text-gray-400">
                                Chart View:
                                <button onClick={() => setChartType("line")} className={`px-2 py-1 rounded-md ${chartType === 'line' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}>Line</button>
                                <button onClick={() => setChartType("bar")} className={`px-2 py-1 rounded-md ${chartType === 'bar' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}>Bar</button>
                            </div>
                        </div>

                        {/* 2.2. KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Object.entries(kpis).map(([col, data]) => (
                                <>
                                    <KpiTile key={`${col}-total`} title={`${col} (Total)`} value={data.total} subtitle={`Avg: ${data.avg.toFixed(2)}`} sparkData={data.spark} sparkType="line" />
                                    <KpiTile key={`${col}-max`} title={`${col} (Max)`} value={data.max} subtitle={`Min: ${data.min}`} sparkData={data.spark.map(v => v - data.min)} sparkType="bar" />
                                </>
                            ))}
                        </div>

                        {/* 2.3. Charts & Insights */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* AI Insights Panel (2/3 width on large screens) */}
                            <div className="lg:col-span-2 rounded-2xl p-6 shadow-xl" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.7), rgba(8,10,20,0.55))", border: "1px solid rgba(255,255,255,0.04)" }}>
                                <h3 className="text-xl font-bold text-green-400 flex items-center gap-2 mb-4">
                                    <MdDataExploration /> AI-Powered Analysis
                                </h3>
                                <div ref={rightPanelRef} className="text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
                                    {aiText}
                                </div>
                            </div>
                            
                            {/* Category Chart (1/3 width on large screens) */}
                            <div className="lg:col-span-1">
                                {generateCategoryChart() || (
                                    <div className="rounded-2xl p-4 shadow-lg h-full flex items-center justify-center text-gray-500" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.65), rgba(6,8,18,0.45))" }}>
                                        <p>No suitable categorical data found to generate distribution chart.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* 2.4. Detailed Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {generateCharts()}
                        </div>
                        
                        {/* 2.5. Recent Data Table */}
                        <div className="rounded-2xl p-6 shadow-xl" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.7), rgba(8,10,20,0.55))", border: "1px solid rgba(255,255,255,0.04)" }}>
                            <h3 className="text-xl font-bold text-gray-300 mb-4">
                                Recent Data Rows ({recentRows.length} of {sheetData.length - 1})
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-800">
                                        <tr>
                                            {sheetData[0].map((header, index) => (
                                                <th
                                                    key={index}
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                                                >
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {recentRows.map((row) => (
                                            <tr key={row._id} className="hover:bg-gray-800/50 transition">
                                                {Object.values(row).slice(0, -1).map((cell, index) => (
                                                    <td
                                                        key={index}
                                                        className={`px-6 py-4 whitespace-nowrap text-sm ${typeof cell === 'number' ? 'text-green-300 font-mono' : 'text-gray-300'}`}
                                                    >
                                                        {typeof cell === 'number' ? cell.toLocaleString() : cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="text-center py-20 border border-dashed border-gray-700 rounded-2xl">
                        <FiUploadCloud size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-xl text-gray-400 font-semibold">Ready to Analyze Data?</p>
                        <p className="text-gray-500 mt-2">Import a Google Sheet or upload a CSV file to begin your AI analysis.</p>
                        <button
                            onClick={() => { setShowModal(true); setSourceName(""); setSelectedSheet(""); setCsvToImport(null); setSelectedApps([]); }}
                            className="mt-6 flex items-center gap-2 mx-auto px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition shadow-lg shadow-purple-500/30"
                        >
                            <FiUploadCloud /> Import Data
                        </button>
                    </div>
                )}
            </div>

            {/* 3. Import Modal */}
            <ImportModal
                showModal={showModal}
                setShowModal={setShowModal}
                selectedApps={selectedApps}
                setSelectedApps={setSelectedApps}
                sheetsList={sheetsList}
                selectedSheet={selectedSheet}
                setSelectedSheet={setSelectedSheet}
                csvToImport={csvToImport}
                setCsvToImport={setCsvToImport}
                loadingSheetValues={loadingSheetValues}
                sourceName={sourceName}
                setSourceName={setSourceName}
                importSelected={importSelected}
                profile={profile}
            />

            {/* 4. Saved Toast */}
            <AnimatePresence>
                {showSavedToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 right-6 p-4 rounded-xl bg-green-600 text-white shadow-xl z-50"
                    >
                        <FiSave className="inline mr-2" /> Metrics saved to Overview page!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}