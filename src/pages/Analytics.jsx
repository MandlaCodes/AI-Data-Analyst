// src/components/analytics.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// --- Configuration ---
const API_BASE_URL = 'https://ai-data-analyst-backend-1nuw.onrender.com';
const DUMMY_SHEET_ID = '12345_PLACEHOLDER_SHEET_ID_67890'; 

const Analytics = () => {
    const [sheetData, setSheetData] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // --- Helper to get JWT from localStorage ---
    const getAuthHeaders = () => {
        // Uses 'adt_token' key from Login.jsx 
        const token = localStorage.getItem('adt_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // --- 1. Fetch Google Sheet Data (Remains the same core logic) ---
    const fetchSheetData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = getAuthHeaders();
            if (!Object.keys(headers).length) {
                setError("User not authenticated. Please log in.");
                setLoading(false);
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/sheets/${DUMMY_SHEET_ID}`, { headers });
            setSheetData(response.data.values);
            
            if (response.data.values && response.data.values.length > 1) {
                await analyzeData(response.data.values);
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('Error fetching sheet data:', err);
            const errorMessage = err.response?.data?.error || 'Failed to fetch data. Check connection.';
            setError(errorMessage);
            setLoading(false);
        }
    }, []);

    // --- 2. Extract Data Structure for AI Prompt (Remains the same) ---
    const extractDataForAI = (data) => {
        if (!data || data.length < 2) return { kpis: [], categories: [], rowCount: 0 };

        const headers = data[0]; 
        const dataRows = data.slice(1);
        const rowCount = dataRows.length;

        const kpis = [];
        const categories = [];
        
        if (dataRows.length > 0) {
            dataRows[0].forEach((value, index) => {
                const header = headers[index];
                if (header && !isNaN(parseFloat(value)) && isFinite(value)) {
                    const trendSnapshot = dataRows.slice(-5).map(row => row[index]).filter(v => v);
                    kpis.push({ 
                        name: header, 
                        snapshot: trendSnapshot.join(', '),
                        sampleValue: value 
                    });
                } else if (header && value) {
                    const uniqueValues = new Set(dataRows.map(row => row[index]).slice(0, 100));
                    categories.push({ 
                        name: header, 
                        uniqueCount: uniqueValues.size,
                        sampleValues: Array.from(uniqueValues).slice(0, 5)
                    });
                }
            });
        }

        return { kpis, categories, rowCount };
    };

    // --- 3. Send Data Structure to AI Backend (Remains the same core logic) ---
    const analyzeData = async (data) => {
        setAnalysisResult(null);
        try {
            const headers = getAuthHeaders();
            const { kpis, categories, rowCount } = extractDataForAI(data);
            
            if (kpis.length === 0) {
                setLoading(false);
                setError("Could not identify any numeric KPIs for analysis. Check your spreadsheet formatting.");
                return;
            }

            const payload = {
                kpis: kpis,
                categories: categories,
                rowCount: rowCount,
            };

            const response = await axios.post(`${API_BASE_URL}/ai/analyze`, payload, { headers });
            setAnalysisResult(response.data.analysis);

        } catch (err) {
            console.error('Error analyzing data:', err);
            const errorMessage = err.response?.data?.error || 'Failed to get analysis from AI model.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (DUMMY_SHEET_ID) {
            fetchSheetData();
        } else {
            setError("Please select a Google Sheet in the Integrations panel first.");
        }
    }, [fetchSheetData]);

    // --- Rendering Logic (rest remains the same) ---
    const renderSheetPreview = () => {
        if (!sheetData) return null;
        const maxRows = 5;
        const maxCols = 5;

        return (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Sheet Data Preview (First {maxRows}x{maxCols})</h3>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            {sheetData[0].slice(0, maxCols).map((header, i) => (
                                <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sheetData.slice(1, maxRows + 1).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.slice(0, maxCols).map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="mt-2 text-xs text-gray-500">...showing the first **{sheetData.length - 1}** rows in total.</p>
            </div>
        );
    };

    const renderAnalysis = () => {
        if (!analysisResult) return null;
        
        const sections = analysisResult.split('\n').filter(line => line.trim().length > 0);
        let currentSection = '';
        const formattedOutput = {};

        sections.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.endsWith(':')) {
                currentSection = trimmedLine.replace(':', '').trim();
                formattedOutput[currentSection] = [];
            } else if (currentSection) {
                formattedOutput[currentSection].push(trimmedLine.replace(/^-/g, '').trim());
            }
        });

        return (
            <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-blue-800 mb-4">🤖 AI-Powered Data Analysis</h3>
                {Object.entries(formattedOutput).map(([title, content], index) => (
                    <div key={index} className="mb-4">
                        <h4 className="text-lg font-semibold text-blue-700 border-b pb-1 mb-2">{title}</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-800 ml-4">
                            {content.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6 bg-white min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Data Analytics Dashboard</h1>
            
            {error && <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

            <div className="bg-gray-50 shadow rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-700">Current Data Source</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Using Google Sheet ID: <code className="bg-gray-200 p-1 rounded text-sm text-blue-600">{DUMMY_SHEET_ID}</code>
                </p>
                
                <button
                    onClick={fetchSheetData}
                    className={`mt-4 py-2 px-4 rounded-lg font-bold text-white transition duration-150 ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                    disabled={loading}
                >
                    {loading ? 'Analyzing Data...' : 'Refresh Data & Run Analysis'}
                </button>
            </div>
            
            {sheetData && !loading && renderSheetPreview()}
            
            {analysisResult && renderAnalysis()}

            {loading && (
                <div className="mt-6 text-center text-lg text-blue-600">
                    <p>Fetching and analyzing data with GPT4All...</p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-3"></div>
                </div>
            )}
            
            {!sheetData && !loading && !error && (
                <div className="mt-6 p-4 text-center bg-yellow-100 rounded-lg">
                    <p className="text-yellow-800">No data loaded. Please ensure a Sheet ID is selected and try running the analysis.</p>
                </div>
            )}
        </div>
    );
};

export default Analytics;