// src/pages/Analytics.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FiDownload, FiUpload } from "react-icons/fi";
import { MdOutlineAnalytics, MdFilterList } from "react-icons/md";
import axios from "axios";
import { useNavigate } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

function KpiTile({ title, value, subtitle, sparkData, sparkType = "line" }) {
  const sparkOptions = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { point: { radius: 0 } },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
  };

  const sparkProps = {
    labels: sparkData ? sparkData.map((_, i) => i) : [],
    datasets: [
      {
        data: sparkData || [0],
        borderColor: "rgba(167,139,250,0.95)",
        backgroundColor: "rgba(167,139,250,0.12)",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="rounded-2xl p-4 shadow-xl" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.7), rgba(8,10,20,0.55))", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-300">{title}</div>
          <div className="text-2xl font-semibold text-white">{value}</div>
          {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
        </div>
        <div className="w-28 h-12">
          {sparkType === "line" ? <Line data={sparkProps} options={sparkOptions} /> : <Bar data={sparkProps} options={sparkOptions} />}
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const profile = JSON.parse(localStorage.getItem("adt_profile") || "null") || { user_id: "test-user" };

  const [showModal, setShowModal] = useState(false);
  const [selectedApps, setSelectedApps] = useState([]);
  const [sheetsList, setSheetsList] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [csvToImport, setCsvToImport] = useState(null);
  const [loadingSheetValues, setLoadingSheetValues] = useState(false);

  const [sheetData, setSheetData] = useState([]);
  const [numericCols, setNumericCols] = useState([]);
  const [chartType, setChartType] = useState("line");
  const [kpis, setKpis] = useState({});
  const [categories, setCategories] = useState({ labels: [], data: [] });
  const [recentRows, setRecentRows] = useState([]);
  const [aiText, setAiText] = useState("AI insights will appear here once generated.");
  const rightPanelRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(220);

  function sanitizeCellValue(value) {
    if (value === null || value === undefined || value === "") return "";
    const str = String(value).trim();
    const datePattern1 = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
    const datePattern2 = /^\d{4}-\d{2}-\d{2}$/;
    const datePattern3 = /^\d{1,2}-\d{1,2}-\d{2,4}$/;
    if (datePattern1.test(str) || datePattern2.test(str) || datePattern3.test(str)) return str;
    const numericStr = str.replace(/[^0-9.-]/g, "");
    if (numericStr && !isNaN(Number(numericStr))) return Number(numericStr);
    return str;
  }

  const detectNumericColumns = (values) => {
    if (!values || !values.length) return [];
    return values[0]
      .map((h, colIndex) => {
        const sampleVals = values.slice(1, 6).map((r) => r[colIndex]);
        const isNumeric = sampleVals.some((v) => !isNaN(sanitizeCellValue(v)));
        return isNumeric ? colIndex : null;
      })
      .filter((i) => i !== null);
  };

  const parseCSVFile = async (file) => {
    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(Boolean);
    if (!rows.length) return [];
    return rows.map((r) => r.split(",").map((c) => c.trim()));
  };

  useEffect(() => {
    if (!showModal || !selectedApps.includes("google_sheets")) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/sheets-list/${profile.user_id}`);
        if (!cancelled) setSheetsList(res.data.sheets || []);
      } catch {
        if (!cancelled) setSheetsList([]);
      }
    })();
    return () => (cancelled = true);
  }, [showModal, selectedApps, profile.user_id]);

  const importSelected = async () => {
    const importedRows = [];
    for (const key of selectedApps) {
      if (key === "google_sheets") {
        if (!selectedSheet) continue;
        try {
          setLoadingSheetValues(true);
          const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/sheets/${profile.user_id}/${selectedSheet}`);
          const values = res.data.values || [];
          if (values.length) importedRows.push(...values);
        } catch (err) {
          console.error("sheet fetch failed", err);
        } finally {
          setLoadingSheetValues(false);
        }
      } else if (key === "other" && csvToImport) {
        try {
          const values = await parseCSVFile(csvToImport);
          if (values.length) importedRows.push(...values);
        } catch (err) {
          console.error("csv parse failed", err);
        }
      }
    }

    if (!importedRows.length) {
      setShowModal(false);
      setSelectedApps([]);
      setSelectedSheet("");
      setCsvToImport(null);
      return;
    }

    const cleaned = importedRows.map((row, idx) => (idx === 0 ? row : row.map((cell) => sanitizeCellValue(cell))));
    setSheetData(cleaned);
    const numeric = detectNumericColumns(cleaned);
    setNumericCols(numeric);
    computeKpis(cleaned, numeric);

    const headers = cleaned[0] || [];
    const asObjects = cleaned.slice(1).map((r, idx) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h || `col${i}`] = r[i] ?? ""));
      obj._id = `r-${idx}-${Math.random().toString(36).slice(2, 6)}`;
      return obj;
    });
    setRecentRows(asObjects.slice(-12).reverse());

    setShowModal(false);
    setSelectedApps([]);
    setSelectedSheet("");
    setCsvToImport(null);
  };

  const computeKpis = (values, numericIndexes) => {
    if (!values.length || !numericIndexes.length) {
      setKpis({});
      setCategories({ labels: [], data: [] });
      return;
    }

    const headers = values[0];
    const k = {};
    numericIndexes.forEach((colIndex) => {
      const colName = headers[colIndex] || `col_${colIndex}`;
      const arr = values.slice(1).map((r) => {
        const v = r[colIndex];
        const n = sanitizeCellValue(v);
        return isNaN(n) ? 0 : n;
      });
      const total = arr.reduce((a, b) => a + b, 0);
      const avg = arr.length ? total / arr.length : 0;
      const max = arr.length ? Math.max(...arr) : 0;
      const min = arr.length ? Math.min(...arr) : 0;
      const spark = arr.slice(-12);
      k[colName] = { total, avg, max, min, spark };
    });

    const firstStringIndex = values[0].findIndex((_, i) => !numericIndexes.includes(i) && i !== 0);
    if (firstStringIndex >= 0) {
      const byCat = {};
      values.slice(1).forEach((r) => {
        const cat = r[firstStringIndex] || "Unknown";
        const weightIndex = numericIndexes[0];
        const weight = weightIndex !== undefined ? sanitizeCellValue(r[weightIndex]) : 1;
        byCat[cat] = (byCat[cat] || 0) + (isNaN(Number(weight)) ? 0 : Number(weight));
      });
      const labels = Object.keys(byCat);
      const data = labels.map((l) => byCat[l]);
      setCategories({ labels, data });
    } else setCategories({ labels: [], data: [] });

    setKpis(k);
  };

  const generateCharts = () => {
    if (!sheetData.length || !numericCols.length) return null;
    const labels = sheetData.slice(1).map((r) => (r[0] === undefined || r[0] === null ? "" : String(r[0])));
    return numericCols.map((colIndex, i) => {
      const label = sheetData[0][colIndex] || `col ${colIndex}`;
      const dataSeries = sheetData.slice(1).map((r) => {
        const v = r[colIndex];
        const n = sanitizeCellValue(v);
        return isNaN(n) ? 0 : n;
      });
      const chartData = {
        labels,
        datasets: [
          {
            label,
            data: dataSeries,
            borderColor: "rgba(167,139,250,0.95)",
            backgroundColor: chartType === "bar" ? "rgba(167,139,250,0.18)" : "rgba(167,139,250,0.06)",
            tension: 0.35,
            fill: chartType !== "bar",
          },
        ],
      };
      return (
        <div key={i} className="rounded-2xl p-4 shadow-lg" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.65), rgba(6,8,18,0.45))" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-300">{label}</div>
              <div className="text-xs text-gray-400">Auto chart — {chartType}</div>
            </div>
            <div className="text-xs text-gray-400">values: {dataSeries.length}</div>
          </div>
          <div style={{ height: chartHeight }}>
            {chartType === "line" ? <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /> : <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
          </div>
        </div>
      );
    });
  };

  // -------------------------------
  // 🔥 AI INSIGHTS w/ AUTOSCROLL 🔥
  // -------------------------------
  const generateAIInsights = async () => {
    if (!sheetData.length || !Object.keys(kpis).length) {
      setAiText("No data or metrics available to analyze.");
      return;
    }

    setAiText("Generating insights…");

    try {
      const payload = { kpis, categories, rowCount: sheetData.length - 1 };
      const res = await axios.post(
        "https://ai-data-analyst-backend-1nuw.onrender.com/ai/analyze",
        payload
      );

      const insights = res.data.analysis || "No insights returned.";
      setAiText(insights);

      // auto-scroll to bottom
      setTimeout(() => {
        if (rightPanelRef.current) {
          rightPanelRef.current.scrollTop = rightPanelRef.current.scrollHeight;
        }
      }, 50);
    } catch (err) {
      console.error(err);
      setAiText("Failed to generate insights from backend.");
    }
  };

  const exportCSV = () => {
    if (!sheetData.length) return;
    const csv = sheetData.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w < 640) setChartHeight(190);
      else if (w < 1024) setChartHeight(220);
      else setChartHeight(260);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(180deg,#0b0f1a,#120827)" }}>
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-3xl font-bold text-white flex items-center gap-3">
            <MdOutlineAnalytics size={28} /> Analytics
          </div>
          <div className="text-sm text-gray-400">Cross-source analysis · merge Sheets, CSV, Stripe and more</div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="px-3 py-2 rounded-lg bg-gray-800 text-white border border-white/6 flex items-center gap-2">
            <FiDownload /> Export
          </button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-black font-semibold">Import</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.keys(kpis).length ? (
          Object.entries(kpis).slice(0, 4).map(([name, m]) => (
            <KpiTile
              key={name}
              title={name}
              value={typeof m.total === "number" ? m.total.toLocaleString() : m.total}
              subtitle={`Avg ${Math.round(m.avg).toLocaleString()} • Max ${m.max.toLocaleString()}`}
              sparkData={m.spark || []}
            />
          ))
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 shadow-xl" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.7), rgba(8,10,20,0.55))" }}>
              <div className="text-xs text-gray-300">Import data</div>
              <div className="text-2xl font-semibold text-white">—</div>
              <div className="text-xs text-gray-400 mt-1">No data yet</div>
            </div>
          ))
        )}
      </div>

      {/* Charts + AI panel */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-300">Charts</div>
              <div className="text-xs text-gray-400">Two per row • auto-generated</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setChartType("line")} className={`px-3 py-1 rounded ${chartType === "line" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-200"}`}>Line</button>
              <button onClick={() => setChartType("bar")} className={`px-3 py-1 rounded ${chartType === "bar" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-200"}`}>Bar</button>
              <button
                onClick={generateAIInsights}
                className="px-3 py-1 rounded bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-black text-sm"
              >
                Generate Insights
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{generateCharts()}</div>

          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.6), rgba(6,8,18,0.45))" }}>
            <div className="text-sm text-gray-300 mb-2">Recently imported rows</div>
            <div className="overflow-x-auto">
              <table className="table-auto w-full text-left text-gray-200 text-xs">
                <thead>
                  <tr>{sheetData[0]?.map((h, i) => <th key={i} className="px-2 py-1">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {recentRows.map((row) => (
                    <tr key={row._id}>
                      {sheetData[0].map((h, i) => (
                        <td key={i} className="px-2 py-1">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right AI panel */}
        <div ref={rightPanelRef} className="col-span-12 lg:col-span-4 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.65), rgba(6,8,18,0.45))" }}>
            <div className="text-sm text-gray-300 mb-2">AI Insights</div>
            <div className="text-xs text-gray-400 whitespace-pre-wrap">{aiText}</div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 rounded-2xl p-6 w-11/12 max-w-xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold text-white">Import Data</div>
              <button onClick={() => setShowModal(false)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" value="google_sheets" checked={selectedApps.includes("google_sheets")} onChange={(e) => setSelectedApps((prev) => e.target.checked ? [...prev, "google_sheets"] : prev.filter((v) => v !== "google_sheets"))} />
                Google Sheets
              </label>
              {selectedApps.includes("google_sheets") && (
                <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white">
                  <option value="">Select sheet</option>
                  {sheetsList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
              <label className="flex items-center gap-2">
                <input type="checkbox" value="other" checked={selectedApps.includes("other")} onChange={(e) => setSelectedApps((prev) => e.target.checked ? [...prev, "other"] : prev.filter((v) => v !== "other"))} />
                CSV / File
              </label>
              {selectedApps.includes("other") && <input type="file" accept=".csv" onChange={(e) => setCsvToImport(e.target.files?.[0] || null)} className="w-full text-gray-300" />}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-gray-700 text-white">Cancel</button>
              <button onClick={importSelected} className="px-4 py-2 rounded bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-black font-semibold">{loadingSheetValues ? "Importing…" : "Import"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  