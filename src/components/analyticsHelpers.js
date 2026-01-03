export const isDate = (value) => {
    if (value === null || value === undefined) return false;
    const str = String(value).trim();
    if (str.length === 0) return false;
    
    const numericStr = str.replace(/[^0-9.-]/g, "");
    if (numericStr && !isNaN(Number(numericStr))) {
        const num = Number(numericStr);
        if (num > 10000000) return false; 
        if (String(Math.abs(num)).length === 4) return false;
    }
    
    const date = new Date(str);
    return !isNaN(date.getTime()) && date.getFullYear() > 1900; 
};

export const sanitizeCellValue = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const str = String(value).trim();
    const numericValue = Number(str.replace(/,/g, ''));
    if (!isNaN(numericValue) && str.length > 0) return numericValue;
    return str;
};

export const detectNumericColumns = (values) => {
    if (!values || values.length < 2) return [];
    return values[0]
        .map((_, colIndex) => {
            const sampleVals = values.slice(1, 6).map((r) => sanitizeCellValue(r[colIndex]));
            const isNumeric = sampleVals.some((v) => typeof v === "number") && 
                             sampleVals.every((v) => typeof v === "number" || isDate(v) || v === "");
            return isNumeric ? colIndex : null;
        })
        .filter((i) => i !== null);
};

export const detectCategoryColumn = (values, numericIndexes) => {
    if (!values || values.length < 2) return null;
    const headerRow = values[0];

    for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
        if (numericIndexes.includes(colIndex)) continue;
        const sampleVals = values.slice(1, 10).map((r) => sanitizeCellValue(r[colIndex]));
        
        let isDateType = sampleVals.every(v => isDate(v) || v === "");
        if (isDateType) {
            return { colIndex, isDate: true, header: headerRow[colIndex] };
        }

        const uniqueValues = new Set(sampleVals.filter(v => typeof v === "string" && v.length > 0));
        if (uniqueValues.size > 1 && uniqueValues.size <= sampleVals.length) {
            return { colIndex, isDate: false, header: headerRow[colIndex] };
        }
    }
    return null; 
};

export const computeMetrics = (values, numericIndexes) => {
    if (!values.length || !numericIndexes.length) return {};
    const headers = values[0];
    const metrics = {};
    numericIndexes.forEach((colIndex) => {
        const colName = headers[colIndex] || `col_${colIndex}`;
        const arr = values.slice(1).map((r) => {
            const n = sanitizeCellValue(r[colIndex]);
            return typeof n === "number" ? n : null;
        }).filter(n => n !== null);
        
        const total = arr.reduce((a, b) => a + b, 0);
        const avg = arr.length ? total / arr.length : 0;
        const max = arr.length ? Math.max(...arr) : 0;
        const min = arr.length ? Math.min(...arr) : 0;
        
        const sqDifferences = arr.map(n => Math.pow(n - avg, 2));
        const variance = arr.length > 1 ? sqDifferences.reduce((a, b) => a + b, 0) / (arr.length - 1) : 0;
        const stdDev = Math.sqrt(variance);

        metrics[colName] = {
            total: total.toFixed(2),
            avg: avg.toFixed(2),
            max: max.toFixed(2),
            min: min.toFixed(2),
            count: arr.length,
            stdDev: stdDev.toFixed(2), 
        };
    });
    return metrics;
};

export const parseCSVFile = async (file) => {
    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(Boolean);
    return rows.map(r => r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"')));
};