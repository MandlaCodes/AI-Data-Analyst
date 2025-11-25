import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { MdArrowBack, MdTrendingUp, MdAttachMoney, MdSpeed, MdNumbers, MdChat } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function GoogleSheetsAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.state?.profile || JSON.parse(localStorage.getItem("adt_profile") || "null");

  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [loadingSheetValues, setLoadingSheetValues] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [numericColumns, setNumericColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [showPreview, setShowPreview] = useState(false); // default unchecked
  const [kpiMetrics, setKpiMetrics] = useState({ total: 0, avg: 0, max: 0, min: 0 });
  const [summary, setSummary] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const rightPanelRef = useRef(null);
  const [rightPanelHeight, setRightPanelHeight] = useState(640);
  const [chartHeight, setChartHeight] = useState(220);

  const updateRightHeight = useCallback(() => {
    const el = rightPanelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setRightPanelHeight(Math.floor(rect.height));
  }, []);

  useEffect(() => {
    if (!profile) navigate("/"); // redirect if no profile
    updateRightHeight();
    window.addEventListener("resize", updateRightHeight);
    return () => window.removeEventListener("resize", updateRightHeight);
  }, [profile, navigate, updateRightHeight]);

  useEffect(() => {
    const chartsCount = Math.max(1, selectedColumns.length);
    const reserved = 220;
    const available = Math.max(320, rightPanelHeight - reserved);
    const h = Math.max(120, Math.floor(available / chartsCount) - 18);
    setChartHeight(h);
  }, [rightPanelHeight, selectedColumns.length]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/sheets-list/${profile.user_id}`);
        if (!cancelled) setSheets(res.data.sheets || []);
      } catch {
        if (!cancelled) setSheets([]);
      }
    })();
    return () => (cancelled = true);
  }, [profile]);

  const getSheetName = (id) => sheets.find((x) => x.id === id)?.name || id;

  const handleSelectSheet = (e) => {
    setSelectedSheet(e.target.value);
    setSheetData([]);
    setShowAnalytics(false);
    setSummary("");
    setChatMessages([]);
    setChatInput("");
  };

  const handleInterpretData = async () => {
    if (!selectedSheet || !profile) return;
    try {
      setLoadingSheetValues(true);
      const res = await axios.get(
        `https://ai-data-analyst-backend-1nuw.onrender.com/sheets/${profile.user_id}/${selectedSheet}`
      );
      const values = res.data.values || [];
      setSheetData(values);

      let indexes = [];
      if (values.length > 1) {
        const headers = values[0];
        const sample = values[1];
        indexes = headers
          .map((h, i) => {
            const v = sample[i];
            if (v === undefined || v === null) return null;
            const cleaned = String(v).replace(/[, ]+/g, "");
            return !isNaN(Number(cleaned)) && i !== 0 ? i : null;
          })
          .filter((i) => i !== null);
      }
      setNumericColumns(indexes);
      setSelectedColumns(indexes);
      setShowAnalytics(true);

      setChatMessages((m) => [
        ...m,
        {
          role: "ai",
          text: `Loaded "${getSheetName(selectedSheet)}" — ${values.length} rows, ${indexes.length} numeric columns.`,
          ts: Date.now(),
        },
      ]);

      setTimeout(updateRightPanelHeightImmediate, 120);
    } catch {
      setSheetData([]);
      setShowAnalytics(false);
    } finally {
      setLoadingSheetValues(false);
    }
  };

  const updateRightPanelHeightImmediate = () => {
    if (!rightPanelRef.current) return;
    const rect = rightPanelRef.current.getBoundingClientRect();
    setRightPanelHeight(Math.floor(rect.height));
  };

  useEffect(() => {
    if (!sheetData.length || selectedColumns.length === 0) {
      setKpiMetrics({ total: 0, avg: 0, max: 0, min: 0 });
      return;
    }
    const numbers = sheetData.slice(1).flatMap((row) =>
      selectedColumns.map((i) => {
        const v = row[i];
        if (!v) return 0;
        const n = Number(String(v).replace(/[, ]+/g, ""));
        return isNaN(n) ? 0 : n;
      })
    );
    if (!numbers.length) {
      setKpiMetrics({ total: 0, avg: 0, max: 0, min: 0 });
      return;
    }
    const total = numbers.reduce((a, b) => a + b, 0);
    const avg = total / numbers.length;
    const max = Math.max(...numbers);
    const min = Math.min(...numbers);
    setKpiMetrics({ total, avg, max, min });
  }, [selectedColumns, sheetData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#fff" } }, tooltip: { mode: "index", intersect: false } },
    scales: { x: { ticks: { color: "#d1d5db" } }, y: { ticks: { color: "#d1d5db" } } },
  };

  const generateCharts = () => {
    if (!sheetData.length || selectedColumns.length === 0) return null;
    const labels = sheetData.slice(1).map((r) => r[0] || "");
    return selectedColumns.map((colIndex) => {
      const label = sheetData[0][colIndex] || `Column ${colIndex + 1}`;
      const values = sheetData.slice(1).map((r) => {
        const v = r[colIndex];
        if (!v) return 0;
        const cleaned = String(v).replace(/[, ]+/g, "");
        return isNaN(Number(cleaned)) ? 0 : Number(cleaned);
      });
      const isRevenue = String(label).toLowerCase().includes("revenue");

      return (
        <div key={colIndex} className="rounded-2xl shadow-xl p-4 bg-gradient-to-br from-purple-800/80 to-indigo-800/80" style={{ height: 200 }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm md:text-base font-semibold text-white truncate">{label}</h4>
            <div className="text-xs text-white/70">{isRevenue ? "Revenue" : "Metric"}</div>
          </div>
          <div style={{ height: 140 }}>
            {isRevenue ? (
              <Line
                data={{ labels, datasets: [{ label, data: values, borderColor: "rgba(20,229,184,0.95)", backgroundColor: "rgba(20,229,184,0.12)", tension: 0.3, fill: true }] }}
                options={chartOptions}
              />
            ) : (
              <Bar
                data={{ labels, datasets: [{ label, data: values, backgroundColor: "rgba(124,58,237,0.9)" }] }}
                options={chartOptions}
              />
            )}
          </div>
        </div>
      );
    });
  };

  const handleGenerateSummary = async () => {
    if (!profile || !sheetData.length) return;
    try {
      const res = await axios.post("https://ai-data-analyst-backend-1nuw.onrender.com/analyze-dataset", {
        user_id: profile.user_id,
        dataset: sheetData,
        mode: "summary",
      });
      setSummary(res.data.summary || "No summary returned.");
      setChatMessages((m) => [...m, { role: "ai", text: res.data.summary || "No summary returned.", ts: Date.now() }]);
    } catch {
      setSummary("Failed to generate summary.");
    }
  };

  const handleSendChat = async () => {
    const q = (chatInput || "").trim();
    if (!q || !profile || !sheetData.length) return;
    const userMsg = { role: "user", text: q, ts: Date.now() };
    setChatMessages((m) => [...m, userMsg]);
    setChatInput("");
    setAiLoading(true);
    try {
      const res = await axios.post("https://ai-data-analyst-backend-1nuw.onrender.com/analyze-dataset", {
        user_id: profile.user_id,
        dataset: sheetData,
        question: q,
      });
      const aiText = res.data?.summary || res.data?.answer || "No response from AI.";
      setChatMessages((m) => [...m, { role: "ai", text: aiText, ts: Date.now() }]);
    } catch {
      setChatMessages((m) => [...m, { role: "ai", text: "AI failed to respond.", ts: Date.now() }]);
    } finally {
      setAiLoading(false);
      setTimeout(updateRightPanelHeightImmediate, 200);
    }
  };

  const handleEnter = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const fmt = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05060a] via-[#0b0f1a] to-[#1f1336] p-6 text-white">
      {/* Header */}
      <div className="rounded-2xl mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 backdrop-blur-sm">
          <button
            onClick={() => navigate("/analytics", { state: { profile } })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 hover:bg-black/55 transition"
          >
            <MdArrowBack size={20} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-center tracking-tight">Google Sheets Analysis</h1>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start">
        <div className="flex-1 flex gap-3 items-center">
          <select value={selectedSheet} onChange={handleSelectSheet} className="w-full p-3 rounded-lg text-black font-semibold shadow-inner">
            <option value="">Select a datasheet</option>
            {sheets.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={handleInterpretData}
            disabled={!selectedSheet || loadingSheetValues}
            className={`px-5 py-3 rounded-lg font-semibold transition ${selectedSheet ? "bg-gradient-to-r from-[#06b6d4] to-[#6b46ff]" : "bg-gray-700/50 cursor-not-allowed"}`}
          >
            {loadingSheetValues ? "Loading…" : "Interpret Data"}
          </button>
        </div>
        {/* Numeric Columns Selection */}
{numericColumns.length > 0 && showAnalytics && (
  <div className="flex flex-wrap gap-2 mt-4">
    {numericColumns.map((colIndex) => {
      const colName = sheetData[0][colIndex] || `Column ${colIndex + 1}`;
      return (
        <label key={colIndex} className="flex items-center gap-1 px-3 py-1 bg-black/30 rounded-lg cursor-pointer select-none">
          <input
            type="checkbox"
            checked={selectedColumns.includes(colIndex)}
            onChange={(e) => {
              if (e.target.checked) setSelectedColumns((prev) => [...prev, colIndex]);
              else setSelectedColumns((prev) => prev.filter((i) => i !== colIndex));
            }}
            className="accent-teal-400"
          />
          <span className="text-sm text-gray-200">{colName}</span>
        </label>
      );
    })}
  </div>
)}

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 bg-black/30 rounded-lg cursor-pointer select-none">
            <input type="checkbox" checked={showPreview} onChange={() => setShowPreview((s) => !s)} className="accent-teal-400" />
            <span className="text-sm text-gray-200">Preview</span>
            <span>{showPreview ? <FiEye className="ml-2" /> : <FiEyeOff className="ml-2" />}</span>
          </label>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT: Preview + KPIs + Charts */}
        <main className="flex-1 space-y-6">
          {/* Adaptive Table */}
          {showPreview && sheetData.length > 0 && (
            <section className="bg-gradient-to-br from-black/40 to-black/30 rounded-2xl shadow-2xl border border-white/6 overflow-auto max-w-full">
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/6">
                <h2 className="text-lg font-semibold">Data Preview</h2>
                <span className="text-xs text-gray-400">{sheetData.length} rows</span>
              </div>
              <div className="overflow-x-auto max-w-full">
                <table className="border-collapse text-white" style={{ tableLayout: "fixed", width: "100%" }}>
                  <tbody>
                    {sheetData.map((row, i) => (
                      <tr key={i} className="border-b border-white/8 hover:bg-gray-800/30 transition">
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1 border-r border-white/8 truncate">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* KPIs */}
          {showAnalytics && (
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#0ea5a6]/80 to-[#7c3aed]/70 shadow-lg flex items-center gap-3">
                <MdAttachMoney size={26} />
                <div>
                  <div className="text-xs text-gray-300">Total</div>
                  <div className="text-xl font-bold">{kpiMetrics.total.toLocaleString()}</div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#06b6d4]/80 to-[#7c3aed]/70 shadow-lg flex items-center gap-3">
                <MdNumbers size={26} />
                <div>
                  <div className="text-xs text-gray-300">Average</div>
                  <div className="text-xl font-bold">{kpiMetrics.avg.toLocaleString()}</div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#6366f1]/80 to-[#7c3aed]/70 shadow-lg flex items-center gap-3">
                <MdTrendingUp size={26} />
                <div>
                  <div className="text-xs text-gray-300">Max</div>
                  <div className="text-xl font-bold">{kpiMetrics.max.toLocaleString()}</div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#a78bfa]/70 to-[#7c3aed]/60 shadow-lg flex items-center gap-3">
                <MdSpeed size={26} />
                <div>
                  <div className="text-xs text-gray-300">Min</div>
                  <div className="text-xl font-bold">{kpiMetrics.min.toLocaleString()}</div>
                </div>
              </div>
            </section>
          )}

          {/* Charts */}
          {showAnalytics && <section className="grid grid-cols-1 md:grid-cols-2 gap-6">{generateCharts()}</section>}
        </main>

        {/* RIGHT: AI Chat */}
        <aside className="w-full md:w-96 flex flex-col bg-black/40 rounded-2xl p-4 shadow-xl backdrop-blur-lg overflow-hidden" ref={rightPanelRef}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><MdChat /> AI Chat</h3>
            <button onClick={() => setChatMessages([])} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg transition">Clear</button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 mb-2">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`mb-2 p-2 rounded-lg max-w-full break-words ${msg.role === "ai" ? "bg-purple-800/60 text-white ml-auto" : "bg-teal-600/70 text-white mr-auto"}`}>
                <div>{msg.text}</div>
                <div className="text-xs text-gray-300 mt-1 text-right">{fmt(msg.ts)}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <textarea
              className="flex-1 p-2 rounded-lg bg-black/50 text-white placeholder-gray-400 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Ask AI about your data..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleEnter}
            />
            <button
              onClick={handleSendChat}
              className={`px-4 py-2 rounded-lg font-semibold transition ${aiLoading ? "bg-gray-700 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-teal-400"}`}
              disabled={aiLoading}
            >
              {aiLoading ? "..." : "Send"}
            </button>
          </div>
        </aside>
      </div>

      {/* AI Summary */}
      {showAnalytics && summary && (
        <section className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-purple-800/70 to-indigo-800/70 shadow-xl text-white">
          <h4 className="font-semibold mb-2">AI Summary</h4>
          <p>{summary}</p>
        </section>
      )}
    </div>
  );
}
