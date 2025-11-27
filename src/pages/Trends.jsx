// src/pages/Trends.jsx
import React, { useState, useEffect } from "react";
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function Trends({ profile }) {
  const [trendData, setTrendData] = useState(null);

  // Mock AI predictions and anomalies
  useEffect(() => {
    const data = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      predictedPrices: [120, 115, 130, 125, 140, 135, 150],
      anomalies: [null, 110, null, null, 160, null, null],
    };
    setTrendData(data);
  }, []);

  if (!trendData) return <div className="text-gray-300">Loading trends...</div>;

  const lineChartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: "Predicted Prices",
        data: trendData.predictedPrices,
        borderColor: "rgba(128, 0, 255, 0.8)",
        backgroundColor: "rgba(128, 0, 255, 0.2)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Anomalies",
        data: trendData.anomalies,
        borderColor: "rgba(255, 0, 0, 0.8)",
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: false,
      },
    ],
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-purple-400">Trends & Predictions</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg flex flex-col">
          <span className="text-gray-400 text-sm">Upcoming Price Drop</span>
          <span className="text-white font-semibold text-xl">Feb -15%</span>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg flex flex-col">
          <span className="text-gray-400 text-sm">Highest Predicted Price</span>
          <span className="text-white font-semibold text-xl">Jul $150</span>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg flex flex-col">
          <span className="text-gray-400 text-sm">Detected Anomalies</span>
          <span className="text-white font-semibold text-xl">2</span>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-gray-900 p-4 rounded-lg w-full" style={{ height: "400px" }}>
        <Line
          data={lineChartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { color: "white" },
              },
              tooltip: {
                mode: "index",
                intersect: false,
              },
              title: {
                display: true,
                text: "Predicted Prices vs Anomalies",
                color: "white",
                font: { size: 16 },
              },
            },
            scales: {
              x: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } },
              y: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } },
            },
          }}
          height={400}
        />
      </div>

      {/* Insights */}
      <div className="bg-gray-900 p-4 rounded-lg flex flex-col gap-2">
        <h3 className="text-purple-400 font-semibold">AI Insights</h3>
        <ul className="list-disc list-inside text-gray-300">
          <li>Price expected to drop by 15% in February – consider adjusting inventory.</li>
          <li>July predicted as peak month with prices hitting $150.</li>
          <li>Anomalies detected in February and May – review sales data.</li>
        </ul>
      </div>
    </div>
  );
}
