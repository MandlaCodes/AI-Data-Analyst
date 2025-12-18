import React from "react";
import { Line, Bar } from "react-chartjs-2";
import { FiTrendingUp, FiBarChart2, FiActivity, FiZap, FiTarget } from "react-icons/fi";

export const Visualizer = ({ activeDatasets, chartType, setChartType, sanitizeCellValue }) => {
    
    // --- AI LOGIC REMAINS THE SAME ---
    const getForecastData = (values) => {
        const n = values.length;
        if (n < 2) return values;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        values.forEach((y, x) => {
            sumX += x; sumY += y;
            sumXY += x * (y || 0);
            sumXX += x * x;
        });
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        return values.map((_, x) => slope * x + intercept);
    };

    const calculateCorrelation = () => {
        if (activeDatasets.length !== 2) return null;
        const ds1 = activeDatasets[0];
        const ds2 = activeDatasets[1];
        const val1 = ds1.data.slice(1, 11).map(r => sanitizeCellValue(r[ds1.numericCols[0]]));
        const val2 = ds2.data.slice(1, 11).map(r => sanitizeCellValue(r[ds2.numericCols[0]]));
        const ratio = val1.reduce((acc, v, i) => acc + (v / (val2[i] || 1)), 0) / val1.length;
        return ratio.toFixed(2);
    };

    const generateChartsForDataset = (dataset) => {
        const { data, numericCols, categoryCol, color } = dataset;
        if (!numericCols.length || !categoryCol) return null;
        
        const rawData = data.slice(1, 15).map(r => sanitizeCellValue(r[numericCols[0]]));
        const labels = data.slice(1, 15).map(r => r[categoryCol.colIndex]);
        const forecastLine = getForecastData(rawData);

        const chartData = {
            labels,
            datasets: [
                {
                    label: `Actual`,
                    data: rawData,
                    borderColor: color,
                    backgroundColor: (context) => {
                        const bg = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
                        bg.addColorStop(0, `${color}44`);
                        bg.addColorStop(1, `${color}00`);
                        return bg;
                    },
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: color,
                },
                {
                    label: `AI Prediction`,
                    data: forecastLine,
                    borderColor: "#f472b6",
                    borderDash: [6, 3],
                    pointRadius: 0,
                    fill: false,
                    borderWidth: 2,
                    opacity: 0.6
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    display: true, 
                    position: 'top',
                    align: 'end',
                    labels: { color: '#64748b', boxWidth: 8, usePointStyle: true, font: { size: 11, weight: '600' } } 
                }
            },
            scales: {
                x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { display: false } },
                y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } }
            }
        };

        return (
            <div key={dataset.id} className="h-[400px] bg-[#0F172A]/40 backdrop-blur-xl p-6 rounded-3xl border border-white/[0.05] shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                        <h4 className="text-xl font-bold text-white tracking-tight">{dataset.name}</h4>
                    </div>
                    <FiTarget className="text-slate-600" size={18} />
                </div>
                <div className="h-[280px]">
                    {chartType === "line" ? <Line data={chartData} options={options} /> : <Bar data={chartData} options={options} />}
                </div>
            </div>
        );
    };

    const correlation = calculateCorrelation();

    return (
        <div className="space-y-6">
            {/* AI Insight Bar */}
            {correlation && (
                <div className="bg-indigo-500/5 border border-indigo-500/20 px-6 py-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-500/20 p-2 rounded-lg"><FiZap className="text-indigo-400" size={18} /></div>
                        <p className="text-sm text-slate-300">
                            <span className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mr-2">Corelation Engine:</span>
                            1 unit of {activeDatasets[1].name} ≈ <span className="text-white font-mono font-bold text-base">{correlation}</span> of {activeDatasets[0].name}
                        </p>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 uppercase">Analysis Complete</div>
                </div>
            )}

            {/* Header Section */}
            <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Visual Insights</h3>
                    <div className="h-0.5 w-12 bg-purple-600 mt-1 rounded-full" />
                </div>
                
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setChartType("line")} 
                        className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${chartType === "line" ? "bg-white text-black" : "text-slate-500 hover:text-slate-300"}`}
                    >
                        Line
                    </button>
                    <button 
                        onClick={() => setChartType("bar")} 
                        className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${chartType === "bar" ? "bg-white text-black" : "text-slate-500 hover:text-slate-300"}`}
                    >
                        Bar
                    </button>
                </div>
            </div>
            
            {/* Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {activeDatasets.length > 0 ? activeDatasets.map(ds => generateChartsForDataset(ds)) : (
                    <div className="xl:col-span-2 py-24 flex flex-col items-center justify-center bg-slate-900/10 rounded-3xl border border-dashed border-white/5">
                        <FiBarChart2 size={32} className="text-slate-800 mb-4" />
                        <p className="text-sm font-bold text-slate-600 uppercase tracking-[0.2em]">Select Datasets to begin</p>
                    </div>
                )}
            </div>
        </div>
    );
};