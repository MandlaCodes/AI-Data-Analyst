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
// Assuming you have this component in the correct path
import { AIAnalysisPanel } from '../components/AIAnalysisPanel'; 
import { FaBrain, FaSpinner } from 'react-icons/fa';

// Register Chart.js components
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

// ** LOCAL STORAGE KEY FOR FALLBACK (REMOVED FROM PRIMARY LOGIC) **
const DATASET_STORAGE_KEY = "analytics_persisted_datasets"; 

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

/* ---------- UI Components (kept for completeness) ---------- */

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
        // Use shorter notation for large numbers (M for Million, k for Thousand)
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
            
            {/* Horizontal Flex Container: Ensures all metrics stay on one row */}
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

    // Close the dropdown when clicking outside
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
            {/* Input Button */}
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

            {/* Dropdown Menu (Appears Below) */}
            <div 
                className={`absolute left-0 right-0 mt-1 rounded-lg bg-gray-900 shadow-2xl border border-purple-900/50 overflow-hidden z-20 transition-all duration-300 ${
                    isOpen ? 'opacity-100 max-h-60 translate-y-0' : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none'
                }`}
                style={{
                    // Use a subtle futuristic glow on the container
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
    // SECURITY NOTE: Ensure profile and token are correctly retrieved.
    const profile = JSON.parse(localStorage.getItem("adt_profile") || '{"user_id":"test-user"}');
    const userToken = localStorage.getItem("adt_token");
    // Use the actual ID from the profile object
    const userId = profile.id || profile.user_id; 

    const [showModal, setShowModal] = useState(false);
    const [selectedApps, setSelectedApps] = useState([]);
    const [sheetsList, setSheetsList] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [csvToImport, setCsvToImport] = useState(null);
    const [loadingSheetValues, setLoadingSheetValues] = useState(false);

    // Initial state set to an empty array. The useEffect below handles loading persisted data.
    const [allDatasets, setAllDatasets] = useState([]);
    const [activeDatasets, setActiveDatasets] = useState([]);

    const [chartType, setChartType] = useState("line");
    const [showSavedToast, setShowSavedToast] = useState(false);
    
    const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false); 
    
    // State for Flawless Transition & Initial Load
    const [isImporting, setIsImporting] = useState(false); 
    const [isInitializing, setIsInitializing] = useState(true); // <-- Blocks UI until load completes
    const [staggerState, setStaggerState] = useState(0); 

    const datasetColors = ["#A78BFA","#22C55E","#F97316","#EAB308"];

    const parseCSVFile = async (file) => {
        const text = await file.text();
        // Simple CSV parsing for this example
        const rows = text.split(/\r?\n/).filter(Boolean);
        // Clean up quotes and trim
        return rows.map(r => r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"')));
    };
    
    // ---------------------------------------------
    // 1. **EFFECT: INITIAL LOAD FROM DATABASE** - CRITICALLY MODIFIED
    // This loads the user's *current* working session from the database.
    // ---------------------------------------------
    useEffect(() => {
        let cancelled = false;
        
        const loadCurrentSession = async () => {
            setIsInitializing(true); 
            setStaggerState(0);
            
            // Only attempt to load if the user is logged in
            if (!userId || userId === "test-user" || !userToken) {
                console.log("Not logged in. Starting a fresh local session.");
                setIsInitializing(false);
                return;
            }
            
            try {
                // Fetch the most recent working session from the server
                const res = await axios.get(`${API_BASE_URL}/analysis/current`, { 
                    headers: { Authorization: `Bearer ${userToken}` }
                });

                if (cancelled || !res.data) return;

                const { allDatasets: loadedDatasets = [], config = {} } = res.data.results || {};
                const { activeDatasetIds = [], chartType: loadedChartType = "line" } = config;

                if (loadedDatasets.length > 0) {
                    setAllDatasets(loadedDatasets);
                    
                    // Restore active state based on saved IDs
                    const restoredActive = loadedDatasets.filter(d => activeDatasetIds.includes(d.id));
                    setActiveDatasets(restoredActive);
                    setChartType(loadedChartType);
                }

                console.log(`Loaded ${loadedDatasets.length} datasets from server session.`);

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log("No current analysis session found in the database. Starting fresh.");
                } else {
                    console.error("Failed to load user session from server:", error.response?.data || error);
                }
            } finally {
                if (!cancelled) {
                    setIsInitializing(false); 
                }
            }
        };
        
        loadCurrentSession();

        return () => { cancelled = true; };
    }, [userId, userToken]); 

    // ---------------------------------------------
    // 2. **EFFECT: AUTOSAVE ON UNMOUNT & STAGGER** - CRITICALLY MODIFIED
    // This handles persistence when the user navigates away.
    // ---------------------------------------------
    useEffect(() => {
        if (isInitializing || !userId || userId === "test-user" || !userToken) return;

        // --- Stagger Transition Logic (Visual Only) ---
        if (allDatasets.length > 0 && staggerState === 0) {
            setTimeout(() => setStaggerState(1), 100); 
            setTimeout(() => setStaggerState(2), 500); 
            setTimeout(() => setStaggerState(3), 900);
        } else if (allDatasets.length === 0) {
            setStaggerState(0);
        }
        
        // --- Autosave on Unmount Logic (Cleanup Function) ---
        const handleAutosave = async () => {
            if (allDatasets.length === 0) return; // Don't save if there's nothing to save

            const autosavePayload = {
                source: allDatasets.map(d => d.name).join(" & "), 
                config: {
                    chartType: chartType,
                    activeDatasetIds: activeDatasets.map(d => d.id) 
                },
                results: {
                    allDatasets: allDatasets,
                }
            };

            try {
                await axios.post(`${API_BASE_URL}/analysis/autosave`, autosavePayload, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                console.log("Autosave successful during unmount/cleanup.");
            } catch (error) {
                console.error("Autosave failed:", error.response?.data || error);
            }
        };

        // This function runs when the component unmounts
        return handleAutosave;

    }, [allDatasets, activeDatasets, chartType, isInitializing, staggerState, userId, userToken]); 

    // Fetch Sheets List for Modal
    useEffect(() => {
        if (!showModal || !selectedApps.includes("google_sheets")) return;
        let cancelled = false;
        (async () => {
            try {
                const token = localStorage.getItem("adt_token");
                // FIX: sheets-list should be `/sheets-list`
                const res = await axios.get(`${API_BASE_URL}/sheets-list`, { 
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!cancelled) setSheetsList(res.data.sheets || []);
            } catch(e) { 
                console.error("Failed to fetch sheets list:", e);
                if (!cancelled) setSheetsList([]); 
            }
        })();
        return () => { cancelled = true; };
    }, [showModal, selectedApps]); // Removed userId from dependency list as it's not needed for the sheets-list endpoint

    const importSelected = async () => {
        // 1. START: Set Importing State & Close Modal
        setShowModal(false);
        setIsImporting(true);
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
                    // FIX: Sheet endpoint is assumed to be correct
                    const res = await axios.get(
                        `${API_BASE_URL}/sheets/${selectedSheet}`,
                        { headers: { Authorization: `Bearer ${token}` } } 
                    );
                    if (res.data?.data?.rows?.length) {
                         // Data structure assumption adjustment for importedRows
                         const headers = res.data.data.headers || [];
                         const rows = res.data.data.rows || [];
                         importedRows.push([headers, ...rows]);
                    }
                } catch (err) { console.error("Google Sheets Fetch Error:", err); }
                setLoadingSheetValues(false);
            } else if (key === "other" && csvToImport) {
                sourceName = csvToImport.name.replace(/\.csv$/i,"");
                try {
                    const values = await parseCSVFile(csvToImport);
                    if (values.length) {
                        importedRows.push(values);
                    }
                } catch (err) { console.error("CSV Parse Error:", err); }
            }
        }
        
        // Merge multiple imported datasets into one giant set for simplicity in this example
        if (!importedRows.length) {
            setSelectedApps([]); setSelectedSheet(""); setCsvToImport(null);
            setIsImporting(false);
            return;
        }

        // --- Data Merging Logic (Simplified) ---
        const firstDataset = importedRows[0];
        const headers = firstDataset[0];
        let combinedData = [...firstDataset];
        
        for (let i = 1; i < importedRows.length; i++) {
            // Simple merge: assumes same headers or ignores headers for subsequent files
            combinedData.push(...importedRows[i].slice(1));
        }

        // 2. DATA PROCESSING
        const cleaned = combinedData.map((row, idx) => idx === 0 ? row : row.map(sanitizeCellValue));
        const numeric = detectNumericColumns(cleaned);
        const metrics = computeMetrics(cleaned, numeric);
        const categoryColumn = detectCategoryColumn(cleaned, numeric); 

        const newDataset = {
            id: Date.now(), // Unique ID based on timestamp
            name: sourceName,
            // Assign a color based on the current length of ALL datasets, including existing ones
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
        
        // 3. END: Release Block
        setIsImporting(false); 
        // Staggered transitions will be handled by the second useEffect now
    };

    const toggleDataset = (dataset) => {
        setActiveDatasets(prev => prev.find(d => d.id === dataset.id) ? prev.filter(d => d.id !== dataset.id) : [...prev, dataset]);
    };

    const removeDataset = (id) => {
        setAllDatasets(prev => prev.filter(d => d.id !== id));
        setActiveDatasets(prev => prev.filter(d => d.id !== id));
    };

    const handleClearAll = async () => {
        if (window.confirm("Are you sure you want to clear ALL imported datasets? This action cannot be undone.")) {
            setAllDatasets([]);
            setActiveDatasets([]);
            setStaggerState(0);
            
            // CRITICAL: Autosave with empty payload to clear the working session in the DB
            if (userId && userId !== "test-user" && userToken) {
                 const emptyPayload = {
                    source: "Cleared Session", 
                    config: { chartType: "line", activeDatasetIds: [] },
                    results: { allDatasets: [] }
                };
                try {
                    await axios.post(`${API_BASE_URL}/analysis/autosave`, emptyPayload, {
                        headers: { Authorization: `Bearer ${userToken}` }
                    });
                    console.log("Database session cleared successfully via autosave.");
                } catch (error) {
                    console.error("Failed to clear DB session on /analysis/autosave:", error.response?.data || error);
                }
            }
        }
    };
    
    // ** SAVES DATASETS TO THE USER'S BACKEND ACCOUNT (EXPLICIT SAVE) **
    const handleSave = async () => { 
        if (!userId || userId === "test-user") {
            alert("Please log in to save datasets to your account.");
            return;
        }

        setShowSavedToast(true); 
        
        // 1. CONSTRUCT THE PAYLOAD (Uses /analysis/save, which requires a name)
        const savePayload = {
            // A descriptive name for the overall session
            name: prompt("Enter a name for this analysis session:", "My Saved Analysis") || "Untitled Session", 
            // A generic source since it might be multiple files/sheets
            source: allDatasets.map(d => d.name).join(" & "), 
            
            // Configuration/Settings for the UI/App state
            config: {
                chartType: chartType,
                // Save the IDs of the currently active datasets to restore the view
                activeDatasetIds: activeDatasets.map(d => d.id) 
            },
            
            // The actual data (datasets) and computed results (metrics)
            results: {
                allDatasets: allDatasets, // The full array of data to be reloaded
            }
        };
        
        // Stop if user cancels the prompt
        if (savePayload.name === "Untitled Session" && !prompt) return;

        try {
            // 2. USE THE CORRECT BACKEND ENDPOINT
            await axios.post(`${API_BASE_URL}/analysis/save`, savePayload, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            
            // NOTE: Local storage persistence is now obsolete for primary persistence but can be kept as a fallback cache
            // localStorage.setItem(DATASET_STORAGE_KEY, JSON.stringify(allDatasets));

        } catch (error) {
            console.error("Failed to save datasets to account:", error.response?.data || error);
            alert("Error saving data to your account. Check your connection or console for details.");
        } finally {
            // Close toast after 2 seconds
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
                
                {/* Table Preview Component */}
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
                                {dataset.data.slice(1, maxPreviewRows + 1).map((row, rowIndex) => (
                                    <tr key={rowIndex} className="even:bg-gray-900/50 hover:bg-gray-800/70 transition-colors">
                                        {row.map((cell, cellIndex) => (
                                            <td 
                                                key={cellIndex} 
                                                className={`px-3 py-2 whitespace-nowrap ${dataset.numericCols.includes(cellIndex) ? 'text-right font-mono' : 'text-left'}`}
                                            >
                                                <div className="max-w-[150px] truncate" title={String(cell)}>
                                                    {String(cell)}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {dataset.data.length > maxPreviewRows + 1 && (
                                    <tr>
                                        <td colSpan={dataset.data[0].length} className="px-3 py-1 text-center text-gray-500">
                                            ... {dataset.data.length - 1 - maxPreviewRows} more rows ...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Metrics Summary Row */}
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {dataset.numericCols.map((colIndex, idx) => {
                        const colName = dataset.data[0][colIndex];
                        const metrics = dataset.metrics[colName];
                        return metrics ? (
                            <div key={colIndex} className="flex-shrink-0 w-[400px]">
                                <MetricSummaryCard 
                                    colName={colName} 
                                    datasetName={dataset.name} 
                                    metrics={metrics} 
                                    color={dataset.color} 
                                />
                            </div>
                        ) : null;
                    })}
                </div>
                
                {/* Individual Numeric Column Charts (Bars for categories, Lines for date/index) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dataset.numericCols.map((colIndex, idx) => {
                        const colName = dataset.data[0][colIndex];
                        const isDateOrCategory = dataset.categoryCol && (dataset.categoryCol.isDate || dataset.categoryCol.colIndex === 0);
                        
                        // Decide Chart Type for Internal Plot (Force Bar if true categorical, Line if time-series)
                        const internalChartType = dataset.categoryCol && !dataset.categoryCol.isDate && dataset.rows <= 100 ? 'bar' : 'line';
                        
                        const chartData = {
                            labels: labels.slice(0, 100), // Limit samples for performance
                            datasets: [{
                                label: colName,
                                data: dataset.data.slice(1, 101).map(r => r[colIndex]),
                                backgroundColor: internalChartType === 'bar' ? `${dataset.color}99` : 'transparent',
                                borderColor: dataset.color,
                                borderWidth: 2,
                                tension: 0.4,
                                fill: internalChartType === 'line',
                                pointRadius: internalChartType === 'line' ? 2 : 0,
                                pointBackgroundColor: dataset.color,
                                order: 1,
                            }]
                        };

                        const ChartComponent = internalChartType === 'bar' ? Bar : Line;

                        return (
                            <div key={colIndex} className="bg-gray-900/40 p-4 rounded-xl shadow-inner border border-gray-800">
                                <h4 className="text-md font-semibold text-white mb-2">{colName} vs {dataset.categoryCol ? dataset.categoryCol.header : 'Index'} ({internalChartType.toUpperCase()})</h4>
                                <div className="h-64">
                                    <ChartComponent 
                                        data={chartData} 
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: { mode: 'index', intersect: false }
                                            },
                                            scales: {
                                                x: {
                                                    ticks: {
                                                        color: '#9CA3AF',
                                                        autoSkip: true,
                                                        maxRotation: 0,
                                                        minRotation: 0,
                                                        maxTicksLimit: 10
                                                    },
                                                    grid: { color: 'rgba(55, 65, 81, 0.2)' },
                                                    title: { display: true, text: dataset.categoryCol ? dataset.categoryCol.header : 'Index', color: '#9CA3AF' }
                                                },
                                                y: {
                                                    ticks: { color: '#9CA3AF' },
                                                    grid: { color: 'rgba(55, 65, 81, 0.2)' },
                                                    title: { display: true, text: colName, color: '#9CA3AF' }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        );
    };

    const generateComparisonChart = () => {
        if (activeDatasets.length === 0) return null;

        // 1. Determine a common Category Column (X-axis)
        // For simplicity, we use the category column of the first active dataset.
        const primaryDataset = activeDatasets[0];
        const primaryCategoryCol = primaryDataset.categoryCol;

        if (!primaryCategoryCol || primaryDataset.numericCols.length === 0) {
            return <div className="text-gray-400 text-center p-8 text-lg">Cannot compare: Primary dataset needs a numeric and a category/date column.</div>;
        }

        // We choose the first numeric column of the primary dataset as the default Y-axis metric
        const primaryMetricColIndex = primaryDataset.numericCols[0];
        const primaryMetricColName = primaryDataset.data[0][primaryMetricColIndex];
        
        // 2. Map data
        const comparisonDatasets = activeDatasets.map(ds => {
            // Find the index of the metric with the same name, or the first numeric one if name match fails
            let metricIndex = ds.data[0].findIndex((h, i) => i !== primaryCategoryCol.colIndex && h === primaryMetricColName && ds.numericCols.includes(i));
            if (metricIndex === -1) {
                metricIndex = ds.numericCols[0];
            }
            
            // Generate data points for the comparison. 
            // NOTE: This assumes datasets are aligned or the category labels can be correctly compared/sorted.
            // For a robust app, a proper data join/alignment based on categoryCol would be needed.
            const dataPoints = ds.data.slice(1).map(r => ({
                x: primaryCategoryCol.isDate ? new Date(r[primaryCategoryCol.colIndex]).getTime() : String(r[primaryCategoryCol.colIndex]),
                y: r[metricIndex]
            }));

            return {
                label: ds.name,
                data: dataPoints.map(p => p.y).slice(0, 100), // Only take first 100 points for chart data
                backgroundColor: ds.color,
                borderColor: ds.color,
                borderWidth: chartType === 'line' ? 2 : 1,
                tension: chartType === 'line' ? 0.4 : 0,
                fill: false,
                pointRadius: chartType === 'line' ? 3 : 0,
                type: chartType,
                yAxisID: 'y'
            };
        });

        // Use labels from the primary dataset's category column
        const labels = primaryDataset.data.slice(1, 101).map(r => primaryCategoryCol.isDate ? new Date(r[primaryCategoryCol.colIndex]).toLocaleDateString() : String(r[primaryCategoryCol.colIndex]));

        const ChartComponent = chartType === 'line' ? Line : Bar;
        
        return (
            <div className="h-[400px] w-full p-4 rounded-xl shadow-xl border border-gray-800 bg-gray-900/40">
                <h3 className="text-xl font-bold text-white mb-4">
                    Comparison: <span className="text-purple-400">{primaryMetricColName}</span> across Datasets
                </h3>
                <div className="h-full">
                    <ChartComponent
                        data={{ labels, datasets: comparisonDatasets }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { 
                                    position: 'bottom', 
                                    labels: { color: '#D1D5DB', usePointStyle: true, boxHeight: 6 } 
                                },
                                title: { display: false },
                                tooltip: { mode: 'index', intersect: false }
                            },
                            scales: {
                                x: {
                                    type: 'category',
                                    ticks: {
                                        color: '#9CA3AF',
                                        autoSkip: true,
                                        maxRotation: 0,
                                        minRotation: 0,
                                        maxTicksLimit: 10
                                    },
                                    grid: { color: 'rgba(55, 65, 81, 0.2)' },
                                    title: { display: true, text: primaryCategoryCol.header, color: '#9CA3AF' }
                                },
                                y: {
                                    ticks: { color: '#9CA3AF' },
                                    grid: { color: 'rgba(55, 65, 81, 0.2)' },
                                    title: { display: true, text: primaryMetricColName, color: '#9CA3AF' }
                                }
                            },
                            // Custom options for Bar/Line mixing
                            interaction: {
                                mode: 'index',
                                intersect: false,
                            }
                        }}
                    />
                </div>
            </div>
        );
    };

    if (isInitializing || isImporting) {
        return <FlawlessLoadingOverlay />;
    }

    return (
        <div className="min-h-screen bg-[#0A0D18] text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className={`transition-all duration-700 ${staggerState >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
                    <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
                        <MdOutlineAnalytics className="text-purple-500" size={32} />
                        Data Comparison Engine
                    </h1>
                    <p className="text-gray-400 mb-6">Analyze and compare multiple datasets instantly.</p>
                </div>
                
                {/* Action Bar */}
                {allDatasets.length > 0 && (
                    <div className={`flex justify-between items-center bg-gray-900/50 p-3 rounded-xl border border-gray-800 mb-6 transition-all duration-700 ${staggerState >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                        <div className="flex gap-3">
                            <IconButton 
                                icon={FiSave} 
                                onClick={handleSave} 
                                className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-900/50"
                                title="Save current analysis session to your account"
                                disabled={!userToken || allDatasets.length === 0}
                            >
                                Save Session
                            </IconButton>
                            <IconButton 
                                icon={FiDownload} 
                                onClick={exportActive} 
                                className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-900/50"
                                title="Export combined active datasets to CSV"
                                disabled={activeDatasets.length === 0}
                            >
                                Export Active Data
                            </IconButton>
                            <IconButton 
                                icon={FiTrash2} 
                                onClick={handleClearAll} 
                                className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-900/50"
                                title="Clear all datasets and reset the session"
                                disabled={allDatasets.length === 0}
                            >
                                Clear All
                            </IconButton>
                        </div>
                        <div className="flex gap-3 items-center">
                            {/* Chart Type Selector */}
                            <select 
                                value={chartType} 
                                onChange={(e) => setChartType(e.target.value)} 
                                className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                            >
                                <option value="line">Line Chart</option>
                                <option value="bar">Bar Chart</option>
                            </select>
                            
                            <IconButton 
                                icon={FaBrain} 
                                onClick={() => setIsAnalysisPanelOpen(prev => !prev)} 
                                className={`font-extrabold ${isAnalysisPanelOpen ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'} text-white shadow-md shadow-purple-900/50`}
                                title="Get AI-powered insights on active datasets"
                                disabled={activeDatasets.length === 0}
                            >
                                <MdOutlineInsights size={18} />
                                AI Insights {isAnalysisPanelOpen ? 'ON' : 'OFF'}
                            </IconButton>
                            
                            <IconButton 
                                icon={FiPlus} 
                                onClick={() => setShowModal(true)} 
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                Add Dataset
                            </IconButton>
                        </div>
                    </div>
                )}
                
                {/* Dataset Selector / Landing View */}
                <div className="grid grid-cols-1 gap-6">
                    {allDatasets.length === 0 && (
                        <LandingView onImportClick={() => setShowModal(true)} />
                    )}
                    
                    {allDatasets.length > 0 && (
                        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 transition-all duration-700 ${staggerState >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
                            {allDatasets.map((dataset) => (
                                <DatasetCard 
                                    key={dataset.id} 
                                    dataset={dataset} 
                                    isActive={activeDatasets.some(d => d.id === dataset.id)}
                                    onToggle={() => toggleDataset(dataset)}
                                    onRemove={() => removeDataset(dataset.id)}
                                />
                            ))}
                            {/* "Add New" Card */}
                            <div 
                                className="rounded-xl p-4 cursor-pointer border-2 border-dashed border-gray-700 hover:border-purple-500 transition-all duration-300 flex items-center justify-center bg-gray-900/50"
                                onClick={() => setShowModal(true)}
                            >
                                <div className="text-center text-gray-400 hover:text-purple-400">
                                    <FiPlus size={24} className="mx-auto mb-1" />
                                    <span className="text-sm font-medium">Add New Data</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Analysis Panel */}
                <div className={`transition-all duration-500 overflow-hidden ${isAnalysisPanelOpen && activeDatasets.length > 0 ? 'max-h-[1000px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
                    <AIAnalysisPanel 
                        activeDatasets={activeDatasets} 
                        userToken={userToken} 
                        apiBaseUrl={API_BASE_URL} 
                    />
                </div>
                
                {/* Comparison View */}
                {activeDatasets.length > 1 && (
                    <div className={`mb-10 transition-all duration-1000 ${staggerState >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
                        {generateComparisonChart()}
                    </div>
                )}
                
                {/* Individual Dataset Detail Views */}
                {activeDatasets.length > 0 && (
                    <div className="space-y-12">
                        {activeDatasets.map((dataset, idx) => (
                            <div 
                                key={dataset.id} 
                                className={`p-6 rounded-2xl border transition-all duration-1000`}
                                style={{ 
                                    borderColor: dataset.color,
                                    background: `linear-gradient(135deg, ${dataset.color}05, rgba(10, 10, 15, 0.95))`
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-extrabold text-white">
                                        <span style={{ color: dataset.color }}>{dataset.name}</span> Details
                                    </h2>
                                    <span className="text-sm text-gray-400">{dataset.rows} rows, {dataset.cols} columns</span>
                                </div>
                                {generateChartsForDataset(dataset)}
                            </div>
                        ))}
                    </div>
                )}
                
            </div>
            
            {/* Modal for Import/Connection */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-gray-900/95 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-purple-900" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                            <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                                <FiUploadCloud className="text-cyan-400" />
                                Import New Dataset
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition">
                                <FiX size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-300">Choose a Data Source:</h4>
                            
                            <SourceCard
                                icon={({ size, className }) => <img src="/icons/google-sheets.svg" alt="Google Sheets" width={size} height={size} className={className} />}
                                title="Google Sheets"
                                description="Connect to a shared Google Sheet (requires prior OAuth connection)."
                                isSelected={selectedApps.includes("google_sheets")}
                                onClick={() => {
                                    setSelectedApps(["google_sheets"]);
                                    setSelectedSheet(""); // Reset sheet selection on source change
                                    setCsvToImport(null);
                                }}
                                disabled={!userToken} // Disable if user is not logged in/token available
                            />
                            
                            {selectedApps.includes("google_sheets") && (
                                <div className="space-y-3 p-4 border border-purple-500/50 rounded-lg bg-gray-800/50">
                                    {loadingSheetValues ? (
                                        <div className="text-center text-purple-400 flex items-center justify-center gap-2">
                                            <FaSpinner className="animate-spin" /> Fetching Sheets...
                                        </div>
                                    ) : (
                                        <SheetsDropdown 
                                            sheetsList={sheetsList} 
                                            selectedSheet={selectedSheet} 
                                            setSelectedSheet={setSelectedSheet} 
                                        />
                                    )}
                                    <p className="text-xs text-gray-400">Select the specific sheet you want to import data from.</p>
                                </div>
                            )}
                            
                            <SourceCard
                                icon={FiUploadCloud}
                                title="Upload CSV File"
                                description="Upload a local CSV file directly from your computer."
                                isSelected={selectedApps.includes("other")}
                                onClick={() => {
                                    setSelectedApps(["other"]);
                                    setSelectedSheet(""); // Reset sheet selection on source change
                                }}
                            />
                            
                            {selectedApps.includes("other") && (
                                <div className="space-y-3 p-4 border border-cyan-500/50 rounded-lg bg-gray-800/50">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setCsvToImport(e.target.files[0])}
                                        className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-cyan-50 file:text-cyan-700
                                        hover:file:bg-cyan-100"
                                    />
                                    {csvToImport && <p className="text-sm text-gray-300">File selected: <span className="font-medium text-cyan-400">{csvToImport.name}</span></p>}
                                </div>
                            )}

                        </div>
                        
                        <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
                            <IconButton 
                                icon={FiPlus} 
                                onClick={importSelected}
                                disabled={
                                    (selectedApps.includes("google_sheets") && !selectedSheet) || 
                                    (selectedApps.includes("other") && !csvToImport) ||
                                    selectedApps.length === 0 || 
                                    loadingSheetValues
                                }
                                className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-6 py-2"
                            >
                                Import Data
                            </IconButton>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Save Toast Notification */}
            {showSavedToast && (
                <div className="fixed bottom-5 right-5 p-4 rounded-xl bg-green-600 shadow-2xl shadow-green-900 flex items-center gap-2 transition-opacity duration-300 z-50">
                    <FiCheckCircle size={20} className="text-white" />
                    <span className="font-medium text-white">Session Saved Successfully!</span>
                </div>
            )}
            
        </div>
    );
}