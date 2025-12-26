/**
 * components/Visualizer.js
 */
import React, { useMemo, useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { FiHash, FiDownload, FiArrowUp, FiLayers, FiDatabase, FiActivity } from "react-icons/fi";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AIAnalysisPanel from "./AIAnalysisPanel";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const COLORS = ["#a855f7", "#22c55e", "#f97316", "#38bdf8"];
const CARD_GRADIENTS = [
  "from-purple-600 to-indigo-600", 
  "from-emerald-500 to-teal-600", 
  "from-orange-500 to-red-600", 
  "from-blue-500 to-cyan-600"
];

const toNumber = (v) => {
  if (typeof v === "number") return v;
  const n = Number(String(v || "").replace(/[%,$£€,]/g, "").trim());
  return isNaN(n) ? null : n;
};

export const Visualizer = ({ activeDatasets = [], chartType = "line", authToken, onAIUpdate }) => {
  const [readyStates, setReadyStates] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync ready states: If datasets have aiStorage, the UI reveals the charts
  useEffect(() => {
    const updatedReady = {};
    activeDatasets.forEach(ds => {
      if (ds.aiStorage) {
        updatedReady[ds.id] = true;
      }
    });
    setReadyStates(updatedReady);
  }, [activeDatasets]);

  const handleAIComplete = (id, aiData) => {
    // Mark all currently active datasets as ready when a multi-analysis completes
    const newReady = { ...readyStates };
    activeDatasets.forEach(ds => {
        newReady[ds.id] = true;
        if (onAIUpdate) onAIUpdate(ds.id, aiData);
    });
    setReadyStates(newReady);
  };

  const handleExport = async (id, name) => {
    setFlash(true); 
    setTimeout(() => setFlash(false), 150);
    const element = document.getElementById(`report-${id}`);
    if (!element) return;

    const canvas = await html2canvas(element, { 
      scale: 2, 
      backgroundColor: '#020617',
      logging: false,
      useCORS: true 
    });
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
        
      const analysis = columns.map(col => {
        const numeric = rows.map(r => toNumber(r[col])).filter(v => v !== null);
        return { col, isNumeric: numeric.length >= 2, numeric };
      });
      return { ...ds, rows, columns, analysis };
    });
  }, [activeDatasets]);

  if (activeDatasets.length === 0) return null;

  return (
    <div className="mt-10 space-y-32 pb-20">
      {flash && <div className="fixed inset-0 z-[9999] bg-white pointer-events-none" />}
      
      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="fixed bottom-10 right-10 z-[100] w-14 h-14 bg-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-500 transition-all hover:scale-110 active:scale-90"
        >
          <FiArrowUp size={24} />
        </button>
      )}

      {/* GLOBAL AI PANEL - Now controls all active datasets */}
      <section className="scroll-mt-28">
          <div className="mb-10 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px] uppercase tracking-[0.5em]">
                  <FiLayers className="animate-pulse" /> Neural Processing Unit
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          
          <AIAnalysisPanel 
            datasets={parsed} 
            onUpdateAI={handleAIComplete} 
          />
      </section>

      {/* INDIVIDUAL DATA REPORTS */}
      {parsed.map(ds => {
        const numericCols = ds.analysis.filter(c => c.isNumeric);
        const isReady = !!readyStates[ds.id];

        return (
          <div key={ds.id} className="space-y-12 scroll-mt-20" id={`report-${ds.id}`}>
            {/* Report Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-8 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <FiDatabase className="text-purple-500" />
                    <h3 className="text-purple-500 font-mono text-[10px] uppercase tracking-[0.4em]">Data Stream Active</h3>
                  </div>
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">{ds.name}</h2>
                </div>
                
                {isReady && (
                    <button 
                      onClick={() => handleExport(ds.id, ds.name)} 
                      className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all transform hover:-translate-y-1 shadow-xl shadow-purple-900/10"
                    >
                        <FiDownload size={16} /> Export Intelligence
                    </button>
                )}
            </div>
            
            {/* STATS AND CHARTS SECTION - Revealed via readyState */}
            <div className={`transition-all duration-1000 transform ${isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none h-0 overflow-hidden"}`}>
              
              {/* Statistical Anchors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {numericCols.slice(0, 4).map((col, idx) => (
                  <div key={col.col} className={`relative overflow-hidden bg-gradient-to-br ${CARD_GRADIENTS[idx % 4]} rounded-[2.5rem] p-8 text-white shadow-2xl group hover:scale-[1.02] transition-transform`}>
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FiHash size={40} />
                    </div>
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-4">{col.col}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black tracking-tighter">
                        {(col.numeric.reduce((a,b)=>a+b,0) / (col.numeric.length || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                      <span className="text-white/60 text-[10px] font-black font-mono">MEAN_AVG</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Visualization Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                {numericCols.map((col, idx) => (
                  <div key={col.col} className="group relative border border-white/5 rounded-[3rem] p-10 h-[500px] bg-white/[0.01] hover:bg-white/[0.03] transition-all hover:border-white/10">
                    <div className="flex justify-between items-center mb-10">
                      <div>
                        <h4 className="text-white text-xs font-black uppercase tracking-widest">{col.col}</h4>
                        <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-tighter">Temporal_Distribution_Model_0{idx+1}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl group-hover:text-purple-400 transition-colors border border-white/5">
                        <FiActivity size={18} />
                      </div>
                    </div>

                    <div className="h-[320px] w-full">
                        {chartType === "bar" ? 
                            <Bar 
                              data={{
                                labels: col.numeric.map((_, i) => i + 1), 
                                datasets: [{
                                  label: col.col, 
                                  data: col.numeric, 
                                  backgroundColor: COLORS[idx % 4],
                                  borderRadius: 12,
                                  hoverBackgroundColor: '#fff'
                                }]
                              }} 
                              options={{ 
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                  y: { grid: { color: 'rgba(255,255,255,0.03)' }, border: { display: false }, ticks: { color: '#475569', font: { family: 'monospace', size: 10 } } },
                                  x: { grid: { display: false }, border: { display: false }, ticks: { display: false } }
                                }
                              }} 
                            /> :
                            <Line 
                              data={{
                                labels: col.numeric.map((_, i) => i + 1), 
                                datasets: [{
                                  label: col.col, 
                                  data: col.numeric, 
                                  borderColor: COLORS[idx % 4], 
                                  borderWidth: 4,
                                  pointRadius: 0,
                                  pointHoverRadius: 6,
                                  pointHoverBackgroundColor: '#fff',
                                  pointHoverBorderColor: COLORS[idx % 4],
                                  pointHoverBorderWidth: 3,
                                  tension: 0.4,
                                  fill: true,
                                  backgroundColor: (context) => {
                                    const ctx = context.chart.ctx;
                                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                                    gradient.addColorStop(0, `${COLORS[idx % 4]}30`);
                                    gradient.addColorStop(1, `${COLORS[idx % 4]}00`);
                                    return gradient;
                                  },
                                }]
                              }} 
                              options={{ 
                                maintainAspectRatio: false,
                                plugins: { 
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: '#0f172a',
                                        titleFont: { size: 12, weight: 'bold' },
                                        padding: 12,
                                        cornerRadius: 12,
                                        displayColors: false
                                    }
                                },
                                scales: {
                                  y: { grid: { color: 'rgba(255,255,255,0.03)' }, border: { display: false }, ticks: { color: '#475569', font: { family: 'monospace', size: 10 } } },
                                  x: { grid: { display: false }, border: { display: false }, ticks: { display: false } }
                                }
                              }} 
                            />
                        }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};