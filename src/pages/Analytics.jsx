import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { FiDownload, FiUploadCloud, FiSave, FiPlus, FiX, FiCheckCircle, FiChevronDown, FiTrash2 } from "react-icons/fi";
import { MdOutlineAnalytics, MdOutlineTableChart, MdOutlineInsights } from "react-icons/md";
import axios from "axios";
import { AIAnalysisPanel } from '../components/AIAnalysisPanel'; 
import { FaBrain, FaSpinner } from 'react-icons/fa';

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
const AUTH_TOKEN_KEY = "adt_token"; // Synchronized with Integrations.jsx

/* ---------- Data Processing Helpers ---------- */
const isDate = (value) => {
    if (value === null || value === undefined) return false;
    const str = String(value).trim();
    if (str.length === 0) return false;
    const numericStr = str.replace(/[^0-9.-]/g, "");
    if (numericStr && !isNaN(Number(numericStr))) {
        const num = Number(numericStr);
        if (num > 10000000) return false; 
        if (String(Math.abs(num)).length === 4) return false;
    }
    const date = new Date(str);
    return !isNaN(date.getTime()) && date.getFullYear() > 1900; 
};

const sanitizeCellValue = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const str = String(value).trim();
    const numericValue = Number(str.replace(/,/g, ''));
    if (!isNaN(numericValue) && str.length > 0) return numericValue;
    return str;
};

const detectNumericColumns = (values) => {
    if (!values || values.length < 2) return [];
    return values[0]
        .map((_, colIndex) => {
            const sampleVals = values.slice(1, 6).map((r) => sanitizeCellValue(r[colIndex]));
            const isNumeric = sampleVals.some((v) => typeof v === "number") && 
                             sampleVals.every((v) => typeof v === "number" || isDate(v) || v === "");
            return isNumeric ? colIndex : null;
        })
        .filter((i) => i !== null);
};

const detectCategoryColumn = (values, numericIndexes) => {
    if (!values || values.length < 2) return null;
    const headerRow = values[0];
    for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
        if (numericIndexes.includes(colIndex)) continue;
        const sampleVals = values.slice(1, 10).map((r) => sanitizeCellValue(r[colIndex]));
        let isDateType = sampleVals.every(v => isDate(v) || v === "");
        if (isDateType) return { colIndex, isDate: true, header: headerRow[colIndex] };
        const uniqueValues = new Set(sampleVals.filter(v => typeof v === "string" && v.length > 0));
        if (uniqueValues.size > 1 && uniqueValues.size <= sampleVals.length) {
            return { colIndex, isDate: false, header: headerRow[colIndex] };
        }
    }
    return null; 
};

const computeMetrics = (values, numericIndexes) => {
    if (!values.length || !numericIndexes.length) return {};
    const headers = values[0];
    const metrics = {};
    numericIndexes.forEach((colIndex) => {
        const colName = headers[colIndex] || `col_${colIndex}`;
        const arr = values.slice(1).map((r) => {
            const n = sanitizeCellValue(r[colIndex]);
            return typeof n === "number" ? n : null;
        }).filter(n => n !== null);
        const total = arr.reduce((a, b) => a + b, 0);
        const avg = arr.length ? total / arr.length : 0;
        const max = arr.length ? Math.max(...arr) : 0;
        const min = arr.length ? Math.min(...arr) : 0;
        const sqDifferences = arr.map(n => Math.pow(n - avg, 2));
        const variance = arr.length > 1 ? sqDifferences.reduce((a, b) => a + b, 0) / (arr.length - 1) : 0;
        const stdDev = Math.sqrt(variance);
        metrics[colName] = {
            total: total.toFixed(2),
            avg: avg.toFixed(2),
            max: max.toFixed(2),
            min: min.toFixed(2),
            count: arr.length,
            stdDev: stdDev.toFixed(2), 
        };
    });
    return metrics;
};

/* ---------- UI Components ---------- */
const IconButton = ({ icon: Icon, onClick, className = "", children, disabled = false, title = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${disabled ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : className}`}
    >
        <Icon size={16} />
        {children}
    </button>
);

function DatasetCard({ dataset, isActive, onToggle, onRemove }) {
    return (
        <div
            className={`relative rounded-xl p-4 cursor-pointer transition-all duration-700 border-2 flex flex-col justify-between h-full ${isActive ? "border-purple-500 shadow-2xl shadow-purple-900/40" : "border-gray-800 hover:border-purple-900"}`}
            style={{
                background: isActive ? "linear-gradient(145deg, rgba(167,139,250,0.08), rgba(139,92,246,0.04))" : "rgba(10, 10, 15, 0.7)",
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
                        <span>{dataset.rows} rows</span>
                        <span>{dataset.cols} columns</span>
                    </div>
                </div>
                {isActive && (
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="flex-shrink-0 ml-3 p-1 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-400">
                        <FiX size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}

function MetricSummaryCard({ colName, datasetName, metrics, color }) {
    const formatValue = (value) => {
        const num = Number(value);
        if (isNaN(num)) return value;
        if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        else if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'k';
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };
    const metricOrder = [
        { key: 'total', label: 'SUM', color: 'text-purple-400' },
        { key: 'avg', label: 'AVG', color: 'text-cyan-400' },
        { key: 'max', label: 'MAX', color: 'text-green-400' },
        { key: 'min', label: 'MIN', color: 'text-red-400' },
        { key: 'stdDev', label: 'SD', color: 'text-yellow-400' },
        { key: 'count', label: 'COUNT', color: 'text-gray-400' },
    ];
    return (
        <div className="rounded-xl p-3 shadow-lg border border-gray-800 w-full flex flex-col transition-transform duration-700 hover:scale-[1.005]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.01), rgba(10,12,18,0.65))", backdropFilter: "blur(8px)", borderColor: `${color}80` }}>
            <h3 className="text-sm font-bold text-white mb-2 pb-1 border-b border-gray-700/50 truncate">{datasetName}: {colName}</h3>
            <div className="flex justify-between items-start gap-2">
                {metricOrder.map(({ key, label, color: labelColor }) => (
                    <div key={key} className="flex flex-col flex-1 min-w-0 items-center">
                        <span className={`text-xs font-medium ${labelColor} leading-none mb-1`}>{label}</span>
                        <span className="text-sm font-extrabold text-white leading-none truncate">{formatValue(metrics[key])}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LandingView({ onImportClick }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
            <MdOutlineAnalytics size={80} className="text-purple-500 mb-6 animate-pulse" />
            <h2 className="text-5xl font-extrabold text-white mb-4">Analyze Your Data. Get Insights.</h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl">The Data Comparison Engine allows you to visualize, compare, and analyze multiple datasets with powerful metrics and AI-driven insights.</p>
            <IconButton icon={FiUploadCloud} onClick={onImportClick} className="bg-cyan-600 hover:bg-cyan-700 text-white text-lg px-8 py-3 shadow-lg shadow-cyan-900/50">Start by Importing Your First Dataset</IconButton>
        </div>
    );
}

function FlawlessLoadingOverlay() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#070D18] to-[#050510]">
            <FaSpinner size={64} className="text-purple-500 animate-spin mb-6" />
            <h2 className="text-3xl font-bold text-white mb-2">Processing Data...</h2>
        </div>
    );
}

const SourceCard = ({ icon: Icon, title, description, isSelected, onClick, disabled }) => (
    <div onClick={onClick} className={`p-5 rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-4 border-2 ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-900/50 border-gray-800' : isSelected ? 'border-purple-500 bg-purple-900/10 shadow-lg shadow-purple-900/50' : 'border-gray-800 hover:border-cyan-500/50 bg-gray-900/60'}`} style={{ backdropFilter: 'blur(4px)' }}>
        <Icon size={32} className={isSelected ? "text-purple-400" : "text-gray-400"} />
        <div className="flex-1"><h4 className="font-semibold text-white">{title}</h4><p className="text-xs text-gray-400">{description}</p></div>
        {isSelected && <FiCheckCircle size={20} className="text-cyan-400" />}
    </div>
);

function SheetsDropdown({ sheetsList, selectedSheet, setSelectedSheet }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selectedName = selectedSheet ? (sheetsList.find(s => s.id === selectedSheet)?.name || "-- Choose Sheet --") : "-- Choose Sheet --";
    useEffect(() => {
        const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);
    return (
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full p-3 flex justify-between items-center rounded-lg text-left transition duration-300 ${isOpen ? 'bg-gray-700 border-purple-500' : 'bg-gray-800 border-gray-700 hover:border-purple-500/50'} border text-white`}>
                <span className={`truncate ${selectedSheet ? 'text-white' : 'text-gray-400'}`}>{selectedName}</span>
                <FiChevronDown size={18} className={`ml-2 transform transition-transform ${isOpen ? 'rotate-180 text-purple-400' : 'rotate-0 text-gray-400'}`} />
            </button>
            <div className={`absolute left-0 right-0 mt-1 rounded-lg bg-gray-900 shadow-2xl border border-purple-900/50 overflow-hidden z-20 transition-all duration-300 ${isOpen ? 'opacity-100 max-h-60 translate-y-0' : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none'}`}>
                <div className="max-h-56 overflow-y-auto">
                    {!sheetsList.length ? (
                        <div className="p-3 text-center text-gray-500 text-sm italic">Searching for spreadsheets...</div>
                    ) : (
                        sheetsList.map(sheet => (
                            <div key={sheet.id} onClick={() => { setSelectedSheet(sheet.id); setIsOpen(false); }} className={`p-3 text-sm cursor-pointer transition-colors duration-200 truncate ${sheet.id === selectedSheet ? 'bg-purple-700/50 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800'}`}>{sheet.name}</div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Main Analytics Component ---------- */
export default function Analytics() {
    // UPDATED: Standardizing how we grab the token and ID
    const userToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const profileStr = localStorage.getItem("adt_profile");
    const profile = profileStr ? JSON.parse(profileStr) : { user_id: "test-user" };
    const userId = profile.id || profile.user_id; 

    const [showModal, setShowModal] = useState(false);
    const [selectedApps, setSelectedApps] = useState([]);
    const [sheetsList, setSheetsList] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [csvToImport, setCsvToImport] = useState(null);

    const [allDatasets, setAllDatasets] = useState([]);
    const [activeDatasets, setActiveDatasets] = useState([]);
    const [chartType, setChartType] = useState("line");
    const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false); 
    const [isImporting, setIsImporting] = useState(false); 
    const [isInitializing, setIsInitializing] = useState(true);

    const datasetColors = ["#A78BFA","#22C55E","#F97316","#EAB308"];

    const parseCSVFile = async (file) => {
        const text = await file.text();
        const rows = text.split(/\r?\n/).filter(Boolean);
        return rows.map(r => r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"')));
    };

    useEffect(() => {
        let cancelled = false;
        const loadCurrentSession = async () => {
            setIsInitializing(true); 
            if (!userId || userId === "test-user" || !userToken) { setIsInitializing(false); return; }
            try {
                const res = await axios.get(`${API_BASE_URL}/analysis/current`, { headers: { Authorization: `Bearer ${userToken}` } });
                if (cancelled || !res.data) return;
                const { allDatasets: loadedDatasets = [], config = {} } = res.data.results || {};
                const { activeDatasetIds = [], chartType: loadedChartType = "line" } = config;
                if (loadedDatasets.length > 0) {
                    setAllDatasets(loadedDatasets);
                    setActiveDatasets(loadedDatasets.filter(d => activeDatasetIds.includes(d.id)));
                    setChartType(loadedChartType);
                }
            } catch (error) { console.error("Session load failed"); }
            finally { if (!cancelled) setIsInitializing(false); }
        };
        loadCurrentSession();
        return () => { cancelled = true; };
    }, [userId, userToken]);

    // FETCH GOOGLE SHEETS EFFECT - SYNCHRONIZED WITH INTEGRATIONS.JSX
    useEffect(() => {
        if (!showModal || !selectedApps.includes("google_sheets") || !userToken) return;
        let cancelled = false;
        (async () => {
            try {
                // First verify connection like IntegrationsPage does
                const verifyRes = await fetch(`${API_BASE_URL}/connected-apps`, {
                    headers: { 'Authorization': `Bearer ${userToken}` }
                });
                const verifyData = await verifyRes.json();
                
                // Only fetch if backend confirms google_sheets is connected
                if (verifyData.google_sheets) {
                    const res = await axios.get(`${API_BASE_URL}/google/sheets`, { 
                        headers: { Authorization: `Bearer ${userToken}` }
                    });
                    if (!cancelled) {
                        const list = res.data.files || res.data.sheets || (Array.isArray(res.data) ? res.data : []);
                        setSheetsList(list);
                    }
                } else {
                    console.warn("Analytics: Google Sheets not connected in integrations.");
                    if (!cancelled) setSheetsList([]);
                }
            } catch(e) { 
                console.error("Analytics: Failed to fetch sheets:", e);
                if (!cancelled) setSheetsList([]); 
            }
        })();
        return () => { cancelled = true; };
    }, [showModal, selectedApps, userToken]);

    const importSelected = async () => {
        setShowModal(false);
        setIsImporting(true);
        const importedRows = [];
        let sourceName = "Imported Dataset";

        try {
            for (const key of selectedApps) {
                if (key === "google_sheets" && selectedSheet) {
                    const sheet = sheetsList.find(s => s.id === selectedSheet);
                    sourceName = sheet?.name || "Google Sheet";
                    const res = await axios.get(`${API_BASE_URL}/google/sheets/${selectedSheet}`, { 
                        headers: { Authorization: `Bearer ${userToken}` } 
                    });
                    if (res.data?.values) importedRows.push(res.data.values);
                } else if (key === "other" && csvToImport) {
                    sourceName = csvToImport.name.replace(/\.csv$/i,"");
                    const values = await parseCSVFile(csvToImport);
                    if (values.length) importedRows.push(values);
                }
            }

            if (!importedRows.length) { setIsImporting(false); return; }

            const combinedData = importedRows[0];
            const cleaned = combinedData.map((row, idx) => idx === 0 ? row : row.map(sanitizeCellValue));
            const numeric = detectNumericColumns(cleaned);
            const metrics = computeMetrics(cleaned, numeric);
            const categoryColumn = detectCategoryColumn(cleaned, numeric); 

            const newDataset = {
                id: Date.now(),
                name: sourceName,
                color: datasetColors[allDatasets.length % datasetColors.length],
                rows: cleaned.length - 1,
                cols: cleaned[0]?.length || 0,
                data: cleaned,
                numericCols: numeric,
                metrics,
                categoryCol: categoryColumn, 
            };

            setAllDatasets(prev => [...prev, newDataset]);
            setActiveDatasets(prev => [...prev, newDataset]);
        } catch (err) { console.error("Import failed:", err); }
        finally {
            setSelectedApps([]); setSelectedSheet(""); setCsvToImport(null);
            setIsImporting(false);
        }
    };

    const toggleDataset = (dataset) => {
        setActiveDatasets(prev => prev.find(d => d.id === dataset.id) ? prev.filter(d => d.id !== dataset.id) : [...prev, dataset]);
    };

    const removeDataset = (id) => {
        setAllDatasets(prev => prev.filter(d => d.id !== id));
        setActiveDatasets(prev => prev.filter(d => d.id !== id));
    };

    const handleClearAll = () => {
        setAllDatasets([]);
        setActiveDatasets([]);
    };

    const handleSave = async () => {
        if (!userToken) return;
        try {
            await axios.post(`${API_BASE_URL}/analysis/save`, {
                name: `Comparison Session ${new Date().toLocaleDateString()}`,
                source: "Multiple",
                config: { activeDatasetIds: activeDatasets.map(d => d.id), chartType },
                results: { allDatasets }
            }, { headers: { Authorization: `Bearer ${userToken}` } });
            alert("Analysis saved successfully!");
        } catch (e) { console.error("Save failed", e); }
    };

    const generateChartsForDataset = (dataset) => {
        const { data, numericCols, categoryCol, color } = dataset;
        if (!numericCols.length || !categoryCol) return null;
        const labels = data.slice(1, 15).map(r => r[categoryCol.colIndex]);
        
        return numericCols.slice(0, 2).map((colIdx) => {
            const chartData = {
                labels,
                datasets: [{
                    label: `${dataset.name}: ${data[0][colIdx]}`,
                    data: data.slice(1, 15).map(r => sanitizeCellValue(r[colIdx])),
                    borderColor: color,
                    backgroundColor: `${color}33`,
                    fill: true,
                    tension: 0.4
                }]
            };
            const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, labels: { color: '#94a3b8', font: { size: 10 } } } },
                scales: {
                    x: { ticks: { color: '#64748b' }, grid: { display: false } },
                    y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } }
                }
            };
            return (
                <div key={`${dataset.id}-${colIdx}`} className="h-64 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    {chartType === "line" ? <Line data={chartData} options={options} /> : <Bar data={chartData} options={options} />}
                </div>
            );
        });
    };

    return (
        <div className="min-h-screen bg-[#070D18] text-white">
             {(isInitializing || isImporting) && <FlawlessLoadingOverlay />}
             
             <div className="max-w-7xl mx-auto px-6 py-8">
                {allDatasets.length === 0 ? (
                    <LandingView onImportClick={() => setShowModal(true)} />
                ) : (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        {/* Header Actions */}
                        <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                            <h2 className="text-3xl font-bold flex items-center gap-2">
                                <MdOutlineInsights className="text-purple-500" /> Analysis Workbench
                            </h2>
                            <div className="flex gap-3">
                                <IconButton icon={FiPlus} onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-500">Import</IconButton>
                                <IconButton icon={FiSave} onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white">Save</IconButton>
                                <IconButton icon={FiTrash2} onClick={handleClearAll} className="bg-red-900/40 hover:bg-red-800 text-red-400">Clear</IconButton>
                                <button onClick={() => setIsAnalysisPanelOpen(true)} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-bold">
                                    <FaBrain /> AI Insights
                                </button>
                            </div>
                        </div>

                        {/* Dataset Selector Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {allDatasets.map(ds => (
                                <DatasetCard 
                                    key={ds.id} 
                                    dataset={ds} 
                                    isActive={activeDatasets.some(a => a.id === ds.id)}
                                    onToggle={() => toggleDataset(ds)}
                                    onRemove={() => removeDataset(ds.id)}
                                />
                            ))}
                        </div>

                        {/* Metrics Summary Strip */}
                        {activeDatasets.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {activeDatasets.flatMap(ds => 
                                    ds.numericCols.slice(0, 1).map(idx => (
                                        <MetricSummaryCard 
                                            key={`${ds.id}-${idx}`}
                                            datasetName={ds.name}
                                            colName={ds.data[0][idx]}
                                            metrics={ds.metrics[ds.data[0][idx]]}
                                            color={ds.color}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {/* Visualization Zone */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-300">Data Trends</h3>
                                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                                    <button onClick={() => setChartType("line")} className={`px-4 py-1 rounded-md text-sm transition-all ${chartType === "line" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>Line</button>
                                    <button onClick={() => setChartType("bar")} className={`px-4 py-1 rounded-md text-sm transition-all ${chartType === "bar" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>Bar</button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {activeDatasets.flatMap(ds => generateChartsForDataset(ds))}
                            </div>
                        </div>
                    </div>
                )}
             </div>

             {/* IMPORT MODAL */}
             {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Import Data</h3>
                            <button onClick={() => setShowModal(false)}><FiX size={24} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <SourceCard 
                                icon={MdOutlineTableChart} 
                                title="Google Sheets" 
                                description="Select a file from your connected Drive"
                                isSelected={selectedApps.includes("google_sheets")}
                                onClick={() => setSelectedApps(prev => prev.includes("google_sheets") ? [] : ["google_sheets"])}
                            />
                            {selectedApps.includes("google_sheets") && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Spreadsheet</label>
                                    <SheetsDropdown sheetsList={sheetsList} selectedSheet={selectedSheet} setSelectedSheet={setSelectedSheet} />
                                </div>
                            )}
                            
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    accept=".csv" 
                                    className="hidden" 
                                    id="csv-upload" 
                                    onChange={(e) => {
                                        if(e.target.files[0]) {
                                            setCsvToImport(e.target.files[0]);
                                            setSelectedApps(prev => [...new Set([...prev, "other"])]);
                                        }
                                    }}
                                />
                                <label htmlFor="csv-upload">
                                    <SourceCard 
                                        icon={FiUploadCloud} 
                                        title="Local CSV" 
                                        description={csvToImport ? `Selected: ${csvToImport.name}` : "Upload from your computer"}
                                        isSelected={selectedApps.includes("other")}
                                        onClick={() => {}} 
                                    />
                                </label>
                            </div>

                            <button 
                                onClick={importSelected} 
                                disabled={selectedApps.length === 0 || (selectedApps.includes("google_sheets") && !selectedSheet)}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Import Selected
                            </button>
                        </div>
                    </div>
                </div>
             )}

            {/* AI Analysis Panel */}
            <AIAnalysisPanel 
                isOpen={isAnalysisPanelOpen}
                onClose={() => setIsAnalysisPanelOpen(false)}
                datasets={activeDatasets}
            />
        </div>
    );
}