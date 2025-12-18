import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { FaSpinner } from 'react-icons/fa';
import { MdOutlineAnalytics, MdOutlineTableChart } from "react-icons/md";
import { FiTrash2, FiPlus, FiActivity, FiTrendingUp, FiHash, FiBarChart2, FiEye, FiZap } from "react-icons/fi";
import { Pie } from 'react-chartjs-2';

import { WorkbenchHeader } from '../components/WorkbenchHeader';
import { Visualizer } from '../components/Visualizer';
import { ImportModal } from '../components/ImportModal';
import { AIAnalysisPanel } from '../components/AIAnalysisPanel';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

export default function Analytics() {
    const userToken = localStorage.getItem("adt_token");
    
    // Core State
    const [allDatasets, setAllDatasets] = useState([]);
    const [activeDatasets, setActiveDatasets] = useState([]);
    const [savedInsights, setSavedInsights] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Import Params
    const [selectedApps, setSelectedApps] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [csvToImport, setCsvToImport] = useState(null);

    // --- LOGIC: Data Processing & Categorical Identification ---

    const sanitizeCellValue = (value) => {
        if (value === null || value === undefined || value === "") return "";
        const str = String(value).trim();
        const numericValue = Number(str.replace(/,/g, ''));
        return !isNaN(numericValue) && str.length > 0 ? numericValue : str;
    };

    const getCategoricalData = (dataset) => {
        const headers = dataset.data[0];
        const rows = dataset.data.slice(1);
        
        // Find a column that isn't numeric and has repeating values
        const catColIdx = headers.findIndex((_, idx) => {
            const sample = rows.slice(0, 10).map(r => sanitizeCellValue(r[idx]));
            return sample.some(v => typeof v === 'string' && v.length > 0);
        });

        if (catColIdx === -1) return null;

        const counts = {};
        rows.forEach(row => {
            const val = row[catColIdx] || "Unknown";
            counts[val] = (counts[val] || 0) + 1;
        });

        return {
            label: headers[catColIdx],
            labels: Object.keys(counts),
            values: Object.values(counts)
        };
    };

    const globalAggregates = useMemo(() => {
        if (activeDatasets.length === 0) return { totalRecords: 0, totalSum: 0, avgValue: 0 };
        let records = 0; let sum = 0;
        activeDatasets.forEach(ds => {
            records += ds.rows;
            Object.values(ds.metrics).forEach(m => sum += m.total);
        });
        return { totalRecords: records, totalSum: sum, avgValue: sum / (records || 1) };
    }, [activeDatasets]);

    const importSelected = async () => {
        setIsImporting(true);
        setShowModal(false);
        try {
            let importedRows = [];
            let name = "Stream_" + Date.now().toString().slice(-4);
            
            if (selectedApps.includes("google_sheets") && selectedSheet) {
                const res = await axios.get(`${API_BASE_URL}/google/sheets/${selectedSheet}`, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                importedRows = res.data.values;
            } else if (selectedApps.includes("other") && csvToImport) {
                const text = await csvToImport.text();
                importedRows = text.split(/\r?\n/).filter(Boolean).map(r => r.split(","));
                name = csvToImport.name;
            }

            if (importedRows.length > 0) {
                const cleaned = importedRows.map((row, idx) => idx === 0 ? row : row.map(sanitizeCellValue));
                const headers = cleaned[0];
                const numericIdxs = headers.map((_, i) => {
                    const sample = cleaned.slice(1, 6).map(r => sanitizeCellValue(r[i]));
                    return sample.some(v => typeof v === "number") ? i : null;
                }).filter(v => v !== null);

                const metrics = {};
                numericIdxs.forEach(idx => {
                    const vals = cleaned.slice(1).map(r => sanitizeCellValue(r[idx])).filter(v => typeof v === 'number');
                    metrics[headers[idx]] = { total: vals.reduce((a,b) => a+b, 0), count: vals.length };
                });

                const newDs = { id: Date.now(), name, rows: cleaned.length - 1, data: cleaned, metrics, numericCols: numericIdxs };
                setAllDatasets(p => [...p, newDs]);
                setActiveDatasets(p => [...p, newDs]);
            }
        } catch (e) { console.error(e); } finally { setIsImporting(false); }
    };

    return (
        <div className="bg-[#0A0B14] min-h-screen text-slate-200 font-sans selection:bg-pink-500/30">
            {isImporting && <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center"><FaSpinner size={50} className="animate-spin text-pink-500" /></div>}
            
            <div className="max-w-[1600px] mx-auto p-8 space-y-10">
                <WorkbenchHeader onImport={() => setShowModal(true)} onOpenAI={() => setIsAnalysisPanelOpen(true)} />

                {/* METRICS & AGGREGATES SECTION (Reference: Top Row of Screenshot) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-8 rounded-[2.5rem] shadow-xl">
                        <div className="text-[11px] font-black uppercase tracking-widest text-purple-200 opacity-70">Total Records</div>
                        <div className="text-4xl font-black mt-2">{globalAggregates.totalRecords.toLocaleString()}</div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500 to-cyan-700 p-8 rounded-[2.5rem] shadow-xl">
                        <div className="text-[11px] font-black uppercase tracking-widest text-cyan-100 opacity-70">Aggregate Sum</div>
                        <div className="text-4xl font-black mt-2">{globalAggregates.totalSum.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#161927] p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Active Streams</div>
                            <div className="text-3xl font-black mt-1 text-white">{activeDatasets.length}</div>
                        </div>
                        <FiActivity className="text-pink-500" size={30} />
                    </div>
                    <div className="bg-[#161927] p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Calculations</div>
                            <div className="text-3xl font-black mt-1 text-white">{globalAggregates.avgValue.toFixed(1)} <span className="text-xs text-slate-500 italic">avg</span></div>
                        </div>
                        <FiTrendingUp className="text-emerald-400" size={30} />
                    </div>
                </div>

                {/* VISUALIZATION GRID (Categorical Pie Charts + Insights Table) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Categorical Distribution Pie Charts */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {activeDatasets.slice(0, 2).map(ds => {
                            const cat = getCategoricalData(ds);
                            if (!cat) return null;
                            return (
                                <div key={ds.id} className="bg-[#11131F] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                                        Distribution: {cat.label}
                                    </h4>
                                    <div className="h-64 flex items-center justify-center">
                                        <Pie data={{
                                            labels: cat.labels,
                                            datasets: [{
                                                data: cat.values,
                                                backgroundColor: ['#A855F7', '#06B6D4', '#F43F5E', '#10B981'],
                                                borderWidth: 0,
                                            }]
                                        }} options={{ plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 10, weight: 'bold' } } } }, cutout: '70%' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* AI Insights Ledger / History (Sidebar style like screenshot) */}
                    <div className="bg-[#11131F] rounded-[3rem] border border-white/5 p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Neural_History</h3>
                            <FiZap className="text-pink-500" />
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {savedInsights.length > 0 ? savedInsights.map(log => (
                                <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-pink-500/30 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-mono text-pink-500">{log.timestamp}</span>
                                        <div className="h-1 w-8 bg-pink-500/20 rounded-full overflow-hidden"><div className="h-full bg-pink-500 w-full" /></div>
                                    </div>
                                    <p className="text-[11px] text-slate-300 italic line-clamp-2">"{log.summary}"</p>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                    <MdOutlineAnalytics size={40} />
                                    <p className="text-[10px] uppercase font-black mt-2">No past analyses</p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsAnalysisPanelOpen(true)} className="mt-8 w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest">Open AI Analyst</button>
                    </div>
                </div>

                <Visualizer activeDatasets={activeDatasets} sanitizeCellValue={sanitizeCellValue} />
            </div>

            {showModal && (
                <ImportModal onClose={() => setShowModal(false)} selectedApps={selectedApps} setSelectedApps={setSelectedApps} selectedSheet={selectedSheet} setSelectedSheet={setSelectedSheet} setCsvToImport={setCsvToImport} csvToImport={csvToImport} onImport={importSelected} />
            )}

            <AIAnalysisPanel 
                isOpen={isAnalysisPanelOpen} 
                onClose={() => setIsAnalysisPanelOpen(false)} 
                datasets={activeDatasets} 
                onSaveInsight={(ins) => setSavedInsights(p => [{id: Date.now(), timestamp: new Date().toLocaleTimeString(), ...ins}, ...p])} 
            />
        </div>
    );
}