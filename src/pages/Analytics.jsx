// src/pages/Analytics.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Line, Bar, Pie } from "react-chartjs-2";
import { FiDownload, FiZap } from "react-icons/fi";
import { MdAttachMoney, MdTrendingUp, MdSpeed, MdNumbers } from "react-icons/md";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

/*
  Analytics Dashboard — Cross-source analysis
  - Import Modal pulls connected apps from /connected-apps
  - Google Sheets list from /sheets-list/:user_id
  - Google Sheet values from /sheets/:user_id/:sheet_id
  - Tries /fetch/stripe and /fetch/hubspot for other sources (fall back to mock)
  - POST /analyze-dataset for AI summary & anomaly detection (if available)
*/

const rand = (min, max) => Math.round(min + Math.random() * (max - min));

const MOCK_STRIPE = [
  { id: "S1001", date: "2025-05-07", amount: 620, email: "tom@example.com", product: "Aurora Pro" },
  { id: "S1002", date: "2025-05-08", amount: 420, email: "may@example.com", product: "Stellar X" },
];

const MOCK_HUBSPOT = [
  { id: "H5001", date: "2025-05-06", amount: 250, email: "lead1@example.com", product: "Nova One" },
];

function KPI({ label, value, accent }) {
  return (
    <div className="p-4 rounded-2xl shadow-lg" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.06))", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="text-xs text-gray-300">{label}</div>
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

export default function Analytics() {
  const profile = JSON.parse(localStorage.getItem("adt_profile") || "null") || { user_id: "test-user" };

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [connected, setConnected] = useState({}); // result from /connected-apps
  const [availableApps, setAvailableApps] = useState([]); // derived list of connected apps

  // Import modal selection
  const [selectedApps, setSelectedApps] = useState([]); // ["google_sheets", "stripe", ...]
  const [sheetsList, setSheetsList] = useState([]); // google sheets for dropdown
  const [selectedSheet, setSelectedSheet] = useState("");
  const [csvToImport, setCsvToImport] = useState(null);

  // Data sources & merged dataset
  const [sources, setSources] = useState([]); // { id, name, rows: [{id,date,amount,product,email,source}] }
  const merged = useMemo(() => {
    const rows = [];
    for (const s of sources) {
      for (const r of s.rows) {
        rows.push({
          id: r.id || `${s.id}-${Math.random().toString(36).slice(2, 7)}`,
          date: r.date || null,
          amount: Number(r.amount || 0),
          product: r.product || r.sku || "(unknown)",
          email: r.email || null,
          source: s.name,
        });
      }
    }
    rows.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return rows;
  }, [sources]);

  // KPIs & charts state
  const kpi = useMemo(() => {
    const totalRevenue = merged.reduce((s, r) => s + (r.amount || 0), 0);
    const uniqueCustomers = new Set(merged.map((r) => r.email).filter(Boolean)).size;
    const transactions = merged.length;
    const avgOrder = transactions ? Math.round(totalRevenue / transactions) : 0;
    return { totalRevenue, uniqueCustomers, transactions, avgOrder };
  }, [merged]);

  const revenueByDay = useMemo(() => {
    const map = {};
    for (const r of merged) {
      if (!r.date) continue;
      map[r.date] = (map[r.date] || 0) + (r.amount || 0);
    }
    const labels = Object.keys(map).sort();
    return { labels, data: labels.map((d) => map[d]) };
  }, [merged]);

  const categories = useMemo(() => {
    const byProd = {};
    for (const r of merged) {
      const p = r.product || "unknown";
      byProd[p] = (byProd[p] || 0) + (r.amount || 0);
    }
    const labels = Object.keys(byProd);
    const data = labels.map((l) => byProd[l]);
    return { labels, data };
  }, [merged]);

  // AI / Anomaly summary
  const [aiSummary, setAiSummary] = useState("");
  const [anomalies, setAnomalies] = useState([]);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);

  // UI helpers
  const [chartType, setChartType] = useState("line");
  const fileRef = useRef(null);

  // fetch connected apps on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/connected-apps?user_id=${profile.user_id}`);
        if (cancelled) return;
        setConnected(res.data || {});
        // derive available apps from known integration keys
        const apps = [];
        if (res.data?.google_sheets) apps.push({ key: "google_sheets", name: "Google Sheets" });
        if (res.data?.stripe) apps.push({ key: "stripe", name: "Stripe" });
        if (res.data?.hubspot) apps.push({ key: "hubspot", name: "HubSpot" });
        // always allow CSV/Other
        apps.push({ key: "other", name: "CSV / Upload" });
        setAvailableApps(apps);
      } catch (err) {
        // fallback: if backend unreachable show basic Google Sheets (for local dev)
        if (!cancelled) {
          setConnected({});
          setAvailableApps([{ key: "other", name: "CSV / Upload" }]);
        }
      }
    })();
    return () => (cancelled = true);
  }, [profile.user_id]);

  // when google_sheets selected in modal, fetch sheets list
  useEffect(() => {
    let cancelled = false;
    if (!selectedApps.includes("google_sheets")) {
      setSheetsList([]);
      setSelectedSheet("");
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/sheets-list/${profile.user_id}`);
        if (cancelled) return;
        setSheetsList(res.data.sheets || []);
      } catch (err) {
        if (!cancelled) setSheetsList([]);
      }
    })();
    return () => (cancelled = true);
  }, [selectedApps, profile.user_id]);

  // helper: parse CSV file into rows array matching shape
  const parseCSVFile = async (file) => {
    const text = await file.text();
    // super-simple CSV parse (comma separated, first row headers, no complex quoting)
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1).map((ln, i) => {
      const cells = ln.split(",").map((c) => c.trim());
      // assume columns: id,date,amount,email,product (if present)
      return {
        id: cells[0] || `csv-${i}`,
        date: cells[1] || "",
        amount: Number(cells[2] || 0),
        email: cells[3] || "",
        product: cells[4] || headers[2] || "Imported",
      };
    });
    return rows;
  };

  // Import selected apps from modal
  const importSelected = async () => {
    const imported = [];
    for (const appKey of selectedApps) {
      if (appKey === "google_sheets") {
        if (!selectedSheet) continue;
        try {
          const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/sheets/${profile.user_id}/${selectedSheet}`);
          const values = res.data.values || [];
          // Convert values (array of arrays) -> rows with columns id,date,amount,email,product if possible
          const rows = [];
          if (values.length >= 1) {
            const headers = values[0];
            for (let i = 1; i < values.length; i++) {
              const row = values[i];
              rows.push({
                id: row[0] || `${selectedSheet}-${i}`,
                date: row[0] || "",
                amount: Number(row[1] || 0),
                email: row[2] || "",
                product: row[3] || headers[3] || "Imported",
              });
            }
          }
          imported.push({ id: `sheets-${selectedSheet}`, name: `GSheet: ${sheetsList.find(s => s.id === selectedSheet)?.name || selectedSheet}`, rows });
        } catch (err) {
          // ignore single failure and continue
          console.error("sheets fetch failed", err);
        }
      } else if (appKey === "stripe") {
        // try backend stripe fetch endpoint (implement on backend), fallback to mock
        try {
          const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/fetch/stripe?user_id=${profile.user_id}`);
          const rows = (res.data?.rows || []).map((r) => ({ id: r.id, date: r.date, amount: Number(r.amount), email: r.email, product: r.product }));
          imported.push({ id: `stripe-${Date.now()}`, name: "Stripe", rows });
        } catch {
          imported.push({ id: `stripe-mock-${Date.now()}`, name: "Stripe (mock)", rows: MOCK_STRIPE });
        }
      } else if (appKey === "hubspot") {
        try {
          const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/fetch/hubspot?user_id=${profile.user_id}`);
          const rows = (res.data?.rows || []).map((r) => ({ id: r.id, date: r.date, amount: Number(r.amount), email: r.email, product: r.product }));
          imported.push({ id: `hubspot-${Date.now()}`, name: "HubSpot", rows });
        } catch {
          imported.push({ id: `hubspot-mock-${Date.now()}`, name: "HubSpot (mock)", rows: MOCK_HUBSPOT });
        }
      } else if (appKey === "other" && csvToImport) {
        try {
          const rows = await parseCSVFile(csvToImport);
          imported.push({ id: `csv-${Date.now()}`, name: csvToImport.name || "CSV Upload", rows });
        } catch (err) {
          console.error("CSV parse failed", err);
        }
      }
    }

    // merge into state (append)
    setSources((prev) => {
      // avoid duplicates by id
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = imported.filter((i) => !existingIds.has(i.id));
      return [...prev, ...toAdd];
    });

    // cleanup UI modal
    setShowModal(false);
    setSelectedApps([]);
    setSelectedSheet("");
    setCsvToImport(null);
  };

  // Run AI summary + anomaly detection:
  const runAnalyze = async () => {
    setLoadingAnalyze(true);
    setAiSummary("");
    setAnomalies([]);
    try {
      // prefer backend analyze-dataset which can be wired to OpenAI
      const payload = {
        user_id: profile.user_id,
        merged: merged, // send merged rows; backend should handle size/formatting and call OpenAI
        mode: "summary+anomalies",
      };
      const res = await axios.post("https://ai-data-analyst-backend-1nuw.onrender.com/analyze-dataset", payload, { timeout: 120000 });
      if (res.data) {
        setAiSummary(res.data.summary || "No summary returned.");
        setAnomalies(res.data.anomalies || []);
      } else {
        throw new Error("No response");
      }
    } catch (err) {
      // fallback local heuristics for demo:
      const total = kpi.totalRevenue;
      const topProducts = Object.entries(
        merged.reduce((acc, r) => {
          acc[r.product] = (acc[r.product] || 0) + (r.amount || 0);
          return acc;
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((p) => `${p[0]} (${p[1]})`);
      const localSummary = `Merged ${merged.length} transactions from ${sources.length} sources. Total revenue R ${total.toLocaleString()}. Top products: ${topProducts.join(", ")}.`;
      // simple anomaly detection: detect dates where revenue > mean + 2*std
      const byDate = {};
      for (const r of merged) {
        if (!r.date) continue;
        byDate[r.date] = (byDate[r.date] || 0) + (r.amount || 0);
      }
      const vals = Object.values(byDate);
      const mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
      const std = Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(1, vals.length));
      const detected = Object.entries(byDate)
        .filter(([d, v]) => v > mean + 2 * std)
        .map(([d, v]) => ({ date: d, value: v, reason: "High revenue spike" }));
      setAiSummary(localSummary);
      setAnomalies(detected);
    } finally {
      setLoadingAnalyze(false);
    }
  };

  // export merged CSV
  const exportMerged = () => {
    const header = ["id", "date", "amount", "email", "product", "source"];
    const rows = merged.map((r) => [r.id, r.date, r.amount, r.email, r.product, r.source]);
    const csv = [header.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // small UI: Imported Apps card content
  const importedApps = useMemo(() => sources.map((s) => s.name), [sources]);

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(180deg,#0b0f1a,#1f1336)" }}>
      {/* header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-3xl font-bold text-white">Analytics</div>
          <div className="text-sm text-gray-300">Cross-source analysis · merge Sheets, Stripe, HubSpot, CSV and more</div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={exportMerged} className="px-3 py-2 rounded-lg bg-gray-800 text-white border border-white/6">Export</button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#06b6d4] to-[#6b46ff] text-black font-semibold">Import Apps</button>
        </div>
      </div>

      {/* KPIs / top area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="col-span-1 md:col-span-1">
          <KPI label="Total Revenue" value={`R ${kpi.totalRevenue.toLocaleString()}`} accent="text-teal-300" />
        </div>
        <div>
          <KPI label="Unique Customers" value={kpi.uniqueCustomers} accent="text-indigo-300" />
        </div>
        <div>
          <KPI label="Transactions" value={kpi.transactions} accent="text-purple-300" />
        </div>
        <div>
          <KPI label="Avg Order" value={`R ${kpi.avgOrder.toLocaleString()}`} accent="text-amber-300" />
        </div>
      </div>

      {/* main grid like screenshot: big chart left, right column small cards */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left big area */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(180deg, rgba(12,12,22,0.6), rgba(6,6,12,0.5))", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-gray-300">Revenue (by day)</div>
                <div className="text-xs text-gray-400">Merged across sources</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setChartType("line")} className={`px-2 py-1 rounded ${chartType === "line" ? "bg-purple-700 text-white" : "bg-black/30 text-gray-300"}`}>Line</button>
                <button onClick={() => setChartType("bar")} className={`px-2 py-1 rounded ${chartType === "bar" ? "bg-purple-700 text-white" : "bg-black/30 text-gray-300"}`}>Bar</button>
              </div>
            </div>

            <div style={{ height: 260 }}>
              {chartType === "line" ? (
                <Line
                  data={{
                    labels: revenueByDay.labels.length ? revenueByDay.labels : Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`),
                    datasets: [{ label: "Revenue", data: revenueByDay.data.length ? revenueByDay.data : Array.from({ length: 7 }, () => rand(200, 900)), borderColor: "#9f7aea", backgroundColor: "rgba(159,122,234,0.12)", tension: 0.35, fill: true }],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                />
              ) : (
                <Bar
                  data={{
                    labels: revenueByDay.labels.length ? revenueByDay.labels : ["M", "T", "W", "T", "F", "S", "S"],
                    datasets: [{ label: "Revenue", data: revenueByDay.data.length ? revenueByDay.data : Array.from({ length: 7 }, () => rand(200, 900)), backgroundColor: "rgba(124,58,237,0.8)" }],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                />
              )}
            </div>

            {/* small summary row below chart */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-xs text-gray-400">Transactions</div>
                <div className="font-semibold">{kpi.transactions}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-xs text-gray-400">Avg order</div>
                <div className="font-semibold">R {kpi.avgOrder.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-xs text-gray-400">Data sources</div>
                <div className="font-semibold">{sources.length}</div>
              </div>
            </div>
          </div>

          {/* Transactions / table */}
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(180deg, rgba(12,12,22,0.5), rgba(6,6,12,0.35))", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-300">Transactions</div>
              <div className="text-xs text-gray-400">Latest items across all sources</div>
            </div>
            <div className="overflow-auto max-h-56">
              <table className="w-full text-sm">
                <thead className="text-gray-400">
                  <tr>
                    <th className="text-left">ID</th>
                    <th className="text-left">Date</th>
                    <th className="text-left">Product</th>
                    <th className="text-right">Amount</th>
                    <th className="text-left">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {merged.slice(-12).reverse().map((r) => (
                    <tr key={r.id} className="border-t border-white/6">
                      <td className="py-2">{r.id}</td>
                      <td className="py-2">{r.date}</td>
                      <td className="py-2">{r.product}</td>
                      <td className="py-2 text-right">R {Math.round(r.amount).toLocaleString()}</td>
                      <td className="py-2">{r.source}</td>
                    </tr>
                  ))}
                  {merged.length === 0 && <tr><td colSpan={5} className="text-gray-400 py-4">No transactions imported yet — click Import Apps to begin.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column small cards (imported apps, categories, anomalies, AI summary) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Imported Apps (replaces Active Cards from screenshot) */}
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(180deg, rgba(12,12,22,0.5), rgba(6,6,12,0.35))", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-300">Imported Apps</div>
              <div className="text-xs text-gray-400">{importedApps.length} connected</div>
            </div>
            <div className="space-y-2">
              {importedApps.length ? importedApps.map((a, i) => (
                <div key={i} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="text-sm font-semibold">{a}</div>
                </div>
              )) : <div className="text-gray-400 text-sm">No apps imported — import Google Sheets, Stripe, HubSpot or upload CSV.</div>}
            </div>
          </div>

          {/* Categories (pie) */}
          <div className="rounded-2xl p-4 flex flex-col items-center" style={{ background: "linear-gradient(180deg, rgba(12,12,22,0.5), rgba(6,6,12,0.35))", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="w-full flex items-center justify-between mb-3">
              <div className="text-sm text-gray-300">Categories</div>
              <div className="text-xs text-gray-400">Revenue share</div>
            </div>
            <div className="w-40 h-40">
              <Pie
                data={{
                  labels: categories.labels.length ? categories.labels : ["No data"],
                  datasets: [{ data: categories.data.length ? categories.data : [1], backgroundColor: ["#9f7aea", "#00ffe0", "#ff8fb8", "#ffd66b"] }],
                }}
                options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: "#ddd", boxWidth: 8 } } } }}
              />
            </div>
          </div>

          {/* Anomalies */}
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(180deg, rgba(12,12,22,0.5), rgba(6,6,12,0.35))", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-300">Anomalies</div>
              <button onClick={runAnalyze} className="px-2 py-1 rounded bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs">{loadingAnalyze ? "Detecting…" : "Detect anomalies"}</button>
            </div>
            <div className="space-y-2 text-sm">
              {anomalies.length ? anomalies.map((a, i) => (
                <div key={i} className="p-2 rounded-md" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="font-semibold">{a.date}</div>
                  <div className="text-xs text-gray-300">{a.reason} — R {Math.round(a.value).toLocaleString()}</div>
                </div>
              )) : <div className="text-gray-400">No anomalies detected yet.</div>}
            </div>
          </div>

          {/* AI Summary */}
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(180deg, rgba(12,12,22,0.5), rgba(6,6,12,0.35))", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-300">AI Summary</div>
              <button onClick={runAnalyze} className="px-2 py-1 rounded bg-gradient-to-r from-teal-400 to-cyan-400 text-black text-xs">Generate summary</button>
            </div>
            <div className="text-sm text-gray-200 whitespace-pre-wrap min-h-[70px]">{aiSummary || "No summary yet. Import data and press Generate summary to get an executive summary and suggested actions (OpenAI-backed when available)."}</div>
          </div>
        </div>
      </div>

      {/* IMPORT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-[92%] max-w-2xl rounded-2xl p-6" style={{ background: "#0b0c14", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Import Apps</h3>
              <button onClick={() => { setShowModal(false); setSelectedApps([]); setSelectedSheet(""); setCsvToImport(null); }} className="text-gray-400">Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: available connected apps (only show connected ones as requested) */}
              <div>
                <div className="text-sm text-gray-300 mb-2">Connected apps</div>
                <div className="space-y-2">
                  {/* derive from connected or availableApps */}
                  {availableApps.map((app) => (
                    <label key={app.key} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedApps.includes(app.key)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedApps((prev) => {
                              if (checked) return [...prev, app.key];
                              return prev.filter((k) => k !== app.key);
                            });
                          }}
                        />
                        <div>
                          <div className="font-semibold">{app.name}</div>
                          <div className="text-xs text-gray-400">{app.key === "other" ? "Upload CSV or JSON" : (connected[app.key] ? "Connected" : "Not connected")}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* CSV input if Other selected */}
                {selectedApps.includes("other") && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-300 mb-1">Upload CSV</div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvToImport(e.target.files?.[0] || null)}
                      className="text-sm"
                    />
                    {csvToImport && <div className="text-xs text-gray-200 mt-1">{csvToImport.name}</div>}
                  </div>
                )}
              </div>

              {/* Right: Google Sheets dropdown if selected */}
              <div>
                <div className="text-sm text-gray-300 mb-2">Google Sheets</div>
                {selectedApps.includes("google_sheets") ? (
                  <div>
                    <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)} className="w-full p-2 rounded-lg text-black">
                      <option value="">Select Google Sheet</option>
                      {sheetsList.length ? sheetsList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>) : <option value="">No sheets found / not connected</option>}
                    </select>
                    <div className="text-xs text-gray-400 mt-2">Pick a sheet to import rows from (Sheet1 range).</div>
                  </div>
                ) : (
                  <div className="text-gray-400">Enable Google Sheets in the left column to pick a sheet (only shown if connected).</div>
                )}

                {/* quick tips */}
                <div className="mt-4 text-xs text-gray-400">
                  Tip: for best results, have columns [id, date, amount, email, product] or similar. The importer will try to map columns automatically.
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowModal(false); setSelectedApps([]); setSelectedSheet(""); setCsvToImport(null); }} className="px-4 py-2 rounded-lg bg-gray-700 text-white">Cancel</button>
              <button onClick={importSelected} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#06b6d4] to-[#6b46ff] text-black font-semibold">Import Selected</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
