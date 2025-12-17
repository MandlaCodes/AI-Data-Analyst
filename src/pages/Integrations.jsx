import React, { useState, useEffect, useCallback } from 'react';
import { Database, CheckCircle, Plus, ArrowRight, Zap, RefreshCw, ExternalLink, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const API_BASE_URL = 'https://ai-data-analyst-backend-1nuw.onrender.com';
const AUTH_TOKEN_KEY = 'adt_token';

const IntegrationsPage = () => {
    const [searchParams] = useSearchParams();
    const [connectedApps, setConnectedApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState(null); 
    const [actionId, setActionId] = useState(null);

    const fetchConnectedApps = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) return;
            const res = await fetch(`${API_BASE_URL}/connected-apps`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const connected = [];
                if (data.google_sheets) {
                    connected.push({ id: 'google_sheets', lastSync: data.google_sheets_last_sync });
                }
                setConnectedApps(connected);
            }
        } catch (e) { 
            console.error("Fetch failed:", e); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => {
        fetchConnectedApps();
        
        // Handle return flags from the backend redirect
        const connected = searchParams.get('connected');
        const error = searchParams.get('error');

        if (connected === 'true') {
            setStatusMessage({ text: '✅ Google Sheets connected successfully!', type: 'success' });
            window.history.replaceState(null, '', window.location.pathname);
        } else if (connected === 'false' || error) {
            const msg = error === 'session_expired' ? 'Session expired. Please try again.' : 'Connection failed.';
            setStatusMessage({ text: `❌ ${msg}`, type: 'error' });
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, [fetchConnectedApps, searchParams]);

    const handleConnect = (id) => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            setStatusMessage({ text: 'Session expired. Please log in.', type: 'error' });
            return;
        }
        setActionId(id);
        
        // This triggers the window redirect to our new backend start point
        const authUrl = `${API_BASE_URL}/auth/google_sheets?token=${token}&return_path=${encodeURIComponent(window.location.pathname)}`;
        window.location.href = authUrl;
    };

    const handleDisconnect = async (id) => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        setActionId(id);
        try {
            // Updated to match the specific backend route: /disconnect/google_sheets
            const res = await fetch(`${API_BASE_URL}/disconnect/google_sheets`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                setStatusMessage({ text: 'Disconnected successfully.', type: 'success' });
                fetchConnectedApps();
            } else {
                setStatusMessage({ text: 'Failed to disconnect.', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setStatusMessage({ text: 'An error occurred.', type: 'error' });
        } finally {
            setActionId(null);
        }
    };

    if (loading) return <div className="p-20 text-center text-white">Loading Integrations...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-12">
            <h1 className="text-4xl font-bold mb-8">Integrations</h1>
            
            {statusMessage && (
                <div className={`p-4 mb-6 rounded border transition-all ${
                    statusMessage.type === 'success' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'
                }`}>
                    {statusMessage.text}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-3xl">📊</div>
                        {connectedApps.some(a => a.id === 'google_sheets') && (
                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-xs rounded-full border border-emerald-500/50 flex items-center gap-1">
                                <CheckCircle size={12} /> Connected
                            </span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">Google Sheets</h3>
                    <p className="text-slate-400 text-sm mb-6">Import your data directly from Sheets.</p>
                    
                    {connectedApps.some(a => a.id === 'google_sheets') ? (
                        <button 
                            onClick={() => handleDisconnect('google_sheets')} 
                            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"
                        >
                            {actionId === 'google_sheets' ? 'Processing...' : 'Disconnect'}
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleConnect('google_sheets')} 
                            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
                        >
                            {actionId === 'google_sheets' ? 'Redirecting...' : 'Connect'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;