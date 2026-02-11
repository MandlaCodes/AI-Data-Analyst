export function flattenDatasets(datasets: any[]) {
    return datasets.flatMap(ds => ds.metrics || []);
  }
  export function calculateTotals(rows: any[]) {
    const totalRevenue = rows.reduce((sum, r) => sum + (r.revenue || 0), 0);
    const totalExpense = rows.reduce((sum, r) => sum + (r.expense || 0), 0);
    const totalProfit = totalRevenue - totalExpense;
  
    const avgProfitMargin =
      totalRevenue > 0 ? totalProfit / totalRevenue : 0;
  
    return {
      total_revenue: totalRevenue,
      total_expense: totalExpense,
      total_profit: totalProfit,
      avg_profit_margin: avgProfitMargin
    };
  }
  export function calculateRevenueBySegment(rows: any[]) {
    const segmentMap: Record<string, number> = {};
  
    rows.forEach(r => {
      const segment = r.segment || "Uncategorized";
      segmentMap[segment] = (segmentMap[segment] || 0) + (r.revenue || 0);
    });
  
    return segmentMap;
  }
  
  export function calculateGrowthRate(rows: any[]) {
    const datedRows = rows
      .filter(r => r.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
    if (datedRows.length < 2) return null;
  
    const first = datedRows[0].revenue || 0;
    const last = datedRows[datedRows.length - 1].revenue || 0;
  
    if (first === 0) return null;
  
    return (last - first) / first;
  }
  
  export function calculateTopClientShare(rows: any[]) {
    const clientRevenue: Record<string, number> = {};
  
    rows.forEach(r => {
      const client = r.client || "Unknown";
      clientRevenue[client] =
        (clientRevenue[client] || 0) + (r.revenue || 0);
    });
  
    const totalRevenue = Object.values(clientRevenue).reduce((a, b) => a + b, 0);
    const topClientRevenue = Math.max(...Object.values(clientRevenue), 0);
  
    return totalRevenue > 0 ? topClientRevenue / totalRevenue : 0;
  }
  
  export function calculateVolatilityIndex(rows: any[]) {
    const revenues = rows.map(r => r.revenue || 0);
  
    if (revenues.length < 2) return null;
  
    const mean =
      revenues.reduce((sum, r) => sum + r, 0) / revenues.length;
  
    const variance =
      revenues.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      revenues.length;
  
    return Math.sqrt(variance);
  }
  
  export function buildIntelligencePayload(datasets: any[]) {
    const rows = flattenDatasets(datasets);
  
    const totals = calculateTotals(rows);
  
    const distribution = {
      revenue_by_segment: calculateRevenueBySegment(rows)
    };
  
    const trends = {
      growth_rate: calculateGrowthRate(rows),
      volatility_index: calculateVolatilityIndex(rows)
    };
  
    const concentration = {
      top_client_share: calculateTopClientShare(rows)
    };
  
    return {
      totals,
      distribution,
      trends,
      concentration
    };
  }
  