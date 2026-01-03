/**
 * utils/AnalystEngine.js
 */
export const prepareAIContext = (dataset) => {
    if (!dataset || !dataset.analysis) {
        return { stats: [], trends: [], rowCount: 0, columnNames: [] };
    }

    const { columns, rows, analysis } = dataset;
    
    const calculateVolatility = (values) => {
        if (!values || values.length === 0) return "0.00";
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(v => Math.pow(v - avg, 2));
        const variance = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(variance);
        return isFinite(stdDev) ? stdDev.toFixed(2) : "0.00";
    };

    const numericSummary = analysis
        .filter(col => col.isNumeric && col.numeric && col.numeric.length > 0)
        .map(col => {
            const vals = col.numeric;
            const sum = vals.reduce((a, b) => a + b, 0);
            return {
                header: col.col,
                avg: (sum / vals.length).toFixed(2),
                max: Math.max(...vals),
                min: Math.min(...vals),
                volatility: calculateVolatility(vals) 
            };
        });

    const trends = analysis
        .filter(col => col.isNumeric && col.numeric && col.numeric.length > 4)
        .map(col => {
            const vals = col.numeric;
            const firstHalf = vals.slice(0, Math.floor(vals.length / 2));
            const secondHalf = vals.slice(Math.floor(vals.length / 2));
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            
            const growth = (firstAvg && firstAvg !== 0) ? ((secondAvg / firstAvg) - 1) * 100 : 0;
            const safeGrowth = isFinite(growth) ? growth.toFixed(1) : "0.0";

            return { header: col.col, growthPercent: safeGrowth };
        });

    return {
        stats: numericSummary,
        trends: trends,
        rowCount: rows?.length || 0,
        columnNames: columns || []
    };
};