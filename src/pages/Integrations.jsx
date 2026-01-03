import React, { useState, useEffect, useCallback } from 'react';
import { Database, CheckCircle, Plus, ArrowRight, Zap, RefreshCw, ExternalLink, XCircle, Shield, Layers, LayoutGrid } from 'lucide-react';
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
        
        const connected = searchParams.get('connected');
        const error = searchParams.get('error');

        if (connected === 'true') {
            setStatusMessage({ text: 'Google Sheets connected successfully!', type: 'success' });
            window.history.replaceState(null, '', window.location.pathname);
        } else if (connected === 'false' || error) {
            const msg = error === 'session_expired' ? 'Session expired. Please try again.' : 'Connection failed.';
            setStatusMessage({ text: msg, type: 'error' });
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
        const authUrl = `${API_BASE_URL}/auth/google_sheets?token=${token}&return_path=${encodeURIComponent(window.location.pathname)}`;
        window.location.href = authUrl;
    };

    const handleDisconnect = async (id) => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        setActionId(id);
        try {
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

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-6">
            <RefreshCw className="text-purple-500 animate-spin" size={40} />
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em] text-center">Syncing Neural Hub...</p>
        </div>
    );

    return (
        <div className="min-h-screen text-white p-6 md:p-10 lg:p-16">
            {/* Header Section */}
            <div className="mb-12 md:mb-16">
                <div className="flex items-center gap-3 mb-4">
                    <Layers className="text-purple-500" size={18} />
                    <h3 className="text-purple-500 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.4em]">External Data Streams</h3>
                </div>
                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none mb-6">
                    Integrations
                </h1>
                <p className="text-slate-500 max-w-xl text-base md:text-lg font-light leading-relaxed">
                    Connect your enterprise data sources to the Metria Neural Core for real-time intelligence synthesis.
                </p>
            </div>
            
            {/* Status Notifications */}
            {statusMessage && (
                <div className={`mb-10 flex items-start md:items-center gap-3 px-6 py-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-top-4 ${
                    statusMessage.type === 'success' 
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/5 border-red-500/20 text-red-400'
                }`}>
                    {statusMessage.type === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <XCircle size={18} className="shrink-0" />}
                    <span className="text-xs md:text-sm font-bold uppercase tracking-wider">{statusMessage.text}</span>
                </div>
            )}
            
            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Google Sheets Card */}
                <div className="group relative overflow-hidden bg-[#0F172A] border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 shadow-2xl transition-all hover:border-purple-500/30">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-8">
                        <div className="p-4 md:p-5 bg-slate-900 border border-white/5 rounded-2xl md:rounded-3xl group-hover:scale-110 transition-transform">
                            {/* FIXED SIZE HERE */}
                            <Database className="text-indigo-400" size={26} />
                        </div>
                        {connectedApps.some(a => a.id === 'google_sheets') && (
                            <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Connected
                            </div>
                        )}
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">Google Sheets</h3>
                    <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed mb-8 md:mb-10">
                        Map and synchronize tabular data directly from Cloud Sheets into your analysis workspace.
                    </p>
                    
                    <div className="mt-auto">
                        {connectedApps.some(a => a.id === 'google_sheets') ? (
                            <button 
                                onClick={() => handleDisconnect('google_sheets')} 
                                className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all group/btn"
                            >
                                {actionId === 'google_sheets' ? (
                                    <RefreshCw className="animate-spin" size={14} />
                                ) : (
                                    <XCircle size={14} className="group-hover/btn:rotate-90 transition-transform" />
                                )}
                                {actionId === 'google_sheets' ? 'Processing' : 'Terminate Stream'}
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleConnect('google_sheets')} 
                                className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-purple-600 hover:text-white transition-all active:scale-95"
                            >
                                {actionId === 'google_sheets' ? (
                                    <RefreshCw className="animate-spin" size={14} />
                                ) : (
                                    <Zap size={14} />
                                )}
                                {actionId === 'google_sheets' ? 'Authorizing' : 'Establish Connection'}
                            </button>
                        )}
                    </div>

                    <div className="absolute -bottom-12 -right-12 opacity-[0.02] text-white rotate-12 group-hover:rotate-0 transition-transform hidden sm:block">
                        <Database size={160} />
                    </div>
                </div>

                {/* Placeholder Card */}
                <div className="border border-white/5 border-dashed rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-60 transition-opacity group min-h-[250px]">
                    <div className="p-5 bg-slate-900/50 rounded-2xl mb-4 grayscale group-hover:grayscale-0 transition-all">
                        {/* FIXED SIZE HERE */}
                        <Shield className="text-slate-600 group-hover:text-purple-500" size={26} />
                    </div>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">More streams coming soon</p>
                </div>
            </div>

            {/* Support Footer */}
            <div className="mt-16 md:mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                    <p className="text-[9px] text-slate-600 uppercase font-mono tracking-tighter text-center md:text-left">
                        Metria Neural Infrastructure v2.4.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;