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
import { FiTrash2, FiPlus, FiCpu } from "react-icons/fi"; 
import { WorkbenchHeader } from '../components/WorkbenchHeader';
import { Visualizer } from '../components/Visualizer';
import { ImportModal } from '../components/ImportModal';
import { MetriaFollowUp } from '../components/MetriaFollowUp';

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
    const [readyToVisualize, setReadyToVisualize] = useState([]); 
    
    // UI Logic State
    const [showModal, setShowModal] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showFloatingBtn, setShowFloatingBtn] = useState(true);

    // Import Flow State
    const [selectedApps, setSelectedApps] = useState([]);
    const [sheetsList, setSheetsList] = useState([]); 
    const [selectedSheet, setSelectedSheet] = useState("");
    const [csvToImport, setCsvToImport] = useState(null);

    // Multi-Dataset & Cross Analysis Choice Modal State
    const [showMultiSelectModal, setShowMultiSelectModal] = useState(false);

    const datasetColors = ["#bc13fe", "#22C55E", "#F97316", "#EAB308"];
    const isFirstMount = useRef(true);
    const metriaRef = useRef(null);
    const hasLoadedSession = useRef(false);

    const scrollToMetria = () => {
        if (metriaRef.current) {
            metriaRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    // IntersectionObserver to hide the floating button when the Metria component is visible
    useEffect(() => {
        const currentMetriaRef = metriaRef.current;
        if (!currentMetriaRef) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowFloatingBtn(!entry.isIntersecting);
            },
            {
                root: null,
                threshold: 0.1, 
            }
        );

        observer.observe(currentMetriaRef);

        return () => {
            if (currentMetriaRef) {
                observer.unobserve(currentMetriaRef);
            }
        };
    }, [activeDatasets]);

    const handleLiveSync = async () => {
        if (!userToken || activeDatasets.length === 0) return;
        
        try {
            const updatedDatasets = await Promise.all(
                activeDatasets.map(async (ds) => {
                    if (ds.id && typeof ds.id === 'string' || ds.id > 1000) { 
                        const endpoint = ds.name.includes("Excel") || ds.id.toString().length > 10
                            ? `${API_BASE_URL}/excel/sheets/${ds.id}`
                            : `${API_BASE_URL}/google/sheets/${ds.id}`;
                            
                        const res = await axios.get(endpoint, { 
                            headers: { Authorization: `Bearer ${userToken}` } 
                        });
                        
                        if (res.data?.values) {
                            const importedRows = res.data.values;
                            const cleaned = importedRows.map((row, idx) => idx === 0 ? row : row.map(sanitizeCellValue));
                            const numeric = detectNumericColumns(cleaned);
                            const category = detectCategoryColumn(cleaned, numeric);
                            
                            const existing = activeDatasets.find(d => d.id === ds.id);
                            
                            return {
                                ...ds,
                                rows: cleaned.length - 1,
                                cols: cleaned[0]?.length || 0,
                                data: cleaned,
                                numericCols: numeric,
                                metrics: computeMetrics(cleaned, numeric),
                                categoryCol: category,
                                aiStorage: existing?.aiStorage || ds.aiStorage || null
                            };
                        }
                    }
                    return ds;
                })
            );

            setActiveDatasets(updatedDatasets);
            setAllDatasets(prev => prev.map(d => {
                const match = updatedDatasets.find(u => u.id === d.id);
                return match ? match : d;
            }));
            
        } catch (e) {
            console.error("Live sync failed:", e);
        }
    };

    useEffect(() => {
        const pollInterval = setInterval(() => {
            handleLiveSync();
        }, 60000);

        return () => clearInterval(pollInterval);
    }, [activeDatasets, userToken]);

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

 useEffect(() => {
        const loadSession = async () => {
            if (!userToken) { setIsInitializing(false); return; }
            try {
                const res = await axios.get(`${API_BASE_URL}/analysis/current`, { 
                    headers: { Authorization: `Bearer ${userToken}` } 
                });
                
                if (res.data?.page_state) {
                    let { 
                        allDatasets: loadedDatasets = [], 
                        activeDatasetIds = [], 
                        chartType: loadedChartType = "line",
                        uiContext 
                    } = res.data.page_state;

                    setAllDatasets(loadedDatasets);
                    setChartType(loadedChartType);
                    
                    if (loadedDatasets.length > 0) {
                        const active = activeDatasetIds?.length > 0 
                            ? loadedDatasets.filter(d => activeDatasetIds.includes(d.id))
                            : [loadedDatasets[0]];

                        setActiveDatasets(active);
                        // Updated check: renders as long as dataset contains rows or aiStorage
                        setReadyToVisualize(active.filter(d => (d.data && d.data.length > 0) || d.aiStorage));
                    }

                    if (uiContext) {
                        setShowModal(!!uiContext.showModal);
                        setSelectedApps(uiContext.selectedApps || []);
                        setSelectedSheet(uiContext.selectedSheet || "");
                    }
                }
                hasLoadedSession.current = true;
            } catch (e) {
                console.error("Session load from database failed:", e);
                hasLoadedSession.current = true;
            } finally {
                setIsInitializing(false);
            }
        };
        loadSession();
    }, [userToken]);

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        const autosave = async () => {
            if (!userToken || isInitializing || !hasLoadedSession.current) return;
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
                console.warn("Database autosave failed", e);
            } finally {
                setIsSaving(false);
            }
        };
        const timer = setTimeout(autosave, 1500); 
        return () => clearTimeout(timer);
    }, [allDatasets, activeDatasets, chartType, showModal, selectedApps, selectedSheet, userToken, isInitializing]);

    // --- ACTIONS ---

    const handleAIUpdate = async (datasetId, aiData) => {
        const updatedAll = allDatasets.map(ds =>
            ds.id === datasetId
                ? { ...ds, aiStorage: aiData }
                : ds
        );

        const updatedActive = activeDatasets.map(ds =>
            ds.id === datasetId
                ? { ...ds, aiStorage: aiData }
                : ds
        );

        // Update React state
        setAllDatasets(updatedAll);
        setActiveDatasets(updatedActive);
        setReadyToVisualize(updatedActive);

        // Persist directly to database via API
        try {
            await axios.post(
                `${API_BASE_URL}/analysis/save`,
                {
                    name: "AI Analysis Update",
                    page_state: {
                        allDatasets: updatedAll,
                        activeDatasetIds: updatedActive.map(d => d.id),
                        chartType,
                        uiContext: {
                            showModal,
                            selectedApps,
                            selectedSheet
                        }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                }
            );

            console.log("AI analysis persisted to database successfully.");
        } catch (err) {
            console.error("Failed to persist AI analysis to database:", err.response?.data || err);
        }
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
            alert("Workspace snapshot saved to database!");
        } catch (e) {
            alert("Save failed.");
        } finally {
            setIsSaving(false);
        }
    };

    const importSelected = async (manualIds = [], manualNames = []) => {
        setIsImporting(true);
        try {
            let newlyImported = [];

            if (selectedApps.includes("google_sheets") && Array.isArray(manualIds)) {
                const importPromises = manualIds.map(async (id, index) => {
                    const res = await axios.get(`${API_BASE_URL}/google/sheets/${id}`, { 
                        headers: { Authorization: `Bearer ${userToken}` } 
                    });
                    
                    if (res.data?.values) {
                        const importedRows = res.data.values;
                        const sourceName = manualNames[index] || res.data.title || "Neural Stream";
                        const cleaned = importedRows.map((row, idx) => idx === 0 ? row : row.map(sanitizeCellValue));
                        const numeric = detectNumericColumns(cleaned);
                        const category = detectCategoryColumn(cleaned, numeric);
                        
                        const existingMatch = allDatasets.find(d => d.id === id);

                        return {
                            id: id || Date.now() + index,
                            name: sourceName,
                            color: datasetColors[(allDatasets.length + index) % datasetColors.length],
                            rows: cleaned.length - 1,
                            cols: cleaned[0]?.length || 0,
                            data: cleaned,
                            numericCols: numeric,
                            metrics: computeMetrics(cleaned, numeric),
                            categoryCol: category,
                            aiStorage: existingMatch?.aiStorage || null
                        };
                    }
                    return null;
                });
    
                newlyImported = (await Promise.all(importPromises)).filter(ds => ds !== null);
            } 
            else if (selectedApps.includes("excel") && Array.isArray(manualIds)) {
                const importPromises = manualIds.map(async (id, index) => {
                    const res = await axios.get(`${API_BASE_URL}/excel/sheets/${id}`, { 
                        headers: { Authorization: `Bearer ${userToken}` } 
                    });
                    
                    if (res.data?.values) {
                        const importedRows = res.data.values;
                        const sourceName = manualNames[index] || "Excel Stream";
                        const cleaned = importedRows.map((row, idx) => idx === 0 ? row : row.map(sanitizeCellValue));
                        const numeric = detectNumericColumns(cleaned);
                        const category = detectCategoryColumn(cleaned, numeric);
                        
                        const existingMatch = allDatasets.find(d => d.id === id);

                        return {
                            id: id || Date.now() + index,
                            name: sourceName,
                            color: datasetColors[(allDatasets.length + index) % datasetColors.length],
                            rows: cleaned.length - 1,
                            cols: cleaned[0]?.length || 0,
                            data: cleaned,
                            numericCols: numeric,
                            metrics: computeMetrics(cleaned, numeric),
                            categoryCol: category,
                            aiStorage: existingMatch?.aiStorage || null
                        };
                    }
                    return null;
                });
    
                newlyImported = (await Promise.all(importPromises)).filter(ds => ds !== null);
            }
            else if (selectedApps.includes("other") && csvToImport) {
                const sourceName = csvToImport.name.replace(/\.csv$/i,"");
                const importedRows = await parseCSVFile(csvToImport);
                
                if (importedRows.length > 0) {
                    const cleaned = importedRows.map((row, idx) => idx === 0 ? row : row.map(sanitizeCellValue));
                    const numeric = detectNumericColumns(cleaned);
                    const category = detectCategoryColumn(cleaned, numeric);
                    
                    const existingMatch = allDatasets.find(d => d.name === sourceName);

                    newlyImported = [{
                        id: existingMatch?.id || Date.now(),
                        name: sourceName,
                        color: datasetColors[allDatasets.length % datasetColors.length],
                        rows: cleaned.length - 1,
                        cols: cleaned[0]?.length || 0,
                        data: cleaned,
                        numericCols: numeric,
                        metrics: computeMetrics(cleaned, numeric),
                        categoryCol: category,
                        aiStorage: existingMatch?.aiStorage || null
                    }];
                }
            }

            if (newlyImported.length > 0) {
                setAllDatasets(prev => {
                    const map = new Map(prev.map(d => [d.id, d]));
                    newlyImported.forEach(d => {
                        const old = map.get(d.id);
                        if (old && !d.aiStorage) d.aiStorage = old.aiStorage;
                        map.set(d.id, d);
                    });
                    return Array.from(map.values());
                });
                
                setActiveDatasets(prev => {
                    const map = new Map(prev.map(d => [d.id, d]));
                    newlyImported.forEach(d => {
                        const old = map.get(d.id);
                        if (old && !d.aiStorage) d.aiStorage = old.aiStorage;
                        map.set(d.id, d);
                    });
                    const combinedActive = Array.from(map.values());
                    
                    if (combinedActive.length > 1) {
                        setShowMultiSelectModal(true);
                    }
                    return combinedActive;
                });

                setReadyToVisualize(prev => {
                    const combined = [...prev, ...newlyImported];
                    return Array.from(new Set(combined));
                });
            }
    
            setShowModal(false); 
        } catch (e) {
            console.error("Import error:", e);
            alert("Import failed.");
        } finally {
            setIsImporting(false);
            setSelectedApps([]);
            setCsvToImport(null);
            setSelectedSheet("");
        }
    };

    const handleDatasetToggle = (datasetToToggle) => {
        let shouldAnalyze = false;

        setActiveDatasets(prevActive => {
            const exists = prevActive.some(d => d.id === datasetToToggle.id);
            let updated;
            
            if (exists) {
                updated = prevActive.filter(d => d.id !== datasetToToggle.id);
            } else {
                const masterRecord = allDatasets.find(d => d.id === datasetToToggle.id);
                const datasetToAdd = masterRecord || datasetToToggle;
                updated = [...prevActive, datasetToAdd];
                
                if (!datasetToAdd.aiStorage) {
                    shouldAnalyze = datasetToAdd;
                }
            }
            
            if (updated.length > 1) {
                setShowMultiSelectModal(true);
            }

            setReadyToVisualize(updated);
            return updated;
        });

        if (shouldAnalyze) {
            executeSingleAnalysisFlow(shouldAnalyze);
        }
    };

    const executeSingleAnalysisFlow = async (dataset) => {
        setIsInitializing(true);
        try {
            const rawRows = dataset.data || dataset.rows || [];
            const formattedContext = rawRows.map(row => {
                if (Array.isArray(row)) {
                    return row.reduce((acc, val, i) => ({ ...acc, [`col_${i}`]: val }), {});
                }
                return row;
            });

            const payload = { contexts: [formattedContext] };
            const res = await axios.post(`${API_BASE_URL}/ai/analyze`, payload, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            handleAIUpdate(dataset.id, res.data);
        } catch (err) {
            console.error("Single analysis flow failed:", err);
        } finally {
            setIsInitializing(false);
        }
    };

    const handleCrossAnalysisSubmit = async () => {
        setShowMultiSelectModal(false);
        setIsInitializing(true); 

        try {
            const datasetContexts = activeDatasets.map(d => {
                const rawRows = d.data || d.rows || d.values || d.content || [];
                return rawRows.map(row => {
                    if (Array.isArray(row)) {
                        return row.reduce((acc, val, i) => ({ ...acc, [`col_${i}`]: val }), {});
                    }
                    return row;
                });
            }).filter(stream => stream.length > 0);

            const payload = { contexts: datasetContexts };

            const res = await axios.post(`${API_BASE_URL}/ai/analyze`, payload, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            const analysisResult = res.data;
            const totalRows = datasetContexts.reduce((acc, curr) => acc + curr.length, 0);

            const unifiedDataset = {
                id: `cross-${Date.now()}`,
                name: `Cross-Analysis (${activeDatasets.map(d => d.name).join(' + ')})`,
                rows: totalRows,
                metrics: analysisResult.metrics || activeDatasets[0]?.metrics || {},
                data: datasetContexts.flat(),
                aiStorage: analysisResult, 
                analysis: analysisResult,
                summary: analysisResult.summary,
                root_cause: analysisResult.root_cause,
                opportunity: analysisResult.opportunity,
                action: analysisResult.action
            };

            setAllDatasets(prev => [
                ...prev.filter(d => d.id !== unifiedDataset.id),
                unifiedDataset
            ]);

            setActiveDatasets([unifiedDataset]);
            setReadyToVisualize([unifiedDataset]);
        } catch (err) {
            console.error("Cross-analysis synthesis failed:", err.response?.data || err);
        } finally {
            setIsInitializing(false); 
        }
    };

    return (
        <div className="bg-black text-slate-200 w-full min-h-screen font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
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

            <div className="w-full">
                <div className="pt-8 px-6 lg:px-10">
                    <WorkbenchHeader 
                        isSaving={isSaving} 
                        onImport={() => setShowModal(true)} 
                        onSave={handleSave} 
                        onOpenAI={() => {}} 
                    />
                </div>

                {allDatasets.length > 0 ? (
                    <div className="mt-12 space-y-12">
                        <div className="flex items-center gap-6 px-6 lg:px-10">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.8em] whitespace-nowrap">Neural Streams</h3>
                            <div className="h-[1px] flex-1 bg-white/5" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 lg:px-10">
                            {allDatasets.map(ds => {
                                const isActive = activeDatasets.some(a => a.id === ds.id);
                                const health = calculateHealthScore(ds);
                                return (
                                    <div 
                                        key={ds.id} 
                                        onClick={() => handleDatasetToggle(ds)}
                                        className={`group relative overflow-hidden border rounded-[2rem] p-8 transition-all duration-500 cursor-pointer flex flex-col min-h-[220px] ${
                                            isActive 
                                            ? 'bg-purple-900/20 border-purple-500/40 shadow-[0_0_50px_rgba(188,19,254,0.1)] scale-[1.02]' 
                                            : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                                        }`} 
                                    >
                                        <div className="absolute inset-0 opacity-40 pointer-events-none"
                                            style={{ background: isActive 
                                                ? 'radial-gradient(circle at 10% 10%, rgba(188, 19, 254, 0.3), transparent 80%)'
                                                : 'radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.05), transparent 80%)' }}
                                        />
                                        <div className="relative z-10 flex-1">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                                                    isActive ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/20' 
                                                             : 'bg-white border-white text-black'
                                                }`}>
                                                    <MdOutlineTableChart size={22} />
                                                </div>
                                                <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${health > 85 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                                                    {health}% Integrity
                                                </span>
                                            </div>
                                            <div className="mb-2">
                                                <div className="text-xl font-black text-white uppercase tracking-tighter truncate leading-tight mb-1">{ds.name}</div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                                                    {ds.rows} Active Nodes
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative z-10 flex items-center justify-between pt-5 border-t border-white/5">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-purple-500 animate-pulse' : 'bg-slate-700'}`} /> {isActive ? 'Broadcasting' : 'Standby'}
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
                                    </div>
                                );
                            })}
                            <button 
                                onClick={() => setShowModal(true)}
                                className="h-full min-h-[220px] rounded-[2rem] border-2 border-dashed border-white/5 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-4 text-slate-600 hover:text-purple-400 group cursor-pointer"
                            >
                                <div className="p-4 rounded-full border-2 border-dashed border-slate-800 group-hover:border-purple-500/50 transition-all">
                                    <FiPlus size={28} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.5em]">Sync Stream</span>
                            </button>
                        </div>

                        {readyToVisualize.length > 0 && (
                            <div className="px-6 lg:px-10 pb-12">
                                <Visualizer 
                                    activeDatasets={activeDatasets} 
                                    readyDatasets={readyToVisualize}
                                    chartType={chartType} 
                                    chartTypeSet={setChartType} 
                                    authToken={userToken}
                                    onUpdateAI={handleAIUpdate} 
                                />
                            </div>
                        )}
                        
                        {activeDatasets.length > 0 && activeDatasets.some(ds => ds?.aiStorage) && (
                            <div ref={metriaRef}>
                                <MetriaFollowUp 
                                    activeDataset={activeDatasets.find(ds => ds?.aiStorage) || activeDatasets[0]} 
                                    authToken={userToken} 
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="px-6 lg:px-10 pb-12 mt-12">
                        <div className="text-center py-52 bg-white/[0.01] border-y border-white/5 relative overflow-hidden rounded-[3rem]">
                            <div className="absolute inset-0 bg-radial-gradient from-purple-500/10 to-transparent opacity-40 pointer-events-none" />
                            <MdOutlineAnalytics size={100} className="mx-auto text-slate-900 mb-8" />
                            <h3 className="text-5xl font-black text-white uppercase tracking-tighter mb-6">Neural Link Disconnected</h3>
                            <button 
                                onClick={() => setShowModal(true)} 
                                className="px-16 py-6 bg-purple-600 text-white rounded-full font-black text-xs uppercase tracking-[0.6em] transition-all hover:scale-105 shadow-2xl shadow-purple-500/20 cursor-pointer"
                            >
                                Initialize Stream
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {activeDatasets.length > 0 && activeDatasets.some(ds => ds?.aiStorage) && (
                <button
                    onClick={scrollToMetria}
                    className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white p-4 rounded-full shadow-[0_0_25px_rgba(168,85,247,0.5)] flex items-center gap-3 font-black text-xs uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 border border-purple-400/30 cursor-pointer ${
                        showFloatingBtn ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                >
                    <div className="p-1.5 bg-white/20 rounded-full">
                        <FiCpu size={18} className="animate-pulse" />
                    </div>
                    <span className="hidden sm:inline pr-1">Ask Metria</span>
                </button>
            )}

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
                    setSheetsList={setSheetsList}
                    selectedSheet={selectedSheet} 
                    setSelectedSheet={setSelectedSheet} 
                    setCsvToImport={setCsvToImport} 
                    csvToImport={csvToImport} 
                    onImport={(ids, names) => importSelected(ids, names)} 
                />
            )}
            
            {showMultiSelectModal && (
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0a0612] border border-purple-500/30 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative">
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Multiple Datasets Active</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            You have selected <span className="text-purple-400 font-bold">{activeDatasets.length} datasets</span>. How would you like the Neural Engine to proceed?
                        </p>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={handleCrossAnalysisSubmit}
                                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-left transition-all shadow-lg shadow-purple-500/20 flex flex-col cursor-pointer"
                            >
                                <span className="text-sm uppercase tracking-wider">Option 1: Run Cross-Analysis</span>
                                <span className="text-xs text-purple-200 font-normal mt-1">Correlate metrics and generate a unified multi-stream strategy.</span>
                            </button>

                            <button 
                                onClick={() => {
                                    setShowMultiSelectModal(false);
                                    executeSingleAnalysisFlow(activeDatasets[0]);
                                }}
                                className="w-full py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-left transition-all flex flex-col cursor-pointer"
                            >
                                <span className="text-sm uppercase tracking-wider">Option 2: Analyze Individually</span>
                                <span className="text-xs text-gray-400 font-normal mt-1">Run standard deep-dive on the primary active dataset.</span>
                            </button>
                        </div>

                        <button 
                            onClick={() => setShowMultiSelectModal(false)}
                            className="mt-6 w-full text-center text-xs text-gray-500 hover:text-gray-300 uppercase tracking-widest font-bold cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}