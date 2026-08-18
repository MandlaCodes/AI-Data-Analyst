/**
 * components/Visualizer.js - PRODUCTION EXECUTIVE VERSION (MULTI-STREAM ENABLED)
 * Flow: Multi-AI Insights -> Stream Selector -> Unified Table -> Cross-Stream Analytics
 */
import React, { useMemo, useState, useEffect } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { 
  FiDownload, FiArrowUp, FiDatabase, FiPieChart, 
  FiBarChart2, FiTrendingUp, FiTrendingDown, 
  FiMaximize2, FiX, FiRefreshCw, FiTable, FiCpu, FiLayers
} from "react-icons/fi";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AIAnalysisPanel from "./AIAnalysisPanel";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const COLORS = ["#00F2FF", "#7000FF", "#FF007A", "#ADFF2F", "#FF8A00", "#00FF94"];

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (s.includes('/') || (s.includes('-') && s.split('-').length > 2)) return null;
  const cleaned = s.replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === ".") return null;
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
        legend: { display: false }, 
        tooltip: { 
            backgroundColor: '#09090b', 
            padding: 12, 
            cornerRadius: 12,
            borderColor: '#27272a', 
            borderWidth: 1,
            titleFont: { size: 11, weight: 'bold' },
            bodyFont: { size: 10, family: 'monospace' },
            displayColors: true, 
            boxPadding: 6
        } 
    },
    scales: {
      y: { 
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false }, 
        ticks: { color: '#71717a', font: { size: 9, weight: 'bold', family: 'monospace' }, padding: 8 } 
      },
      x: { 
        grid: { display: false }, 
        ticks: { 
          color: '#a1a1aa', 
          font: { size: 9, weight: '600', family: 'sans-serif' }, 
          autoSkip: false,
          maxRotation: 45,
          minRotation: 25,
          padding: 8
        } 
      }
    }
};

export const Visualizer = ({ activeDatasets = [], chartType = "bar", authToken, onAIUpdate }) => {
  const [readyStates, setReadyStates] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [flash, setFlash] = useState(false);
  const [localChartTypes, setLocalChartTypes] = useState({});
  const [expandedChart, setExpandedChart] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); 

  const isMultiStream = activeDatasets.length > 1;

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updatedReady = {};
    activeDatasets.forEach(ds => { if (ds.aiStorage) updatedReady[ds.id] = true; });
    setReadyStates(updatedReady);
  }, [activeDatasets]);

  const handleAIComplete = (id, aiData) => {
    setReadyStates(prev => ({ ...prev, [id]: true }));
    if (onAIUpdate) onAIUpdate(id, aiData);
  };

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const toggleLocalChartType = (datasetId, colName) => {
    const key = `${datasetId}-${colName}`;
    setLocalChartTypes(prev => ({ ...prev, [key]: prev[key] === "bar" ? "line" : "bar" }));
  };

  const handleExport = async (id, name) => {
    setFlash(true); 
    setTimeout(() => setFlash(false), 150);
    const element = document.getElementById(`report-${id}`);
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#000000', logging: false, useCORS: true });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`Strategic_Report_${name}.pdf`);
  };

  // Parse individual datasets
  const parsed = useMemo(() => {
    return activeDatasets.map(ds => {
      const columns = Array.isArray(ds.data?.[0]) ? ds.data[0] : Object.keys(ds.data?.[0] || {});
      const rows = Array.isArray(ds.data?.[0]) 
        ? ds.data.slice(1).map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]])))
        : ds.data || [];
        
      const labelCol = columns.find(col => {
          const cLower = col.toLowerCase();
          if (cLower.includes('value') || cLower.includes('amount') || cLower.includes('price') || cLower.includes('cost') || cLower.includes('total') || cLower.includes('revenue')) return false;
          return cLower.includes('name') || cLower.includes('product') || cLower.includes('item') || cLower.includes('deal') || cLower.includes('client') || cLower.includes('company') || cLower.includes('rep') || cLower.includes('title') || cLower.includes('id');
      }) || columns.find(col => {
          const cLower = col.toLowerCase();
          return cLower.includes('date') || cLower.includes('time');
      }) || columns[0];

      const isDateLabel = labelCol.toLowerCase().includes('date') || labelCol.toLowerCase().includes('time');

      const analysis = columns.map(col => {
        const numeric = rows.map(r => toNumber(r[col])).filter(v => v !== null);
        const isDateCol = col.toLowerCase().includes('date') || col.toLowerCase().includes('time');
        const isNumeric = numeric.length > 0 && col !== labelCol && !isDateCol;
        let stats = null;
        if (isNumeric) {
            const mid = Math.floor(numeric.length / 2);
            const firstHalf = numeric.slice(0, mid);
            const secondHalf = numeric.slice(mid);
            const avg1 = firstHalf.reduce((a,b)=>a+b,0) / (firstHalf.length || 1);
            const avg2 = secondHalf.reduce((a,b)=>a+b,0) / (secondHalf.length || 1);
            const trendVal = avg1 === 0 ? 0 : ((avg2 - avg1) / avg1) * 100;
            stats = {
                avg: numeric.reduce((a,b)=>a+b,0) / numeric.length,
                min: Math.min(...numeric), max: Math.max(...numeric), sum: numeric.reduce((a,b)=>a+b,0),
                trend: Math.abs(trendVal).toFixed(1), trendDir: trendVal >= 0 ? 'up' : 'down'
            };
        }
        const freq = {};
        if (!isNumeric) {
            rows.forEach(r => { const val = r[col] || "N/A"; freq[val] = (freq[val] || 0) + 1; });
        }
        return { col, isNumeric, numeric, stats, freq };
      });

      return { 
        ...ds, 
        rows, 
        columns, 
        analysis, 
        labelCol,
        isDateLabel,
        labels: rows.map(r => r[labelCol] || "N/A") 
      };
    });
  }, [activeDatasets, refreshKey]);

  // Combined Multi-Stream Dataset for Cross Analysis View
  const multiStreamCombined = useMemo(() => {
    if (!isMultiStream) return null;
    const combinedRows = [];
    const baseColumns = parsed[0]?.columns || [];
    
    parsed.forEach((ds, idx) => {
      ds.rows.forEach(r => {
        const rowArr = baseColumns.map(c => r[c] || "N/A");
        combinedRows.push([`Stream_${idx+1}: ${ds.name}`, ...rowArr]);
      });
    });

    const columns = ["Stream_Source", ...baseColumns];
    const rows = combinedRows.map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
    const labels = rows.map((_, i) => `Record #${i+1}`);

    return { name: `Cross-Stream Workspace (${activeDatasets.length} Sources)`, columns, rows, labels };
  }, [parsed, isMultiStream, activeDatasets.length]);

  if (activeDatasets.length === 0) return null;

  return (
    <div key={refreshKey} className="mt-10 md:mt-16 space-y-16 pb-32 max-w-[1600px] mx-auto px-4 md:px-10">
      {flash && <div className="fixed inset-0 z-[9999] bg-white pointer-events-none" />}
      
      {/* 1. TOP AI ANALYSIS RUN (SUPPORTS MULTI-STREAM OR SINGLE) */}
      <section className="scroll-mt-28">
          <div className="mb-6 flex items-center gap-4">
             <div className="h-[1px] flex-1 bg-white/10" />
             <div className="flex items-center gap-2">
                {isMultiStream ? <FiLayers className="text-[#00F2FF] animate-bounce" /> : <FiCpu className="text-[#a5b4fc] animate-pulse" />}
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">
                    {isMultiStream ? `Cross-Stream Intelligence Workspace (${activeDatasets.length} Streams Active)` : `Live Analysis: ${parsed[0]?.name || "Active Session"}`}
                </span>
             </div>
             <div className="h-[1px] flex-1 bg-white/10" />
          </div>
          <AIAnalysisPanel datasets={isMultiStream ? [multiStreamCombined] : parsed} onUpdateAI={handleAIComplete} />
      </section>

      {/* MULTI-STREAM HYBRID SUMMARY VIEW OR INDIVIDUAL BREAKDOWNS */}
      {isMultiStream ? (
        <div className="space-y-12 md:space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-1000" id="report-multi-stream">
            
            {/* MULTI-STREAM IDENTITY HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-10 gap-8">
                <div className="max-w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-[#00F2FF]/10 rounded-xl border border-[#00F2FF]/20">
                      <FiLayers className="text-[#00F2FF] w-5 h-5" />
                    </div>
                    <h3 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.6em]">Multi_Stream_Cross_Correlation_Active</h3>
                  </div>
                  <h2 className="text-4xl sm:text-6xl md:text-7xl font-[1000] text-white uppercase tracking-tighter italic leading-none break-words">
                    Cross-Stream Workspace
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {activeDatasets.map((ds, idx) => (
                      <span key={ds.id} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-zinc-400">
                        Stream {idx + 1}: <strong className="text-white">{ds.name}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex w-full md:w-auto gap-4">
                  <button onClick={handleRefresh} className="flex-1 md:flex-none p-5 bg-zinc-900/50 border border-white/10 text-white rounded-2xl hover:bg-zinc-800 transition-all">
                    <FiRefreshCw className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleExport("multi-stream", "Cross_Stream_Workspace")} className="flex-[3] md:flex-none flex items-center justify-center gap-4 px-8 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-xl">
                    <FiDownload className="w-5 h-5" /> Export Cross-Report
                  </button>
                </div>
            </div>

            {/* UNIFIED MULTI-STREAM TABLE */}
            <div className="bg-[#0a0a0f] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <FiTable className="text-zinc-500 w-4 h-4" />
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest italic">Combined_Multi_Stream_Registry</span>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-600 font-mono uppercase tracking-widest">{multiStreamCombined.rows.length} Total Consolidated Rows</span>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="sticky top-0 bg-[#0a0a0f] z-10">
                            <tr className="bg-black/60 backdrop-blur-md">
                                {multiStreamCombined.columns.map(col => (
                                    <th key={col} className="px-8 py-5 text-[10px] font-black text-white/70 uppercase tracking-wider border-b border-white/5">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {multiStreamCombined.rows.map((row, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                    {multiStreamCombined.columns.map(col => (
                                        <td key={col} className={`px-8 py-4 text-[11px] font-medium font-mono truncate max-w-[200px] ${col === 'Stream_Source' ? 'text-[#00F2FF] font-bold' : 'text-zinc-400 group-hover:text-white'} transition-colors`}>
                                            {row[col]}
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
        /* STANDARD SINGLE DATASET VIEW */
        parsed.map(ds => {
          const numericCols = ds.analysis.filter(c => c.isNumeric);
          const categoricalCols = ds.analysis.filter(c => !c.isNumeric && Object.keys(c.freq).length > 1 && Object.keys(c.freq).length < 15);
          if (!readyStates[ds.id]) return null;

          return (
            <div key={ds.id} className="space-y-12 md:space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-1000" id={`report-${ds.id}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-10 gap-8">
                  <div className="max-w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-[#7000FF]/10 rounded-xl border border-[#7000FF]/20">
                        <FiDatabase className="text-[#7000FF] w-5 h-5" />
                      </div>
                      <h3 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.6em]">System_Source_Verified</h3>
                    </div>
                    <h2 className="text-5xl sm:text-6xl md:text-8xl font-[1000] text-white uppercase tracking-tighter italic leading-none break-words">
                      {ds.name}
                    </h2>
                  </div>
                  
                  <div className="flex w-full md:w-auto gap-4">
                    <button onClick={handleRefresh} className="flex-1 md:flex-none p-5 bg-zinc-900/50 border border-white/10 text-white rounded-2xl hover:bg-zinc-800 transition-all">
                      <FiRefreshCw className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleExport(ds.id, ds.name)} className="flex-[3] md:flex-none flex items-center justify-center gap-4 px-8 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-xl">
                      <FiDownload className="w-5 h-5" /> Download Report
                    </button>
                  </div>
              </div>

              {/* LIVE TABLE */}
              <div className="bg-[#0a0a0f] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                  <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                          <FiTable className="text-zinc-500 w-4 h-4" />
                          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest italic">Full_Dataset_Records</span>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-600 font-mono uppercase tracking-widest">{ds.rows.length} Total Records Found</span>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead className="sticky top-0 bg-[#0a0a0f] z-10">
                              <tr className="bg-black/60 backdrop-blur-md">
                                  {ds.columns.map(col => (
                                      <th key={col} className="px-8 py-5 text-[10px] font-black text-white/70 uppercase tracking-wider border-b border-white/5">{col}</th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.03]">
                              {ds.rows.map((row, i) => (
                                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                      {ds.columns.map(col => (
                                          <td key={col} className="px-8 py-4 text-[11px] font-medium text-zinc-400 font-mono truncate max-w-[200px] group-hover:text-white transition-colors">
                                              {row[col]}
                                          </td>
                                      ))}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
            </div>
          );
        })
      )}

      {expandedChart && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 md:p-12">
            <button onClick={() => setExpandedChart(null)} className="absolute top-10 right-10 p-4 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white/10">
                <FiX className="w-8 h-8" />
            </button>
            <div className="w-full h-full max-w-7xl flex flex-col">
                <h2 className="text-white text-4xl md:text-6xl font-[1000] uppercase italic tracking-tighter mb-10">{expandedChart.title}</h2>
                <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[4rem] p-10">
                    {expandedChart.type === "bar" ? <Bar data={expandedChart.data} options={chartOptions} /> : <Line data={expandedChart.data} options={chartOptions} />}
                </div>
            </div>
        </div>
      )}

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-24 right-6 z-[100] w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-90 transition-all">
          <FiArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};