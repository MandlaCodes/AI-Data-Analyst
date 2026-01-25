/**
 * components/Visualizer.js - UNIVERSAL PROTOCOL VERSION
 * Optimized: 2026-01-25 - Aggressive Numeric Detection & Zero-Value Retention
 * Constraint: Charts only render after AI response completion.
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
import { FiDownload, FiArrowUp, FiDatabase, FiPieChart, FiBarChart2, FiTrendingUp, FiMaximize2, FiX } from "react-icons/fi";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AIAnalysisPanel from "./AIAnalysisPanel";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const COLORS = ["#00F2FF", "#7000FF", "#FF007A", "#ADFF2F", "#FF8A00", "#00FF94"];

/**
 * IMPROVED UNIVERSAL PARSER
 * Strips commas, currency, and special trailing chars like '#' to find the number.
 */
const toNumber = (v) => {
  if (typeof v === "number") return v;
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  
  // Strip everything except numbers and decimals
  const cleaned = s.replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "-") return null;
  
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
        legend: { display: false }, 
        tooltip: { 
            backgroundColor: '#000', 
            padding: 12, 
            cornerRadius: 12,
            borderColor: '#333',
            borderWidth: 1,
            titleFont: { size: 10, weight: 'bold' },
            bodyFont: { size: 9, family: 'monospace' },
            displayColors: true,
            boxPadding: 6
        } 
    },
    scales: {
      y: { 
        grid: { color: 'rgba(255,255,255,0.02)', drawBorder: false }, 
        ticks: { color: '#444', font: { size: 8, weight: 'bold', family: 'monospace' }, padding: 8 } 
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: '#444', font: { size: 8, weight: 'bold', family: 'monospace' }, autoSkip: true, maxTicksLimit: 12, padding: 10 } 
      }
    }
};

export const Visualizer = ({ activeDatasets = [], chartType = "line", authToken, onAIUpdate }) => {
  const [readyStates, setReadyStates] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isExporting, setIsExporting] = useState(false); 
  const [localChartTypes, setLocalChartTypes] = useState({});
  const [expandedChart, setExpandedChart] = useState(null);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updatedReady = { ...readyStates };
    activeDatasets.forEach(ds => {
      if (ds.aiStorage) updatedReady[ds.id] = true;
    });
    setReadyStates(updatedReady);
  }, [activeDatasets]);

  const handleAIComplete = (id, aiData) => {
    setReadyStates(prev => ({ ...prev, [id]: true }));
    if (onAIUpdate) onAIUpdate(id, aiData);
  };

  const toggleLocalChartType = (datasetId, colName) => {
    const key = `${datasetId}-${colName}`;
    setLocalChartTypes(prev => ({
      ...prev,
      [key]: prev[key] === "bar" ? "line" : "bar"
    }));
  };

  const handleExport = async (id, name) => {
    const element = document.getElementById(`report-${id}`);
    if (!element || isExporting) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#000000",
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`METRIA_PROTOCOL_${name.toUpperCase()}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const parsed = useMemo(() => {
    return activeDatasets.map(ds => {
      const rawData = ds.data || [];
      const columns = Array.isArray(rawData[0]) ? rawData[0] : Object.keys(rawData[0] || {});
      const rows = Array.isArray(rawData[0]) 
        ? rawData.slice(1).map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]])))
        : rawData;
        
      // SMART LABEL SELECTION: Priority given to "Area Name" or "State"
      const labelCol = columns.find(c => /area|name|state|label/i.test(c)) || 
                       columns.find(col => rows.slice(0, 5).every(r => toNumber(r[col]) === null)) || 
                       columns[0];

      const analysis = columns.map(col => {
        const numeric = rows.map(r => toNumber(r[col]));
        const validNumeric = numeric.filter(v => v !== null);
        
        // If 50% or more of the column is numeric, treat as chartable data
        const isNumeric = validNumeric.length > rows.length * 0.5;

        const stats = isNumeric ? {
            avg: validNumeric.reduce((a,b)=>a+b,0) / validNumeric.length,
            min: Math.min(...validNumeric),
            max: Math.max(...validNumeric),
            sum: validNumeric.reduce((a,b)=>a+b,0)
        } : null;

        const freq = {};
        if (!isNumeric) {
            rows.forEach(r => {
                const val = r[col] || "N/A";
                freq[val] = (freq[val] || 0) + 1;
            });
        }
        return { col, isNumeric, numeric: numeric.map(v => v === null ? 0 : v), stats, freq };
      });
      return { ...ds, rows, columns, analysis, labels: rows.map(r => r[labelCol] || "Unknown") };
    });
  }, [activeDatasets]);

  if (activeDatasets.length === 0) return null;

  return (
    <div className="mt-6 md:mt-10 space-y-8 md:space-y-12 pb-32 max-w-[1500px] mx-auto px-4 md:px-6" style={{ overflowAnchor: 'none' }}>
      
      {expandedChart && (
        <div className="fixed inset-0 z-[300] flex flex-col lg:flex-row">
          <div className="hidden lg:block w-64 flex-shrink-0" /> 
          <div className="flex-1 bg-black/95 md:bg-black/90 backdrop-blur-2xl p-4 md:p-8 flex flex-col shadow-[0_0_100px_rgba(112,0,255,0.2)]">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h2 className="text-white text-2xl md:text-4xl font-[1000] uppercase tracking-tighter italic truncate pr-4">{expandedChart.title}</h2>
              <button onClick={() => setExpandedChart(null)} className="p-3 md:p-4 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all shrink-0">
                <FiX className="w-6 h-6 md:w-7 md:h-7" />
              </button>
            </div>
            <div className="flex-1 w-full relative bg-[#111] border border-zinc-700 rounded-[2rem] md:rounded-[3rem] p-4 md:p-10 shadow-inner overflow-hidden">
              {expandedChart.type === "bar" ? 
                <Bar data={expandedChart.data} options={{...chartOptions, maintainAspectRatio: false}} /> : 
                <Line data={expandedChart.data} options={{...chartOptions, maintainAspectRatio: false}} />
              }
            </div>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-[#7000FF] hover:text-white transition-all shadow-2xl border-4 border-black">
          <FiArrowUp className="w-5 h-5" />
        </button>
      )}

      <section className="scroll-mt-28">
          <AIAnalysisPanel datasets={parsed} onUpdateAI={handleAIComplete} />
      </section>

      {parsed.map(ds => {
        const isReady = !!readyStates[ds.id];
        if (!isReady) return null;

        const numericCols = ds.analysis.filter(c => c.isNumeric);
        const categoricalCols = ds.analysis.filter(c => !c.isNumeric && Object.keys(c.freq).length > 1 && Object.keys(c.freq).length < 20);

        return (
          <div key={ds.id} className="space-y-10 md:space-y-16 scroll-mt-20 p-4 rounded-[3rem] animate-in fade-in slide-in-from-bottom-5 duration-700" id={`report-${ds.id}`}>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-8 md:pb-12 gap-6 md:gap-8">
                <div className="max-w-full lg:max-w-2xl overflow-hidden">
                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <div className="p-2 bg-[#7000FF]/20 rounded-lg border border-[#7000FF]/30">
                      <FiDatabase className="text-[#7000FF] w-4 h-4 md:w-[18px] md:h-[18px]" />
                    </div>
                    <h3 className="text-zinc-500 font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.5em]">Network_Data_Matrix</h3>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-[1000] text-white uppercase tracking-tighter leading-none italic line-clamp-2">{ds.name}</h2>
                </div>
                <button 
                  onClick={() => handleExport(ds.id, ds.name)} 
                  disabled={isExporting}
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-6 md:px-10 py-4 md:py-5 bg-zinc-100 text-black rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#7000FF] hover:text-white transition-all active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.5)] disabled:opacity-50 shrink-0"
                >
                    <FiDownload className={`w-4 h-4 md:w-[18px] md:h-[18px] ${isExporting ? 'animate-bounce' : ''}`} /> 
                    {isExporting ? "Compiling Report..." : "Download Protocol"}
                </button>
            </div>
            
            <div className="opacity-100 translate-y-0 transition-all duration-1000">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {numericCols.slice(0, 4).map((col, idx) => (
                  <div key={col.col} className="relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col h-full">
                    <p className="text-zinc-500 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] mb-4 md:mb-6 truncate">{col.col}</p>
                    <div className="flex flex-wrap items-baseline gap-2 mb-6 md:mb-8 overflow-hidden">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white break-all">
                        {col.stats?.avg.toLocaleString(undefined, {maximumFractionDigits: 1}) || 0}
                      </span>
                      <span className="text-zinc-600 text-[9px] md:text-[11px] font-black uppercase tracking-widest">avg</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 md:gap-2 border-t border-zinc-800/50 pt-6 mt-auto">
                        <div className="min-w-0">
                          <p className="text-[7px] md:text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">Min</p>
                          <p className="text-[10px] md:text-xs font-bold text-zinc-300 truncate">{col.stats?.min.toLocaleString() || 0}</p>
                        </div>
                        <div className="border-x border-zinc-800/50 px-1 md:px-2 text-center min-w-0">
                            <p className="text-[7px] md:text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">Max</p>
                            <p className="text-[10px] md:text-xs font-bold text-zinc-300 truncate">{col.stats?.max.toLocaleString() || 0}</p>
                        </div>
                        <div className="text-right min-w-0">
                            <p className="text-[7px] md:text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">Sum</p>
                            <p className="text-[10px] md:text-xs font-bold text-[#7000FF] truncate">
                              {col.stats?.sum > 1000000 ? (col.stats.sum/1000000).toFixed(1)+'M' : col.stats?.sum.toLocaleString() || 0}
                            </p>
                        </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-10 md:mt-16">
                {numericCols.map((col, idx) => {
                  const currentChartType = localChartTypes[`${ds.id}-${col.col}`] || chartType;
                  const activeColor = COLORS[idx % COLORS.length];
                  const chartData = {
                    labels: ds.labels, 
                    datasets: [{
                      label: col.col, 
                      data: col.numeric, 
                      borderColor: activeColor, 
                      backgroundColor: currentChartType === 'bar' ? activeColor : `${activeColor}10`,
                      borderWidth: 2,
                      tension: 0.4,
                      fill: true,
                      pointRadius: 4,
                      pointBackgroundColor: activeColor
                    }]
                  };

                  return (
                    <div key={col.col} className="group relative border border-zinc-800 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 bg-[#0d0d0d] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex flex-col min-h-[450px]">
                      <div className="flex justify-between items-start mb-6 md:mb-10">
                        <div className="min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeColor }} />
                             <h4 className="text-zinc-200 text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] truncate">{col.col}</h4>
                          </div>
                        </div>
                        <div className="flex gap-1 md:gap-2 bg-black/60 p-1 md:p-2 rounded-xl border border-zinc-800 shrink-0">
                          <button onClick={() => setExpandedChart({ title: col.col, data: chartData, type: currentChartType })} className="p-1.5 md:p-2 text-zinc-500 hover:text-white transition-colors">
                            <FiMaximize2 className="w-3.5 h-3.5 md:w-[14px] md:h-[14px]" />
                          </button>
                          <button onClick={() => toggleLocalChartType(ds.id, col.col)} className="p-1.5 md:p-2 text-zinc-500 hover:text-white transition-colors">
                            {currentChartType === 'line' ? <FiBarChart2 className="w-3.5 h-3.5 md:w-[14px] md:h-[14px]" /> : <FiTrendingUp className="w-3.5 h-3.5 md:w-[14px] md:h-[14px]" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 w-full relative">
                         {currentChartType === "bar" ? <Bar data={chartData} options={chartOptions} /> : <Line data={chartData} options={chartOptions} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {categoricalCols.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 mt-10 md:mt-16">
                   {categoricalCols.slice(0, 3).map((col) => (
                       <div key={col.col} className="p-8 md:p-12 border border-zinc-800 rounded-[2.5rem] bg-gradient-to-tr from-[#0a0a0a] to-[#141414] shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-8 md:mb-10">
                                <div className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700"><FiPieChart className="text-white w-4 h-4" /></div>
                                <h4 className="text-zinc-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] truncate pr-8">{col.col}</h4>
                            </div>
                            <div className="aspect-square relative w-full">
                                <Pie 
                                    data={{
                                        labels: Object.keys(col.freq),
                                        datasets: [{
                                            data: Object.values(col.freq),
                                            backgroundColor: COLORS,
                                            borderWidth: 2,
                                            borderColor: '#0d0d0d'
                                        }]
                                    }}
                                    options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
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