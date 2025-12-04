import React, { useMemo, useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { FiRefreshCw } from "react-icons/fi";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// -----------------------------
// DEFAULT/FAKE DATA HELPERS
// -----------------------------
const rand = (min, max) => Math.round(min + Math.random() * (max - min));

const mockTimeLabels = (() => {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(
      d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    );
  }
  return labels;
})();

// -----------------------------
// Overview component
// -----------------------------
export default function Overview() {
  // user (from memory/context) — your name stored earlier as Mandla.
  const userName = "Mandla";

  // savedData holds the latest analytics snapshots saved from Analytics.jsx
  const [savedData, setSavedData] = useState(null);

  // apps connected — used in App filter dropdown
  const [connectedApps, setConnectedApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState("all");

  // UI
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [isLoading, setIsLoading] = useState(false);

  // load from localStorage on mount and listen for storage events (so Analytics can save)
  useEffect(() => {
    loadSavedData();
    loadConnectedApps();

    const onStorage = (e) => {
      if (e.key === "analytics_overview_data") loadSavedData();
      if (e.key === "adt_connected_apps") loadConnectedApps();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Try fetch connected apps from backend (fallbacks to localStorage)
  async function loadConnectedApps() {
    // prefer calling backend if available
    try {
      const profile = JSON.parse(localStorage.getItem("adt_profile") || "null") || { user_id: "test-user" };
      const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/connected-apps?user_id=${profile.user_id}`);
      if (res?.data) {
        // transform into a list for the dropdown
        const apps = [];
        if (res.data.google_sheets) apps.push({ key: "google_sheets", label: "Google Sheets" });
        // you can add other known keys here if backend expands
        // fallback: if nothing, consult localStorage
        if (!apps.length) {
          const stored = JSON.parse(localStorage.getItem("adt_connected_apps") || "null");
          setConnectedApps(stored || []);
        } else {
          setConnectedApps(apps);
        }
        return;
      }
    } catch (err) {
      // ignore — fallback to localStorage
    }

    const stored = JSON.parse(localStorage.getItem("adt_connected_apps") || "null");
    if (stored && Array.isArray(stored)) setConnectedApps(stored);
  }

  function loadSavedData() {
    try {
      const stored = localStorage.getItem("analytics_overview_data");
      if (!stored) {
        setSavedData(null);
        return;
      }
      const parsed = JSON.parse(stored);
      setSavedData(parsed);
    } catch (e) {
      console.error("Failed to load saved analytics:", e);
      setSavedData(null);
    }
  }

  const clearData = () => {
    localStorage.removeItem("analytics_overview_data");
    setSavedData(null);
  };

  const refreshPage = async () => {
    setIsLoading(true);
    // re-load saved data and connected apps
    loadSavedData();
    await loadConnectedApps();
    setTimeout(() => setIsLoading(false), 350); // small UX delay
  };

  // -----------------------------
  // Build aggregates from savedData if available
  // savedData formats we handle:
  // - { kpis: { colName: { total, avg, max, min, spark }, ... }, categories: { labels, data }, meta: { app: 'google_sheets', timestamp } }
  // - or older shapes with revenueSeries, ordersSeries etc (we handle generically)
  // -----------------------------
  const aggregates = useMemo(() => {
    if (!savedData) return null;

    // if savedData contains kpis, create top-level metrics
    if (savedData.kpis && typeof savedData.kpis === "object") {
      // pick first 3 numeric KPIs as main aggregates (Revenue, Marketing, Visitors etc if present)
      const kpiKeys = Object.keys(savedData.kpis);
      const primary = kpiKeys.slice(0, 3).map((k) => {
        const v = savedData.kpis[k];
        return {
          name: k,
          total: typeof v.total === "number" ? v.total : 0,
          avg: typeof v.avg === "number" ? v.avg : 0,
          spark: v.spark || [],
        };
      });

      // compute a gauge-like "health" score (simple heuristic)
      let health = 75;
      try {
        // if there's a 'revenue' or 'total revenue' key attempt to base it on growth / avg
        const revenueKey = kpiKeys.find((x) => /rev|revenue|sales/i.test(x));
        if (revenueKey) {
          const r = savedData.kpis[revenueKey];
          // positive if avg close to total/rows
          health = Math.max(40, Math.min(95, Math.round(50 + (r.avg / (r.max || r.avg || 1)) * 45)));
        }
      } catch (e) {
        health = 75;
      }

      return {
        primary,
        categories: savedData.categories || { labels: [], data: [] },
        health,
        meta: savedData.meta || {},
      };
    }

    // fallback: older shape with revenueSeries/ordersSeries
    if (savedData.revenueSeries) {
      const rev = savedData.revenueSeries.reduce((a, b) => a + b, 0);
      return {
        primary: [{ name: "Revenue", total: rev, avg: Math.round(rev / savedData.revenueSeries.length) }],
        categories: savedData.categories || { labels: [], data: [] },
        health: 80,
        meta: savedData.meta || {},
      };
    }

    return null;
  }, [savedData]);

  // -----------------------------
  // Build the "cards" contents:
  // - Sales analytics (summary)
  // - Anomalies & warnings
  // - Suggestions & actions
  // Each prefers using savedData but falls back to mock suggestions
  // -----------------------------
  const salesSummary = useMemo(() => {
    if (!aggregates) {
      // default mock summary
      const total = mockTimeLabels.map(() => Math.round(50000 + Math.random() * 45000)).reduce((a, b) => a + b, 0);
      return {
        title: "Sales analytics",
        lines: [
          `Total revenue (est): ${total.toLocaleString()}`,
          `Avg / day: ${Math.round(total / 7).toLocaleString()}`,
          `Top source: ${connectedApps[0]?.label || "Organic"}`,
        ],
      };
    }

    // build a human friendly summary from kpis. pick best guess metric for "revenue"
    const primary = aggregates.primary || [];
    const revenue = primary.find((p) => /rev|revenue|sales/i.test(p.name)) || primary[0] || null;
    const lines = [];
    if (revenue) {
      lines.push(`Total ${revenue.name}: ${Math.round(revenue.total).toLocaleString()}`);
      lines.push(`Avg / period: ${Math.round(revenue.avg).toLocaleString()}`);
      if (revenue.spark && revenue.spark.length) {
        const last = revenue.spark[revenue.spark.length - 1];
        lines.push(`Latest point: ${last}`);
      }
    } else {
      lines.push("No clear revenue KPI found in latest analysis.");
    }

    if (aggregates.categories && aggregates.categories.labels?.length) {
      lines.push(`Top category: ${aggregates.categories.labels[0]}`);
    }

    return { title: "Sales analytics", lines };
  }, [aggregates, connectedApps]);

  const anomalies = useMemo(() => {
    if (!savedData) {
      return [
        { id: 1, level: "info", text: "No recent analysis run — try importing a sheet." },
      ];
    }

    // look for anomalies field from savedData (if Analytics wrote anomalies)
    if (savedData.anomalies && savedData.anomalies.length) {
      return savedData.anomalies.map((a, i) => ({ id: i, level: a.level || "warning", text: a.text || JSON.stringify(a) }));
    }

    // heuristic: if any KPI has a negative avg or large max/min gap -> flag a warning
    const items = [];
    if (savedData.kpis) {
      Object.entries(savedData.kpis).forEach(([k, v]) => {
        if (typeof v.avg === "number" && v.avg < 0) {
          items.push({ id: k, level: "critical", text: `${k} average negative (${v.avg}).` });
        } else if (typeof v.max === "number" && typeof v.min === "number" && Math.abs(v.max - v.min) / (Math.abs(v.max) + 1) > 2) {
          items.push({ id: k, level: "warning", text: `${k} has high variance (max ${v.max} / min ${v.min}).` });
        }
      });
    }

    if (!items.length) items.push({ id: 0, level: "info", text: "No major anomalies detected in the latest analysis." });
    return items;
  }, [savedData]);

  const suggestions = useMemo(() => {
    if (!savedData) {
      return [
        { id: 1, text: "Import a Google Sheet and run analysis to get tailored suggestions." },
      ];
    }
    if (savedData.suggestions && savedData.suggestions.length) return savedData.suggestions;

    // generic suggestions generated heuristically from aggregates
    const s = [];
    if (aggregates?.health < 50) s.push({ id: 1, text: "Business health low — investigate drop in primary KPI." });
    s.push({ id: 2, text: "A/B test the top landing pages to improve conversion." });
    s.push({ id: 3, text: "Check payment provider logs — reduce payment failures." });
    return s;
  }, [savedData, aggregates]);

  // -----------------------------
  // Recently run analyses log
  // -----------------------------
  const recentAnalyses = useMemo(() => {
    // savedData maybe an array of runs, or a single object with meta.timestamps
    if (!savedData) return [];

    if (Array.isArray(savedData.runs) && savedData.runs.length) {
      return savedData.runs.slice(-6).reverse().map((r, i) => ({
        id: i,
        text: `${r.app || r.source || "unknown"} — ${new Date(r.timestamp).toLocaleString()}`,
      }));
    }

    // if savedData.meta provided
    if (savedData.meta && savedData.meta.app) {
      return [
        { id: 1, text: `${savedData.meta.app} — ${new Date(savedData.meta.timestamp || Date.now()).toLocaleString()}` },
      ];
    }

    // fallback: if savedData has origin info
    if (savedData.origin) {
      return [{ id: 1, text: `${savedData.origin} — ${new Date().toLocaleString()}` }];
    }

    return [];
  }, [savedData]);

  // -----------------------------
  // Extra right-card idea: Data Health / Top Categories
  // -----------------------------
  const dataHealthCard = useMemo(() => {
    if (!aggregates) return { title: "Data Health", text: "No analysis yet" };
    return {
      title: "Data Health",
      text: `Overall health: ${aggregates.health}% — ${aggregates.categories.labels?.length ? `${aggregates.categories.labels.length} categories detected` : "No categories"}`,
    };
  }, [aggregates]);

  // -----------------------------
  // Chart datasets (prefers savedData if available)
  // -----------------------------
  const revenueSeries =
    (savedData && (savedData.revenueSeries || savedData.kpis?.Revenue?.spark || savedData.kpis?.revenue?.spark)) ||
    mockTimeLabels.map(() => Math.round(50000 + Math.random() * 45000));

  const ordersSeries =
    (savedData && (savedData.ordersSeries || savedData.kpis?.Orders?.spark)) ||
    mockTimeLabels.map(() => rand(120, 420));

  const customersSeries =
    (savedData && (savedData.customersSeries || savedData.kpis?.Customers?.spark)) ||
    mockTimeLabels.map(() => rand(80, 260));

  const revenueChart = {
    labels: mockTimeLabels,
    datasets: [
      {
        label: "Revenue",
        data: revenueSeries,
        borderColor: "#00ffe0",
        backgroundColor: "rgba(0,255,224,0.12)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const ordersChart = {
    labels: mockTimeLabels,
    datasets: [
      {
        label: "Orders",
        data: ordersSeries,
        backgroundColor: "rgba(124,58,237,0.7)",
      },
      {
        label: "Customers",
        data: customersSeries,
        backgroundColor: "rgba(0,255,224,0.6)",
      },
    ],
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="text-white h-screen p-6 bg-gradient-to-b from-[#0a0410] to-[#12062d] flex flex-col">
      {/* Top bar: Left => Welcome, Middle removed search, Right => date + app filter + refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-2xl font-bold">Hello, {userName} 👋</div>
          <div className="text-sm text-gray-400">Welcome back — your latest business snapshot.</div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date filter (kept) */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-[#120826] border border-purple-700 px-3 py-2 rounded-lg text-sm outline-none"
          >
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Month</option>
            <option>Custom Range</option>
          </select>

          {/* App filter (was Service). includes "All" and connected apps */}
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="bg-[#120826] border border-purple-700 px-3 py-2 rounded-lg text-sm outline-none"
          >
            <option value="all">All Apps</option>
            {connectedApps.map((a) => (
              <option key={a.key || a.label} value={a.key || a.label}>
                {a.label || a.key}
              </option>
            ))}
          </select>

          {/* Refresh button */}
          <button
            onClick={refreshPage}
            className="px-3 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-sm flex items-center gap-2"
            title="Refresh overview"
          >
            <FiRefreshCw />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Aggregated metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Card 1..3: aggregated metrics */}
        {(aggregates && aggregates.primary?.length ? aggregates.primary.slice(0, 4) : [
          { name: "Revenue", total: revenueSeries.reduce((a, b) => a + b, 0) },
          { name: "Orders", total: ordersSeries.reduce((a, b) => a + b, 0) },
          { name: "Customers", total: customersSeries[customersSeries.length - 1] },
          { name: "Health", total: dataHealthCard?.text || "—" },
        ]).map((m, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 shadow-lg"
            style={{
              background: "linear-gradient(180deg, rgba(12,14,26,0.7), rgba(8,10,20,0.55))",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div className="text-xs text-gray-300">{m.name}</div>
            <div className="text-2xl font-semibold text-white my-2">
              {typeof m.total === "number" ? m.total.toLocaleString() : m.total}
            </div>
            <div className="text-xs text-gray-400">{m.avg ? `Avg ${Math.round(m.avg).toLocaleString()}` : (m.name === "Health" ? dataHealthCard.text : "Summary")}</div>
          </div>
        ))}
      </div>

      {/* Main grid: left large column + right sidebar */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left column */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Top row of three cards: sales analytics, anomalies/warnings, suggestions/actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Sales analytics */}
            <div className="rounded-2xl p-4 bg-black/20 border border-purple-700 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold">Sales Analytics</div>
                  <div className="text-xs text-gray-400">Summarized from latest analysis</div>
                </div>
                <div className="text-xs text-gray-300">{savedData?.meta?.app ? savedData.meta.app : selectedApp === "all" ? "All" : selectedApp}</div>
              </div>

              <div className="text-white text-sm space-y-2">
                {(salesSummary.lines || []).map((l, i) => (
                  <div key={i} className="text-sm text-gray-300">
                    • {l}
                  </div>
                ))}
              </div>

              <div className="mt-4 h-36">
                <Line data={revenueChart} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            </div>

            {/* Anomalies & warnings */}
            <div className="rounded-2xl p-4 bg-black/20 border border-yellow-700 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold">Anomalies & Warnings</div>
                  <div className="text-xs text-gray-400">Auto-detected issues</div>
                </div>
                <div className="text-xs text-gray-300">{(anomalies.length && anomalies[0].text) ? "" : ""}</div>
              </div>

              <div className="space-y-2 max-h-48 overflow-auto mt-2">
                {anomalies.map((a) => (
                  <div
                    key={a.id}
                    className={`p-3 rounded-lg ${a.level === "critical" ? "bg-rose-900/10 border border-rose-500" : a.level === "warning" ? "bg-yellow-900/5 border border-yellow-400" : "bg-white/3 border border-white/6"}`}
                  >
                    <div className="text-sm font-medium">{a.level.toUpperCase()}</div>
                    <div className="text-xs text-gray-300 mt-1">{a.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions & actions */}
            <div className="rounded-2xl p-4 bg-black/20 border border-green-700 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold">Suggestions & Actions</div>
                  <div className="text-xs text-gray-400">How to stay competitive — from latest analysis</div>
                </div>
                <div className="text-xs text-gray-300">Priority</div>
              </div>

              <div className="space-y-2 max-h-48 overflow-auto mt-2">
                {suggestions.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg bg-black/30 border border-white/6 flex justify-between items-start">
                    <div className="text-sm text-gray-200">{s.text}</div>
                    <div className="text-xs text-gray-400 ml-3">ETA</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary row: big "Recent analyses" and a second card of your choice */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
            {/* Recent analyses (logs) */}
            <div className="rounded-2xl p-4 bg-black/20 border border-white/6 shadow-lg overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold">Recent Analyses</div>
                  <div className="text-xs text-gray-400">Chronological log of analysis runs</div>
                </div>
                <div className="text-xs text-gray-300">{recentAnalyses.length ? `${recentAnalyses.length} runs` : "No runs"}</div>
              </div>

              <div className="space-y-2">
                {recentAnalyses.length ? recentAnalyses.map((r) => (
                  <div key={r.id} className="p-2 rounded-lg bg-black/30 border border-white/6 flex justify-between items-center text-sm">
                    <div>{r.text}</div>
                    <div className="text-xs text-gray-400">View</div>
                  </div>
                )) : (
                  <div className="text-gray-400">No recent analysis runs yet. Run analysis in Analytics to populate this feed.</div>
                )}
              </div>
            </div>

            {/* Right card: Data Health / Top Categories */}
            <div className="rounded-2xl p-4 bg-black/20 border border-white/6 shadow-lg overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold">{dataHealthCard.title}</div>
                  <div className="text-xs text-gray-400">Quick status</div>
                </div>
                <div className="text-xs text-gray-300">{aggregates?.meta?.app || "—"}</div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-200">{dataHealthCard.text}</div>

                <div>
                  <div className="text-xs text-gray-400 mb-2">Top categories</div>
                  <div className="flex gap-2 flex-wrap">
                    {(aggregates?.categories?.labels?.length ? aggregates.categories.labels.slice(0, 6) : ["No categories"]).map((c, i) => (
                      <div key={i} className="px-3 py-1 text-xs bg-white/5 rounded-full">{c}</div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 h-40">
                  <Bar data={ordersChart} options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
          {/* Activities */}
          <div className="rounded-2xl bg-black/30 p-3 border border-white/6">
            <div className="text-sm font-semibold">Recent Activities</div>
            <div className="mt-2 space-y-1 text-xs text-gray-300">
              <div>• Auto-analysis completed — {recentAnalyses[0]?.text ?? "—"}</div>
              <div>• Sheet imported — {savedData?.meta?.app ? savedData.meta.app : "—"}</div>
              <div>• Overview refreshed — just now</div>
            </div>
          </div>

          {/* AI Insights (short preview) */}
          <div className="rounded-2xl bg-purple-900/30 p-3 border border-purple-700 shadow-xl flex-1 overflow-y-auto">
            <div className="text-sm font-semibold mb-2">AI Insights Preview</div>
            <div className="text-xs text-gray-300 whitespace-pre-wrap">
              {savedData?.analysisText
                ? savedData.analysisText.slice(0, 800)
                : "No AI-generated summary yet. Run analysis on the Analytics page and press Save to populate a summary here."}
            </div>
          </div>

          {/* Connected apps */}
          <div className="rounded-2xl bg-black/30 p-3 border border-white/6">
            <div className="text-sm font-semibold mb-2">Connected Apps</div>
            <div className="text-xs text-gray-300">
              {connectedApps.length ? (
                connectedApps.map((a) => (
                  <div key={a.key || a.label} className="flex items-center justify-between py-1">
                    <div>{a.label || a.key}</div>
                    <div className="text-xs text-gray-400">Connected</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No apps connected — connect in Integrations.</div>
              )}
            </div>
          </div>

          {/* Clear saved analysis */}
          <button
            onClick={clearData}
            className="w-full px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm"
          >
            Clear saved analytics
          </button>
        </aside>
      </div>
    </div>
  );
}
