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

    // --- LOAD SESSION WITH UNIFIED AI NORMALIZATION ---
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
                        aiStorage: globalAiStorage = null,
                        ai_insight: globalAiInsight = null,
                        uiContext 
                    } = res.data.page_state;

                    // Unify global AI payload mapping to support both naming schemas
                    const rawGlobalAi = globalAiStorage || globalAiInsight;
                    const resolvedGlobalAi = rawGlobalAi ? {
                        ...rawGlobalAi,
                        summary: rawGlobalAi.summary || rawGlobalAi["Main Discovery"],
                        root_cause: rawGlobalAi.root_cause || rawGlobalAi["Main Discovery"],
                        risk: rawGlobalAi.risk || rawGlobalAi["Risks to Watch"],
                        opportunity: rawGlobalAi.opportunity || rawGlobalAi["Next Big Move"],
                        action: rawGlobalAi.action || rawGlobalAi["Top Action"],
                        impact: rawGlobalAi.impact || rawGlobalAi["Impact (R)"]
                    } : null;

                    // Bind normalized aiStorage into individual datasets if missing
                    const sanitizedDatasets = loadedDatasets.map(d => {
                        const targetAi = d.aiStorage || d.analysis || resolvedGlobalAi;
                        return {
                            ...d,
                            aiStorage: targetAi ? {
                                ...targetAi,
                                summary: targetAi.summary || targetAi["Main Discovery"],
                                root_cause: targetAi.root_cause || targetAi["Main Discovery"],
                                risk: targetAi.risk || targetAi["Risks to Watch"],
                                opportunity: targetAi.opportunity || targetAi["Next Big Move"],
                                action: targetAi.action || targetAi["Top Action"],
                                impact: targetAi.impact || targetAi["Impact (R)"]
                            } : null
                        };
                    });

                    setAllDatasets(sanitizedDatasets);
                    setChartType(loadedChartType);
                    
                    if (sanitizedDatasets.length > 0) {
                        const active = activeDatasetIds?.length > 0 
                            ? sanitizedDatasets.filter(d => activeDatasetIds.includes(d.id))
                            : [sanitizedDatasets[0]];

                        const finalizedActive = active.map(act => ({
                            ...act,
                            aiStorage: act.aiStorage || resolvedGlobalAi
                        }));

                        setActiveDatasets(finalizedActive);
                        setReadyToVisualize(finalizedActive.filter(d => (d.data && d.data.length > 0) || d.aiStorage));
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
                const currentAiStorage = activeDatasets[0]?.aiStorage || allDatasets.find(d => d.aiStorage)?.aiStorage || null;
                
                const updatedDatasets = allDatasets.map((ds, idx) => 
                    idx === 0 && currentAiStorage ? { ...ds, aiStorage: currentAiStorage } : ds
                );

                const pageState = {
                    allDatasets: updatedDatasets,
                    activeDatasetIds: activeDatasets.map(d => d.id),
                    chartType,
                    aiStorage: currentAiStorage,
                    ai_insight: currentAiStorage, // Sync both keys for cross-page compatibility
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
        // Normalize incoming structure to guarantee matching keys across pages
        const normalizedAi = {
            ...aiData,
            summary: aiData?.summary || aiData?.["Main Discovery"],
            root_cause: aiData?.root_cause || aiData?.["Main Discovery"],
            risk: aiData?.risk || aiData?.["Risks to Watch"],
            opportunity: aiData?.opportunity || aiData?.["Next Big Move"],
            action: aiData?.action || aiData?.["Top Action"],
            impact: aiData?.impact || aiData?.["Impact (R)"]
        };

        const updatedAll = allDatasets.map(ds =>
            ds.id === datasetId
                ? { ...ds, aiStorage: normalizedAi, analysis: normalizedAi, summary: normalizedAi.summary, root_cause: normalizedAi.root_cause, opportunity: normalizedAi.opportunity, action: normalizedAi.action }
                : ds
        );

        const updatedActive = activeDatasets.map(ds =>
            ds.id === datasetId
                ? { ...ds, aiStorage: normalizedAi, analysis: normalizedAi, summary: normalizedAi.summary, root_cause: normalizedAi.root_cause, opportunity: normalizedAi.opportunity, action: normalizedAi.action }
                : ds
        );

        setAllDatasets(updatedAll);
        setActiveDatasets(updatedActive);
        setReadyToVisualize(updatedActive);

        try {
            const pageState = {
                allDatasets: updatedAll,
                activeDatasetIds: updatedActive.map(d => d.id),
                chartType,
                aiStorage: normalizedAi,
                ai_insight: normalizedAi,
                uiContext: { showModal, selectedApps, selectedSheet }
            };

            await axios.post(
                `${API_BASE_URL}/analysis/save`,
                {
                    name: "AI Analysis Update",
                    page_state: pageState
                },
                {
                    headers: { Authorization: `Bearer ${userToken}` }
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
            const activeAi = activeDatasets[0]?.aiStorage || null;
            const pageState = {
                allDatasets,
                activeDatasetIds: activeDatasets.map(d => d.id),
                chartType,
                aiStorage: activeAi,
                ai_insight: activeAi,
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
}