// src/pages/Analysis.jsx
import React, { useEffect, useState } from "react";
import { FiDatabase, FiLoader, FiFileText, FiArrowRight } from "react-icons/fi";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";
const AUTH_TOKEN_KEY = "adt_token";

export default function Analysis() {
    const [loading, setLoading] = useState(true);
    const [sheets, setSheets] = useState([]);
    const [error, setError] = useState(null);

    // Fetch user's Google Sheets files
    const fetchSheets = async () => {
        setLoading(true);

        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                setError("You must be logged in to access your connected sheets.");
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/google-sheets/list-files`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch sheets");
            }

            const data = await response.json();
            setSheets(data.files || []);
        } catch (e) {
            console.error(e);
            setError("Could not load your Google Sheets. Please reconnect in Integrations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSheets();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <FiLoader className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Fetching your sheets…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-10">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                        <FiDatabase className="text-white text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white">Analysis</h1>
                        <p className="text-gray-400">Choose a Google Sheet to analyze</p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {/* Sheets List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sheets.length === 0 && (
                        <div className="text-center text-gray-400 col-span-2">
                            No Google Sheets found.  
                            <br />
                            Try refreshing or reconnecting Google Sheets.
                        </div>
                    )}

                    {sheets.map((sheet) => (
                        <button
                            key={sheet.id}
                            className="group bg-gray-800/40 border border-gray-700 rounded-xl p-6 text-left hover:border-cyan-500/50 transition-all duration-200 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                            onClick={() => {
                                window.location.href = `/analytics?fileId=${sheet.id}`;
                            }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <FiFileText className="w-8 h-8 text-cyan-400" />
                                <FiArrowRight className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-1">
                                {sheet.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                Last modified:{" "}
                                {sheet.modifiedTime
                                    ? new Date(sheet.modifiedTime).toLocaleString()
                                    : "Unknown"}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
