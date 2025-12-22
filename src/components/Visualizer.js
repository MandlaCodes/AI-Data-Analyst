import React, { useMemo, useState, useEffect, useRef } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { FiHash, FiList, FiTable, FiChevronDown, FiArrowUp, FiDownload } from "react-icons/fi";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AIAnalysisPanel from "./AIAnalysisPanel"; 

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const COLORS = ["#a855f7", "#22c55e", "#f97316", "#38bdf8", "#f43f5e", "#eab308", "#64748b", "#f59e0b", "#10b981", "#6366f1"];
const CARD_GRADIENTS = ["from-[#b16cea] to-[#ff5e62]", "from-[#00d2ff] to-[#3a7bd5]", "from-[#11998e] to-[#38ef7d]", "from-[#fc4a1a] to-[#f7b733]"];

const toNumber = (v) => {
  if (typeof v === "number" && !isNaN(v)) return v;
  if (v === null || v === undefined) return null;
  const cleaned = String(v).replace(/[%,$£€]/g, "").replace(/,/g, "").trim();
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
};

const calcStats = (nums) => {
  if (!nums.length) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return { count: nums.length, sum, avg: sum / nums.length, min: Math.min(...nums), max: Math.max(...nums) };
};

const groupCategorical = (values, limit = 6) => {
  const counts = {};
  values.forEach(v => {
    const k = String(v ?? "N/A");
    counts[k] = (counts[k] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const main = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  if (rest.length) main.push(["Other", rest.reduce((a, b) => a + b[1], 0)]);
  return Object.fromEntries(main);
};

export const Visualizer = ({ activeDatasets = [], chartType = "line" }) => {
  const [readyStates, setReadyStates] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [flash, setFlash] = useState(false);
  const chartSectionRefs = useRef({});

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAIComplete = (id) => {
    setReadyStates(prev => ({ ...prev, [id]: true }));
  };

  const scrollToCharts = (id) => {
    chartSectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleExport = async (id, name) => {
    setIsExporting(true);
    setFlash(true); 
    setTimeout(() => setFlash(false), 150);
    const element = document.getElementById(`report-${id}`);
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#020617', logging: false, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`MetriaAI_Report_${name.replace(/\s+/g, '_')}.pdf`);
    setIsExporting(false);
  };

  const parsed = useMemo(() => {
    return activeDatasets.map(ds => {
      let rows = [], columns = [];
      if (Array.isArray(ds.data?.[0])) {
        columns = ds.data[0];
        rows = ds.data.slice(1).map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
      } else {
        rows = ds.data || [];
        columns = Object.keys(rows[0] || {});
      }
      const analysis = columns.map(col => {
        const values = rows.map(r => r[col]);
        const numeric = values.map(toNumber).filter(v => v !== null);
        const isNumeric = numeric.length >= 3;
        return { col, isNumeric, numeric, categorical: isNumeric ? null : values };
      });
      return { ...ds, rows, columns, analysis };
    });
  }, [activeDatasets]);

  return (
    <div className="mt-10 space-y-32 relative">
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      {flash && <div className="fixed inset-0 z-[10000] bg-white pointer-events-none" />}

      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-10 right-10 z-[100] flex items-center gap-3 px-6 py-4 bg-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all"
        >
          <FiArrowUp />
          <span className="text-[10px] font-black uppercase tracking-widest">Top</span>
        </button>
      )}

      {parsed.map(ds => {
        const numericCols = ds.analysis.filter(c => c.isNumeric);
        const categoricalCols = ds.analysis.filter(c => !c.isNumeric);
        const isReady = readyStates[ds.id];

        return (
          <div key={ds.id} className="space-y-10" id={`report-${ds.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1.5 bg-purple-600 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">{ds.name}</h2>
              </div>
              {isReady && (
                <button 
                  onClick={() => handleExport(ds.id, ds.name)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  <FiDownload /> Share Analysis
                </button>
              )}
            </div>

            <div className="w-full relative flex flex-col items-center">
              <div className="w-full h-[550px]">
                <AIAnalysisPanel datasets={[ds]} onComplete={() => handleAIComplete(ds.id)} />
              </div>
              
              <div className="h-28 flex items-center justify-center">
                <div className={`transition-all duration-[2000ms] ${isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}>
                  <button 
                    onClick={() => scrollToCharts(ds.id)}
                    className="flex flex-col items-center animate-float text-purple-400 hover:text-white transition-colors group"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">Explore Insights</span>
                    <FiChevronDown size={28} className="group-hover:scale-125 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            <div 
              ref={el => chartSectionRefs.current[ds.id] = el}
              style={{ 
                display: 'grid',
                gridTemplateRows: isReady ? '1fr' : '0fr',
                transition: 'grid-template-rows 2s cubic-bezier(0.4, 0, 0.2, 1), opacity 2s ease',
                opacity: isReady ? 1 : 0,
                visibility: isReady ? 'visible' : 'hidden'
              }}
            >
              <div className="overflow-hidden space-y-24 pt-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {numericCols.slice(0, 4).map((col, idx) => {
                    const stats = calcStats(col.numeric);
                    if (!stats) return null;
                    const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                    return (
                      <div key={col.col} className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-[2.5rem] p-8 shadow-2xl transition-transform hover:scale-[1.02]`}>
                        <div className="relative z-10 flex flex-col h-full text-white">
                          <p className="text-white/80 text-sm font-medium mb-4 tracking-wide uppercase">{col.col}</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold tracking-tighter">
                              {stats.avg > 1000 ? (stats.avg / 1000).toFixed(1) + 'k' : stats.avg.toFixed(0)}
                            </span>
                            <span className="text-xl font-medium opacity-80">avg</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {numericCols.map((col, idx) => {
                      const labels = col.numeric.map((_, i) => `Row ${i + 1}`);
                      const color = COLORS[idx % COLORS.length];
                      return (
                        <Card key={col.col} title={col.col} icon={<FiHash />} color={color}>
                          {chartType === "bar" ? (
                            <Bar data={{labels, datasets: [{label: col.col, data: col.numeric, backgroundColor: color}]}} options={{ responsive: true, maintainAspectRatio: false }} />
                          ) : (
                            <Line data={{labels, datasets: [{label: col.col, data: col.numeric, borderColor: color, fill: true, backgroundColor: `${color}22`}]}} options={{ responsive: true, maintainAspectRatio: false }} />
                          )}
                        </Card>
                      );
                    })}
                  </div>
                  <div className="flex flex-col gap-8">
                    {categoricalCols.map(col => {
                      const grouped = groupCategorical(col.categorical);
                      const labels = Object.entries(grouped).map(([k, v]) => k);
                      return (
                        <div key={col.col} className="bg-[#0F172A]/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md">
                          <div className="h-[260px]">
                            <Doughnut data={{labels, datasets: [{data: Object.values(grouped), backgroundColor: COLORS}]}} options={{ plugins: { legend: { position: "bottom", labels: { color: '#94a3b8' } } } }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#0F172A]/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md pb-10">
                  <h4 className="text-sm font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <FiTable className="text-purple-500" /> MetriaAI Raw Stream
                  </h4>
                  <div className="overflow-auto max-h-[400px] custom-scrollbar">
                    <table className="w-full text-xs text-slate-400">
                      <thead className="sticky top-0 bg-[#020617] z-20">
                        <tr>
                          {ds.columns.map(c => <th key={c} className="px-4 py-3 text-left font-black border-b border-white/10">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {ds.rows.slice(0, 15).map((r, i) => (
                          <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02]">
                            {ds.columns.map(c => <td key={c} className="px-4 py-3 truncate max-w-[200px]">{String(r[c] ?? "—")}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Card = ({ title, icon, color, children }) => (
  <div className="border border-white/5 rounded-[2.5rem] p-8 h-[400px] transition-all backdrop-blur-sm" style={{ backgroundColor: `${color}10` }}>
    <div className="flex justify-between items-center mb-6">
      <h4 className="font-black text-white text-xs truncate uppercase tracking-widest">{title}</h4>
      <span className="text-purple-400">{icon}</span>
    </div>
    <div className="h-[280px]">{children}</div>
  </div>
);