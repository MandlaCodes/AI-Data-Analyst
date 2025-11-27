import React, { useMemo, useState } from "react";
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
} from "chart.js";
import { FiRefreshCw } from "react-icons/fi";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const rand = (min, max) => Math.round(min + Math.random() * (max - min));

const mockTimeLabels = (() => {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  }
  return labels;
})();

export default function Overview() {
  const [dateRange, setDateRange] = useState("Jan 2025 - May 2025");
  const revenueSeries = useMemo(() => mockTimeLabels.map(() => Math.round(50000 + Math.random() * 45000)), []);
  const ordersSeries = useMemo(() => mockTimeLabels.map(() => rand(120, 420)), []);
  const customersSeries = useMemo(() => mockTimeLabels.map(() => rand(80, 260)), []);

  const kpis = useMemo(() => {
    const totalRevenue = revenueSeries.reduce((a, b) => a + b, 0);
    return {
      revenue: totalRevenue,
      customers: customersSeries[customersSeries.length - 1] + rand(0, 40),
      transactions: ordersSeries.reduce((a, b) => a + b, 0),
      conversion: +(Math.random() * 4 + 1.2).toFixed(2),
    };
  }, [revenueSeries, ordersSeries, customersSeries]);

  const insights = [
    { id: 1, title: "Revenue spike", text: "Revenue increased 18% vs last week.", severity: "positive" },
    { id: 2, title: "Conversion drop", text: "Sessions increased 40% but conversion dropped.", severity: "warning" },
    { id: 3, title: "Payment failures", text: "Failures rose to 3.8%.", severity: "critical" },
  ];

  const suggestedActions = [
    { id: 1, title: "Optimize landing page", eta: "2h", impact: "High" },
    { id: 2, title: "Increase ad spend", eta: "1d", impact: "Medium" },
    { id: 3, title: "Staff evening shift", eta: "12h", impact: "Medium" },
  ];

  const revenueChart = { labels: mockTimeLabels, datasets: [{ label: "Revenue", data: revenueSeries, borderColor: "#00ffe0", backgroundColor: "rgba(0,255,224,0.15)", tension: 0.4, fill: true }] };
  const ordersChart = { labels: mockTimeLabels, datasets: [{ label: "Orders", data: ordersSeries, backgroundColor: "rgba(124,58,237,0.7)" }, { label: "Customers", data: customersSeries, backgroundColor: "rgba(0,255,224,0.6)" }] };

  return (
    <div className="text-white h-screen p-4 bg-gradient-to-b from-[#0a0410] to-[#12062d] flex flex-col">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-wide">Dashboard</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-purple-900/40 border border-purple-600 px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
        >
          <option>Jan 2025 - Mar 2025</option>
          <option>Apr 2025 - Jun 2025</option>
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
          <option>Custom Range</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left content */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
            {[
              { label: "Revenue", value: kpis.revenue, gradient: "from-purple-700 to-indigo-600" },
              { label: "Customers", value: kpis.customers, gradient: "from-indigo-700 to-purple-900" },
              { label: "Transactions", value: kpis.transactions, gradient: "from-pink-700 to-purple-800" },
              { label: "Conversion", value: kpis.conversion + "%", gradient: "from-green-700 to-teal-600" },
            ].map((kpi, i) => (
              <div key={i} className={`p-4 rounded-2xl bg-gradient-to-br ${kpi.gradient} shadow-lg hover:scale-105 transition-transform duration-300`}>
                <div className="text-xs text-gray-300">{kpi.label}</div>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
            <div className="p-4 bg-black/20 rounded-2xl border border-purple-600 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <Line data={revenueChart} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
            <div className="p-4 bg-black/20 rounded-2xl border border-purple-600 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <Bar data={ordersChart} options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
            </div>
          </div>

          {/* Top Products */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-800 to-purple-900 p-4 shadow-lg hover:scale-105 transition-transform duration-300 flex-shrink-0">
            <h2 className="text-lg font-semibold mb-2">Top Performing Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {["Aurora Pro", "Stellar X", "Nova One"].map((p, i) => (
                <div key={i} className="p-2 bg-black/30 rounded-lg flex justify-between items-center">
                  <span>{p}</span>
                  <span>{rand(1000, 5000)} sold</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 overflow-hidden">
          
          {/* Recent Activities */}
          <div className="rounded-2xl bg-black/30 p-3 border border-white/6 flex-shrink-0">
            <div className="text-sm font-semibold">Recent Activities</div>
            <div className="mt-2 space-y-1 text-xs text-gray-300">
              <div>• Auto-analysis completed — 2 hours ago</div>
              <div>• Sheet "Sales Ledger - Nov" imported — today</div>
              <div>• Alert: Payment failures spike — yesterday</div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="rounded-2xl bg-purple-900/40 p-3 border border-purple-700 shadow-xl flex-1 overflow-y-auto space-y-2">
            <div className="text-sm font-semibold mb-1">AI Insights & Summary</div>
            {insights.map((it) => (
              <div key={it.id} className={`p-2 rounded-lg border ${it.severity === "critical" ? "border-rose-500 bg-rose-900/10" : it.severity === "warning" ? "border-yellow-400 bg-yellow-900/5" : "border-green-500 bg-green-900/6"}`}>
                <div className="text-xs">{it.title}</div>
                <div className="text-gray-300 text-xs">{it.text}</div>
              </div>
            ))}
          </div>

          {/* Suggested Actions */}
          <div className="rounded-2xl bg-purple-900/40 p-3 border border-purple-700 shadow-xl flex-shrink-0 space-y-2">
            <div className="text-sm font-semibold mb-1">Actions Suggested by AI</div>
            {suggestedActions.map((a) => (
              <div key={a.id} className="p-2 rounded-lg bg-black/30 border border-white/6 flex justify-between items-center text-xs hover:bg-purple-800 transition-colors duration-300">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-gray-400">{a.eta} • Impact: {a.impact}</div>
                </div>
                <button className="px-2 py-1 text-sm rounded bg-purple-600 hover:bg-purple-500">Run</button>
              </div>
            ))}
          </div>

        </aside>
      </div>
    </div>
  );
}
