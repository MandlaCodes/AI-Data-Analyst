// src/pages/Analytics.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Line, Bar } from "react-chartjs-2";
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
import { FiUpload, FiDatabase, FiFileText, FiSearch, FiDownload, FiZap } from "react-icons/fi";
import { MdArrowBack, MdTrendingUp, MdAttachMoney, MdSpeed, MdNumbers } from "react-icons/md";
import axios from "axios";
import { useNavigate } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function Analytics() {
  const navigate = useNavigate();
  const profile = JSON.parse(localStorage.getItem("adt_profile") || "null");

  // Modal and imports
  const [showModal, setShowModal] = useState(false);
  const [selectedApps, setSelectedApps] = useState([]);

  // Google Sheets states
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [loadingSheetValues, setLoadingSheetValues] = useState(false);

  // Analytics states
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [numericColumns, setNumericColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [kpiMetrics, setKpiMetrics] = useState({ total: 0, avg: 0, max: 0, min: 0 });
  const [chartType, setChartType] = useState("line");
  const rightPanelRef = useRef(null);
  const [rightPanelHeight, setRightPanelHeight] = useState(640);
  const [chartHeight, setChartHeight] = useState(220);

  // Fetch sheets when modal opens
  useEffect(() => {
    if (!showModal || !profile) return;
    if (!selectedApps.includes("google_sheets")) return;

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
  }, [showModal, selectedApps, profile]);

  // Right panel height for charts
  const updateRightPanelHeightImmediate = () => {
    if (!rightPanelRef.current) return;
    const rect = rightPanelRef.current.getBoundingClientRect();
    setRightPanelHeight(Math.floor(rect.height));
  };

  useEffect(() => {
    window.addEventListener("resize", updateRightPanelHeightImmediate);
    return () => window.removeEventListener("resize", updateRightPanelHeightImmediate);
  }, []);

  useEffect(() => {
    const chartsCount = Math.max(1, selectedColumns.length);
    const reserved = 220;
    const available = Math.max(320, rightPanelHeight - reserved);
    const h = Math.max(120, Math.floor(available / chartsCount) - 18);
    setChartHeight(h);
  }, [rightPanelHeight, selectedColumns.length]);

  // Handle sheet selection
  const handleSelectSheet = (e) => {
    setSelectedSheet(e.target.value);
    setSheetData([]);
    setShowAnalytics(false);
    setNumericColumns([]);
    setSelectedColumns([]);
  };

  // Import apps (including Google Sheets)
  const importSelectedApps = async () => {
    for (const appId of selectedApps) {
      if (appId === "google_sheets") {
        if (!selectedSheet) continue;
        try {
          setLoadingSheetValues(true);
          const res = await axios.get(
            `https://ai-data-analyst-backend-1nuw.onrender.com/sheets/${profile.user_id}/${selectedSheet}`
          );
          const values = res.data.values || [];
          setSheetData(values);

          // Determine numeric columns
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
        } catch {
          setSheetData([]);
          setShowAnalytics(false);
        } finally {
          setLoadingSheetValues(false);
        }
      }
    }

    setShowModal(false);
    setSelectedApps([]);
    setSelectedSheet("");
    updateRightPanelHeightImmediate();
  };

  // Calculate KPI metrics
  useEffect(() => {
    if (!sheetData.length || !selectedColumns.length) {
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
    if (!sheetData.length || !selectedColumns.length) return null;
    const labels = sheetData.slice(1).map((r) => r[0] || "");
    return selectedColumns.map((colIndex) => {
      const label = sheetData[0][colIndex] || `Column ${colIndex + 1}`;
      const values = sheetData.slice(1).map((r) => {
        const v = r[colIndex];
        if (!v) return 0;
        const cleaned = String(v).replace(/[, ]+/g, "");
        return isNaN(Number(cleaned)) ? 0 : Number(cleaned);
      });
      const commonProps = {
        labels,
        datasets: [{ label, data: values, fill: chartType === "area", backgroundColor: "rgba(124,58,237,0.6)", borderColor: "#8f8bff", tension: 0.3 }],
      };
      return (
        <div key={colIndex} className="rounded-2xl shadow-xl p-4 bg-gradient-to-br from-purple-800/80 to-indigo-800/80" style={{ height: chartHeight }}>
          {chartType === "line" && <Line data={commonProps} options={chartOptions} />}
          {chartType === "bar" && <Bar data={commonProps} options={chartOptions} />}
          {chartType === "area" && <Line data={commonProps} options={{ ...chartOptions, elements: { line: { tension: 0.4 }, point: { radius: 0 } } }} />}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05060a] via-[#0b0f1a] to-[#1f1336] p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate("/")} className="px-3 py-2 rounded-lg bg-black/40 hover:bg-black/55 transition">Back</button>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-gradient-to-r from-[#06b6d4] to-[#6b46ff] rounded-lg font-semibold">Import Apps</button>
      </div>

      {/* Charts + KPIs */}
      {showAnalytics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#8b5cf6]/80 to-[#7c3aed]/70 shadow-lg flex items-center gap-3">
              <MdSpeed size={26} />
              <div>
                <div className="text-xs text-gray-300">Min</div>
                <div className="text-xl font-bold">{kpiMetrics.min.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">{generateCharts()}</div>
        </>
      )}

      {/* Import Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-[#0c0c16] p-6 rounded-xl w-[90%] max-w-lg">
            <h2 className="text-xl font-bold mb-4">Import Apps</h2>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" value="google_sheets" checked={selectedApps.includes("google_sheets")} onChange={(e) => {
                  if (e.target.checked) setSelectedApps((prev) => [...prev, "google_sheets"]);
                  else setSelectedApps((prev) => prev.filter((x) => x !== "google_sheets"));
                }} />
                Google Sheets
              </label>
              {/* Sheets dropdown */}
              {selectedApps.includes("google_sheets") && (
                <select value={selectedSheet} onChange={handleSelectSheet} className="p-2 rounded-lg text-black">
                  <option value="">Select a Google Sheet</option>
                  {sheets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-gray-700">Cancel</button>
              <button onClick={importSelectedApps} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#06b6d4] to-[#6b46ff]">{loadingSheetValues ? "Loading…" : "Import Selected"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
