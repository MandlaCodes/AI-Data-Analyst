// FULL UPDATED FILE — IMPROVED DEFAULT PAGE TEXT AND CONTENT

import React, { useState, useEffect } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { 
    MdOutlineDashboard, 
    MdDataExploration, 
    MdInfoOutline, 
    MdTrendingUp, 
    MdSettings, 
    MdGraphicEq 
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// --- Sparkline ---
const Sparkline = ({ data }) => {
  if (!data || data.length === 0) return null;

  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [
      {
        data,
        backgroundColor: 'rgba(167, 139, 250, 0.4)',
        borderColor: '#a78bfa',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false }, tooltip: { enabled: true } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 } },
  };

  return (
    <div style={{ height: 40, width: 100 }} className="flex-shrink-0">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

// --- KPI ---
function OverviewKpiTile({ title, value, context, icon: Icon, sparkData }) {
  const isPositive = context && context.toLowerCase().includes("increase");

  return (
    <div className="rounded-2xl p-4 shadow-xl flex flex-col justify-between"
         style={{ background: "linear-gradient(180deg, rgba(167,139,250,0.1), rgba(12,14,26,0.7))", border: "1px solid rgba(255,255,255,0.04)" }}>
      
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-light text-gray-300">{title}</div>
        {Icon && <Icon className="text-purple-400" size={20} />}
      </div>

      <div className="flex items-end justify-between">
        <div className="text-4xl font-extrabold text-white">{value?.toLocaleString?.()}</div>
        {sparkData && <Sparkline data={sparkData} />}
      </div>

      <div className={`text-xs mt-3 font-medium ${isPositive ? 'text-green-400' : 'text-orange-400'}`}>
        {context || "No additional context."}
      </div>
    </div>
  );
}

const CategoryPieChart = ({ categories }) => {
  if (!categories || !categories.labels?.length) return null;

  const chartData = {
    labels: categories.labels,
    datasets: [{ data: categories.data, backgroundColor: ['#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa'] }],
  };

  const chartOptions = { responsive: true, plugins: { legend: { position: 'bottom' } } };

  return (
    <div className="rounded-xl p-4 shadow-lg h-full"
         style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.65), rgba(6,8,18,0.45))" }}>
      <div className="text-lg font-semibold text-gray-300 mb-4">Distribution by Category</div>
      <div style={{ height: 320 }}>
        <Pie data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

// --- MAIN ---
export default function Overview({ profile }) {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `https://ai-data-analyst-backend-1nuw.onrender.com/api/dashboard/sessions?user_id=${profile.user_id}`
        );
        const data = await res.json();

        if (data.sessions?.length > 0) {
          const current = data.sessions.find(s => s.is_current) || data.sessions[0];
          setDashboard(current.layout_data ? JSON.parse(current.layout_data) : null);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profile.user_id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-white bg-[#0b0f1a]">
        Loading Dashboard...
      </div>
    );
  }

  // ------------- IMPROVED DEFAULT SCREEN -------------
  if (!dashboard) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center 
                      bg-gradient-to-br from-[#0b0f1a] to-[#0a051d] p-10 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl opacity-70 animate-pulse"></div>

        <div className="w-full max-w-6xl p-12 rounded-3xl z-10 
                        bg-[#1c2135] backdrop-blur-sm border border-indigo-700/30 
                        shadow-[0_0_60px_rgba(109,40,217,0.1)]">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-8 border-b border-gray-700/50 pb-4">
            <div className="text-xl font-bold text-gray-300 flex items-center gap-2">
              <MdOutlineDashboard className="text-purple-400" size={28} /> Overview
            </div>

            <div className="flex gap-3 text-sm font-medium">
              <button className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 flex items-center gap-1 hover:bg-purple-600/40 transition">
                <MdSettings size={16} /> Settings
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="flex flex-col lg:flex-row gap-12">

            {/* LEFT */}
            <div className="lg:w-3/5 text-left space-y-8">

              <div className="space-y-2">
                <p className="text-sm font-semibold text-purple-400 uppercase tracking-widest">
                  Welcome, {profile?.email?.split("@")[0] ?? "User"}
                </p>

                <h2 className="text-5xl font-extrabold text-white leading-snug">
                  Your Analytics Workspace is Ready.
                </h2>

                <p className="text-lg text-gray-300 max-w-lg">
                  Connect your first dataset and let the AI automatically analyze patterns, 
                  trends, risks, and opportunities — instantly.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md">

                {/* STEP 1 */}
                <button
                  onClick={() => navigate("/integrations")}
                  className="col-span-1 px-4 py-3 rounded-xl bg-gray-700/50 text-gray-300 font-semibold 
                             hover:bg-gray-700/70 hover:text-purple-300 transition flex items-center justify-center gap-2 border border-purple-800/50"
                >
                  <MdTrendingUp size={20} /> Step 1: Connect Data
                </button>

                <div className="col-span-1 flex items-center justify-center text-xl font-extrabold text-white">
                  0 / 1
                </div>

                {/* STEP 2 */}
                <button
                  onClick={() => navigate("/analytics")}
                  className="col-span-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold 
                             hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                >
                  <MdDataExploration size={20} /> Step 2: Run Analysis
                </button>

                <div className="col-span-1 flex items-center justify-center text-xl font-extrabold text-white">
                  0 / 1
                </div>
              </div>

            </div>

            {/* RIGHT SIDE MOCKUP */}
            <div className="lg:w-2/5 flex flex-col p-6 rounded-2xl border border-purple-800/50 bg-[#0c1020]">

              <div className="flex justify-between items-center mb-4 border-b border-gray-700/50 pb-2">
                <div className="text-sm font-semibold text-purple-400 flex items-center gap-1">
                  <MdOutlineDashboard size={18} /> Dashboard Preview
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-900/40 mb-4 flex justify-between items-center border border-purple-700/50">
                <div className="text-gray-300">Sample KPI</div>
                <MdGraphicEq className="text-green-400" size={24} />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2 p-4 rounded-xl bg-black/30 border border-gray-700/50">
                  <p className="text-purple-400 text-xl font-extrabold">14,212</p>
                  <p className="text-gray-400 text-sm">Sample Metric</p>
                  <MdGraphicEq className="text-yellow-400 mt-3" size={40} />
                </div>

                <div className="w-1/2 p-4 rounded-xl bg-black/30 border border-gray-700/50 flex flex-col justify-between">
                  <p className="text-gray-400 text-sm mb-2">Sample Chart</p>
                  <div className="bg-purple-900/30 h-24 rounded-full w-24 mx-auto border-4 border-purple-600"></div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Preview of category distribution</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  }

  // ------------- EXISTING DASHBOARD VIEW -------------
  const { kpis, analysisText, meta, categories } = dashboard;
  const metricKey = Object.keys(kpis)[0];
  const primaryKpi = kpis[metricKey];

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-[#0b0f1a] to-[#12062d]">
      
      <div className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-gray-800 gap-4">
        
        <div>
          <div className="text-3xl font-bold text-white flex items-center gap-3">
            <MdOutlineDashboard size={28} className="text-green-400"/> {meta.sourceName} - Overview
          </div>
          <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
            <MdInfoOutline size={16} className="text-purple-400"/>
            Snapshot saved: {new Date(meta.savedAt).toLocaleTimeString()}
          </div>
        </div>

        <button 
          onClick={() => navigate("/analytics")} 
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <MdDataExploration /> Edit Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <OverviewKpiTile
          title={`Total ${metricKey}`}
          value={primaryKpi.total}
          context={`Increase of ${primaryKpi.context}`}
          icon={MdTrendingUp}
          sparkData={primaryKpi.sparkData}
        />

        <OverviewKpiTile
          title={`Average ${metricKey}`}
          value={primaryKpi.avg}
          context={`Max: ${primaryKpi.max} | Min: ${primaryKpi.min}`}
          icon={MdInfoOutline}
        />

        <OverviewKpiTile
          title={"Top Category"}
          value={categories.labels[0]}
          context={`Represents ${((categories.data[0] / primaryKpi.total) * 100).toFixed(1)}%`}
          icon={MdOutlineDashboard}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        <div className="lg:w-3/5 p-6 rounded-xl shadow-lg flex-grow bg-[#1c2135] border-l-4 border-purple-400">
          <div className="font-semibold text-2xl text-pink-400 mb-3 flex items-center gap-2">
            <MdDataExploration size={24}/> AI Analysis & Key Takeaways
          </div>
          <div className="text-base text-gray-300 whitespace-pre-wrap leading-relaxed">
            {analysisText}
          </div>
        </div>

        <div className="lg:w-2/5 flex-shrink-0">
          <CategoryPieChart categories={categories} />
        </div>

      </div>
    </div>
  );
}
