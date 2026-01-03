/**
 * pages/Analytics.js - VERSION: METRIA AI HIGH-ENERGY
 * Full production file with Session Persistence and Neural Stream processing.
 */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
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
import { FaSpinner } from 'react-icons/fa';
import { MdOutlineAnalytics, MdOutlineTableChart } from "react-icons/md";
import { FiTrash2, FiPlus } from "react-icons/fi"; 
import { WorkbenchHeader } from '../components/WorkbenchHeader';
import { Visualizer } from '../components/Visualizer';
import { ImportModal } from '../components/ImportModal';

// Register ChartJS components for the Visualizer
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
const AUTH_TOKEN_KEY = "adt_token";

export default function Analytics() {
    const userToken = localStorage.getItem(AUTH_TOKEN_KEY);
    
    // Core Data State
    const [allDatasets, setAllDatasets] = useState([]);
    const [activeDatasets, setActiveDatasets] = useState([]);
    const [chartType, setChartType] = useState("line");
    
    // UI Logic State
    const [showModal, setShowModal] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Import Flow State
    const [selectedApps, setSelectedApps] = useState([]);
    const [sheetsList, setSheetsList] = useState([]); // Kept for prop stability
    const [selectedSheet, setSelectedSheet] = useState("");
    const [csvToImport, setCsvToImport] = useState(null);

    const datasetColors = ["#bc13fe", "#22C55E", "#F97316", "#EAB308"];
    const isFirstMount = useRef(true);

    // --- DATA UTILITIES ---

    const sanitizeCellValue = (value) => {
        if (value === null || value === undefined || value === "") return "";
        const str = String(value).trim();
        const numericValue = Number(str.replace(/,/g, ''));
        return !isNaN(numericValue) && str.length > 0 ? numericValue : str;
    };

    const calculateHealthScore = (dataset) => {
        if (!dataset.data || dataset.data.length < 2) return 0;
        const rows = dataset.data.slice(1);
        const numericIdx = dataset.numericCols[0] || 0;
        let issues = 0;
        const vals = rows.map(r => sanitizeCellValue(r[numericIdx])).filter(v => typeof v === 'number');
        const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        
        rows.forEach(row => {
            const val = sanitizeCellValue(row[numericIdx]);
            if (val === "" || val === null || val === undefined) issues++;
            if (typeof val === 'number' && val > avg * 5 && avg !== 0) issues += 0.5;
        });
        const score = Math.max(0, 100 - (issues / (rows.length || 1)) * 100);
        return Math.round(score);
    };

    const parseCSVFile = async (file) => {
        const text = await file.text();
        const rows = text.split(/\r?\n/).filter(Boolean);
        return rows.map(r => r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"')));
    };

    const detectNumericColumns = (values) => {
        if (!values || values.length < 2) return [];
        return values[0].map((_, colIndex) => {
            const sample = values.slice(1, 6).map(r => sanitizeCellValue(r[colIndex]));
            return sample.some(v => typeof v === "number") ? colIndex : null;
        }).filter(i => i !== null);
    };

    const detectCategoryColumn = (values, numericIndexes) => {
        for (let i = 0; i < values[0].length; i++) {
            if (!numericIndexes.includes(i)) return { colIndex: i, header: values[0][i] };
        }
        return null;
    };

    const computeMetrics = (values, numericIndexes) => {
        const metrics = {};
        numericIndexes.forEach(idx => {
            const colName = values[0][idx];
            const arr = values.slice(1).map(r => sanitizeCellValue(r[idx])).filter(n => typeof n === "number");
            const total = arr.reduce((a, b) => a + b, 0);
            metrics[colName] = { 
                total, 
                avg: total / (arr.length || 1), 
                max: Math.max(...arr), 
                min: Math.min(...arr), 
                count: arr.length 
            };
        });
        return metrics;
    };

    // --- SESSION & PERSISTENCE ---

    useEffect(() => {
        const loadSession = async () => {
            if (!userToken) { setIsInitializing(false); return; }
            try {
                const res = await axios.get(`${API_BASE_URL}/analysis/current`, { 
                    headers: { Authorization: `Bearer ${userToken}` } 
                });
                
                if (res.data?.page_state) {
                    const { 
                        allDatasets: loadedDatasets, 
                        activeDatasetIds, 
                        chartType: loadedChartType,
                        uiContext 
                    } = res.data.page_state;

                    setAllDatasets(loadedDatasets || []);
                    setChartType(loadedChartType || "line");
                    
                    if (activeDatasetIds && loadedDatasets) {
                        const active = loadedDatasets.filter(d => activeDatasetIds.includes(d.id));
                        setActiveDatasets(active);
                    }

                    if (uiContext) {
                        setShowModal(!!uiContext.showModal);
                        setSelectedApps(uiContext.selectedApps || []);
                        setSelectedSheet(uiContext.selectedSheet || "");
                    }
                }
            } catch (e) {
                console.error("Session load failed:", e);
            } finally {
                setIsInitializing(false);
            }
        };
        loadSession();
    }, [userToken]);

    // AUTOSAVE LOGIC
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        const autosave = async () => {
            if (!userToken || isInitializing) return;
            setIsSaving(true);
            try {
                const pageState = {
                    allDatasets,
                    activeDatasetIds: activeDatasets.map(d => d.id),
                    chartType,
                    uiContext: { showModal, selectedApps, selectedSheet }
                };

                await axios.post(`${API_BASE_URL}/analysis/save`, {
                    name: "Autosave Dashboard",
                    page_state: pageState
                }, { 
                    headers: { Authorization: `Bearer ${userToken}` } 
                });
            } catch (e) {
                console.warn("Autosave failed", e);
            } finally {
                setIsSaving(false);
            }
        };

        const timer = setTimeout(autosave, 1500); 
        return () => clearTimeout(timer);
    }, [allDatasets, activeDatasets, chartType, showModal, selectedApps, selectedSheet, userToken, isInitializing]);

    // --- ACTIONS ---

    const handleAIUpdate = (datasetId, aiData) => {
        const applyUpdate = (list) => list.map(ds => 
            ds.id === datasetId ? { ...ds, aiStorage: aiData } : ds
        );
        setAllDatasets(prev => applyUpdate(prev));
        setActiveDatasets(prev => applyUpdate(prev));
    };

    const handleSave = async () => {
        if (!userToken) return;
        setIsSaving(true);
        try {
            const pageState = {
                allDatasets,
                activeDatasetIds: activeDatasets.map(d => d.id),
                chartType,
                uiContext: { showModal, selectedApps, selectedSheet }
            };

            await axios.post(`${API_BASE_URL}/analysis/save`, {
                name: `Manual Save ${new Date().toLocaleTimeString()}`,
                page_state: pageState
            }, { 
                headers: { Authorization: `Bearer ${userToken}` } 
            });
            alert("Workspace snapshot saved!");
        } catch (e) {
            alert("Save failed.");
        } finally {
            setIsSaving(false);
        }
    };

    const importSelected = async () => {
        setIsImporting(true);
        try {
            let importedRows = [];
            let sourceName = "Dataset";

            if (selectedApps.includes("google_sheets") && selectedSheet) {
                // Fetch the sheet data using the ID from the Picker
                const res = await axios.get(`${API_BASE_URL}/google/sheets/${selectedSheet}`, { 
                    headers: { Authorization: `Bearer ${userToken}` } 
                });
                
                if (res.data?.values) {
                    importedRows = res.data.values;
                    // Use the title from API or fallback to ID
                    sourceName = res.data.title || `Sheet_${selectedSheet.slice(0, 5)}`;
                }
            } else if (selectedApps.includes("other") && csvToImport) {
                sourceName = csvToImport.name.replace(/\.csv$/i,"");
                importedRows = await parseCSVFile(csvToImport);
            }

            if (importedRows.length > 0) {
                const cleaned = importedRows.map((row, idx) => idx === 0 ? row : row.map(sanitizeCellValue));
                const numeric = detectNumericColumns(cleaned);
                const category = detectCategoryColumn(cleaned, numeric);
                
                const newDataset = {
                    id: Date.now(),
                    name: sourceName,
                    color: datasetColors[allDatasets.length % datasetColors.length],
                    rows: cleaned.length - 1,
                    cols: cleaned[0]?.length || 0,
                    data: cleaned,
                    numericCols: numeric,
                    metrics: computeMetrics(cleaned, numeric),
                    categoryCol: category,
                    aiStorage: null
                };
                setAllDatasets(prev => [...prev, newDataset]);
                setActiveDatasets(prev => [...prev, newDataset]);
                setShowModal(false); 
            }
        } catch (e) {
            console.error("Import error:", e);
            alert("Import failed. Ensure you have selected a valid stream.");
        } finally {
            setIsImporting(false);
            setSelectedApps([]);
            setCsvToImport(null);
            setSelectedSheet("");
        }
    };

    // --- RENDER ---

    return (
        <div className="bg-black text-slate-200 w-full min-h-screen font-sans selection:bg-purple-500/30 overflow-x-hidden">
            {/* Loading Overlay */}
            {(isInitializing || isImporting) && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-purple-500/20 blur-3xl animate-pulse" />
                        <FaSpinner size={60} className="text-purple-500 animate-spin relative" />
                    </div>
                    <p className="text-sm font-black tracking-[0.4em] text-white uppercase animate-pulse">
                        {isImporting ? "Processing Stream..." : "MetriaAI Initializing..."}
                    </p>
                </div>
            )}

            <div className="w-full space-y-10">
                <div className="pt-8 px-6 md:px-12">
                    <WorkbenchHeader 
                        isSaving={isSaving} 
                        onImport={() => setShowModal(true)} 
                        onSave={handleSave} 
                        onOpenAI={() => {}} 
                    />
                </div>

                {allDatasets.length > 0 ? (
                    <>
                        <div className="flex items-center gap-4 px-8 md:px-14">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">Neural Streams</h3>
                            <div className="h-[1px] flex-1 bg-white/5" />
                        </div>

                        {/* Stream Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 md:px-12">
                            {allDatasets.map(ds => {
                                const isActive = activeDatasets.some(a => a.id === ds.id);
                                const health = calculateHealthScore(ds);
                                return (
                                    <div 
                                        key={ds.id} 
                                        onClick={() => setActiveDatasets(prev => isActive ? prev.filter(d => d.id !== ds.id) : [...prev, ds])} 
                                        className={`group relative overflow-hidden border rounded-[2.5rem] p-8 transition-all duration-500 cursor-pointer flex flex-col min-h-[220px] ${
                                            isActive 
                                            ? 'bg-purple-900/20 border-purple-500/40 shadow-[0_0_40px_rgba(188,19,254,0.1)]' 
                                            : 'bg-white/[0.04] border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.03)]'
                                        }`} 
                                    >
                                        <div className="absolute inset-0 opacity-30 pointer-events-none"
                                            style={{ background: isActive 
                                                ? 'radial-gradient(circle at 20% 20%, rgba(188, 19, 254, 0.4), transparent 70%)'
                                                : 'radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1), transparent 70%)' }}
                                        />

                                        <div className="relative z-10 flex-1">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                                                    isActive ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(188,19,254,0.4)]' 
                                                             : 'bg-white border-white text-black'
                                                }`}>
                                                    <MdOutlineTableChart size={22} />
                                                </div>
                                                <span className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest ${health > 85 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                                                    {health}% Integrity
                                                </span>
                                            </div>

                                            <div className="mb-4">
                                                <div className="text-xl font-black text-white uppercase tracking-tighter truncate leading-none mb-2">{ds.name}</div>
                                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                                    {ds.rows} Entries • STRM_{ds.id.toString().slice(-4)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/5">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-purple-500 animate-pulse' : 'bg-slate-600'}`} /> Link Active
                                            </span>
                                            <FiTrash2 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setAllDatasets(d => d.filter(x => x.id !== ds.id)); 
                                                    setActiveDatasets(d => d.filter(x => x.id !== ds.id)); 
                                                }} 
                                                className="text-slate-600 hover:text-red-400 transition-colors" 
                                                size={18}
                                            />
                                        </div>
                                        <div className={`absolute bottom-0 left-8 right-8 h-[2px] rounded-t-full ${isActive ? 'bg-purple-500 shadow-[0_0_20px_#bc13fe]' : 'bg-white shadow-[0_0_20px_white]'}`} />
                                    </div>
                                );
                            })}
                            
                            <button 
                                onClick={() => setShowModal(true)}
                                className="h-full min-h-[220px] rounded-[2.5rem] border-2 border-dashed border-white/5 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-purple-400 group"
                            >
                                <div className="p-4 rounded-full border-2 border-dashed border-slate-700 group-hover:border-purple-500/50 transition-all">
                                    <FiPlus size={28} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Initialize Stream</span>
                            </button>
                        </div>

                        {/* Chart / AI Visualizer Area */}
                        <div className="px-6 md:px-12 pb-12">
                            <Visualizer 
                                activeDatasets={activeDatasets} 
                                chartType={chartType} 
                                chartTypeSet={setChartType} 
                                authToken={userToken}
                                onAIUpdate={handleAIUpdate} 
                            />
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className="px-6 md:px-12 pb-12">
                        <div className="text-center py-48 bg-white/[0.01] rounded-[4rem] border border-white/5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-radial-gradient from-purple-500/5 to-transparent opacity-30 pointer-events-none" />
                            <MdOutlineAnalytics size={80} className="mx-auto text-slate-800 mb-8" />
                            <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">No data detected</h3>
                            <p className="text-slate-500 text-lg font-light italic max-w-md mx-auto mb-10">Upload a neural stream to begin deep-sector intelligence analysis.</p>
                            <button 
                                onClick={() => setShowModal(true)} 
                                className="px-12 py-5 bg-purple-600 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(188,19,254,0.4)] transition-all hover:scale-105"
                            >
                                Import Data Stream
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <ImportModal 
                    onClose={() => {
                        setShowModal(false);
                        setSelectedApps([]);
                        setSheetsList([]);
                        setCsvToImport(null);
                        setSelectedSheet("");
                    }} 
                    selectedApps={selectedApps} 
                    setSelectedApps={setSelectedApps} 
                    sheetsList={sheetsList} 
                    selectedSheet={selectedSheet} 
                    setSelectedSheet={setSelectedSheet} 
                    setCsvToImport={setCsvToImport} 
                    csvToImport={csvToImport} 
                    onImport={importSelected} 
                />
            )}
        </div>
    );
}