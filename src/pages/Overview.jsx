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
import { MdOutlineDashboard, MdDataExploration, MdInfoOutline, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { useNavigate } from "react-router-dom";

// Register Chart.js elements
ChartJS.register(ArcElement, Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// --- Sparkline Component ---
const Sparkline = ({ data }) => {
  if (!data || data.length === 0) return null;

  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [
      {
        data: data,
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
    <div style={{ height: '40px', width: '100px' }} className="flex-shrink-0">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

// --- KPI Tile ---
function OverviewKpiTile({ title, value, context, icon: Icon, sparkData }) {
  const isPositive = context && context.includes("Positive");

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

      <div className={`text-xs mt-3 ${isPositive ? 'text-green-400' : 'text-orange-400'} font-medium`}>
        {context || "No contextual information available."}
      </div>
    </div>
  );
}

// --- Category Pie Chart ---
const CategoryPieChart = ({ categories }) => {
  if (!categories || !categories.labels?.length) return null;

  const chartData = {
    labels: categories.labels,
    datasets: [
      {
        data: categories.data,
        backgroundColor: ['#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa'],
      },
    ],
  };

  const chartOptions = { responsive: true, plugins: { legend: { position: 'bottom' } } };

  return (
    <div className="rounded-xl p-4 shadow-lg h-full" style={{ background: "linear-gradient(180deg, rgba(12,14,26,0.65), rgba(6,8,18,0.45))" }}>
      <div className="text-lg font-semibold text-gray-300 mb-4">Distribution by Top Category</div>
      <div style={{ height: 320 }}>
        <Pie data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

// --- Main Overview Component ---
export default function Overview({ profile }) {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the user's dashboard sessions from backend
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`https://ai-data-analyst-backend-1nuw.onrender.com/api/dashboard/sessions?user_id=${profile.user_id}`);
        const data = await res.json();

        if (data.sessions && data.sessions.length > 0) {
          // For simplicity, load the first (latest) dashboard
          const latestDashboard = data.sessions.find(s => s.is_current) || data.sessions[0];

          // Fetch dashboard layout/details if stored separately
          // Assuming the layout data is embedded in the session for now
          setDashboard(latestDashboard.layout_data ? JSON.parse(latestDashboard.layout_data) : null);
        }
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [profile.user_id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-white bg-[#0b0f1a]">Loading Dashboard...</div>;
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen p-10 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b0f1a] to-[#12062d]">
        <div className="p-10 text-center rounded-xl bg-gray-900/50 border border-purple-900/50 max-w-lg">
          <h2 className="text-3xl font-bold text-red-400 mb-4">No Dashboard Found</h2>
          <p className="text-gray-400 mb-6">Please go to the Analytics Workspace to create a dashboard.</p>
          <button onClick={() => navigate("/analytics")} className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center gap-2 mx-auto">
            <MdDataExploration /> Go to Workspace
          </button>
        </div>
      </div>
    );
  }

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
        <button onClick={() => navigate("/analytics")} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center gap-2">
          <MdDataExploration /> Edit Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <OverviewKpiTile
          title={`Total ${metricKey}`}
          value={primaryKpi.total}
          context={primaryKpi.context || "Positive performance"}
          icon={MdTrendingUp}
          sparkData={primaryKpi.sparkData}
        />
        <OverviewKpiTile
          title={`Average ${metricKey} Value`}
          value={primaryKpi.avg}
          context={`Max: ${primaryKpi.max} | Min: ${primaryKpi.min}`}
          icon={MdInfoOutline}
        />
        <OverviewKpiTile
          title={"Top Contributing Category"}
          value={categories.labels[0]}
          context={`Accounts for ${((categories.data[0] / primaryKpi.total) * 100).toFixed(1)}% of total ${metricKey}`}
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
