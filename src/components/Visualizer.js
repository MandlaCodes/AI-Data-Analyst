/**
 * components/Visualizer.js - MOBILE OPTIMIZED VERSION
 * UPDATED: Table Preview, Static Refresh, & Categorical Labels
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
  FiMaximize2, FiX, FiRefreshCw, FiTable
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
            backgroundColor: '#000', padding: 12, cornerRadius: 12,
            borderColor: '#333', borderWidth: 1,
            titleFont: { size: 10, weight: 'bold' },
            bodyFont: { size: 9, family: 'monospace' },
            displayColors: true, boxPadding: 6
        } 
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.02)', drawBorder: false }, ticks: { color: '#444', font: { size: 8, weight: 'bold', family: 'monospace' }, padding: 8 } },
      x: { grid: { display: false }, ticks: { color: '#444', font: { size: 8, weight: 'bold', family: 'monospace' }, autoSkip: true, maxTicksLimit: 6, padding: 10 } }
    }
};

export const Visualizer = ({ activeDatasets = [], chartType = "line", authToken, onAIUpdate }) => {
  const [readyStates, setReadyStates] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [flash, setFlash] = useState(false);
  const [localChartTypes, setLocalChartTypes] = useState({});
  const [expandedChart, setExpandedChart] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); 

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
    pdf.save(`MetriaAI_Report_${name}.pdf`);
  };

  const parsed = useMemo(() => {
    return activeDatasets.map(ds => {
      const columns = Array.isArray(ds.data?.[0]) ? ds.data[0] : Object.keys(ds.data?.[0] || {});
      const rows = Array.isArray(ds.data?.[0]) 
        ? ds.data.slice(1).map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]])))
        : ds.data || [];
        
      const labelCol = columns.find(col => {
          const cLower = col.toLowerCase();
          if (cLower.includes('date') || cLower.includes('time') || cLower.includes('name') || cLower.includes('label')) return true;
          const sample = rows.slice(0, 10).map(r => toNumber(r[col]));
          return sample.filter(v => v !== null).length < sample.length / 2;
      }) || columns[0];

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
      return { ...ds, rows, columns, analysis, labels: rows.map(r => r[labelCol]) };
    });
  }, [activeDatasets, refreshKey]);

  if (activeDatasets.length === 0) return null;

  return (
    <div key={refreshKey} className="mt-10 md:mt-20 space-y-20 md:space-y-40 pb-32 max-w-[1500px] mx-auto px-4 md:px-6">
      {flash && <div className="fixed inset-0 z-[9999] bg-white pointer-events-none" />}
      
      {expandedChart && (
        <div className="fixed inset-0 z-[300] flex flex-col lg:flex-row">
          <div className="hidden lg:block w-64 flex-shrink-0" /> 
          <div className="flex-1 bg-black/95 backdrop-blur-2xl p-4 md:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h2 className="text-white text-2xl md:text-4xl font-[1000] uppercase italic truncate">{expandedChart.title}</h2>
              <button onClick={() => setExpandedChart(null)} className="p-3 bg-white/5 border border-white/10 text-white rounded-full">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 w-full relative bg-[#111] border border-zinc-700 rounded-[2rem] p-4 overflow-hidden">
              {expandedChart.type === "bar" ? <Bar data={expandedChart.data} options={chartOptions} /> : <Line data={expandedChart.data} options={chartOptions} />}
            </div>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-6 z-[100] w-12 h-12 bg-white text-black rounded-full flex items-center justify-center border-4 border-black shadow-2xl">
          <FiArrowUp className="w-5 h-5" />
        </button>
      )}

      <section className="scroll-mt-28">
          <AIAnalysisPanel datasets={parsed} onUpdateAI={handleAIComplete} />
      </section>

      {parsed.map(ds => {
        const numericCols = ds.analysis.filter(c => c.isNumeric);
        const categoricalCols = ds.analysis.filter(c => !c.isNumeric && Object.keys(c.freq).length > 1 && Object.keys(c.freq).length < 15);
        if (!readyStates[ds.id]) return null;

        return (
          <div key={ds.id} className="space-y-10 md:space-y-16 scroll-mt-20 animate-in fade-in duration-1000" id={`report-${ds.id}`}>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-8 gap-6">
                <div className="max-w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#7000FF]/20 rounded-lg border border-[#7000FF]/30">
                      <FiDatabase className="text-[#7000FF] w-4 h-4" />
                    </div>
                    <h3 className="text-zinc-500 font-black text-[8px] uppercase tracking-[0.5em]">Network_Data_Matrix</h3>
                  </div>
                  <h2 className="text-4xl sm:text-5xl md:text-7xl font-[1000] text-white uppercase tracking-tighter italic leading-none break-words">{ds.name}</h2>
                </div>
                
                <div className="flex w-full md:w-auto gap-3">
                  <button onClick={handleRefresh} className="flex-1 md:flex-none p-4 bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
                    <FiRefreshCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleExport(ds.id, ds.name)} className="flex-[3] md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-zinc-100 text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">
                    <FiDownload className="w-4 h-4" /> Download Protocol
                  </button>
                </div>
            </div>

            {/* TABLE PREVIEW - NEW SECTION */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-[2rem] overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                    <FiTable className="text-zinc-500 w-3 h-3" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Live_Data_Preview (Top 5 Rows)</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-black/40">
                                {ds.columns.map(col => (
                                    <th key={col} className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-wider border-b border-zinc-800">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {ds.rows.slice(0, 5).map((row, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    {ds.columns.map(col => (
                                        <td key={col} className="px-6 py-3 text-[10px] font-medium text-zinc-300 font-mono truncate max-w-[150px]">{row[col]}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div>
              {/* STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mt-10">
                {numericCols.slice(0, 4).map((col, idx) => (
                  <div key={col.col} className="relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-zinc-800 rounded-[2rem] p-6 md:p-10 text-white shadow-2xl">
                    <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${idx % 2 === 0 ? 'from-[#7000FF]' : 'from-zinc-400'} to-transparent`} />
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.3em] truncate">{col.col}</p>
                        {col.stats?.trend && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[7px] font-bold ${col.stats.trendDir === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {col.stats.trendDir === 'up' ? <FiTrendingUp className="w-2.5 h-2.5" /> : <FiTrendingDown className="w-2.5 h-2.5" />}
                                {col.stats.trend}%
                            </div>
                        )}
                    </div>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl md:text-5xl font-black tracking-tighter">{col.stats?.avg.toLocaleString(undefined, {maximumFractionDigits: 1})}</span>
                      <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">avg</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-t border-zinc-800/50 pt-6">
                        <div><p className="text-[7px] text-zinc-600 uppercase font-black mb-1">Min</p><p className="text-[10px] font-bold text-zinc-300">{col.stats?.min.toLocaleString()}</p></div>
                        <div className="border-x border-zinc-800/50 px-2 text-center"><p className="text-[7px] text-zinc-600 uppercase font-black mb-1">Max</p><p className="text-[10px] font-bold text-zinc-300">{col.stats?.max.toLocaleString()}</p></div>
                        <div className="text-right"><p className="text-[7px] text-zinc-600 uppercase font-black mb-1">Sum</p><p className="text-[10px] font-bold text-[#7000FF] truncate">{col.stats?.sum > 1e6 ? (col.stats.sum/1e6).toFixed(1)+'M' : col.stats?.sum.toLocaleString()}</p></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* GRAPHS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-10 md:mt-16">
                {numericCols.map((col, idx) => {
                  const currentChartType = localChartTypes[`${ds.id}-${col.col}`] || chartType;
                  const activeColor = COLORS[idx % COLORS.length];
                  const chartData = {
                    labels: ds.labels, 
                    datasets: [{
                      label: col.col, data: col.numeric, 
                      borderColor: activeColor, backgroundColor: currentChartType === 'bar' ? activeColor : `${activeColor}10`,
                      borderWidth: 2, tension: 0.4, fill: true, pointRadius: 0
                    }]
                  };
                  return (
                    <div key={`${col.col}-${refreshKey}`} className="group relative border border-zinc-800 rounded-[2rem] p-6 md:p-10 bg-[#0d0d0d] shadow-2xl transition-all flex flex-col">
                      <div className="flex justify-between items-start mb-6 md:mb-10">
                        <div className="min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColor }} />
                             <h4 className="text-zinc-200 text-[9px] font-black uppercase tracking-[0.4em] truncate">{col.col}</h4>
                          </div>
                          <p className="text-zinc-700 text-[8px] font-mono uppercase tracking-[0.2em]">Node_{idx}</p>
                        </div>
                        <div className="flex gap-1 bg-black/60 p-1 rounded-xl border border-zinc-800 shrink-0">
                          <button onClick={() => setExpandedChart({ title: col.col, data: chartData, type: currentChartType })} className="p-1.5 text-zinc-500 hover:text-white"><FiMaximize2 className="w-4 h-4" /></button>
                          <button onClick={() => toggleLocalChartType(ds.id, col.col)} className="p-1.5 text-zinc-500 hover:text-white">{currentChartType === 'line' ? <FiBarChart2 className="w-4 h-4" /> : <FiTrendingUp className="w-4 h-4" />}</button>
                        </div>
                      </div>
                      <div className="w-full aspect-[4/3] sm:aspect-[16/9] relative">
                         {currentChartType === "bar" ? <Bar data={chartData} options={chartOptions} /> : <Line data={chartData} options={chartOptions} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PIE CHARTS (CATEGORICAL) */}
              {categoricalCols.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 mt-10 md:mt-16">
                   {categoricalCols.slice(0, 3).map((col) => (
                       <div key={`${col.col}-${refreshKey}`} className="p-8 md:p-12 border border-zinc-800 rounded-[2.5rem] bg-gradient-to-tr from-[#0a0a0a] to-[#141414] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-4 right-6 px-3 py-1 bg-[#7000FF]/10 border border-[#7000FF]/20 rounded-full">
                                <span className="text-[7px] font-black text-[#7000FF] uppercase tracking-widest italic">Categorical</span>
                            </div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700"><FiPieChart className="text-white w-4 h-4" /></div>
                                <h4 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] truncate pr-12">{col.col}</h4>
                            </div>
                            <div className="aspect-square relative w-full">
                                <Pie 
                                    data={{
                                        labels: Object.keys(col.freq),
                                        datasets: [{ data: Object.values(col.freq), backgroundColor: COLORS, borderWidth: 2, borderColor: '#0d0d0d' }]
                                    }}
                                    options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#666', font: { size: 8, weight: 'bold' }, padding: 10 } } } }}
                                />
                            </div>
                       </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};