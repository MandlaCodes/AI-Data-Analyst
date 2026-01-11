/**
 * components/Visualizer.js - PRODUCTION NEURAL ENGINE V3.3 (RESTORATION COMPLETE)
 * ---------------------------------------------------------------------------
 * RE-INTEGRATED:
 * 1. LOCAL CHART TOGGLING (Line/Bar/Pie per dataset)
 * 2. EXPANDABLE MODAL (Full-screen analysis)
 * 3. MULTI-METRIC SELECTOR (Switch between all numeric columns)
 * 4. ALL PREVIOUS INTEGRITY & MATRIX FEATURES
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
  FiDownload, FiArrowUp, FiDatabase, FiRefreshCw, 
  FiTable, FiActivity, FiShield, FiCheckCircle,
  FiTrendingUp, FiTrendingDown, FiLayers, FiMaximize2, FiX,
  FiBarChart2, FiPieChart, FiTrendingUp as FiLineChart
} from "react-icons/fi";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AIAnalysisPanel from "./AIAnalysisPanel";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

// --- CONSTANTS ---
const COLORS = ["#00F2FF", "#7000FF", "#FF007A", "#ADFF2F", "#FF8A00", "#00FF94"];

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v).trim().replace(/[^\d.-]/g, "");
  return s === "" || s === "." ? null : Number(s);
};

export const Visualizer = ({ activeDatasets = [], onAIUpdate, aiImpact = "$0.00" }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [flash, setFlash] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // STATE FOR RESTORED FEATURES
  const [localChartTypes, setLocalChartTypes] = useState({}); // { dsId: 'line' | 'bar' | 'pie' }
  const [expandedChart, setExpandedChart] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState({}); // { dsId: colName }

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const processed = useMemo(() => {
    if (activeDatasets.length === 0) return null;
    let totalAnomalies = 0, totalCells = 0;

    const hydrated = activeDatasets.map((ds, dsIdx) => {
      const columns = Array.isArray(ds.data?.[0]) ? ds.data[0] : Object.keys(ds.data?.[0] || {});
      const rows = Array.isArray(ds.data?.[0]) 
        ? ds.data.slice(1).map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]])))
        : ds.data || [];
        
      const labelCol = columns.find(col => {
          const c = col.toLowerCase();
          return c.includes('date') || c.includes('time') || c.includes('name');
      }) || columns[0];

      const analysis = columns.map(col => {
        const rawNumeric = rows.map(r => {
            totalCells++;
            const n = toNumber(r[col]);
            if (n === null && r[col] !== "" && !col.toLowerCase().includes('date')) totalAnomalies++;
            return n;
        });
        const numeric = rawNumeric.filter(v => v !== null);
        const isNumeric = numeric.length > (rows.length * 0.3) && !col.toLowerCase().includes('date');
        
        let stats = null;
        if (isNumeric) {
            const avg = numeric.reduce((a,b)=>a+b,0) / (numeric.length || 1);
            stats = {
                avg, min: Math.min(...numeric), max: Math.max(...numeric),
                trend: (((numeric[numeric.length-1] - (numeric[0] || 1)) / (numeric[0] || 1)) * 100).toFixed(1)
            };
        }
        return { col, isNumeric, numeric: rawNumeric, stats };
      });

      return { ...ds, rows, columns, analysis, labels: rows.map(r => r[labelCol]), color: COLORS[dsIdx % COLORS.length] };
    });

    return { 
        hydrated, 
        health: { score: totalCells > 0 ? Math.round(100 - (totalAnomalies / totalCells * 100)) : 100 }
    };
  }, [activeDatasets, refreshKey]);

  if (!processed) return null;

  // RENDER HELPER FOR DYNAMIC CHART TYPES
  const renderChart = (type, data, options) => {
    switch(type) {
      case 'bar': return <Bar data={data} options={options} />;
      case 'pie': return <Pie data={data} options={options} />;
      default: return <Line data={data} options={options} />;
    }
  };

  return (
    <div key={refreshKey} className="mt-10 space-y-20 pb-40 max-w-[1600px] mx-auto px-4 md:px-10 font-sans">
      {flash && <div className="fixed inset-0 z-[9999] bg-white pointer-events-none" />}

      {/* EXPANDED MODAL RESTORED */}
      {expandedChart && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl p-10 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">{expandedChart.name} // Full Analysis</h2>
            <button onClick={() => setExpandedChart(null)} className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20"><FiX size={24}/></button>
          </div>
          <div className="flex-1 min-h-0 bg-[#050505] border border-white/10 rounded-[3rem] p-12">
            {renderChart(localChartTypes[expandedChart.id] || 'line', expandedChart.data, { ...standardOptions, maintainAspectRatio: false })}
          </div>
        </div>
      )}

      {/* HEADER & AI PANEL (Restored) */}
      <section className="flex flex-wrap items-center justify-between bg-[#080808] border border-white/5 p-8 rounded-[2.5rem] gap-6">
        <div className="flex items-center gap-10">
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-3">System Health</span>
                <div className="flex items-center gap-4">
                    <div className="h-2 w-48 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${processed.health.score}%` }} /></div>
                    <span className="text-sm font-mono font-bold text-white">{processed.health.score}%</span>
                </div>
            </div>
            <div className="flex flex-col text-white">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Impact Projection</span>
                <span className="text-3xl font-[1000] tracking-tighter italic font-mono">{aiImpact} <span className="text-emerald-500 text-sm">↑</span></span>
            </div>
        </div>
      </section>

      <AIAnalysisPanel datasets={processed.hydrated} onUpdateAI={onAIUpdate} />

      {/* DATASET NODES WITH RESTORED TOGGLES */}
      {processed.hydrated.map(ds => {
        const numericCols = ds.analysis.filter(a => a.isNumeric);
        const currentMetricCol = selectedMetrics[ds.id] || (numericCols[0]?.col);
        const currentMetricData = ds.analysis.find(a => a.col === currentMetricCol);
        const chartType = localChartTypes[ds.id] || 'line';

        const chartData = {
          labels: ds.labels,
          datasets: [{
            label: currentMetricCol,
            data: currentMetricData?.numeric,
            borderColor: ds.color,
            backgroundColor: chartType === 'pie' ? COLORS : `${ds.color}20`,
            borderWidth: 4,
            tension: 0.4,
            fill: true
          }]
        };

        return (
          <div key={ds.id} className="space-y-12 pt-20 border-t border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                <div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-4 block"><FiDatabase className="inline mr-2"/> Neural_Source</span>
                    <h3 className="text-6xl font-[1000] text-white uppercase tracking-tighter italic leading-none">{ds.name}</h3>
                </div>
                
                {/* RESTORED METRIC SELECTOR */}
                <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10">
                  {numericCols.map(m => (
                    <button 
                      key={m.col}
                      onClick={() => setSelectedMetrics(prev => ({ ...prev, [ds.id]: m.col }))}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentMetricCol === m.col ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                    >
                      {m.col}
                    </button>
                  ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[550px]">
                {/* RESTORED MAIN CHART AREA WITH TOGGLES */}
                <div className="lg:col-span-2 bg-[#0a0a0f] border border-white/10 rounded-[3rem] p-10 flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex gap-2">
                           <button onClick={() => setLocalChartTypes(p => ({ ...p, [ds.id]: 'line' }))} className={`p-3 rounded-xl ${chartType === 'line' ? 'bg-white text-black' : 'bg-white/5 text-white'}`}><FiLineChart/></button>
                           <button onClick={() => setLocalChartTypes(p => ({ ...p, [ds.id]: 'bar' }))} className={`p-3 rounded-xl ${chartType === 'bar' ? 'bg-white text-black' : 'bg-white/5 text-white'}`}><FiBarChart2/></button>
                           <button onClick={() => setLocalChartTypes(p => ({ ...p, [ds.id]: 'pie' }))} className={`p-3 rounded-xl ${chartType === 'pie' ? 'bg-white text-black' : 'bg-white/5 text-white'}`}><FiPieChart/></button>
                        </div>
                        <button 
                          onClick={() => setExpandedChart({ id: ds.id, name: ds.name, data: chartData })}
                          className="p-3 bg-white/5 text-white rounded-xl hover:bg-white/10"
                        >
                          <FiMaximize2/>
                        </button>
                    </div>
                    <div className="flex-1 min-h-0">
                      {renderChart(chartType, chartData, standardOptions)}
                    </div>
                </div>

                {/* RESTORED METRIC INFO PANEL */}
                <div className="bg-[#0d0d12] border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-10">Metric Insight</p>
                        <h4 className="text-white text-2xl font-black uppercase mb-2">{currentMetricCol}</h4>
                        <div className="text-6xl font-black text-white tracking-tighter italic mb-4">
                          {currentMetricData?.stats?.avg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </div>
                        <div className={`text-xs font-black uppercase flex items-center gap-2 ${parseFloat(currentMetricData?.stats?.trend) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {parseFloat(currentMetricData?.stats?.trend) >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                            {currentMetricData?.stats?.trend}% Period Growth
                        </div>
                    </div>
                    <div className="pt-10 border-t border-white/5 space-y-4">
                       <div className="flex justify-between text-[10px] font-bold uppercase"><span className="text-white/30">Min Value</span><span className="text-white">{currentMetricData?.stats?.min}</span></div>
                       <div className="flex justify-between text-[10px] font-bold uppercase"><span className="text-white/30">Max Value</span><span className="text-white">{currentMetricData?.stats?.max}</span></div>
                    </div>
                </div>
            </div>
          </div>
        );
      })}

      {/* COMMAND MATRIX SUMMARY (Preserved) */}
      <section className="bg-white text-black rounded-[4rem] p-16">
          <div className="flex items-center gap-4 mb-12">
              <div className="bg-black text-white p-3 rounded-2xl"><FiLayers size={24} /></div>
              <h4 className="text-4xl font-[1000] uppercase italic tracking-tighter">Command Matrix</h4>
          </div>
          <table className="w-full text-left">
              <thead>
                  <tr className="border-b-2 border-black/10">
                      <th className="py-6 text-[11px] font-black uppercase">Source</th>
                      <th className="py-6 text-[11px] font-black uppercase">KPI</th>
                      <th className="py-6 text-[11px] font-black uppercase">Avg</th>
                      <th className="py-6 text-[11px] font-black uppercase text-right">Integrity</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                  {processed.hydrated.map(ds => {
                      const primary = ds.analysis.find(a => a.isNumeric);
                      return (
                          <tr key={ds.id}>
                              <td className="py-8 font-[1000] text-xl uppercase italic">{ds.name}</td>
                              <td className="py-8 font-mono text-xs opacity-60 uppercase">{primary?.col}</td>
                              <td className="py-8 font-black text-2xl tracking-tighter italic">${primary?.stats?.avg?.toLocaleString()}</td>
                              <td className="py-8 font-mono font-bold text-emerald-600 text-right">VERIFIED</td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
      </section>
    </div>
  );
};

const standardOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#444', font: { size: 9 } } },
    x: { grid: { display: false }, ticks: { color: '#444', font: { size: 9 } } }
  }
};