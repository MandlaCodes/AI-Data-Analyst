// src/pages/Analytics.jsx - Cross-Analysis Mode (Dark Hybrid - Glass on Matte)
import React, { useState, useEffect, useRef } from "react";
import { Line, Bar } from "react-chartjs-2";
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
  Filler
} from "chart.js";
import { FiDownload, FiUploadCloud, FiRefreshCw, FiSave, FiPlus, FiX, FiLayers } from "react-icons/fi";
import { MdOutlineAnalytics, MdCompareArrows } from "react-icons/md";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ---------- Helper Components ----------
function DatasetCard({ dataset, isActive, onToggle, onRemove }) {
  return (
    <div
      className={`relative rounded-xl p-4 cursor-pointer transition-all border-2 ${
        isActive
          ? "border-purple-400 shadow-2xl"
          : "border-gray-700 hover:border-gray-600"
      }`}
      style={{
        background: isActive
          ? "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(139,92,246,0.03))"
          : "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.25))",
        backdropFilter: "blur(6px)"
      }}
      onClick={onToggle}
    >
      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-300"
          title="Remove dataset"
        >
          <FiX size={14} />
        </button>
      )}

      <div className="flex items-start justify-between mb-2">
        <div
          className="w-3 h-3 rounded-full mr-3 mt-1"
          style={{ backgroundColor: dataset.color }}
        />
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">{dataset.name}</div>
          <div className="text-xs text-gray-400 mt-1">
            {dataset.rows} rows • {dataset.cols} columns
          </div>
        </div>
      </div>

      {isActive && (
        <div className="text-xs text-purple-300 mt-2 font-medium select-none">
          ✓ Active in comparison
        </div>
      )}
    </div>
  );
}

function MetricComparisonCard({ title, datasets }) {
  // Ensure we have at least one valid number for comparison
  const values = datasets.map(d => d.value).filter(v => typeof v === 'number');
  const datasetsToRender = datasets.filter(d => d.value !== undefined && d.value !== null);

  // Calculate variance percentage between the first two available datasets
  const d1 = datasetsToRender[0]?.value;
  const d2 = datasetsToRender[1]?.value;

  const variance = d1 !== undefined && d2 !== undefined && d1 !== 0
    ? (((d2 - d1) / d1) * 100).toFixed(1)
    : '—';
  
  const isPositive = d1 !== undefined && d2 !== undefined ? d2 > d1 : true;

  return (
    <div
      className="rounded-xl p-5 shadow-xl"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(10,12,18,0.55))",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(167,139,250,0.06)"
      }}
    >
      <div className="text-sm font-semibold text-gray-300 mb-4">{title}</div>
      <div className="space-y-3">
        {datasetsToRender.map((ds, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ds.color }}
              />
              <span className="text-xs text-gray-400">{ds.name}</span>
            </div>
            <span className="text-lg font-bold text-white">
              {typeof ds.value === "number" ? ds.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : ds.value}
            </span>
          </div>
        ))}
      </div>

      {datasetsToRender.length > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Variance (vs. {datasetsToRender[0].name})</span>
            <span
              className={`font-semibold ${
                isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {variance}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Main Component ----------
export default function Analytics() {
  const profile = JSON.parse(localStorage.getItem("adt_profile") || "null") || { user_id: "test-user" };

  // modal + import
  const [showModal, setShowModal] = useState(false);
  const [selectedApps, setSelectedApps] = useState([]);
  const [sheetsList, setSheetsList] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [csvToImport, setCsvToImport] = useState(null);
  const [loadingSheetValues, setLoadingSheetValues] = useState(false);

  // datasets
  const [allDatasets, setAllDatasets] = useState([]);
  const [activeDatasets, setActiveDatasets] = useState([]);
  const [chartType, setChartType] = useState("line");
  const [showSavedToast, setShowSavedToast] = useState(false);

  const datasetColors = ["rgba(167,139,250,0.92)", "rgba(34,197,94,0.92)", "rgba(249,115,22,0.92)", "rgba(234,179,8,0.92)"];

  // ---------- Utilities (LOGIC KEPT IDENTICAL) ----------
  function sanitizeCellValue(value) {
    if (value === null || value === undefined || value === "") return "";
    const str = String(value).trim();
    // dates
    const datePattern1 = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
    const datePattern2 = /^\d{4}-\d{2}-\d{2}$/;
    const datePattern3 = /^\d{1,2}-\d{1,2}-\d{2,4}$/;
    if (datePattern1.test(str) || datePattern2.test(str) || datePattern3.test(str)) return str;
    // numeric attempt
    const numericStr = str.replace(/[^0-9.-]/g, "");
    if (numericStr && !isNaN(Number(numericStr))) return Number(numericStr);
    return str;
  }

  const detectNumericColumns = (values) => {
    if (!values || !values.length) return [];
    return values[0]
      .map((_, colIndex) => {
        const sampleVals = values.slice(1, 6).map((r) => r[colIndex]);
        const isNumeric = sampleVals.some((v) => {
          const n = sanitizeCellValue(v);
          return typeof n === "number" && !isNaN(n);
        });
        return isNumeric ? colIndex : null;
      })
      .filter((i) => i !== null);
  };

  const parseCSVFile = async (file) => {
    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(Boolean);
    if (!rows.length) return [];
    return rows.map((r) =>
      // basic CSV split - preserves simple CSVs (no complex quoting)
      r.split(",").map((c) => c.trim())
    );
  };

  const computeMetrics = (values, numericIndexes) => {
    if (!values.length || !numericIndexes.length) return {};
    const headers = values[0];
    const metrics = {};

    numericIndexes.forEach((colIndex) => {
      const colName = headers[colIndex] || `col_${colIndex}`;
      const arr = values.slice(1).map((r) => {
        const v = r[colIndex];
        const n = sanitizeCellValue(v);
        return typeof n === "number" && !isNaN(n) ? n : 0;
      });
      const total = arr.reduce((a, b) => a + b, 0);
      const avg = arr.length ? total / arr.length : 0;
      const max = arr.length ? Math.max(...arr) : 0;
      const min = arr.length ? Math.min(...arr) : 0;
      metrics[colName] = { total, avg, max, min };
    });

    return metrics;
  };

  // ---------- Fetch sheet list when modal opens (LOGIC CONFIRMED) ----------
  useEffect(() => {
    if (!showModal || !selectedApps.includes("google_sheets")) return;
    let cancelled = false;
    (async () => {
      try {
        // AXIOS CALL TO FETCH SHEETS LIST
        const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/sheets-list/${profile.user_id}`);
        if (!cancelled) setSheetsList(res.data.sheets || []);
      } catch {
        if (!cancelled) setSheetsList([]);
      }
    })();
    return () => (cancelled = true);
  }, [showModal, selectedApps, profile.user_id]);

  // ---------- Import selected apps (LOGIC CONFIRMED) ----------
  const importSelected = async () => {
    const importedRows = [];
    let sourceName = "Imported Dataset";

    for (const key of selectedApps) {
      if (key === "google_sheets") {
        if (!selectedSheet) continue;
        const sheet = sheetsList.find((s) => s.id === selectedSheet);
        sourceName = sheet ? sheet.name : sourceName;
        try {
          setLoadingSheetValues(true);
          // AXIOS CALL TO FETCH SHEET VALUES
          const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/sheets/${profile.user_id}/${selectedSheet}`);
          const values = res.data.values || [];
          if (values.length) importedRows.push(...values);
        } catch (err) {
          console.error("sheet fetch failed", err);
        } finally {
          setLoadingSheetValues(false);
        }
      } else if (key === "other" && csvToImport) {
        sourceName = (csvToImport.name || sourceName).replace(/\.csv$/i, "");
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

    // sanitize all rows: keep header unchanged, sanitize data rows
    const cleaned = importedRows.map((row, idx) => (idx === 0 ? row : row.map((cell) => sanitizeCellValue(cell))));
    const numeric = detectNumericColumns(cleaned);
    const metrics = computeMetrics(cleaned, numeric);

    const newDataset = {
      id: Date.now(),
      name: sourceName,
      color: datasetColors[allDatasets.length % datasetColors.length],
      rows: Math.max(0, cleaned.length - 1),
      cols: cleaned[0]?.length || 0,
      data: cleaned,
      numericCols: numeric,
      metrics
    };

    setAllDatasets((prev) => [...prev, newDataset]);
    setActiveDatasets((prev) => [...prev, newDataset]);

    setShowModal(false);
    setSelectedApps([]);
    setSelectedSheet("");
    setCsvToImport(null);
  };

  // ---------- Dataset management (LOGIC KEPT IDENTICAL) ----------
  const toggleDataset = (dataset) => {
    if (activeDatasets.find((d) => d.id === dataset.id)) {
      setActiveDatasets((prev) => prev.filter((d) => d.id !== dataset.id));
    } else {
      setActiveDatasets((prev) => [...prev, dataset]);
    }
  };

  const removeDataset = (id) => {
    setAllDatasets((prev) => prev.filter((d) => d.id !== id));
    setActiveDatasets((prev) => prev.filter((d) => d.id !== id));
  };

  // ---------- Chart generator (LOGIC KEPT IDENTICAL) ----------
  const generateComparisonChart = () => {
    if (!activeDatasets.length) return null;

    // pick first numeric column from first dataset
    const firstDataset = activeDatasets[0];
    if (!firstDataset || !firstDataset.numericCols.length) return (
      <div className="text-center text-gray-400 py-6">No numeric columns available in selected datasets.</div>
    );

    const numericIndex = firstDataset.numericCols[0];
    const colLabel = firstDataset.data[0][numericIndex] || "Value";

    // labels: rows limited to 20 for readability
    const maxLength = Math.max(...activeDatasets.map((ds) => Math.max(0, ds.data.length - 1)));
    const visible = Math.min(maxLength, 20);
    const labels = Array.from({ length: visible }, (_, i) => `Row ${i + 1}`);

    const datasets = activeDatasets.map((ds) => {
      // Find the correct index for the common column, default to first numeric column
      let currentNumericIndex = ds.numericCols.includes(numericIndex) ? numericIndex : ds.numericCols[0];
      if (currentNumericIndex === undefined) currentNumericIndex = 0; // Fallback

      const series = ds.data.slice(1, visible + 1).map((row) => {
        const v = row[currentNumericIndex];
        const n = sanitizeCellValue(v);
        return typeof n === "number" && !isNaN(n) ? n : 0;
      });

      return {
        label: `${ds.name} — ${ds.data[0][currentNumericIndex] || colLabel}`,
        data: series,
        borderColor: ds.color,
        backgroundColor: ds.color.replace("0.92", "0.12"),
        tension: 0.35,
        fill: chartType === "line",
      };
    });

    const chartData = { labels, datasets };
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true, labels: { color: "#d1d5db" } },
        tooltip: { backgroundColor: "rgba(0,0,0,0.8)" }
      },
      scales: {
        x: { grid: { color: "rgba(75, 85, 99, 0.14)" }, ticks: { color: "#9ca3af" } },
        y: { grid: { color: "rgba(75, 85, 99, 0.14)" }, ticks: { color: "#9ca3af" } }
      }
    };

    return (
      <div style={{ height: 380 }}>
        {chartType === "line" ? (
          <Line data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    );
  };

  // ---------- Metrics generator (LOGIC KEPT IDENTICAL) ----------
  const generateMetricComparisons = () => {
    if (!activeDatasets.length) return [];

    const firstDataset = activeDatasets[0];
    const firstMetricKey = Object.keys(firstDataset.metrics || {})[0];
    if (!firstMetricKey) return [];

    const metricTypes = ["total", "avg", "max"];
    const comparisons = metricTypes.map((metricType) => {
      const datasets = activeDatasets.map((ds) => ({
        name: ds.name,
        color: ds.color,
        // Check if the metric exists before accessing the value
        value: ds.metrics[firstMetricKey]?.[metricType]
      }));
      return { title: `${firstMetricKey} (${metricType})`, datasets };
    });

    return comparisons;
  };

  const metricComparisons = generateMetricComparisons();

  // ---------- Save / Export (LOGIC KEPT IDENTICAL) ----------
  const handleSave = () => {
    if (!activeDatasets.length) return;

    const payload = {
      datasets: activeDatasets.map((ds) => ({
        name: ds.name,
        metrics: ds.metrics,
        rows: ds.rows,
        cols: ds.cols
      })),
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("analytics_comparison_data", JSON.stringify(payload));
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  const exportActive = () => {
    if (!activeDatasets.length) return;
    const rows = [];
    activeDatasets.forEach((ds) => {
      rows.push([`Dataset: ${ds.name}`]);
      rows.push(ds.data[0] || []);
      ds.data.slice(1).forEach((r) => rows.push(r));
      rows.push([]); // blank line
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparison_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(180deg,#071224,#08061a)" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-gray-800 gap-4">
        <div>
          <div className="text-3xl font-bold text-white flex items-center gap-3">
            <MdCompareArrows size={32} className="text-purple-400" /> Cross-Analysis Workspace
          </div>
          <div className="text-sm text-gray-400">
            Compare multiple datasets • {allDatasets.length} total • {activeDatasets.length} active
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold hover:from-green-700 transition flex items-center gap-2 disabled:opacity-50"
            disabled={!activeDatasets.length}
            title="Save comparison locally"
          >
            <FiSave /> Save Comparison
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold hover:from-indigo-700 transition flex items-center gap-2"
            title="Import dataset (Google Sheets / CSV)"
          >
            <FiPlus /> Add Dataset
          </button>

          <button
            onClick={exportActive}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:from-purple-700 transition flex items-center gap-2"
            disabled={!activeDatasets.length}
            title="Export active comparison CSV"
          >
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div
            className="rounded-xl p-5 sticky top-6"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(6,8,12,0.55))",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(167,139,250,0.04)"
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiLayers size={18} /> Datasets
              </h2>
            </div>

            <div className="text-xs text-gray-400 mb-3">Click to toggle dataset comparison</div>

            {allDatasets.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No datasets imported yet. Click "Add Dataset" to begin.
              </div>
            ) : (
              <div className="space-y-3">
                {allDatasets.map((dataset) => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    isActive={!!activeDatasets.find((d) => d.id === dataset.id)}
                    onToggle={() => toggleDataset(dataset)}
                    onRemove={() => removeDataset(dataset.id)}
                  />
                ))}
              </div>
            )}

            {activeDatasets.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-400 mb-2">Active Comparisons</div>
                <div className="text-2xl font-bold text-purple-400">{activeDatasets.length}</div>
              </div>
            )}
          </div>
        </div>

        {/* Main Area */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {activeDatasets.length === 0 ? (
            <div
              className="rounded-xl p-12 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(6,8,12,0.45))",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(167,139,250,0.03)"
              }}
            >
              <MdOutlineAnalytics size={48} className="text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Datasets Selected</h3>
              <p className="text-gray-500">Import and select datasets from the left panel to begin comparison</p>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(6,8,12,0.35))",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(167,139,250,0.03)"
                }}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">Chart Type:</span>
                    <button
                      onClick={() => setChartType("line")}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        chartType === "line" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      Line
                    </button>
                    <button
                      onClick={() => setChartType("bar")}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        chartType === "bar" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      Bar
                    </button>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <div className="text-xs text-gray-400">Showing {activeDatasets.length} dataset{activeDatasets.length !== 1 ? "s" : ""}</div>
                    <button onClick={() => { setActiveDatasets([]); setAllDatasets([]); }} className="text-xs text-red-400 hover:text-red-300">Clear all</button>
                  </div>
                </div>
              </div>

              {/* Metric Cards */}
              {metricComparisons.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {metricComparisons.map((metric, idx) => (
                    <MetricComparisonCard key={idx} {...metric} />
                  ))}
                </div>
              )}

              {/* Main Chart */}
              <div
                className="rounded-xl p-6 shadow-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(6,8,12,0.85), rgba(10,12,18,0.75))",
                  border: "1px solid rgba(167,139,250,0.04)"
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Dataset Comparison</h3>
                  <div className="text-xs text-gray-400">{activeDatasets.length} dataset{activeDatasets.length !== 1 ? "s" : ""}</div>
                </div>

                {generateComparisonChart()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Saved Toast */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 px-4 py-2 bg-green-600 rounded shadow text-white text-sm">
          Comparison saved successfully!
        </div>
      )}

      {/* Import Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div
            className="bg-gradient-to-b from-[#0b0f1a]/80 to-[#070612]/80 p-8 rounded-xl max-w-lg w-full shadow-2xl border border-purple-600/10"
            style={{ backdropFilter: "blur(10px)" }}
          >
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <FiUploadCloud /> Add New Dataset
            </h3>

            <div className="flex flex-col gap-3">
              <label className="text-gray-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  value="google_sheets"
                  checked={selectedApps.includes("google_sheets")}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedApps((prev) => (prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]));
                  }}
                />
                Google Sheets
              </label>

              {selectedApps.includes("google_sheets") && (
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="p-2 rounded bg-[#0b1220] text-white border border-gray-700 w-full"
                >
                  <option value="">{sheetsList.length ? "Select Sheet" : "Loading Sheets..."}</option>
                  {sheetsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}

              <label className="text-gray-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  value="other"
                  checked={selectedApps.includes("other")}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedApps((prev) => (prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]));
                  }}
                />
                Upload CSV
              </label>

              {selectedApps.includes("other") && (
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvToImport(e.target.files[0])}
                  className="text-white text-sm p-2 rounded bg-[#0b1220] w-full border border-gray-700"
                />
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedApps([]);
                  setSelectedSheet("");
                  setCsvToImport(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>

              <button
                onClick={importSelected}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg text-white font-semibold hover:from-purple-700 transition disabled:opacity-50"
                disabled={loadingSheetValues || selectedApps.length === 0 || (selectedApps.includes("google_sheets") && !selectedSheet) || (selectedApps.includes("other") && !csvToImport)}
              >
                {loadingSheetValues ? "Loading…" : "Import Dataset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}