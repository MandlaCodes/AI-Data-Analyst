import React, { useEffect, useState } from "react";
import { CheckCircleIcon, XCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const availableApps = [
  { name: "Google Sheets", key: "google_sheets", connected: false, lastSync: null },
];

export default function Integrations() {
  const location = useLocation();
  const [apps, setApps] = useState(availableApps);

  const [sheets, setSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheetData, setSheetData] = useState([]);

  const [numericColumns, setNumericColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);

  const [kpiMetrics, setKpiMetrics] = useState({ total: 0, avg: 0, max: 0, min: 0 });
  const [aiSummary, setAiSummary] = useState("");
  const [loadingSheetValues, setLoadingSheetValues] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showNotConnectedModal, setShowNotConnectedModal] = useState(false);
  const [notConnectedAppName, setNotConnectedAppName] = useState("");

  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  const searchParams = new URLSearchParams(location.search);
  const userId = searchParams.get("user_id") || "123";

  // Fetch connected apps
  const fetchConnectedApps = async () => {
    try {
      const res = await axios.get(`${BACKEND}/connected-apps?user_id=${userId}`);
      const statuses = res.data;
      setApps((prev) =>
        prev.map((app) => ({
          ...app,
          connected: statuses[app.key] || false,
          lastSync: statuses[`${app.key}_last_sync`] || null,
        }))
      );
      if (statuses["google_sheets"] === true) fetchSheets();
    } catch (err) {
      console.log("Error fetching apps", err);
    }
  };

  // Fetch sheets
  const fetchSheets = async () => {
    setLoadingSheets(true);
    try {
      const res = await axios.get(`${BACKEND}/sheets-list/${userId}`);
      setSheets(res.data.sheets || []);
    } catch (err) {
      console.log("Error fetching sheets", err);
      setSheets([]);
    } finally {
      setLoadingSheets(false);
    }
  };

  // Load sheet data
  const loadSheetData = async () => {
    if (!selectedSheet) return;
    setLoadingSheetValues(true);
    setProgress(20);
    try {
      const res = await axios.get(`${BACKEND}/sheets/${userId}/${selectedSheet.id}`);
      const values = res.data.values || [];
      setSheetData(values);

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

      setProgress(60);
      setTimeout(() => setProgress(100), 250);
      setTimeout(() => setProgress(0), 900);
    } catch (err) {
      console.error(err);
      setSheetData([]);
    } finally {
      setLoadingSheetValues(false);
    }
  };

  // Recalculate KPIs
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
  }, [sheetData, selectedColumns]);

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
                datasets: [{ label, data: values, borderColor: "rgba(34,197,94,1)", backgroundColor: "rgba(34,197,94,0.3)", tension: 0.4, fill: true, pointRadius: 3 }],
              }}
              options={{ responsive: true }}
            />
          ) : (
            <Bar data={{ labels, datasets: [{ label, data: values, backgroundColor: "rgba(99,102,241,0.8)", borderRadius: 6 }] }} options={{ responsive: true }} />
          )}
        </div>
      );
    });
  };

  const generateAIInsights = async () => {
    try {
      const res = await axios.post(`${BACKEND}/analyze-dataset`, { user_id: userId, app: "google_sheets", dataset: sheetData });
      setAiSummary(res.data.summary || "No summary returned.");
    } catch (err) {
      console.error(err);
      setAiSummary("Failed to generate insights.");
    }
  };

  // First load
  useEffect(() => {
    fetchConnectedApps();
  }, []);

  // OAuth redirect handler
  useEffect(() => {
    const justConnected = searchParams.get("connected") === "true";
    const type = searchParams.get("type");
    if (justConnected && type === "google_sheets") {
      fetchConnectedApps();
      window.history.replaceState({}, document.title, "/dashboard/integrations");
    }
  }, [location.search]);

  const connectIntegration = (app) => {
    window.location.href = `${BACKEND}/auth/${app.key}?user_id=${userId}`;
  };
  const disconnect = async (appKey) => {
    await axios.post(`${BACKEND}/disconnect`, { user_id: userId, app: appKey });
    setApps((prev) =>
      prev.map((app) =>
        app.key === appKey ? { ...app, connected: false, lastSync: null } : app
      )
    );
    setSheets([]);
    setSheetData([]);
    setSelectedSheet(null);
  };

  const connectedCount = apps.filter((app) => app.connected).length;

  const GoogleSheetsLogo = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#0F9D58" d="M3 3h12v7H3z" opacity="0.16"></path>
      <path fill="#0F9D58" d="M3 3h12v7H3z"></path>
      <path fill="#fff" d="M5 5h8v1H5zM5 8h8v1H5z" opacity="0.9"></path>
      <path fill="#0F9D58" d="M18 2h-1v20h1a1 1 0 001-1V3a1 1 0 00-1-1z"></path>
      <rect x="4" y="11.5" width="11" height="9" rx="1" fill="#f8fafc" opacity="0.04"></rect>
    </svg>
  );

  const handleAppClick = (key) => {
    if (!apps.find((a) => a.key === key)?.connected) {
      setNotConnectedAppName(key === "google_sheets" ? "Google Sheets" : key);
      setShowNotConnectedModal(true);
    }
  };

  return (
    <div className="relative min-h-[80vh] space-y-10">
      <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500">
        Integrations
      </h2>

      <div className="flex gap-4">
        <div className="flex items-center gap-2 bg-gray-900/70 p-4 rounded-2xl border border-gray-700">
          <CheckCircleIcon className="w-6 h-6 text-green-400" />
          <span>{connectedCount} Connected</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-900/70 p-4 rounded-2xl border border-gray-700">
          <XCircleIcon className="w-6 h-6 text-red-400" />
          <span>{apps.length - connectedCount} Not Connected</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <div key={app.key} className="p-6 bg-gray-800 border border-gray-700 rounded-3xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl text-white">{app.name}</h3>
              {app.connected ? <CheckCircleIcon className="w-6 h-6 text-green-400" /> : <XCircleIcon className="w-6 h-6 text-red-400" />}
            </div>
            {!app.connected ? (
              <button
                onClick={() => connectIntegration(app)}
                className="w-full py-2 mt-2 bg-indigo-600 rounded-xl text-white flex items-center justify-center gap-2"
              >
                Connect <PlusCircleIcon className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={() => disconnect(app.key)} className="w-full py-2 mt-2 bg-red-600 rounded-xl text-white">
                Disconnect
              </button>
            )}
            {app.connected && app.key === "google_sheets" && (
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleAppClick("google_sheets")} className="mt-4 px-4 py-2 bg-indigo-600 rounded-xl text-white">
                Open Sheets Analytics
              </motion.button>
            )}
          </div>
        ))}
      </div>

      {/* Sheets + Analytics Section */}
      {apps.find((a) => a.key === "google_sheets" && a.connected) && (
        <div className="p-6 bg-gray-900/60 rounded-2xl border border-gray-700 space-y-4">
          <h3 className="text-xl text-white font-semibold">Your Google Sheets</h3>

          {loadingSheets ? (
            <div className="text-gray-400">Loading sheets…</div>
          ) : sheets.length === 0 ? (
            <div className="text-gray-400">No Sheets Found</div>
          ) : (
            <div className="flex items-center gap-3">
              <select
                className="bg-gray-800 text-white p-3 rounded-xl"
                value={selectedSheet?.id || ""}
                onChange={(e) => {
                  const found = sheets.find((s) => s.id === e.target.value);
                  setSelectedSheet(found || null);
                  setSheetData([]);
                  setAiSummary("");
                }}
              >
                <option value="">Select a spreadsheet…</option>
                {sheets.map((sheet) => (
                  <option key={sheet.id} value={sheet.id}>
                    {sheet.name}
                  </option>
                ))}
              </select>
              {selectedSheet && !loadingSheetValues && (
                <button onClick={loadSheetData} className="px-6 py-2 bg-green-600 rounded-xl text-white">
                  Load Data
                </button>
              )}
            </div>
          )}

          {sheetData.length > 0 && (
            <div className="space-y-6">
              {/* KPI Metrics */}
              <div className="flex gap-6 flex-wrap">
                <div className="p-4 bg-gray-800 rounded-xl text-white">
                  <div>Total: {kpiMetrics.total}</div>
                  <div>Average: {kpiMetrics.avg}</div>
                  <div>Max: {kpiMetrics.max}</div>
                  <div>Min: {kpiMetrics.min}</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-6">{generateCharts()}</div>

              {/* AI Insights */}
              <div className="mt-6 p-6 bg-gray-900 rounded-xl text-white">
                <h4 className="text-lg font-semibold mb-3">AI Insights</h4>
                <button onClick={generateAIInsights} className="px-4 py-2 bg-indigo-600 rounded-xl font-semibold hover:scale-105 transition">
                  Generate Insights
                </button>
                {aiSummary && <p className="mt-3">{aiSummary}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Not connected modal */}
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
  );
}
