import React, { useEffect, useState } from "react";
import { CheckCircleIcon, XCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useLocation } from "react-router-dom";

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

  const [kpiMetrics, setKpiMetrics] = useState({
    total: 0,
    avg: 0,
    max: 0,
    min: 0,
  });

  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  const searchParams = new URLSearchParams(location.search);
  const userId = searchParams.get("user_id") || "123";

  // Fetch connected integrations
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

      // If Google Sheets is connected, auto-fetch spreadsheets
      if (statuses["google_sheets"] === true) {
        fetchSheets();
      }
    } catch (err) {
      console.log("Error fetching apps", err);
    }
  };

  // Fetch Sheets
  const fetchSheets = async () => {
    setLoadingSheets(true);
    try {
      const res = await axios.get(`${BACKEND}/sheets-list/${userId}`);
      setSheets(res.data.sheets || []);

      // Save sheets in backend for analytics
      await axios.post(`${BACKEND}/save-sheets`, {
        user_id: userId,
        sheets: res.data.sheets || [],
      });
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

    try {
      const res = await axios.get(`${BACKEND}/sheets/${userId}/${selectedSheet.id}`);
      const values = res.data.values || [];

      setSheetData(values);

      // Detect numeric columns
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
    } catch (err) {
      console.log("Error loading sheet data", err);
      setSheetData([]);
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

  return (
    <div className="space-y-10">
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
              {app.connected ? (
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-400" />
              )}
            </div>

            {!app.connected ? (
              <button
                onClick={() => connectIntegration(app)}
                className="w-full py-2 mt-2 bg-indigo-600 rounded-xl text-white flex items-center justify-center gap-2"
              >
                Connect <PlusCircleIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => disconnect(app.key)}
                className="w-full py-2 mt-2 bg-red-600 rounded-xl text-white"
              >
                Disconnect
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Sheets Section */}
      {apps.find((a) => a.key === "google_sheets" && a.connected) && (
        <div className="p-6 bg-gray-900/60 rounded-2xl border border-gray-700 space-y-4">
          <h3 className="text-xl text-white font-semibold">Your Google Sheets</h3>

          {loadingSheets ? (
            <div className="text-gray-400">Loading sheets…</div>
          ) : sheets.length === 0 ? (
            <div className="text-gray-400">No Sheets Found</div>
          ) : (
            <select
              className="bg-gray-800 text-white p-3 rounded-xl"
              value={selectedSheet?.id || ""}
              onChange={(e) => {
                const found = sheets.find((s) => s.id === e.target.value);
                setSelectedSheet(found || null);
                setSheetData([]);
              }}
            >
              <option value="">Select a spreadsheet…</option>
              {sheets.map((sheet) => (
                <option key={sheet.id} value={sheet.id}>
                  {sheet.name}
                </option>
              ))}
            </select>
          )}

          {selectedSheet && (
            <button
              onClick={loadSheetData}
              className="px-6 py-2 bg-green-600 rounded-xl text-white"
            >
              Load Data
            </button>
          )}

          {/* Data Loaded */}
          {sheetData.length > 0 && (
            <div className="space-y-6 text-white">
              <div className="p-4 bg-gray-800 rounded-xl">
                <h4 className="font-bold mb-2">KPIs</h4>
                <div>Total: {kpiMetrics.total}</div>
                <div>Average: {kpiMetrics.avg}</div>
                <div>Max: {kpiMetrics.max}</div>
                <div>Min: {kpiMetrics.min}</div>
              </div>

              <div className="p-4 bg-gray-800 rounded-xl">
                <h4 className="font-bold mb-2">Raw Data Preview</h4>
                <pre className="text-gray-300 text-sm max-h-64 overflow-y-scroll">
                  {JSON.stringify(sheetData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
