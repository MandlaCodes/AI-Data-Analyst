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
  Legend
} from "chart.js";
import { FiHash, FiDownload, FiArrowUp } from "react-icons/fi";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AIAnalysisPanel from "./AIAnalysisPanel";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const COLORS = ["#a855f7", "#22c55e", "#f97316", "#38bdf8"];
const CARD_GRADIENTS = ["from-[#b16cea] to-[#ff5e62]", "from-[#00d2ff] to-[#3a7bd5]", "from-[#11998e] to-[#38ef7d]", "from-[#fc4a1a] to-[#f7b733]"];

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

  // Sync ready states: If a dataset has aiStorage, mark it as ready
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
    setReadyStates(prev => ({ ...prev, [id]: true }));
    if (onAIUpdate) {
      onAIUpdate(id, aiData);
    }
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
      // Handle both array-of-arrays and array-of-objects formats
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

  return (
    <div className="mt-10 space-y-32">
      {flash && <div className="fixed inset-0 z-[9999] bg-white pointer-events-none" />}
      
      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="fixed bottom-10 right-10 z-[100] w-14 h-14 bg-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-500 transition-all"
        >
          <FiArrowUp size={24} />
        </button>
      )}

      {parsed.map(ds => {
        const numericCols = ds.analysis.filter(c => c.isNumeric);
        const isReady = !!readyStates[ds.id];

        return (
          <div key={ds.id} className="space-y-10 scroll-mt-20" id={`report-${ds.id}`}>
            <div className="flex justify-between items-end border-b border-white/5 pb-6">
                <div>
                  <h3 className="text-purple-500 font-mono text-[10px] uppercase tracking-[0.4em] mb-2">Analysis Stream Active</h3>
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">{ds.name}</h2>
                </div>
                {isReady && (
                    <button 
                      onClick={() => handleExport(ds.id, ds.name)} 
                      className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all transform hover:-translate-y-1"
                    >
                        <FiDownload size={16} /> Download Intelligence Report
                    </button>
                )}
            </div>

            {/* AI PANEL SECTION */}
            <div className="w-full transition-all duration-700">
                <AIAnalysisPanel 
                  dataset={ds} 
                  onUpdateAI={(id, data) => handleAIComplete(ds.id, data)} 
                />
            </div>
            
            {/* STATS AND CHARTS SECTION - Only visible once AI is run */}
            <div className={`transition-all duration-1000 transform ${isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none h-0 overflow-hidden"}`}>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Statistical Anchors</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {numericCols.slice(0, 4).map((col, idx) => (
                  <div key={col.col} className={`bg-gradient-to-br ${CARD_GRADIENTS[idx % 4]} rounded-[2.5rem] p-8 text-white shadow-xl`}>
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-4">{col.col}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">
                        {(col.numeric.reduce((a,b)=>a+b,0) / (col.numeric.length || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                      <span className="text-white/60 text-xs font-bold font-mono">AVG</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                {numericCols.map((col, idx) => (
                  <div key={col.col} className="border border-white/5 rounded-[2.5rem] p-8 h-[450px] bg-white/[0.01] hover:bg-white/[0.03] transition-colors group">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h4 className="text-white text-[10px] font-black uppercase tracking-widest">{col.col}</h4>
                        <p className="text-slate-500 text-[9px] font-mono mt-1">DISTRIBUTION_MATRIX_0{idx+1}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl group-hover:text-purple-400 transition-colors">
                        <FiHash />
                      </div>
                    </div>
                    <div className="h-[300px]">
                        {chartType === "bar" ? 
                            <Bar 
                              data={{
                                labels: col.numeric.map((_, i) => i + 1), 
                                datasets: [{
                                  label: col.col, 
                                  data: col.numeric, 
                                  backgroundColor: COLORS[idx % 4],
                                  borderRadius: 8
                                }]
                              }} 
                              options={{ 
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: '#64748b' } },
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
                                  borderWidth: 3,
                                  pointRadius: 0,
                                  tension: 0.4,
                                  fill: true,
                                  backgroundColor: `${COLORS[idx % 4]}10`
                                }]
                              }} 
                              options={{ 
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: '#64748b' } },
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