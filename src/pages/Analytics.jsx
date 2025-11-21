import React, { useEffect, useState } from "react";
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
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function GoogleSheetsLogo({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#0F9D58" d="M3 3h12v7H3z" opacity="0.16"></path>
      <path fill="#0F9D58" d="M3 3h12v7H3z"></path>
      <path fill="#fff" d="M5 5h8v1H5zM5 8h8v1H5z" opacity="0.9"></path>
      <path fill="#0F9D58" d="M18 2h-1v20h1a1 1 0 001-1V3a1 1 0 00-1-1z"></path>
      <rect x="4" y="11.5" width="11" height="9" rx="1" fill="#f8fafc" opacity="0.04"></rect>
    </svg>
  );
}

export default function Analytics() {
  const userId = "123"; // TODO: replace with actual logged-in user ID
  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  const [connectedApps, setConnectedApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [numericColumns, setNumericColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);

  const [kpiMetrics, setKpiMetrics] = useState({ total: 0, avg: 0, max: 0, min: 0 });
  const [aiSummary, setAiSummary] = useState("");

  const [loadingSheets, setLoadingSheets] = useState(false);
  const [loadingSheetValues, setLoadingSheetValues] = useState(false);

  const [landingOpen, setLandingOpen] = useState(true);
  const [showNotConnectedModal, setShowNotConnectedModal] = useState(false);
  const [notConnectedAppName, setNotConnectedAppName] = useState("");
  const [progress, setProgress] = useState(0);

  // Fetch connected apps
  useEffect(() => {
    axios
      .get(`${BACKEND}/connected-apps?user_id=${userId}`)
      .then((res) => {
        const data = res.data || {};
        const apps = Object.entries(data)
          .filter(([k, v]) => k !== "google_sheets_last_sync" && v)
          .map(([k]) => k);
        setConnectedApps(apps);
      })
      .catch(() => setConnectedApps([]));
  }, []);

  // Fetch sheets when Google Sheets selected
  useEffect(() => {
    if (selectedApp === "google_sheets") {
      setLoadingSheets(true);
      axios
        .get(`${BACKEND}/sheets-list/${userId}`)
        .then((res) => setSheets(res.data.sheets || []))
        .catch(() => setSheets([]))
        .finally(() => setLoadingSheets(false));
    } else {
      setSheets([]);
      setSelectedSheet(null);
    }
  }, [selectedApp]);

  // Fetch sheet values
  const fetchSheetData = async () => {
    if (!selectedSheet) return;
    setLoadingSheetValues(true);
    setProgress(20);
    try {
      const res = await axios.get(`${BACKEND}/sheets/${userId}/${selectedSheet.id}`);
      const values = res.data.values || [];
      setSheetData(values);

      setProgress(60);
      if (values.length > 1) {
        const headers = values[0];
        const sample = values[1];
        const numericIndexes = headers
          .map((h, i) => {
            const v = sample[i];
            if (v === undefined || v === null) return null;
            const cleaned = String(v).replace(/[, ]+/g, "");
            return !isNaN(Number(cleaned)) && i !== 0 ? i : null;
          })
          .filter((i) => i !== null);
        setNumericColumns(numericIndexes);
        setSelectedColumns(numericIndexes);
      } else {
        setNumericColumns([]);
        setSelectedColumns([]);
      }

      setShowAnalytics(true);
      setLandingOpen(false);
      setTimeout(() => setProgress(100), 250);
      setTimeout(() => setProgress(0), 900);
    } catch (err) {
      console.error("Failed to fetch sheet values", err);
      setSheetData([]);
      setShowAnalytics(false);
      setProgress(0);
    } finally {
      setLoadingSheetValues(false);
    }
  };

  // KPI calculations
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
        <div key={colIndex} className="p-6 bg-gradient-to-br from-purple-800 to-indigo-800 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-4 text-white">{label}</h3>
          {isRevenue ? (
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label,
                    data: values,
                    borderColor: "rgba(34,197,94,1)",
                    backgroundColor: "rgba(34,197,94,0.3)",
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                  },
                ],
              }}
              options={{ responsive: true }}
            />
          ) : (
            <Bar
              data={{ labels, datasets: [{ label, data: values, backgroundColor: "rgba(99,102,241,0.8)", borderRadius: 6 }] }}
              options={{ responsive: true }}
            />
          )}
        </div>
      );
    });
  };

  const generateAIInsights = async () => {
    try {
      const res = await axios.post(`${BACKEND}/analyze-dataset`, {
        user_id: userId,
        app: selectedApp || "google_sheets",
        dataset: sheetData,
      });
      setAiSummary(res.data.summary || "No summary returned.");
    } catch (err) {
      console.error(err);
      setAiSummary("Failed to generate insights.");
    }
  };

  const handleAppClick = (key) => {
    if (!connectedApps.includes(key)) {
      setNotConnectedAppName(key === "google_sheets" ? "Google Sheets" : key);
      setShowNotConnectedModal(true);
      return;
    }
    setSelectedApp(key);
    setLandingOpen(false);
    setShowNotConnectedModal(false);
    setAiSummary("");
  };

  return (
    <div className="relative min-h-[80vh]">
      <div className="p-3 pt-5 space-y-5">
        <section id="analytics-top" className="space-y-2">
          <h2 className="text-4xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-gray-300 text-lg max-w-3xl">
            Create strategic business insights that enable confident, data-driven decisions.
          </p>
        </section>

        {/* Landing Cards */}
        <AnimatePresence>
          {landingOpen && (
            <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-1 p-6 bg-gradient-to-br from-indigo-800 to-purple-800 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-xl font-semibold text-white">Google Sheets</h3>
                <p className="text-gray-300">Connect and analyze spreadsheets stored in Google Drive.</p>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => handleAppClick("google_sheets")}
                    className={`p-3 rounded-xl cursor-pointer ${connectedApps.includes("google_sheets") ? "bg-white/6 hover:bg-white/10" : "bg-gray-700 opacity-70"}`}
                  >
                    <GoogleSheetsLogo className="w-10 h-10" />
                  </div>
                  <div className="flex-1 space-y-2">
                    {connectedApps.includes("google_sheets") ? (
                      <button
                        onClick={() => handleAppClick("google_sheets")}
                        className="px-4 py-2 bg-indigo-600 rounded-xl text-white font-semibold shadow"
                      >
                        Use Google Sheets
                      </button>
                    ) : (
                      <button
                        onClick={() => { setNotConnectedAppName("Google Sheets"); setShowNotConnectedModal(true); }}
                        className="px-4 py-2 bg-gray-700 rounded-xl text-gray-200"
                      >
                        Not connected
                      </button>
                    )}
                    <div className="text-xs text-gray-300">Last synced: —</div>
                  </div>
                </div>
              </div>

              {/* Placeholder Cards */}
              <div className="p-6 bg-gradient-to-br from-gray-800/70 to-gray-900 rounded-2xl shadow-xl flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">HubSpot (coming)</h3>
                  <p className="text-gray-400">CRM and contacts integration planned.</p>
                </div>
                <button className="px-4 py-2 bg-transparent border border-white/10 text-gray-300 rounded-xl mt-2">Learn more</button>
              </div>

              <div className="p-6 bg-gradient-to-br from-gray-800/70 to-gray-900 rounded-2xl shadow-xl flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Stripe (coming)</h3>
                  <p className="text-gray-400">Payments & revenue insights planned.</p>
                </div>
                <button className="px-4 py-2 bg-transparent border border-white/10 text-gray-300 rounded-xl mt-2">Learn more</button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Connected Apps + Sheet Picker */}
        <section className="space-y-6">
          <div className="p-6 bg-gray-800/40 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-white">Connected Apps</h3>
              <div className="text-gray-300 text-sm">Tap a logo to select source</div>
            </div>

            <div className="flex gap-6 items-center">
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleAppClick("google_sheets")} className={`p-4 rounded-xl transition ${selectedApp === "google_sheets" ? "bg-indigo-600" : "bg-gray-700"}`}>
                <GoogleSheetsLogo className="w-12 h-12" />
              </motion.button>
            </div>

            <AnimatePresence>
              {selectedApp === "google_sheets" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-4">
                  <h4 className="text-lg text-white font-semibold">Select Google Sheet</h4>
                  {loadingSheets ? (
                    <div className="p-4 bg-black/30 rounded-xl">Loading spreadsheets…</div>
                  ) : sheets.length === 0 ? (
                    <div className="p-4 bg-black/30 rounded-xl text-gray-400">No spreadsheets found. Check the Integrations page if you expected sheets.</div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedSheet?.id || ""}
                        onChange={(e) => { const found = sheets.find(s => s.id === e.target.value); setSelectedSheet(found || null); setAiSummary(""); }}
                        className="bg-gray-700 text-white px-4 py-2 rounded-xl"
                      >
                        <option value="">{selectedSheet ? selectedSheet.name : "Choose a spreadsheet…"}</option>
                        {sheets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>

                      {selectedSheet && !showAnalytics && (
                        <motion.button onClick={fetchSheetData} className="px-6 py-2 bg-green-600 rounded-xl text-white font-semibold hover:scale-105 transition">
                          {loadingSheetValues ? "Loading…" : "Interpret Data"}
                        </motion.button>
                      )}
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                      <div style={{ width: `${progress}%` }} className="h-2 bg-green-500 transition-all duration-300"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Column Selector */}
        <AnimatePresence>
          {showAnalytics && numericColumns.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="p-4 bg-gray-900/60 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-semibold">Select Columns</h4>
                <div className="text-sm text-gray-300">Showing up to 5 rows preview</div>
              </div>
              <div className="flex flex-wrap gap-3">
                {numericColumns.map((i) => (
                  <label key={i} className={`px-3 py-1 rounded-xl cursor-pointer ${selectedColumns.includes(i) ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300"}`}>
                    <input type="checkbox" checked={selectedColumns.includes(i)} onChange={() => setSelectedColumns((prev) => (prev.includes(i) ? prev.filter((c) => c !== i) : [...prev, i]))} className="mr-2" />
                    {sheetData[0]?.[i] ?? `Column ${i + 1}`}
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPIs */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 bg-indigo-800 rounded-2xl shadow-xl text-white">
                <h5 className="text-sm">Total</h5>
                <p className="text-2xl font-bold">{kpiMetrics.total.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-indigo-700 rounded-2xl shadow-xl text-white">
                <h5 className="text-sm">Average</h5>
                <p className="text-2xl font-bold">{kpiMetrics.avg.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl text-white">
                <h5 className="text-sm">Maximum</h5>
                <p className="text-2xl font-bold">{kpiMetrics.max.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-indigo-500 rounded-2xl shadow-xl text-white">
                <h5 className="text-sm">Minimum</h5>
                <p className="text-2xl font-bold">{kpiMetrics.min.toLocaleString()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Charts */}
        {showAnalytics && <div className="space-y-8 mt-6">{generateCharts()}</div>}

        {/* AI Insights */}
        {showAnalytics && (
          <div className="p-6 bg-gray-900/70 rounded-2xl mt-6 space-y-4">
            <h4 className="text-xl font-semibold text-white">AI Insights</h4>
            <button onClick={generateAIInsights} className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:scale-105 transition">
              Generate Insights
            </button>
            {aiSummary && <div className="mt-4 text-gray-300 whitespace-pre-line">{aiSummary}</div>}
          </div>
        )}

        {/* Not Connected Modal */}
        <AnimatePresence>
          {showNotConnectedModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-white text-xl font-semibold">{notConnectedAppName} not connected</h3>
                  <button onClick={() => setShowNotConnectedModal(false)}><FaTimes className="text-gray-300" /></button>
                </div>
                <p className="text-gray-300">Please connect {notConnectedAppName} from the Integrations page before using it here.</p>
                <button onClick={() => setShowNotConnectedModal(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold">Close</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
