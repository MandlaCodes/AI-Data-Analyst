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
import { FiDownload, FiUploadCloud, FiSave, FiPlus, FiX, FiCheckCircle, FiChevronDown, FiTrash2 } from "react-icons/fi";
import { MdOutlineAnalytics, MdOutlineTableChart, MdOutlineInsights } from "react-icons/md";
import axios from "axios";
// IMPORTANT: We'll put AIAnalysisPanel in the same file temporarily to make this runnable
// or assume it's correctly imported from 'components/AIAnalysisPanel'

import { FaBrain, FaSpinner, FaChartLine, FaLightbulb } from 'react-icons/fa';

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
const DATASET_STORAGE_KEY = "analytics_persisted_datasets";


/* ---------- AIAnalysisPanel Component (Moved here for immediate fix) ---------- */

// Mock data structure for the analysis result
const MOCK_AI_INSIGHTS = {
    summary: "The primary dataset, 'Sales Data', shows a strong positive correlation between 'Revenue' and 'Customer Satisfaction Score' over the last two quarters. The 'Marketing Spend' dataset, however, suggests diminishing returns on investment in Q3.",
    keyFindings: [
        {
            icon: FaChartLine,
            title: "Revenue Spikes Tied to Satisfaction",
            detail: "Periods of high customer satisfaction (above 4.5/5) correspond to a 15% average increase in daily revenue within the following 72 hours. This correlation is statistically significant ($p < 0.01$)."
        },
        {
            icon: FaLightbulb,
            title: "Marketing Efficiency Drop",
            detail: "The cost-per-acquisition (CPA) from the 'Marketing Spend' dataset increased by 42% in September compared to July, despite maintaining the same ad creative and targeting parameters. Focus should shift to channel optimization."
        },
        {
            icon: FaBrain,
            title: "Outlier Detection in Pricing",
            detail: "Five data points in the 'Pricing' column of 'Sales Data' were flagged as outliers (>$2\sigma$). These correspond to specialty products and should be excluded from future regression analysis on standard products."
        }
    ],
    recommendations: [
        "Investigate the specific factors driving the high customer satisfaction events to replicate the success across other product lines.",
        "A/B test new marketing creatives and reduce budget allocation to the least effective channel immediately.",
        "Segment the data to analyze specialty product sales separately to understand their unique pricing distribution."
    ]
};

// Component Definition
export function AIAnalysisPanel({ isOpen, onClose, datasets, userId, userToken, API_BASE_URL }) {
    // FIX: Add defensive coding by ensuring datasets is an array
    const activeDatasets = datasets || [];
    
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleRunAnalysis = async () => {
        if (activeDatasets.length === 0) { // Safely using .length now
            alert("Please import and select at least one dataset to run AI analysis.");
            return;
        }

        setIsLoading(true);
        setAnalysisResult(null);

        // Simulate an API call delay
        await new Promise(resolve => setTimeout(resolve, 2500));

        const result = activeDatasets.length > 0 ? MOCK_AI_INSIGHTS : { summary: "No data provided for analysis." };

        setAnalysisResult(result);
        setIsLoading(false);
    };

    // Effect to auto-run analysis when panel opens (if no results exist)
    useEffect(() => {
        if (isOpen && !analysisResult && activeDatasets.length > 0) {
            handleRunAnalysis();
        }
    }, [isOpen]); // Only run on mount/open

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-start justify-end bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
        >
            <div 
                className="w-full max-w-lg h-full bg-gray-900 border-l border-purple-800 shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out p-6"
            >
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FaBrain size={24} className="text-purple-400" /> AI Insights
                    </h2>
                    <div className="flex gap-3 items-center">
                        {analysisResult && (
                            <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded-full">Complete</span>
                        )}
                        <button
                            onClick={handleRunAnalysis}
                            disabled={activeDatasets.length === 0 || isLoading}
                            title={activeDatasets.length === 0 ? "Select datasets to run analysis" : "Run AI Analysis"}
                            className={`px-3 py-1 text-sm rounded-lg font-medium transition-all ${
                                isLoading 
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <FaSpinner className="animate-spin" /> Running...
                                </span>
                            ) : (
                                "Re-run"
                            )}
                        </button>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
                            <FiX size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Display */}
                <div className="space-y-6 text-gray-300">
                    {activeDatasets.length === 0 && (
                        <div className="text-center p-8 text-gray-500">
                            Select at least one dataset from the main dashboard to begin AI analysis.
                        </div>
                    )}
                    
                    {isLoading && activeDatasets.length > 0 && (
                        <div className="text-center p-8 text-purple-400 flex flex-col items-center">
                            <FaBrain size={48} className="animate-pulse mb-4" />
                            <p className="text-lg font-medium">Analyzing {activeDatasets.length} dataset(s)...</p>
                            <p className="text-sm text-gray-500 mt-1">This may take a moment to process the data structure and content.</p>
                        </div>
                    )}

                    {analysisResult && (
                        <div className="space-y-6">
                            {/* Summary */}
                            <div className="p-4 bg-purple-900/10 rounded-lg border border-purple-800/50">
                                <h3 className="text-lg font-semibold text-purple-300 mb-2">Executive Summary</h3>
                                <p className="text-base leading-relaxed">{analysisResult.summary}</p>
                            </div>
                            
                            {/* Key Findings */}
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><FaLightbulb className="text-yellow-400" /> Key Findings</h3>
                                <ul className="space-y-3">
                                    {analysisResult.keyFindings.map((finding, index) => (
                                        <li key={index} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                                            <finding.icon size={18} className="text-cyan-400 flex-shrink-0 mt-1" />
                                            <div>
                                                <p className="font-semibold text-gray-200">{finding.title}</p>
                                                <p className="text-sm text-gray-400 mt-0.5">{finding.detail}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Recommendations */}
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">Next Steps & Recommendations</h3>
                                <ol className="list-decimal list-inside space-y-2">
                                    {analysisResult.recommendations.map((rec, index) => (
                                        <li key={index} className="text-sm text-gray-300 pl-2">
                                            <span className="font-medium text-purple-300">Action:</span> {rec}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Data Processing Helpers (kept for completeness) ---------- */

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
        if (isDateType) {
            return { colIndex, isDate: true, header: headerRow[colIndex] };
        }

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
        if (Math.abs(num) >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        } else if (Math.abs(num) >= 1e3) {
            return (num / 1e3).toFixed(1) + 'k';
        }
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
        <div 
            className="rounded-xl p-3 shadow-lg border border-gray-800 w-full flex flex-col transition-transform duration-700 hover:scale-[1.005]" 
            style={{ 
                background: "linear-gradient(135deg, rgba(255,255,255,0.01), rgba(10,12,18,0.65))", 
                backdropFilter: "blur(8px)",
                borderColor: `${color}80` 
            }}
        >
            <h3 className="text-sm font-bold text-white mb-2 pb-1 border-b border-gray-700/50 truncate">
                {datasetName}: {colName}
            </h3>
            <div className="flex justify-between items-start gap-2">
                {metricOrder.map(({ key, label, color: labelColor }) => (
                    <div key={key} className="flex flex-col flex-1 min-w-0 items-center">
                        <span className={`text-xs font-medium ${labelColor} leading-none mb-1`}>{label}</span>
                        <span className="text-sm font-extrabold text-white leading-none truncate">
                            {formatValue(metrics[key])}
                        </span>
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
            <h2 className="text-5xl font-extrabold text-white mb-4">
                Analyze Your Data. Get Insights.
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl">
                The Data Comparison Engine allows you to visualize, compare, and analyze multiple datasets with powerful metrics and AI-driven insights.
            </p>
            <IconButton 
                icon={FiUploadCloud} 
                onClick={onImportClick} 
                className="bg-cyan-600 hover:bg-cyan-700 text-white text-lg px-8 py-3 shadow-lg shadow-cyan-900/50"
            >
                Start by Importing Your First Dataset
            </IconButton>
            <p className="text-sm text-gray-500 mt-6">
                Connect Google Sheets or upload a CSV file.
            </p>
        </div>
    );
}

function FlawlessLoadingOverlay() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#070D18] to-[#050510] transition-opacity duration-700">
            <FaSpinner size={64} className="text-purple-500 animate-spin mb-6" />
            <h2 className="text-3xl font-bold text-white mb-2">Processing Data...</h2>
            <p className="text-lg text-gray-400">Preparing the analytics dashboard for a smooth launch.</p>
        </div>
    );
}

const SourceCard = ({ icon: Icon, title, description, isSelected, onClick, disabled }) => (
    <div
        onClick={onClick}
        className={`p-5 rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-4 border-2 ${
            disabled ? 'opacity-50 cursor-not-allowed bg-gray-900/50 border-gray-800' :
            isSelected 
                ? 'border-purple-500 bg-purple-900/10 shadow-lg shadow-purple-900/50' 
                : 'border-gray-800 hover:border-cyan-500/50 bg-gray-900/60'
        }`}
        style={{ backdropFilter: 'blur(4px)' }}
    >
        <Icon size={32} className={isSelected ? "text-purple-400" : "text-gray-400"} />
        <div className="flex-1">
            <h4 className="font-semibold text-white">{title}</h4>
            <p className="text-xs text-gray-400">{description}</p>
        </div>
        {isSelected && <FiCheckCircle size={20} className="text-cyan-400" />}
    </div>
);

function SheetsDropdown({ sheetsList, selectedSheet, setSelectedSheet }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedName = selectedSheet 
        ? (sheetsList.find(s => s.id === selectedSheet)?.name || "-- Choose Sheet --")
        : "-- Choose Sheet --";

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleSelect = (sheetId) => {
        setSelectedSheet(sheetId);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3 flex justify-between items-center rounded-lg text-left transition duration-300 ${
                    isOpen ? 'bg-gray-700 border-purple-500' : 'bg-gray-800 border-gray-700 hover:border-purple-500/50'
                } border text-white`}
            >
                <span className={`truncate ${selectedSheet ? 'text-white' : 'text-gray-400'}`}>{selectedName}</span>
                <FiChevronDown size={18} className={`ml-2 transform transition-transform ${isOpen ? 'rotate-180 text-purple-400' : 'rotate-0 text-gray-400'}`} />
            </button>
            <div 
                className={`absolute left-0 right-0 mt-1 rounded-lg bg-gray-900 shadow-2xl border border-purple-900/50 overflow-hidden z-20 transition-all duration-300 ${
                    isOpen ? 'opacity-100 max-h-60 translate-y-0' : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none'
                }`}
                style={{
                    boxShadow: isOpen ? '0 10px 30px rgba(139, 92, 246, 0.2)' : 'none',
                }}
            >
                <div className="max-h-56 overflow-y-auto">
                    {!sheetsList.length ? (
                           <div className="p-3 text-center text-gray-500 text-sm">No sheets found. Check connection.</div>
                    ) : (
                        sheetsList.map(sheet => (
                            <div
                                key={sheet.id}
                                onClick={() => handleSelect(sheet.id)}
                                className={`p-3 text-sm cursor-pointer transition-colors duration-200 truncate ${
                                    sheet.id === selectedSheet 
                                        ? 'bg-purple-700/50 text-white font-semibold' 
                                        : 'text-gray-300 hover:bg-gray-800'
                                }`}
                            >
                                {sheet.name}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Main Analytics Component ---------- */

export default function Analytics() {
    const profile = JSON.parse(localStorage.getItem("adt_profile") || '{"user_id":"test-user"}');
    const userToken = localStorage.getItem("adt_token");
    const userId = profile.user_id;

    const [showModal, setShowModal] = useState(false);
    const [selectedApps, setSelectedApps] = useState([]);
    const [sheetsList, setSheetsList] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [csvToImport, setCsvToImport] = useState(null);
    const [loadingSheetValues, setLoadingSheetValues] = useState(false);

    const [allDatasets, setAllDatasets] = useState([]);
    const [activeDatasets, setActiveDatasets] = useState([]);

    const [chartType, setChartType] = useState("line");
    const [showSavedToast, setShowSavedToast] = useState(false);
    
    const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false); 
    
    const [isImporting, setIsImporting] = useState(false); 
    const [staggerState, setStaggerState] = useState(0); 

    const datasetColors = ["#A78BFA","#22C55E","#F97316","#EAB308"];

    const parseCSVFile = async (file) => {
        const text = await file.text();
        const rows = text.split(/\r?\n/).filter(Boolean);
        return rows.map(r => r.split(",").map(c => c.trim()));
    };
    
    // 1. **EFFECT: LOAD DATASETS ON MOUNT (Account & Fallback)**
    useEffect(() => {
        let cancelled = false;
        
        const loadData = async () => {
            if (!userId || userId === "test-user") {
                const savedData = localStorage.getItem(DATASET_STORAGE_KEY);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    setAllDatasets(parsed);
                    setActiveDatasets(parsed); 
                }
                return;
            }

            try {
                const res = await axios.get(`${API_BASE_URL}/api/datasets/${userId}`, { 
                    headers: { Authorization: `Bearer ${userToken}` }
                });

                if (!cancelled && res.data?.datasets) {
                    const loadedDatasets = res.data.datasets;
                    setAllDatasets(loadedDatasets);
                    setActiveDatasets(loadedDatasets); 
                    localStorage.setItem(DATASET_STORAGE_KEY, JSON.stringify(loadedDatasets));
                }
            } catch (error) {
                console.warn("Failed to load user datasets from server. Falling back to local storage.", error);
                
                try {
                    const savedData = localStorage.getItem(DATASET_STORAGE_KEY);
                    if (savedData) {
                        const parsed = JSON.parse(savedData);
                        setAllDatasets(parsed);
                        setActiveDatasets(parsed); 
                    }
                } catch (localError) {
                    console.error("Failed to load datasets from localStorage:", localError);
                    localStorage.removeItem(DATASET_STORAGE_KEY);
                }
            }
        };
        
        loadData();

        return () => { cancelled = true; };
    }, [userId, userToken]); 

    // 2. **EFFECT: SAVE DATASETS ON CHANGE (Local Persistence & Stagger)**
    useEffect(() => {
        if (allDatasets.length > 0) {
            try {
                localStorage.setItem(DATASET_STORAGE_KEY, JSON.stringify(allDatasets));
            } catch (error) {
                console.error("Failed to save datasets to localStorage:", error);
            }
        } else if (allDatasets.length === 0 && localStorage.getItem(DATASET_STORAGE_KEY)) {
            localStorage.removeItem(DATASET_STORAGE_KEY);
        }
        
        if (allDatasets.length > 0 && staggerState === 0) {
            setTimeout(() => setStaggerState(1), 100); 
            setTimeout(() => setStaggerState(2), 500); 
            setTimeout(() => setStaggerState(3), 900);
        }
    }, [allDatasets, staggerState]); 

    // Fetch Sheets List for Modal
    useEffect(() => {
        if (!showModal || !selectedApps.includes("google_sheets")) return;
        let cancelled = false;
        (async () => {
            try {
                const token = localStorage.getItem("adt_token");
                const res = await axios.get(`${API_BASE_URL}/sheets-list/${userId}`, { headers: { Authorization: `Bearer ${token}` }});
                if (!cancelled) setSheetsList(res.data.sheets || []);
            } catch { if (!cancelled) setSheetsList([]); }
        })();
        return () => { cancelled = true; };
    }, [showModal, selectedApps, userId]);

    const importSelected = async () => {
        setIsImporting(true);
        setShowModal(false);
        setStaggerState(0);

        const importedRows = [];
        let sourceName = "Imported Dataset";

        if (selectedApps.includes("google_sheets") && !selectedSheet) { setIsImporting(false); return; }
        if (selectedApps.includes("other") && !csvToImport) { setIsImporting(false); return; }
        if (selectedApps.length === 0) { setIsImporting(false); return; }


        for (const key of selectedApps) {
            if (key === "google_sheets" && selectedSheet) {
                const sheet = sheetsList.find(s => s.id === selectedSheet);
                sourceName = sheet?.name || sourceName;
                setLoadingSheetValues(true); 
                try {
                    const token = localStorage.getItem("adt_token"); 
                    const res = await axios.get(
                        `${API_BASE_URL}/sheets/${userId}/${selectedSheet}`,
                        { headers: { Authorization: `Bearer ${token}` } } 
                    );
                    if (res.data?.values?.length) {
                        importedRows.push(...res.data.values);
                    }
                } catch (err) { console.error("Google Sheets Fetch Error:", err); }
                setLoadingSheetValues(false);
            } else if (key === "other" && csvToImport) {
                sourceName = csvToImport.name.replace(/\.csv$/i,"");
                try {
                    const values = await parseCSVFile(csvToImport);
                    if (values.length) {
                        importedRows.push(...values);
                    }
                } catch (err) { console.error("CSV Parse Error:", err); }
            }
        }

        if (!importedRows.length) {
            setSelectedApps([]); setSelectedSheet(""); setCsvToImport(null);
            setIsImporting(false);
            return;
        }

        const cleaned = importedRows.map((row, idx) => idx === 0 ? row : row.map(sanitizeCellValue));
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
        setSelectedApps([]); setSelectedSheet(""); setCsvToImport(null);
        
        setIsImporting(false); 
    };

    const toggleDataset = (dataset) => {
        setActiveDatasets(prev => prev.find(d => d.id === dataset.id) ? prev.filter(d => d.id !== dataset.id) : [...prev, dataset]);
    };

    const removeDataset = (id) => {
        setAllDatasets(prev => prev.filter(d => d.id !== id));
        setActiveDatasets(prev => prev.filter(d => d.id !== id));
    };

    const handleClearAll = () => {
        if (window.confirm("Are you sure you want to clear ALL imported datasets? This action cannot be undone and will be removed from your account on next save.")) {
            setAllDatasets([]);
            setActiveDatasets([]);
            localStorage.removeItem(DATASET_STORAGE_KEY); 
            setStaggerState(0);
        }
    };
    
    // ** SAVES DATASETS TO THE USER'S BACKEND ACCOUNT **
    const handleSave = async () => {
        if (!userId || userId === "test-user") {
            alert("Please log in to save datasets to your account.");
            return;
        }

        setShowSavedToast(true); 
        
        try {
            await axios.post(`${API_BASE_URL}/api/datasets/save`, {
                userId: userId,
                datasets: allDatasets, 
                savedAt: new Date().toISOString()
            }, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            localStorage.setItem(DATASET_STORAGE_KEY, JSON.stringify(allDatasets));
        } catch (error) {
            console.error("Failed to save datasets to account:", error);
            alert("Error saving data to your account. Check your connection or console for details.");
        } finally {
            setTimeout(() => setShowSavedToast(false), 2000);
        }
    };

    const exportActive = () => {
        if (!activeDatasets.length) return;
        const rows = [];
        activeDatasets.forEach(ds => {
            rows.push([`Dataset: ${ds.name}`]);
            rows.push(ds.data[0]);
            ds.data.slice(1).forEach(r => rows.push(r));
            rows.push([]);
        });
        const csv = rows.map(r => r.map(c => `"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `comparison_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
    };

    const generateChartsForDataset = (dataset) => {
        if (!dataset.numericCols.length) return <div className="text-gray-400 text-center p-4">No numeric columns to display.</div>;

        const labels = dataset.categoryCol 
            ? dataset.data.slice(1).map(r => String(r[dataset.categoryCol.colIndex])) 
            : dataset.data.slice(1).map((r, idx) => `Row ${idx+1}`); 

        const maxPreviewRows = 6;

        return (
            <div className="space-y-6"> 
                <div className="bg-gray-900/40 rounded-xl border border-gray-800 p-3 transition-all duration-700">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Raw Data Preview ({dataset.data.length - 1} rows)</h3>
                    
                    <div className="max-h-36 overflow-y-auto border border-gray-700 rounded-lg">
                        <table className="min-w-full text-xs text-gray-300">
                            <thead className="sticky top-0 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 z-10">
                                <tr>
                                    {dataset.data[0].map((header, index) => (
                                        <th 
                                            key={index} 
                                            className={`px-3 py-2 text-left font-bold truncate ${dataset.numericCols.includes(index) ? 'text-right text-purple-400' : 'text-left'}`}
                                            title={header}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dataset.data.slice(1, maxPreviewRows).map((row, rowIndex) => (
                                    <tr key={rowIndex} className="hover:bg-gray-800/50 even:bg-gray-900/50">
                                        {row.map((cell, cellIndex) => (
                                            <td 
                                                key={cellIndex} 
                                                className={`px-3 py-1.5 whitespace-nowrap truncate max-w-[150px] ${dataset.numericCols.includes(cellIndex) ? 'text-right font-mono' : 'text-left'}`}
                                            >
                                                {String(cell)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                    {dataset.numericCols.slice(0, 4).map((colIdx, i) => { 
                        const colName = dataset.data[0][colIdx] || `Col ${colIdx}`;
                        const data = dataset.data.slice(1).map(r => Number(r[colIdx])).filter(n => !isNaN(n));
                        
                        const chartData = {
                            labels: labels.slice(0, 20), 
                            datasets: [{
                                label: colName,
                                data: data.slice(0, 20),
                                borderColor: dataset.color,
                                backgroundColor: dataset.color + "33",
                                fill: chartType==="line",
                                tension:0.3
                            }]
                        };
                        const options = { 
                            responsive:true, 
                            maintainAspectRatio:false, 
                            plugins:{ legend:{ labels:{ color:"#9ca3af" } } },
                            scales: {
                                x: { 
                                    grid: { color: "rgba(75, 85, 99, 0.18)", drawBorder: false }, 
                                    ticks: { color: "#9ca3af", maxRotation: labels.length > 10 ? 45 : 0 } 
                                },
                                y: { grid: { color: "rgba(75, 85, 99, 0.18)", drawBorder: false }, ticks: { color: "#9ca3af" } }
                            }
                        };
                        return (
                            <div key={i} className="bg-gray-900/40 rounded-xl border border-gray-800 p-3 transition-all duration-700" style={{ height: 250 }}> 
                                <h3 className="text-xs text-gray-400 mb-1 truncate">{colName} - {dataset.categoryCol?.header || labels[0] ? `Trend over ${dataset.categoryCol?.header}` : 'Raw Distribution'}</h3>
                                {chartType==="line" ? <Line data={chartData} options={options} /> : <Bar data={chartData} options={options} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };
    
    const consolidatedMetrics = activeDatasets.flatMap(ds => {
        return Object.keys(ds.metrics || {}).map(colName => ({
            id: `${ds.id}-${colName}`,
            datasetName: ds.name,
            colName: colName,
            metrics: ds.metrics[colName],
            color: ds.color
        }));
    });

    const hasData = allDatasets.length > 0;
    

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#070D18] to-[#050510] relative">
            
            {isImporting && <FlawlessLoadingOverlay />}
            
            <div className="p-4 sm:p-6 lg:p-10">
            
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-gray-800 transition-all duration-700">
                    <h1 className="text-4xl font-extrabold text-white flex items-center gap-3"><MdOutlineAnalytics size={32} className="text-purple-400" /> Data Comparison Engine</h1>
                    
                    {/* Header Controls */}
                    <div className={`flex gap-3 mt-4 sm:mt-0 transition-opacity duration-1000 ${hasData && !isImporting ? 'opacity-100' : 'opacity-0'}`}>
                        {hasData && (
                            <>
                                <select value={chartType} onChange={(e)=>setChartType(e.target.value)} className="bg-gray-800 text-white p-2 rounded-lg">
                                    <option value="line">Line</option>
                                    <option value="bar">Bar</option>
                                </select>
                                <IconButton icon={FiSave} onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white" title={userId === "test-user" ? "Login to save to account" : "Save to Account"}>Save</IconButton>
                                <IconButton icon={FiDownload} onClick={exportActive} disabled={!activeDatasets.length} className="bg-gray-800 hover:bg-gray-700 text-gray-300">Export</IconButton>
                                <IconButton icon={FiTrash2} onClick={handleClearAll} disabled={!hasData} className="bg-red-700 hover:bg-red-800 text-white">Clear All</IconButton>
                            </>
                        )}
                        <IconButton icon={FiUploadCloud} onClick={()=>setShowModal(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">Import Data</IconButton>
                    </div>
                </header>

                {/* Conditional Rendering: Only render dashboard content if not importing */}
                {!hasData && !isImporting ? (
                    <LandingView onImportClick={() => setShowModal(true)} />
                ) : hasData && !isImporting ? (
                    <>
                        {/* 1. *** TOP ROW: DATA SOURCES (Dataset Cards) *** */}
                        <section className={`mb-8 transition-opacity duration-700 transform ${staggerState >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <h2 className="text-2xl font-semibold text-white mb-4">Data Sources ({allDatasets.length})</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {allDatasets.map((ds) => (
                                    <DatasetCard
                                        key={ds.id}
                                        dataset={ds}
                                        isActive={activeDatasets.some(d => d.id === ds.id)}
                                        onToggle={() => toggleDataset(ds)}
                                        onRemove={() => removeDataset(ds.id)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* 2. *** MIDDLE ROW: KEY METRICS OVERVIEW *** */}
                        <section className={`mb-8 transition-opacity duration-700 transform ${staggerState >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold text-white">Key Metrics Overview ({consolidatedMetrics.length} columns)</h2>
                                <IconButton icon={FaBrain} onClick={() => setIsAnalysisPanelOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                                    AI Insights
                                </IconButton>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {consolidatedMetrics.length === 0 ? (
                                    <p className="text-gray-500 col-span-4">Select datasets above to see metric summaries.</p>
                                ) : (
                                    consolidatedMetrics.slice(0, 12).map((metricData) => (
                                        <MetricSummaryCard key={metricData.id} {...metricData} />
                                    ))
                                )}
                            </div>
                        </section>

                        {/* 3. *** BOTTOM ROW: VISUALIZATION DETAIL *** */}
                        <section className={`mb-8 transition-opacity duration-700 transform ${staggerState >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <h2 className="text-2xl font-semibold text-white mb-4">Detailed Visualization</h2>
                            <div className="space-y-10">
                                {activeDatasets.length === 0 ? (
                                    <div className="text-center p-12 bg-gray-900/40 rounded-xl border border-gray-800">
                                        <MdOutlineInsights size={40} className="text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500">Select one or more datasets above to view detailed charts and data previews.</p>
                                    </div>
                                ) : (
                                    activeDatasets.map((ds) => (
                                        <div key={ds.id} className="p-6 rounded-2xl border-t-4" style={{ borderColor: ds.color + '80', background: "rgba(10, 10, 15, 0.7)" }}>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-2xl font-bold" style={{ color: ds.color }}>{ds.name} Analysis</h3>
                                                <button onClick={() => removeDataset(ds.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full transition"><FiTrash2 size={18} /></button>
                                            </div>
                                            {generateChartsForDataset(ds)}
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </>
                ) : null}

                {/* Save Success Toast */}
                {showSavedToast && (
                    <div className="fixed bottom-6 right-6 p-4 rounded-xl bg-green-600 shadow-xl text-white flex items-center gap-3 z-50 transition-all duration-300 transform animate-pulse">
                        <FiCheckCircle size={20} />
                        Data saved to your account!
                    </div>
                )}
            </div>

            {/* Import Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-40 transition-opacity duration-300">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform transition-transform duration-300 scale-100">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3"><FiUploadCloud size={24} className="text-cyan-400" /> Import New Data</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors"><FiX size={24} /></button>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-300 mb-3">Select Data Source</h3>
                        <div className="space-y-4 mb-6">
                            <SourceCard
                                icon={MdOutlineTableChart}
                                title="Google Sheets"
                                description="Connect a spreadsheet from your Google Drive."
                                isSelected={selectedApps.includes("google_sheets")}
                                onClick={() => setSelectedApps(["google_sheets"])}
                            />
                            {selectedApps.includes("google_sheets") && (
                                <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                                    {loadingSheetValues ? (
                                        <div className="text-center text-gray-400 flex items-center justify-center gap-2">
                                            <FaSpinner className="animate-spin" /> Loading available sheets...
                                        </div>
                                    ) : (
                                        <SheetsDropdown sheetsList={sheetsList} selectedSheet={selectedSheet} setSelectedSheet={setSelectedSheet} />
                                    )}
                                    <p className="text-xs text-gray-500">You must be logged in and have granted permissions for Google Sheets access.</p>
                                </div>
                            )}

                            <SourceCard
                                icon={FiDownload}
                                title="Local CSV Upload"
                                description="Upload a comma-separated values (.csv) file from your computer."
                                isSelected={selectedApps.includes("other")}
                                onClick={() => setSelectedApps(["other"])}
                            />
                            {selectedApps.includes("other") && (
                                <div className="p-4 bg-gray-800/50 rounded-lg">
                                    <label className="block w-full cursor-pointer p-3 text-center border-2 border-dashed rounded-lg text-gray-400 border-gray-600 hover:border-cyan-500 hover:text-white transition-colors">
                                        {csvToImport ? `File Selected: ${csvToImport.name}` : "Click to select CSV file"}
                                        <input 
                                            type="file" 
                                            accept=".csv" 
                                            onChange={(e) => setCsvToImport(e.target.files[0])} 
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end pt-4 border-t border-gray-800">
                            <IconButton 
                                icon={FiPlus} 
                                onClick={importSelected} 
                                disabled={
                                    (selectedApps.includes("google_sheets") && !selectedSheet) || 
                                    (selectedApps.includes("other") && !csvToImport) || 
                                    selectedApps.length === 0
                                }
                                className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                            >
                                Import and Analyze
                            </IconButton>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Analysis Panel - FIX: Passing activeDatasets (guaranteed array) and managing the open state */}
            <AIAnalysisPanel 
                isOpen={isAnalysisPanelOpen} 
                onClose={() => setIsAnalysisPanelOpen(false)} 
                datasets={activeDatasets} // Pass the state array
                userId={userId}
                userToken={userToken}
                API_BASE_URL={API_BASE_URL}
            />
        </div>
    );
}