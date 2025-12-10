// src/components/integrations.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';

// --- Configuration ---
const API_BASE_URL = 'https://ai-data-analyst-backend-1nuw.onrender.com'; 

// NOTE: Ensure your parent component passes userId and a function to handle logout.
const Integrations = ({ userId, onLogout }) => {
    const [searchParams] = useSearchParams();
    const location = useLocation(); 
    const [connectedApps, setConnectedApps] = useState({ google_sheets: false, google_sheets_last_sync: null });
    const [sheetsList, setSheetsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null); 
    
    // Helper function to clear local storage and force a global logout
    const handleUnauthorized = useCallback(() => {
        console.error("401 Unauthorized: Session expired or invalid token.");
        
        if (onLogout) {
            onLogout();
        } else {
            localStorage.removeItem('adt_token');
            localStorage.removeItem('adt_profile');
            window.location.reload(); 
        }
        setStatusMessage({ text: 'Your session has expired. Please log in again.', type: 'error' });
    }, [onLogout]);


    // --- Helper to get JWT from localStorage ---
    const getAuthHeaders = () => {
        const token = localStorage.getItem('adt_token'); 
        return { token, headers: token ? { Authorization: `Bearer ${token}` } : {} };
    };

    const fetchSheetsList = async (headers) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sheets-list`, { headers });
            setSheetsList(response.data.sheets || []);
        } catch (err) {
            if (err.response && err.response.status === 401) {
                handleUnauthorized();
                return;
            }
            console.error('Error fetching sheets list:', err);
            setStatusMessage({ text: 'Failed to retrieve your Google Sheets files. You may need to re-connect.', type: 'error' });
        }
    };

    // --- Core Data Fetching ---
    const fetchConnectedApps = useCallback(async () => {
        setLoading(true);
        // Do not reset statusMessage here, as it might be a success message from the redirect.
        
        if (!userId) {
            setLoading(false);
            setStatusMessage({ text: 'User profile is missing. Please log in.', type: 'error' }); 
            return; 
        }
        
        const { token, headers } = getAuthHeaders();
        if (!token) {
            setLoading(false);
            handleUnauthorized();
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/connected-apps`, { headers });
            
            setConnectedApps(response.data);
            
            if (response.data.google_sheets) {
                await fetchSheetsList(headers); 
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                handleUnauthorized();
                return;
            }
            // Catch generic network or server (500) errors
            console.error('Error fetching connected apps:', err);
            setStatusMessage({ text: 'Failed to connect to the backend. Please check your network.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [userId, handleUnauthorized]); 

    // --- Google Sheets Connection Handlers ---
    const handleConnectGoogleSheets = () => {
        if (!userId) {
            setStatusMessage({ text: "Error: User ID not found. Please log in again.", type: 'error' });
            return;
        }

        const returnPath = location.pathname; 

        // Redirect to the backend for the OAuth flow
        window.location.href = 
            `${API_BASE_URL}/auth/google_sheets?user_id=${userId}&return_path=${encodeURIComponent(returnPath)}`;
    };

    // --- Initial Load and URL Callback Handling (OAuth Success) ---
    useEffect(() => {
        const connectedStatus = searchParams.get('connected');
        const type = searchParams.get('type');

        if (connectedStatus === 'true' && type === 'google_sheets') {
            // 🔑 FIX: Set SUCCESS message *before* re-fetching.
            setStatusMessage({ text: 'Google Sheets connected successfully! Fetching your files...', type: 'success' });
            
            // Clean the URL parameters immediately
            window.history.replaceState(null, '', window.location.pathname); 
            
            // Re-fetch data to update the UI
            fetchConnectedApps(); 
        } 
        // Always fetch on load if we have a user ID (and if not already handled by redirect logic)
        else if (userId) {
            fetchConnectedApps();
        }

        // Clear the success message after 5 seconds
        if (statusMessage?.type === 'success') {
            const timer = setTimeout(() => setStatusMessage(null), 5000);
            return () => clearTimeout(timer);
        }

    }, [fetchConnectedApps, searchParams, userId, statusMessage, location.pathname]); // Added location.pathname to dependencies

    // Helper for status message styling
    const getStatusMessageClasses = (type) => {
        switch (type) {
            case 'error': return "bg-red-100 border-red-400 text-red-700";
            case 'success': return "bg-green-100 border-green-400 text-green-700";
            case 'info': return "bg-blue-100 border-blue-400 text-blue-700";
            default: return "bg-gray-100 border-gray-400 text-gray-700";
        }
    };
    
    const renderSheetList = () => {
        if (loading) return <p className="text-blue-500">Loading sheets...</p>;
        if (sheetsList.length === 0) return <p className="text-yellow-600">No Google Sheets found in your Drive or an error occurred.</p>;
        
        return (
            <ul className="mt-4 space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                {sheetsList.map((sheet) => (
                    <li key={sheet.id} className="p-3 border-b hover:bg-gray-100 flex justify-between items-center transition duration-150">
                        <span className="font-medium text-gray-800 truncate" title={sheet.name}>{sheet.name}</span>
                        <button 
                            onClick={() => setStatusMessage({ text: `Sheet ID: ${sheet.id} selected for analysis.`, type: 'info' })}
                            className="text-sm bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition duration-150 shadow-md"
                        >
                            Select
                        </button>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">🔗 Data Integrations</h1>
            
            {statusMessage && (
                <div className={`p-3 mb-4 border rounded ${getStatusMessageClasses(statusMessage.type)}`}>
                    {statusMessage.text}
                </div>
            )}

            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700">Google Sheets</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Connect your Google Drive to analyze data from your spreadsheets.
                        </p>
                    </div>
                    
                    {connectedApps.google_sheets ? (
                        <div className="text-center">
                            <span className="inline-flex items-center px-3 py-1 text-sm font-medium leading-4 bg-green-100 text-green-800 rounded-full">
                                ✅ Connected
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                                Last Sync: {connectedApps.google_sheets_last_sync ? new Date(connectedApps.google_sheets_last_sync).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleConnectGoogleSheets}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150"
                            disabled={loading}
                        >
                            Connect Google Sheets
                        </button>
                    )}
                </div>

                {connectedApps.google_sheets && (
                    <div className="mt-6 border-t pt-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Available Sheets</h3>
                        {renderSheetList()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Integrations;