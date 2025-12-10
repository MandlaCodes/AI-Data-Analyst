import React, { useState, useEffect, useRef } from "react";
import { Line, Bar } from "react-chartjs-2";
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
import { FiDownload, FiUploadCloud, FiSave, FiPlus, FiX, FiLayers, FiActivity, FiBarChart, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { MdOutlineAnalytics, MdCompareArrows, MdOutlineDescription, MdOutlineTableChart } from "react-icons/md";
import axios from "axios";

// --- Chart.js Registration (Keep Logic Intact) ---
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

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

// --- Custom Button Component (Cleaner Styles) ---
const IconButton = ({ icon: Icon, onClick, className = "", children, disabled = false, title = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${disabled ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : className}`}
    >
        <Icon size={16} />
        {children}
    </button>
);


// ---------- Helper Components (Visual Refinements) ----------

function DatasetCard({ dataset, isActive, onToggle, onRemove }) {
    return (
        <div
            className={`relative rounded-xl p-4 cursor-pointer transition-all border-2 flex flex-col justify-between h-full ${
                isActive
                    ? "border-purple-500 shadow-2xl shadow-purple-900/40"
                    : "border-gray-800 hover:border-purple-900"
            }`}
            style={{
                background: isActive
                    ? "linear-gradient(145deg, rgba(167,139,250,0.06), rgba(139,92,246,0.02))"
                    : "rgba(10, 10, 15, 0.7)",
                backdropFilter: "blur(8px)"
            }}
            onClick={onToggle}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <MdOutlineTableChart size={24} className="text-purple-400" />
                        <div className="text-base font-semibold text-white truncate">{dataset.name}</div>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 gap-4">
                        <span className="flex items-center gap-1">
                            <FiLayers size={12} className="text-gray-500" />
                            {dataset.rows} rows
                        </span>
                        <span className="flex items-center gap-1">
                            <MdCompareArrows size={12} className="text-gray-500" />
                            {dataset.cols} columns
                        </span>
                    </div>
                </div>

                {isActive && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="flex-shrink-0 ml-3 p-1 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors"
                        title="Remove dataset"
                    >
                        <FiX size={16} />
                    </button>
                )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: dataset.color }}
                    />
                    <span className="text-sm text-gray-400">Color Tag</span>
                </div>
                {isActive && (
                    <div className="text-sm font-medium text-purple-400 select-none flex items-center gap-1">
                        <FiActivity size={14} />
                        Active
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricComparisonCard({ title, datasets }) {
    const datasetsToRender = datasets.filter(d => d.value !== undefined && d.value !== null);

    const d1 = datasetsToRender[0]?.value;
    const d2 = datasetsToRender[1]?.value;

    const variance = d1 !== undefined && d2 !== undefined && d1 !== 0
        ? (((d2 - d1) / d1) * 100).toFixed(1)
        : '—';
    const isPositive = d1 !== undefined && d2 !== undefined ? d2 >= d1 : true;

    return (
        <div
            className="rounded-xl p-5 shadow-2xl border border-gray-800 transition-transform hover:scale-[1.01] hover:border-cyan-500/30"
            style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.01), rgba(10,12,18,0.65))",
                backdropFilter: "blur(8px)"
            }}
        >
            <div className="text-sm font-light text-gray-300 mb-4 flex items-center gap-2">
                <MdCompareArrows size={18} className="text-cyan-400" />
                {title}
            </div>
            
            {/* Primary Value Display (Focus on the first active dataset) */}
            <div className="mb-4">
                <span className="text-4xl font-extrabold text-white">
                    {datasetsToRender[0]?.value !== undefined && datasetsToRender[0]?.value !== null
                        ? datasetsToRender[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                        : 'N/A'}
                </span>
                <span className="text-sm text-gray-500 ml-2">{datasetsToRender[0]?.name || 'Primary'}</span>
            </div>

            {/* Comparison Details */}
            <div className="space-y-3">
                {datasetsToRender.slice(1).map((ds, idx) => (
                    <div key={idx} className="flex items-center justify-between border-t border-gray-800 pt-3">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: ds.color }}
                            />
                            <span className="text-xs text-gray-400">{ds.name}</span>
                        </div>
                        <span className="text-lg font-bold text-gray-300">
                            {typeof ds.value === "number" ? ds.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : ds.value}
                        </span>
                    </div>
                ))}
            </div>

            {datasetsToRender.length > 1 && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Variance (vs. Primary)</span>
                        <span
                            className={`font-bold text-sm flex items-center gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}
                        >
                            <FiBarChart size={12} className={isPositive ? "rotate-180" : ""} />
                            {variance}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------- Main Component (Refined UI Structure) ----------
export default function Analytics() {
    // --- Logic from original file (Untouched) ---
    const profile = (() => {
        try {
            return JSON.parse(localStorage.getItem("adt_profile")) || { user_id: "test-user" };
        } catch {
            return { user_id: "test-user" };
        }
    })();

    // modal + import
    const [showModal, setShowModal] = useState(false);
    const [selectedApps, setSelectedApps] = useState([]);
    const [sheetsList, setSheetsList] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [csvToImport, setCsvToImport] = useState(null);
    const [loadingSheetValues, setLoadingSheetValues] = useState(false);

    // datasets
    const [allDatasets, setAllDatasets] = useState([]);
    const [activeDatasets, setActiveDatasets] = useState([]);
    const [chartType, setChartType] = useState("line");
    const [showSavedToast, setShowSavedToast] = useState(false);

    const datasetColors = ["rgba(167,139,250,0.92)", "rgba(34,197,94,0.92)", "rgba(249,115,22,0.92)", "rgba(234,179,8,0.92)"];

    // ---------- Utilities (Untouched) ----------
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
                const isNumeric = sampleVals.some((v) => {
                    const n = sanitizeCellValue(v);
                    return typeof n === "number" && !isNaN(n);
                });
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

    const computeMetrics = (values, numericIndexes) => {
        if (!values.length || !numericIndexes.length) return {};
        const headers = values[0];
        const metrics = {};
        numericIndexes.forEach((colIndex) => {
            const colName = headers[colIndex] || `col_${colIndex}`;
            const arr = values.slice(1).map((r) => {
                const n = sanitizeCellValue(r[colIndex]);
                return typeof n === "number" && !isNaN(n) ? n : 0;
            });
            const total = arr.reduce((a, b) => a + b, 0);
            const avg = arr.length ? total / arr.length : 0;
            const max = arr.length ? Math.max(...arr) : 0;
            const min = arr.length ? Math.min(...arr) : 0;
            metrics[colName] = { total, avg, max, min };
        });
        return metrics;
    };

    // ---------- Fetch sheet list (Untouched) ----------
    useEffect(() => {
        if (!showModal || !selectedApps.includes("google_sheets")) return;
        let cancelled = false;

        (async () => {
            try {
                const token = localStorage.getItem("adt_token");
                if (!token) throw new Error("No auth token.");

                let userId = profile.user_id;
                if (!userId) {
                    const meRes = await axios.get(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` }});
                    if (meRes.data?.id) userId = meRes.data.id;
                    else throw new Error("User ID unavailable.");
                }

                const res = await axios.get(`${API_BASE_URL}/sheets-list/${userId}`, { headers: { Authorization: `Bearer ${token}` }});
                if (!cancelled) setSheetsList(res.data.sheets || []);
            } catch (err) {
                console.error("fetchSheets error:", err);
                if (!cancelled) setSheetsList([]);
            }
        })();

        return () => { cancelled = true; };
    }, [showModal, selectedApps, profile.user_id]);

    // ---------- Import selected datasets (Untouched) ----------
    const importSelected = async () => {
        const importedRows = [];
        let sourceName = "Imported Dataset";

        for (const key of selectedApps) {
            if (key === "google_sheets") {
                if (!selectedSheet) continue;
                const sheet = sheetsList.find((s) => s.id === selectedSheet);
                sourceName = sheet?.name || sourceName;

                try {
                    setLoadingSheetValues(true);
                    const res = await axios.get(`${API_BASE_URL}/sheets/${profile.user_id}/${selectedSheet}`);
                    if (res.data?.values?.length) importedRows.push(...res.data.values);
                } catch (err) {
                    console.error("Google Sheet fetch failed:", err);
                } finally {
                    setLoadingSheetValues(false);
                }
            } else if (key === "other" && csvToImport) {
                sourceName = (csvToImport.name || sourceName).replace(/\.csv$/i, "");
                try {
                    const values = await parseCSVFile(csvToImport);
                    if (values.length) importedRows.push(...values);
                } catch (err) {
                    console.error("CSV parse failed:", err);
                }
            }
        }

        if (!importedRows.length) {
            setShowModal(false);
            setSelectedApps([]);
            setSelectedSheet("");
            setCsvToImport(null);
            return;
        }

        const cleaned = importedRows.map((row, idx) => idx === 0 ? row : row.map(sanitizeCellValue));
        const numeric = detectNumericColumns(cleaned);
        const metrics = computeMetrics(cleaned, numeric);

        const newDataset = {
            id: Date.now(),
            name: sourceName,
            color: datasetColors[allDatasets.length % datasetColors.length],
            rows: Math.max(0, cleaned.length - 1),
            cols: cleaned[0]?.length || 0,
            data: cleaned,
            numericCols: numeric,
            metrics
        };

        setAllDatasets((prev) => [...prev, newDataset]);
        setActiveDatasets((prev) => [...prev, newDataset]);
        setShowModal(false);
        setSelectedApps([]);
        setSelectedSheet("");
        setCsvToImport(null);
    };

    // ---------- Dataset management (Untouched) ----------
    const toggleDataset = (dataset) => {
        if (activeDatasets.find((d) => d.id === dataset.id)) {
            setActiveDatasets((prev) => prev.filter((d) => d.id !== dataset.id));
        } else {
            setActiveDatasets((prev) => [...prev, dataset]);
        }
    };

    const removeDataset = (id) => {
        setAllDatasets((prev) => prev.filter((d) => d.id !== id));
        setActiveDatasets((prev) => prev.filter((d) => d.id !== id));
    };

    // ---------- Chart generator (Untouched Logic, only styling for chart options) ----------
    const generateComparisonChart = () => {
        if (!activeDatasets.length) return (
            <div className="flex flex-col items-center justify-center h-full min-h-[380px] text-gray-500 bg-gray-900/40 rounded-xl border border-gray-800 p-8">
                <FiAlertCircle size={32} className="text-purple-500 mb-4" />
                <p className="text-lg font-semibold">No Active Datasets</p>
                <p className="text-sm">Import a dataset and click on its card to activate it for comparison.</p>
            </div>
        );

        const firstDataset = activeDatasets[0];
        if (!firstDataset || !firstDataset.numericCols.length) return (
            <div className="text-center text-gray-400 py-6">No numeric columns available in selected datasets.</div>
        );

        const numericIndex = firstDataset.numericCols[0];
        const colLabel = firstDataset.data[0][numericIndex] || "Value";

        const maxLength = Math.max(...activeDatasets.map((ds) => Math.max(0, ds.data.length - 1)));
        const visible = Math.min(maxLength, 20);
        const labels = Array.from({ length: visible }, (_, i) => `Row ${i + 1}`);

        const datasets = activeDatasets.map((ds) => {
            let currentNumericIndex = ds.numericCols.includes(numericIndex) ? numericIndex : ds.numericCols[0];
            if (currentNumericIndex === undefined) currentNumericIndex = 0;

            const series = ds.data.slice(1, visible + 1).map((row) => {
                const n = sanitizeCellValue(row[currentNumericIndex]);
                return typeof n === "number" && !isNaN(n) ? n : 0;
            });

            return {
                label: `${ds.name} — ${ds.data[0][currentNumericIndex] || colLabel}`,
                data: series,
                borderColor: ds.color,
                backgroundColor: ds.color.replace("0.92", "0.18"),
                tension: 0.35,
                fill: chartType === "line",
            };
        });

        const chartData = { labels, datasets };
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { display: true, labels: { color: "#9ca3af" } },
                tooltip: { backgroundColor: "rgba(0,0,0,0.8)", bodyColor: "#d1d5db", titleColor: "#f3f4f6" }
            },
            scales: {
                x: { 
                    grid: { color: "rgba(75, 85, 99, 0.18)", drawBorder: false }, 
                    ticks: { color: "#9ca3af" } 
                },
                y: { 
                    grid: { color: "rgba(75, 85, 99, 0.18)", drawBorder: false }, 
                    ticks: { color: "#9ca3af" } 
                }
            }
        };

        return (
            <div className="bg-gray-900/40 rounded-xl border border-gray-800 p-6 shadow-2xl">
                <div style={{ height: 380 }}>
                    {chartType === "line" ? <Line data={chartData} options={options} /> : <Bar data={chartData} options={options} />}
                </div>
            </div>
        );
    };

    // ---------- Metric comparisons (Untouched Logic) ----------
    const generateMetricComparisons = () => {
        if (!activeDatasets.length) return [];

        const firstDataset = activeDatasets[0];
        const firstMetricKey = Object.keys(firstDataset.metrics || {})[0];
        if (!firstMetricKey) return [];

        const metricTypes = ["total", "avg", "max"];
        return metricTypes.map((metricType) => {
            const datasets = activeDatasets.map((ds) => ({
                name: ds.name,
                color: ds.color,
                value: ds.metrics[firstMetricKey]?.[metricType]
            }));
            return { title: `${firstMetricKey} (${metricType.toUpperCase()})`, datasets };
        });
    };

    const metricComparisons = generateMetricComparisons();

    // ---------- Save & Export (Untouched Logic) ----------
    const handleSave = () => {
        if (!activeDatasets.length) return;
        const payload = {
            datasets: activeDatasets.map((ds) => ({
                name: ds.name,
                metrics: ds.metrics,
                rows: ds.rows,
                cols: ds.cols
            })),
            savedAt: new Date().toISOString(),
        };
        try {
            localStorage.setItem("analytics_comparison_data", JSON.stringify(payload));
            setShowSavedToast(true);
            setTimeout(() => setShowSavedToast(false), 2000);
        } catch (err) {
            console.error("Failed to save:", err);
        }
    };

    const exportActive = () => {
        if (!activeDatasets.length) return;
        const rows = [];
        activeDatasets.forEach((ds) => {
            rows.push([`Dataset: ${ds.name}`]);
            rows.push(ds.data[0] || []);
            ds.data.slice(1).forEach((r) => rows.push(r));
            rows.push([]);
        });
        const csv = rows.map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `comparison_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ---------- Render ----------
    return (
        <div className="min-h-screen p-8 lg:p-10" style={{ background: "linear-gradient(180deg, #070D18, #050510)" }}>
            
            {/* Animated Background Element (Optional, for visual flair) */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative max-w-7xl mx-auto">
                
                {/* ========== Header ========== */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-gray-800">
                    <h1 className="text-4xl font-extrabold text-white flex items-center gap-3">
                        <MdOutlineAnalytics size={32} className="text-purple-400" /> 
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                            Data Comparison Engine
                        </span>
                    </h1>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4 sm:mt-0">
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            title="Change Chart Type"
                            className="bg-gray-800 text-white border border-gray-700 p-2 rounded-lg text-sm transition-colors hover:border-cyan-500"
                        >
                            <option value="line">📈 Line Chart</option>
                            <option value="bar">📊 Bar Chart</option>
                        </select>
                        <IconButton 
                            icon={FiSave} 
                            onClick={handleSave} 
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/50"
                        >
                            Save View
                        </IconButton>
                        <IconButton 
                            icon={FiDownload} 
                            onClick={exportActive} 
                            disabled={!activeDatasets.length}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                            title="Export all active datasets as a CSV file"
                        >
                            Export
                        </IconButton>
                        <IconButton 
                            icon={FiUploadCloud} 
                            onClick={() => setShowModal(true)} 
                            className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-900/50"
                        >
                            Import Data
                        </IconButton>
                    </div>
                </header>

                {/* ========== Datasets List/Collection ========== */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                        <FiLayers size={20} className="text-purple-400" /> Data Sources ({allDatasets.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {allDatasets.map((ds) => (
                            <DatasetCard
                                key={ds.id}
                                dataset={ds}
                                isActive={!!activeDatasets.find((d) => d.id === ds.id)}
                                onToggle={() => toggleDataset(ds)}
                                onRemove={() => removeDataset(ds.id)}
                            />
                        ))}
                        {allDatasets.length === 0 && (
                             <div className="lg:col-span-4 p-6 text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/40">
                                <MdOutlineDescription size={24} className="mx-auto mb-2 text-gray-600" />
                                No datasets imported. Use the **Import Data** button to begin.
                            </div>
                        )}
                    </div>
                </section>

                {/* ========== Main Chart View ========== */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                        <FiBarChart size={20} className="text-cyan-400" /> Visual Comparison
                    </h2>
                    {generateComparisonChart()}
                </section>

                {/* ========== Metric Comparison Cards ========== */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                        <MdCompareArrows size={20} className="text-green-400" /> Key Metric Analysis
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {metricComparisons.length > 0 ? (
                            metricComparisons.map((mc, idx) => (
                                <MetricComparisonCard key={idx} title={mc.title} datasets={mc.datasets} />
                            ))
                        ) : (
                             <div className="lg:col-span-3 p-6 text-center text-gray-500 border border-gray-800 rounded-xl bg-gray-900/40">
                                Select datasets with **numeric columns** to generate metric comparisons (Total, Average, Max).
                            </div>
                        )}
                    </div>
                </section>

                {/* ========== Import Modal (Visual Cleanup) ========== */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-900/50">
                            
                            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-3">
                                <h2 className="text-2xl text-white font-bold flex items-center gap-2">
                                    <FiUploadCloud size={24} className="text-cyan-400" /> Import Dataset
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <FiX size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-5">
                                
                                {/* App Selection */}
                                <div>
                                    <label className="text-gray-400 mb-2 block font-medium">Select Source App(s):</label>
                                    <select
                                        className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-cyan-500 transition-colors"
                                        multiple
                                        value={selectedApps}
                                        onChange={(e) =>
                                            setSelectedApps(Array.from(e.target.selectedOptions, (o) => o.value))
                                        }
                                        size={2}
                                    >
                                        <option value="google_sheets" className="py-2">Google Sheets</option>
                                        <option value="other" className="py-2">CSV Upload</option>
                                    </select>
                                </div>

                                {/* Google Sheets Selector */}
                                {selectedApps.includes("google_sheets") && (
                                    <div>
                                        <label className="text-gray-400 mb-2 block font-medium">Select Sheet:</label>
                                        <select
                                            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-cyan-500 transition-colors"
                                            value={selectedSheet}
                                            onChange={(e) => setSelectedSheet(e.target.value)}
                                            disabled={sheetsList.length === 0}
                                        >
                                            <option value="">
                                                {sheetsList.length > 0 ? "-- Choose Google Sheet --" : "No sheets found (Check Integrations)"}
                                            </option>
                                            {sheetsList.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* CSV Uploader */}
                                {selectedApps.includes("other") && (
                                    <div className="p-4 border-2 border-dashed border-gray-700 rounded-lg text-center">
                                        <label className="text-gray-400 block font-medium cursor-pointer">
                                            <FiRefreshCw size={24} className="mx-auto mb-2 text-cyan-500" />
                                            <span className="text-sm">{csvToImport ? csvToImport.name : "Click to upload CSV (.csv file only)"}</span>
                                            <input
                                                type="file"
                                                accept=".csv"
                                                onChange={(e) => setCsvToImport(e.target.files[0])}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-4">
                                    <IconButton onClick={() => setShowModal(false)} icon={FiX} className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700">
                                        Cancel
                                    </IconButton>
                                    <IconButton 
                                        onClick={importSelected} 
                                        icon={loadingSheetValues ? FiRefreshCw : FiPlus} 
                                        disabled={loadingSheetValues || (selectedApps.includes("google_sheets") && !selectedSheet) || (selectedApps.includes("other") && !csvToImport)}
                                        className={`text-white shadow-lg ${loadingSheetValues ? 'bg-purple-800 animate-pulse' : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-900/50'}`}
                                    >
                                        {loadingSheetValues ? "Fetching Data..." : "Import"}
                                    </IconButton>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== Toast (Cleaner Look) ========== */}
                {showSavedToast && (
                    <div className="fixed bottom-6 right-6 bg-purple-600/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-purple-500">
                        <FiSave size={18} />
                        View Saved Successfully!
                    </div>
                )}
            </div>
        </div>
    );
}