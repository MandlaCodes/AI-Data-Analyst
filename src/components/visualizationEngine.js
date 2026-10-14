/**
 * MetriaAI — deterministic, dataset-agnostic visualization planning.
 * No React, Chart.js, network calls or LLM required.
 *
 * Public API:
 *   buildVisualizationPlan(dataset, options?) -> {profile, kpis, charts, warnings}
 *   buildVisualizationPlans(datasets, options?) -> array
 *   profileDataset(dataset, options?) -> schema summary
 *   aggregateMetric(rows, metric, options?) -> number|null
 *   toChartJsData(chart, palette?) -> Chart.js {labels,datasets}
 *
 * Accepts {name, data: [headerRow, ...rows]} or {data: [{...}, ...]}.
 * Data is never modified. Charts only show computed, evidence-backed values.
 */

export const DEFAULT_PALETTE = ["#00F2FF", "#7000FF", "#FF007A", "#ADFF2F", "#FF8A00", "#00FF94"];
const MAX_ROWS = 200000;
const EMPTY = new Set(["", "null", "none", "n/a", "na", "undefined", "nan", "-"]);
const ID_RE = /(^|[_\s-])(id|uuid|guid|sku|code|reference|ref|account\s*number|invoice\s*number|zip|postal)([_\s-]|$)/i;
const DATE_RE = /(^|[_\s-])(date|month|year|week|day|timestamp|period|created|updated|time)([_\s-]|$)/i;
const RATE_RE = /(ctr|cpc|cpm|cpa|roas|roi|rate|ratio|percentage|percent|margin|conversion[_\s-]*rate|bounce[_\s-]*rate)/i;
const MONEY_RE = /(spend|cost|revenue|sales|income|amount|price|profit|budget|value|expenses?|turnover|gmv)/i;
const COUNT_RE = /(impressions?|clicks?|conversions?|leads?|orders?|units?|quantity|qty|visits?|sessions?|views?|signups?|customers?|transactions?|stock|soh|inventory|count|sold)/i;
const DIMENSION_RE = /(client|customer|platform|channel|campaign|category|industry|region|country|state|city|product|brand|department|team|source|segment|status|store)/i;
const NON_ADDITIVE_RE = /(balance|stock|soh|inventory|on[_\s-]*hand|headcount|price|unit[_\s-]*cost|unit[_\s-]*price|average|avg|median)/i;
const CURRENCY_MARKERS = /(zar|usd|eur|gbp|aud|cad|\$|€|£|\br\b)/i;
const RATE_COMPONENTS = [
  {test: /(^|\W)ctr(\W|$)|click[_\s-]*through[_\s-]*rate/i, numerator: /(^|\W)clicks?(\W|$)/i, denominator: /(^|\W)impressions?(\W|$)/i, factor: 100, unit: "%"},
  {test: /(^|\W)cpc(\W|$)|cost[_\s-]*per[_\s-]*click/i, numerator: /(spend|advertising[_\s-]*cost|ad[_\s-]*cost)/i, denominator: /(^|\W)clicks?(\W|$)/i, factor: 1, unit: "currency"},
  {test: /(^|\W)cpm(\W|$)|cost[_\s-]*per[_\s-]*mille/i, numerator: /(spend|advertising[_\s-]*cost|ad[_\s-]*cost)/i, denominator: /(^|\W)impressions?(\W|$)/i, factor: 1000, unit: "currency"},
  {test: /(^|\W)cpa(\W|$)|cost[_\s-]*per[_\s-]*acquisition/i, numerator: /(spend|advertising[_\s-]*cost|ad[_\s-]*cost)/i, denominator: /(conversions?|acquisitions?)/i, factor: 1, unit: "currency"},
  {test: /(^|\W)roas(\W|$)/i, numerator: /(attributed[_\s-]*revenue|revenue)/i, denominator: /(spend|advertising[_\s-]*cost|ad[_\s-]*cost)/i, factor: 1, unit: "x"},
  {test: /conversion[_\s-]*rate/i, numerator: /(^|\W)conversions?(\W|$)/i, denominator: /(^|\W)(clicks?|sessions?|visits?)(\W|$)/i, factor: 100, unit: "%"},
];

const cleanName = v => String(v ?? "").trim();
const pretty = v => cleanName(v).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
const finite = n => typeof n === "number" && Number.isFinite(n);
const isMissing = v => v === null || v === undefined || (typeof v === "string" && EMPTY.has(v.trim().toLowerCase()));

/** Strict numeric parsing: never coerce IDs, dates or arbitrary text into numbers. */
export function parseNumeric(value) {
  if (finite(value)) return value;
  if (typeof value !== "string" || isMissing(value)) return null;
  let s = value.trim();
  const negative = /^\(.*\)$/.test(s);
  if (negative) s = s.slice(1, -1).trim();
  s = s.replace(/^(?:ZAR|USD|EUR|GBP|AUD|CAD)\s*/i, "").replace(/^(?:R\s*|\$\s*|€\s*|£\s*)/i, "").replace(/\s*(?:ZAR|USD|EUR|GBP|AUD|CAD)$/i, "");
  const percent = s.endsWith("%");
  if (percent) s = s.slice(0, -1).trim();
  // US/UK formatted numbers; ambiguous decimal-comma inputs are not guessed.
  if (!/^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/.test(s)) return null;
  const n = Number(s.replace(/,/g, "")) * (negative ? -1 : 1);
  return Number.isFinite(n) ? n : null;
}

/** Canonical YYYY-MM-DD, including month-only YYYY-MM and common ISO dates. */
export function parseDateKey(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value !== "string") return null;
  const s = value.trim();
  let match = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?(?:[T\s].*)?$/.exec(s);
  if (!match) match = /^(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?$/.exec(s);
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3] || 1);
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalize(dataset, maxRows = MAX_ROWS) {
  const input = Array.isArray(dataset) ? dataset : dataset?.data ?? dataset?.rows ?? [];
  if (!Array.isArray(input) || !input.length) return {rows: [], columns: [], warnings: ["No tabular records found."]};
  const matrix = Array.isArray(input[0]);
  const headers = matrix ? input[0].map((v, i) => cleanName(v) || `Column ${i + 1}`) : Object.keys(input[0] || {});
  const columns = headers.map((name, i) => ({key: name, label: name, index: i}));
  const warnings = [];
  if (new Set(headers).size !== headers.length) warnings.push("Duplicate column headers detected; rename columns before trusting the results.");
  const source = matrix ? input.slice(1) : input;
  if (source.length > maxRows) warnings.push(`Only the first ${maxRows.toLocaleString()} records were analyzed; results are partial.`);
  const rows = source.slice(0, maxRows).filter(r => r && typeof r === "object").map(r => matrix ? Object.fromEntries(headers.map((h, i) => [h, r[i]])) : r);
  return {rows, columns, warnings};
}

function columnProfile(rows, column) {
  const key = column.key, name = key.toLowerCase();
  const sample = rows.slice(0, 1500).map(r => r[key]).filter(v => !isMissing(v));
  const nonEmpty = sample.length;
  const unique = new Set(sample.map(v => String(v))).size;
  const numeric = sample.filter(v => parseNumeric(v) !== null).length;
  const dates = sample.filter(v => parseDateKey(v) !== null).length;
  const numericRatio = nonEmpty ? numeric / nonEmpty : 0;
  const dateRatio = nonEmpty ? dates / nonEmpty : 0;
  const identifier = ID_RE.test(name) || (numericRatio > 0.95 && unique === nonEmpty && /(?:number|key)$/i.test(name));
  const date = !identifier && (dateRatio >= 0.9 || (DATE_RE.test(name) && dateRatio >= 0.65));
  const metric = !identifier && !date && numericRatio >= 0.9 && nonEmpty > 0;
  const rate = metric && RATE_RE.test(name);
  const currency = metric && (MONEY_RE.test(name) || CURRENCY_MARKERS.test(name));
  const category = !metric && !date && !identifier;
  const preferredDimension = category && (DIMENSION_RE.test(name) || unique <= 12);
  const additive = metric && !rate && !NON_ADDITIVE_RE.test(name);
  const type = identifier ? "identifier" : date ? "date" : rate ? "rate" : metric ? "metric" : "category";
  return {...column, type, nonEmpty, unique, numericRatio, dateRatio, currency, additive, preferredDimension, values: sample.length};
}

export function profileDataset(dataset, options = {}) {
  const {rows, columns, warnings} = normalize(dataset, options.maxRows ?? MAX_ROWS);
  const profiles = columns.map(c => columnProfile(rows, c));
  return {name: dataset?.name || "Dataset", rowCount: rows.length, columns: profiles, warnings, truncated: warnings.some(w => w.includes("partial"))};
}

const sumColumn = (rows, key) => {
  let total = 0, count = 0;
  for (const row of rows) {
    const n = parseNumeric(row[key]);
    if (n !== null) { total += n; count++; }
  }
  return count ? total : null;
};

function rateSpec(column, profiles) {
  const rule = RATE_COMPONENTS.find(r => r.test.test(column.key));
  if (!rule) return null;
  const available = profiles.filter(c => c.type === "metric" || c.type === "rate");
  const num = available.find(c => rule.numerator.test.test(c.key) && c.key !== column.key);
  const den = available.find(c => rule.denominator.test.test(c.key) && c.key !== column.key);
  return num && den ? {numerator: num.key, denominator: den.key, factor: rule.factor, unit: rule.unit} : null;
}

/** Only use weighted/ratio aggregation when matching components are available. */
export function aggregateMetric(rows, metric, options = {}) {
  const spec = options.rateSpec;
  if (spec) {
    const num = sumColumn(rows, spec.numerator), den = sumColumn(rows, spec.denominator);
    return num !== null && den !== null && den !== 0 ? (num / den) * spec.factor : null;
  }
  const values = rows.map(r => parseNumeric(r[metric])).filter(v => v !== null);
  if (!values.length) return null;
  const mode = options.aggregation || "sum";
  if (mode === "count") return values.length;
  if (mode === "avg") return values.reduce((a, b) => a + b, 0) / values.length;
  if (mode === "min") return Math.min(...values);
  if (mode === "max") return Math.max(...values);
  if (mode === "last") return values[values.length - 1];
  return values.reduce((a, b) => a + b, 0);
}

function monthKey(value) { const date = parseDateKey(value); return date ? date.slice(0, 7) : null; }
function makeGroups(rows, dimension, time = false) {
  const groups = new Map();
  for (const row of rows) {
    const raw = row[dimension];
    if (isMissing(raw)) continue;
    const key = time ? monthKey(raw) : String(raw).trim();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}
function priority(c) {
  const n = c.key.toLowerCase();
  if (/^(?:spend|spend[_\s-]*zar|revenue|attributed[_\s-]*revenue|sales|amount|profit)$/i.test(n)) return 110;
  if (/(revenue|spend|sales|profit|clicks|impressions|conversions|orders|quantity)/i.test(n)) return 80;
  if (c.currency) return 60;
  if (c.additive) return 40;
  return 0;
}
function metricMode(c, spec) {
  if (spec) return "ratio";
  if (c.type === "rate") return "avg"; // only a fallback; rates are omitted from auto-charts without components
  return c.additive ? "sum" : "avg";
}
function metricUnit(c, spec) {
  if (spec) return spec.unit;
  if (c.currency) return "currency";
  if (c.type === "rate") return "%";
  return "number";
}
function createChart(rows, dimension, metric, profiles, options = {}) {
  const spec = rateSpec(metric, profiles);
  if (metric.type === "rate" && !spec) return null; // avoid incorrect averages of percentages
  const isTime = dimension.type === "date";
  const groups = makeGroups(rows, dimension.key, isTime);
  const limit = options.maxCategories ?? 12;
  if (groups.size < 2 || groups.size > (isTime ? 120 : 5000)) return null;
  let points = [...groups.entries()].map(([label, subset]) => ({label, value: aggregateMetric(subset, metric.key, {rateSpec: spec, aggregation: metricMode(metric, spec)}), records: subset.length})).filter(p => finite(p.value));
  if (points.length < 2) return null;
  points.sort(isTime ? (a, b) => a.label.localeCompare(b.label) : (a, b) => b.value - a.value);
  const truncated = points.length > limit;
  if (truncated) points = points.slice(0, limit);
  const chartType = isTime ? "line" : "bar";
  return {
    id: `${dimension.key}::${metric.key}`, type: chartType, dimension: dimension.key, metric: metric.key,
    title: `${pretty(metric.key)} by ${isTime ? "month" : pretty(dimension.key)}`,
    subtitle: `${spec ? "Calculated from aggregated components" : metricMode(metric, spec) === "sum" ? "Sum" : "Average"} · ${rows.length.toLocaleString()} source records`,
    unit: metricUnit(metric, spec), aggregation: metricMode(metric, spec),
    labels: points.map(p => p.label), values: points.map(p => p.value),
    points, truncated, note: truncated ? `Showing top ${limit} groups; not all categories are displayed.` : null,
    source: {dimension: dimension.key, metric: metric.key, numerator: spec?.numerator || null, denominator: spec?.denominator || null}
  };
}

function countChart(rows, dimension, options = {}) {
  const groups = makeGroups(rows, dimension.key, dimension.type === "date");
  if (groups.size < 2 || groups.size > 5000) return null;
  const isTime = dimension.type === "date";
  let points = [...groups].map(([label, items]) => ({label, value: items.length, records: items.length}));
  points.sort(isTime ? (a, b) => a.label.localeCompare(b.label) : (a, b) => b.value - a.value);
  const limit = options.maxCategories ?? 12;
  const truncated = points.length > limit;
  points = points.slice(0, limit);
  return {
    id: `${dimension.key}::records`, type: "bar", dimension: dimension.key, metric: null,
    title: `Record count by ${isTime ? "month" : pretty(dimension.key)}`,
    subtitle: "Number of records, not business volume", unit: "number", aggregation: "count",
    labels: points.map(p => p.label), values: points.map(p => p.value), points, truncated,
    note: truncated ? `Showing top ${limit} groups.` : null,
    source: {dimension: dimension.key, metric: null}
  };
}

/** Main entry point. Does not fabricate trends, totals, categories, or missing values. */
export function buildVisualizationPlan(dataset, options = {}) {
  const {rows, columns, warnings} = normalize(dataset, options.maxRows ?? MAX_ROWS);
  const profiles = columns.map(c => columnProfile(rows, c));
  const profile = {name: dataset?.name || "Dataset", rowCount: rows.length, columns: profiles, truncated: warnings.some(w => w.includes("partial"))};
  if (!rows.length) return {profile, kpis: [], charts: [], warnings};
  const metrics = profiles.filter(c => c.type === "metric" || c.type === "rate").sort((a, b) => priority(b) - priority(a));
  const dates = profiles.filter(c => c.type === "date").sort((a, b) => (/month|date/i.test(b.key) ? 1 : 0) - (/month|date/i.test(a.key) ? 1 : 0));
  const categories = profiles.filter(c => c.type === "category" && c.unique >= 2 && c.unique <= (options.maxUniqueDimension ?? 100)).sort((a, b) => (Number(b.preferredDimension) - Number(a.preferredDimension)) || (a.unique - b.unique));
  const kpis = [];
  for (const c of metrics) {
    if (kpis.length >= Math.max(0, (options.maxKpis ?? 8) - 2)) break;
    const spec = rateSpec(c, profiles);
    if (c.type === "rate" && !spec) continue;
    const aggregation = metricMode(c, spec);
    const value = aggregateMetric(rows, c.key, {rateSpec: spec, aggregation});
    if (!finite(value)) continue;
    kpis.push({key: c.key, label: pretty(c.key), value, unit: metricUnit(c, spec), aggregation,
      formula: spec ? `${spec.numerator} / ${spec.denominator}${spec.factor !== 1 ? ` × ${spec.factor}` : ""}` : null});
  }
  // Add important derived marketing ratios even if no CTR/CPC/ROAS column exists.
  for (const rule of RATE_COMPONENTS) {
    if (kpis.length >= (options.maxKpis ?? 8)) break;
    const num = metrics.find(c => rule.numerator.test(c.key));
    const den = metrics.find(c => rule.denominator.test(c.key));
    if (!num || !den) continue;
    const label = rule.test.test("CTR") && rule.numerator.test("Clicks") ? "Overall CTR" : rule.test.test("CPC") && rule.denominator.test("Clicks") ? "Overall CPC" : rule.test.test("ROAS") ? "Overall ROAS" : rule.unit === "%" ? "Calculated conversion rate" : "Calculated cost efficiency";
    const key = `${num.key}/${den.key}`;
    if (kpis.some(k => k.formula?.includes(num.key) && k.formula?.includes(den.key))) continue;
    const value = aggregateMetric(rows, key, {rateSpec: {numerator: num.key, denominator: den.key, factor: rule.factor}});
    if (finite(value)) kpis.push({key, label, value, unit: rule.unit, aggregation: "ratio", formula: `${num.key} / ${den.key}${rule.factor !== 1 ? ` × ${rule.factor}` : ""}`});
  }
  const charts = [];
  const seen = new Set();
  const add = chart => {if (chart && !seen.has(chart.id) && charts.length < (options.maxCharts ?? 6)) {seen.add(chart.id); charts.push(chart);}};
  const primaryMetrics = metrics.filter(c => c.type === "metric" && c.additive).slice(0, 4);
  const preferredTime = dates.find(d => d.unique >= 2);
  if (preferredTime) for (const metric of primaryMetrics.slice(0, 3)) add(createChart(rows, preferredTime, metric, profiles, options));
  const preferredCategory = categories.find(c => DIMENSION_RE.test(c.key)) || categories[0];
  if (preferredCategory) for (const metric of primaryMetrics.slice(0, 3)) add(createChart(rows, preferredCategory, metric, profiles, options));
  if (!charts.length && preferredTime) add(countChart(rows, preferredTime, options));
  if (!charts.length && preferredCategory) add(countChart(rows, preferredCategory, options));
  if (!charts.length) warnings.push("No trustworthy automatic chart could be inferred. Choose a dimension and metric manually.");
  if (metrics.some(c => c.type === "rate" && !rateSpec(c, profiles))) warnings.push("Some rate columns were excluded because their weighted numerator/denominator could not be identified.");
  if (metrics.some(c => !c.additive && c.type === "metric")) warnings.push("Non-additive fields (e.g. prices, balances) use averages, not sums; validate the business meaning.");
  return {profile, kpis, charts, warnings};
}

export function buildVisualizationPlans(datasets, options = {}) {
  return (Array.isArray(datasets) ? datasets : []).map(ds => buildVisualizationPlan(ds, options));
}

/** Compatible with existing react-chartjs-2 Bar and Line components. */
export function toChartJsData(chart, palette = DEFAULT_PALETTE) {
  const color = palette[0] || "#00F2FF";
  return {
    labels: chart.labels,
    datasets: [{label: chart.metric ? pretty(chart.metric) : "Record count", data: chart.values,
      borderColor: color, backgroundColor: chart.type === "line" ? `${color}33` : `${color}CC`,
      borderWidth: chart.type === "line" ? 3 : 1, borderRadius: chart.type === "bar" ? 6 : 0,
      tension: 0.25, fill: chart.type === "line", pointRadius: chart.labels.length > 24 ? 0 : 3}]
  };
}

export function formatMetric(value, unit = "number", currency = "ZAR") {
  if (!finite(value)) return "—";
  if (unit === "%") return `${value.toLocaleString(undefined, {maximumFractionDigits: 2})}%`;
  if (unit === "x") return `${value.toLocaleString(undefined, {maximumFractionDigits: 2})}×`;
  if (unit === "currency") return new Intl.NumberFormat("en-ZA", {style: "currency", currency, maximumFractionDigits: 2}).format(value);
  return value.toLocaleString(undefined, {maximumFractionDigits: 2});
}
