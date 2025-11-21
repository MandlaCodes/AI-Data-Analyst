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
  const userId = "123";
  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  const [connectedApps, setConnectedApps] = useState([]);
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
  // NEW — Fetch sheets on mount so Analytics always loads Sheets
  useEffect(() => {
    async function loadSheetsFromBackend() {
      try {
        const res = await fetch(`${BACKEND}/sheets-list/${userId}`);
        const data = await res.json();

        if (data.sheets) {
          console.log("Sheets loaded in Analytics:", data.sheets);
          setSheets(data.sheets);
        }
      } catch (err) {
        console.error("Failed to load sheets:", err);
      }
    }

    loadSheetsFromBackend();
  }, [BACKEND, userId]);

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

        if (apps.includes("google_sheets")) fetchSheets();
      })
      .catch(() => setConnectedApps([]));
  }, []);

  // Fetch sheets
  const fetchSheets = async () => {
    setLoadingSheets(true);
    try {
      const res = await axios.get(`${BACKEND}/sheets-list/${userId}`);
      setSheets(res.data.sheets || []);
    } catch (err) {
      console.error(err);
      setSheets([]);
    } finally {
      setLoadingSheets(false);
    }
  };

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
      console.error(err);
      setSheetData([]);
      setShowAnalytics(false);
      setProgress(0);
    } finally {
      setLoadingSheetValues(false);
    }
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
        app: "google_sheets",
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
    setLandingOpen(false);
    setAiSummary("");
  };

  return (
    <div className="relative min-h-[80vh]">
      <div className="p-3 pt-5 space-y-5">
        <h2 className="text-4xl font-bold text-white">Analytics Dashboard</h2>
        <p className="text-gray-300 text-lg max-w-3xl">Create strategic business insights that enable confident, data-driven decisions.</p>

        {/* Connected Apps */}
        <div className="p-6 bg-gray-800/40 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-6">
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleAppClick("google_sheets")} className={`p-4 rounded-xl transition ${connectedApps.includes("google_sheets") ? "bg-indigo-600" : "bg-gray-700"}`}>
              <GoogleSheetsLogo className="w-12 h-12" />
            </motion.button>
          </div>

          {connectedApps.includes("google_sheets") && (
            <div className="mt-4 space-y-3">
              <h4 className="text-lg text-white font-semibold">Select Google Sheet</h4>
              {loadingSheets ? (
                <div className="p-4 bg-black/30 rounded-xl">Loading spreadsheets…</div>
              ) : sheets.length === 0 ? (
                <div className="p-4 bg-black/30 rounded-xl text-gray-400">No spreadsheets found. Connect Sheets from Integrations first.</div>
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
                      Load Data
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics display */}
        {showAnalytics && (
          <div className="space-y-6">
            <div className="flex gap-6 flex-wrap">
              <div className="p-4 bg-gray-900 rounded-xl text-white">
                <div>Total: {kpiMetrics.total}</div>
                <div>Average: {kpiMetrics.avg}</div>
                <div>Max: {kpiMetrics.max}</div>
                <div>Min: {kpiMetrics.min}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">{generateCharts()}</div>

            <div className="mt-6 p-6 bg-gray-900 rounded-xl text-white">
              <h4 className="text-lg font-semibold mb-3">AI Insights</h4>
              <button onClick={generateAIInsights} className="px-4 py-2 bg-indigo-600 rounded-xl font-semibold hover:scale-105 transition">
                Generate Insights
              </button>
              {aiSummary && <p className="mt-3">{aiSummary}</p>}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showNotConnectedModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="bg-gray-800 p-6 rounded-2xl w-96 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold text-white">{notConnectedAppName} Not Connected</h4>
                  <FaTimes className="cursor-pointer" onClick={() => setShowNotConnectedModal(false)} />
                </div>
                <p className="text-gray-300">Please connect {notConnectedAppName} from the Integrations page first.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
