import React, { useState, useEffect } from "react";
import axios from "axios";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { FaSpinner } from 'react-icons/fa';
import { MdOutlineAnalytics, MdOutlineTableChart } from "react-icons/md";
import { FiTrash2, FiPlus, FiActivity } from "react-icons/fi";
import { WorkbenchHeader } from '../components/WorkbenchHeader';
import { Visualizer } from '../components/Visualizer';
import { ImportModal } from '../components/ImportModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";
const AUTH_TOKEN_KEY = "adt_token";

export default function Analytics() {
    const userToken = localStorage.getItem(AUTH_TOKEN_KEY);
    
    const [allDatasets, setAllDatasets] = useState([]);
    const [activeDatasets, setActiveDatasets] = useState([]);
    const [chartType, setChartType] = useState("line");
    const [showModal, setShowModal] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedApps, setSelectedApps] = useState([]);
    const [sheetsList, setSheetsList] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [csvToImport, setCsvToImport] = useState(null);

    const datasetColors = ["#A78BFA", "#22C55E", "#F97316", "#EAB308"];

    const sanitizeCellValue = (value) => {
        if (value === null || value === undefined || value === "") return "";
        const str = String(value).trim();
        const numericValue = Number(str.replace(/,/g, ''));
        return !isNaN(numericValue) && str.length > 0 ? numericValue : str;
    };

    const calculateHealthScore = (dataset) => {
        const rows = dataset.data.slice(1);
        const numericIdx = dataset.numericCols[0];
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
            metrics[colName] = { total, avg: total / (arr.length || 1), max: Math.max(...arr), min: Math.min(...arr), count: arr.length };
        });
        return metrics;
    };

    useEffect(() => {
        const load = async () => {
            if (!userToken) { setIsInitializing(false); return; }
            try {
                const res = await axios.get(`${API_BASE_URL}/analysis/current`, { headers: { Authorization: `Bearer ${userToken}` } });
                if (res.data?.results) {
                    const loaded = res.data.results.allDatasets || [];
                    setAllDatasets(loaded);
                    const config = res.data.results.config || {};
                    setActiveDatasets(loaded.filter(d => config.activeDatasetIds?.includes(d.id)));
                    setChartType(config.chartType || "line");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsInitializing(false);
            }
        };
        load();
    }, [userToken]);

    const handleSave = async () => {
        if (!userToken) return;
        setIsSaving(true);
        try {
            await axios.post(`${API_BASE_URL}/analysis/save`, {
                name: `Session ${new Date().toLocaleDateString()}`,
                source: "Multiple",
                config: { activeDatasetIds: activeDatasets.map(d => d.id), chartType },
                results: { allDatasets }
            }, { headers: { Authorization: `Bearer ${userToken}` } });
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const importSelected = async () => {
        setIsImporting(true);
        setShowModal(false);
        try {
            let importedRows = [];
            let sourceName = "Dataset";
            if (selectedApps.includes("google_sheets") && selectedSheet) {
                const res = await axios.get(`${API_BASE_URL}/google/sheets/${selectedSheet}`, { headers: { Authorization: `Bearer ${userToken}` } });
                if (res.data?.values) importedRows = res.data.values;
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
                };
                setAllDatasets(prev => [...prev, newDataset]);
                setActiveDatasets(prev => [...prev, newDataset]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsImporting(false);
            setSelectedApps([]);
            setCsvToImport(null);
        }
    };

    return (
        <div className="text-slate-200 px-6 md:px-12 pb-12 font-sans selection:bg-purple-500/30">
            {(isInitializing || isImporting) && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617]/95 backdrop-blur-xl">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-purple-500/20 blur-3xl animate-pulse" />
                        <FaSpinner size={60} className="text-purple-500 animate-spin relative" />
                    </div>
                    <p className="text-sm font-black tracking-[0.4em] text-white uppercase animate-pulse">MetriaAI Initializing...</p>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto space-y-10">
                <div className="pt-8">
                    <WorkbenchHeader 
                        isSaving={isSaving} 
                        onImport={() => setShowModal(true)} 
                        onSave={handleSave} 
                        onOpenAI={() => {}} // Disabled logic
                    />
                </div>

                {allDatasets.length > 0 ? (
                    <>
                        <div className="flex items-center gap-4 px-2">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">DataSets</h3>
                            <div className="h-[1px] flex-1 bg-white/5" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {allDatasets.map(ds => {
                                const isActive = activeDatasets.some(a => a.id === ds.id);
                                const health = calculateHealthScore(ds);
                                return (
                                    <div 
                                        key={ds.id} 
                                        onClick={() => setActiveDatasets(prev => isActive ? prev.filter(d => d.id !== ds.id) : [...prev, ds])} 
                                        className={`group relative p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer overflow-hidden ${
                                            isActive 
                                            ? 'bg-[#0F172A] border-purple-500 shadow-[0_20px_50px_rgba(0,0,0,0.4)]' 
                                            : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`p-3 rounded-2xl border transition-all ${isActive ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 text-slate-500 border-white/5'}`}>
                                                <MdOutlineTableChart size={20} />
                                            </div>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${health > 85 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                                                {health}% Dataset Health
                                            </span>
                                        </div>

                                        <div className="mb-4">
                                            <div className="text-lg font-black text-white uppercase tracking-tighter truncate">{ds.name}</div>
                                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-500 mt-1 uppercase tracking-widest">
                                                {ds.rows} Rows • Stream_{ds.id.toString().slice(-4)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <FiActivity className="text-purple-500" /> Live
                                            </span>
                                            <FiTrash2 
                                                onClick={(e) => { e.stopPropagation(); setAllDatasets(d => d.filter(x => x.id !== ds.id)); setActiveDatasets(d => d.filter(x => x.id !== ds.id)); }} 
                                                className="text-slate-600 hover:text-red-400 transition-colors" 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            
                            <button 
                                onClick={() => setShowModal(true)}
                                className="h-full min-h-[180px] rounded-[2rem] border-2 border-dashed border-white/5 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-purple-400"
                            >
                                <FiPlus size={24} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Dataset</span>
                            </button>
                        </div>

                        <Visualizer 
                            activeDatasets={activeDatasets} 
                            chartType={chartType} 
                            setChartType={setChartType} 
                            sanitizeCellValue={sanitizeCellValue} 
                        />
                    </>
                ) : (
                    <div className="text-center py-32 bg-white/[0.01] rounded-[3rem] border border-white/5">
                        <MdOutlineAnalytics size={60} className="mx-auto text-slate-700 mb-6" />
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Command Center Empty</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">Initialize your dataset stream to activate inights.</p>
                        <button onClick={() => setShowModal(true)} className="mt-8 px-10 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-all">Import Stream</button>
                    </div>
                )}
            </div>

            {showModal && (
                <ImportModal 
                    onClose={() => setShowModal(false)} 
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