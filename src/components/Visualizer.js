/**
 * components/Visualizer.js - RE-ENGINEERED FOR 2026 KPI DATASETS
 * Optimized: 2026-01-23 - Robust Numeric Detection & Trend Analysis
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

const COLORS = ["#00F2FF", "#7000FF", "#FF007A", "#ADFF2F", "#FF8A00", "#00FF94", "#00E5FF", "#FF4081"];

// IMPROVED: Robust number parsing for "12,975", "$100", etc.
const toNumber = (v) => {
  if (typeof v === "number") return v;
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s === "null" || s === "undefined") return null;
  // Remove currency, commas, and percentage signs
  const cleaned = s.replace(/[$,%]/g, "").replace(/,/g, "").trim();
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
        ticks: { color: '#666', font: { size: 8, weight: 'bold', family: 'monospace' }, padding: 8 } 
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: '#666', font: { size: 8, weight: 'bold', family: 'monospace' }, autoSkip: true, maxTicksLimit: 12, padding: 10 } 
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
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`ANALYTICS_REPORT_${name.toUpperCase()}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const parsed = useMemo(() => {
    return activeDatasets.map(ds => {
      const rawData = ds.data || [];
      if (rawData.length === 0) return null;

      const columns = Array.isArray(rawData[0]) ? rawData[0] : Object.keys(rawData[0] || {});
      const rows = Array.isArray(rawData[0]) 
        ? rawData.slice(1).map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]])))
        : rawData;
        
      // Auto-detect the best label column (usually Name or Sub-Area)
      const labelCol = columns.find(c => c.toLowerCase().includes('name') || c.toLowerCase().includes('area')) || columns[0];

      const analysis = columns.map(col => {
        const numeric = rows.map(r => toNumber(r[col]));
        const validNumeric = numeric.filter(v => v !== null);
        
        const isNumeric = validNumeric.length > rows.length * 0.5; // If >50% are numbers, treat as numeric
        
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

        return { col, isNumeric, numeric, stats, freq };
      });

      return { ...ds, rows, columns, analysis, labels: rows.map(r => r[labelCol]) };
    }).filter(Boolean);
  }, [activeDatasets]);

  if (activeDatasets.length === 0) return null;

  return (
    <div className="mt-6 md:mt-10 space-y-8 md:space-y-12 pb-32 max-w-[1500px] mx-auto px-4 md:px-6">
      
      {/* Modal Expanded View */}
      {expandedChart && (
        <div className="fixed inset-0 z-[300] flex flex-col bg-black/95 backdrop-blur-2xl p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter">{expandedChart.title}</h2>
              <button onClick={() => setExpandedChart(null)} className="p-3 bg-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 w-full bg-[#111] border border-zinc-800 rounded-[2rem] p-4 md:p-10">
              {expandedChart.type === "bar" ? 
                <Bar data={expandedChart.data} options={{...chartOptions, maintainAspectRatio: false}} /> : 
                <Line data={expandedChart.data} options={{...chartOptions, maintainAspectRatio: false}} />
              }
            </div>
        </div>
      )}

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-6 z-[100] w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl">
          <FiArrowUp className="w-5 h-5" />
        </button>
      )}

      <section>
          <AIAnalysisPanel datasets={parsed} onUpdateAI={handleAIComplete} />
      </section>

      {parsed.map(ds => {
        const isReady = !!readyStates[ds.id];
        if (!isReady) return null;

        const numericCols = ds.analysis.filter(c => c.isNumeric);
        const categoricalCols = ds.analysis.filter(c => !c.isNumeric && Object.keys(c.freq).length > 1);

        return (
          <div key={ds.id} className="space-y-10 id={`report-${ds.id}`}">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-8 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <FiDatabase className="text-[#7000FF] w-4 h-4" />
                    <h3 className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Performance_Matrix_v2026</h3>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-[1000] text-white uppercase tracking-tighter italic">{ds.name}</h2>
                </div>
                <button 
                  onClick={() => handleExport(ds.id, ds.name)} 
                  disabled={isExporting}
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#7000FF] hover:text-white transition-all disabled:opacity-50"
                >
                    <FiDownload className={isExporting ? 'animate-bounce' : ''} /> 
                    {isExporting ? "Processing..." : "Export Intelligence PDF"}
                </button>
            </div>
            
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {numericCols.slice(0, 8).map((col, idx) => (
                  <div key={col.col} className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-6 text-white hover:border-[#7000FF]/50 transition-colors">
                    <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-4 truncate">{col.col}</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-black tracking-tighter">
                        {col.stats?.sum > 1000 ? (col.stats.sum/1000).toFixed(1)+'k' : col.stats?.sum.toFixed(0)}
                      </span>
                      <span className="text-zinc-600 text-[10px] font-black uppercase">Total</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-800 pt-4 mt-2">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Avg: {col.stats?.avg.toFixed(1)}</span>
                        <span className="text-[10px] text-[#00F2FF] font-bold uppercase">Peak: {col.stats?.max}</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Main Charts - Forces Bar/Line for every column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {numericCols.map((col, idx) => {
                  const currentChartType = localChartTypes[`${ds.id}-${col.col}`] || (col.col.toLowerCase().includes('total') ? 'bar' : 'line');
                  const activeColor = COLORS[idx % COLORS.length];
                  
                  const chartData = {
                    labels: ds.labels, 
                    datasets: [{
                      label: col.col, 
                      data: col.numeric, 
                      borderColor: activeColor, 
                      backgroundColor: currentChartType === 'bar' ? activeColor : `${activeColor}20`,
                      borderWidth: 3,
                      tension: 0.3,
                      fill: true,
                      pointRadius: 4,
                      pointBackgroundColor: activeColor
                    }]
                  };

                  return (
                    <div key={col.col} className="border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 bg-[#0a0a0a] flex flex-col min-h-[400px]">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeColor }} />
                            <h4 className="text-white text-[11px] font-black uppercase tracking-widest">{col.col}</h4>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleLocalChartType(ds.id, col.col)} className="p-2 text-zinc-500 hover:text-white bg-zinc-900 rounded-lg">
                            {currentChartType === 'line' ? <FiBarChart2 /> : <FiTrendingUp />}
                          </button>
                          <button onClick={() => setExpandedChart({ title: col.col, data: chartData, type: currentChartType })} className="p-2 text-zinc-500 hover:text-white bg-zinc-900 rounded-lg">
                            <FiMaximize2 />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 relative">
                         {currentChartType === "bar" ? <Bar data={chartData} options={chartOptions} /> : <Line data={chartData} options={chartOptions} />}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Categorical Distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {categoricalCols.slice(0, 3).map((col) => (
                     <div key={col.col} className="p-8 border border-zinc-800 rounded-[2rem] bg-zinc-900/30">
                          <div className="flex items-center gap-3 mb-6">
                              <FiPieChart className="text-[#FF007A]" />
                              <h4 className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">{col.col} Distribution</h4>
                          </div>
                          <div className="aspect-square relative">
                              <Pie 
                                  data={{
                                      labels: Object.keys(col.freq),
                                      datasets: [{
                                          data: Object.values(col.freq),
                                          backgroundColor: COLORS,
                                          borderColor: '#000',
                                          borderWidth: 4
                                      }]
                                  }}
                                  options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                              />
                          </div>
                     </div>
                 ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};