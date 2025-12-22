import React from "react";

export function MetricSummaryCard({ colName, datasetName, metrics, color }) {
    const formatValue = (value) => {
        const num = Number(value);
        if (isNaN(num)) return value;
        if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'k';
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    const metricOrder = [
        { key: 'total', label: 'SUM', color: 'text-purple-400' },
        { key: 'avg', label: 'AVG', color: 'text-cyan-400' },
        { key: 'max', label: 'MAX', color: 'text-green-400' },
        { key: 'min', label: 'MIN', color: 'text-red-400' },
        { key: 'stdDev', label: 'SD', color: 'text-yellow-400' },
        { key: 'count', label: 'COUNT', color: 'text-gray-400' },
    ];

    return (
        <div 
            className="rounded-xl p-3 shadow-lg border border-gray-800 w-full flex flex-col transition-transform duration-700 hover:scale-[1.005]" 
            style={{ 
                background: "linear-gradient(135deg, rgba(255,255,255,0.01), rgba(10,12,18,0.65))", 
                backdropFilter: "blur(8px)",
                borderColor: `${color}80` 
            }}
        >
            <h3 className="text-sm font-bold text-white mb-2 pb-1 border-b border-gray-700/50 truncate">
                {datasetName}: {colName}
            </h3>
            <div className="flex justify-between items-start gap-2">
                {metricOrder.map(({ key, label, color: labelColor }) => (
                    <div key={key} className="flex flex-col flex-1 min-w-0 items-center">
                        <span className={`text-xs font-medium ${labelColor} leading-none mb-1`}>{label}</span>
                        <span className="text-sm font-extrabold text-white leading-none truncate">
                            {formatValue(metrics[key])}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}