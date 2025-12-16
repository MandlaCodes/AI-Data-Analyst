import React, { useState, useEffect, useCallback } from 'react';
import { Database, CheckCircle, Plus, ArrowRight, Zap, RefreshCw, ExternalLink, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// --- Configuration ---
const API_BASE_URL = 'https://ai-data-analyst-backend-1nuw.onrender.com';
const AUTH_TOKEN_KEY = 'adt_token'; 
// const PROFILE_KEY = 'adt_profile'; // <-- REMOVED: No longer storing profile locally

const IntegrationsPage = () => {
    const [searchParams] = useSearchParams();
    const [connectedApps, setConnectedApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(null);
    const [statusMessage, setStatusMessage] = useState(null); 
    const [disconnecting, setDisconnecting] = useState(null);

    // Suggested integrations with realistic data sources
    const suggestedIntegrations = [
        { id: 'google_sheets', name: 'Google Sheets', description: 'Import spreadsheet data for instant analysis', icon: '📊', category: 'Spreadsheets', color: 'from-green-500 to-emerald-600', popularity: 'Most Popular', isImplemented: true },
        { id: 'excel', name: 'Microsoft Excel', description: 'Connect Excel files from OneDrive or local storage', icon: '📈', category: 'Spreadsheets', color: 'from-green-600 to-teal-600', popularity: 'Popular', comingSoon: true },
        { id: 'stripe', name: 'Stripe', description: 'Analyze payment data and revenue metrics', icon: '💳', category: 'Payments', color: 'from-purple-500 to-indigo-600', popularity: 'Popular', comingSoon: true },
        { id: 'salesforce', name: 'Salesforce', description: 'Connect CRM data for sales analytics', icon: '☁️', category: 'CRM', color: 'from-blue-500 to-cyan-600', comingSoon: true },
        { id: 'hubspot', name: 'HubSpot', description: 'Marketing and sales pipeline insights', icon: '🎯', category: 'CRM', color: 'from-orange-500 to-red-600', comingSoon: true },
        { id: 'postgres', name: 'PostgreSQL', description: 'Direct database connection for custom queries', icon: '🐘', category: 'Databases', color: 'from-indigo-500 to-blue-600', comingSoon: true },
        { id: 'mysql', name: 'MySQL', description: 'Connect to MySQL databases securely', icon: '🗄️', category: 'Databases', color: 'from-blue-600 to-cyan-600', comingSoon: true },
        { id: 'shopify', name: 'Shopify', description: 'E-commerce sales and inventory analytics', icon: '🛍️', category: 'E-commerce', color: 'from-green-500 to-lime-600', comingSoon: true },
        { id: 'quickbooks', name: 'QuickBooks', description: 'Financial data and accounting insights', icon: '💰', category: 'Finance', color: 'from-green-600 to-emerald-600', comingSoon: true },
        { id: 'slack', name: 'Slack', description: 'Team communication analytics and metrics', icon: '💬', category: 'Communication', color: 'from-purple-600 to-pink-600', comingSoon: true },
        { id: 'airtable', name: 'Airtable', description: 'Flexible database and project management data', icon: '🔷', category: 'Databases', color: 'from-yellow-500 to-orange-600', comingSoon: true },
        { id: 'zendesk', name: 'Zendesk', description: 'Customer support tickets and satisfaction metrics', icon: '🎧', category: 'Support', color: 'from-teal-500 to-cyan-600', comingSoon: true }
    ];

    // NOTE: Removed getProfile() helper

    // --- Core Backend Logic (Memoized) ---

    // Fetch connected apps from backend
    const fetchConnectedApps = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                setLoading(false);
                setStatusMessage({ text: 'You must be logged in to view your integrations.', type: 'info' });
                return;
            }

            const response = await fetch(`${API_BASE_URL}/connected-apps`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const connected = [];
                
                // Only Google Sheets status is checked
                if (data.google_sheets) {
                    connected.push({
                        id: 'google_sheets',
                        name: 'Google Sheets',
                        connectedAt: data.google_sheets_last_sync,
                        status: 'active'
                    });
                }
                
                setConnectedApps(connected);
            } else if (response.status === 401) {
                // If the token is invalid or expired
                setStatusMessage({ text: 'Session expired. Please log in again.', type: 'error' });
            }
        } catch (error) {
            console.error('Error fetching connected apps:', error);
            setStatusMessage({ text: 'Network error. Could not reach the backend.', type: 'error' });
        } finally {
            setLoading(false); 
        }
    }, []); 


    const handleConnect = async (integrationId) => {
        if (integrationId !== 'google_sheets') {
            return; 
        }

        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            // FIX: Relying only on the JWT token check
            setStatusMessage({ text: 'Authentication required. Please log in before connecting a service.', type: 'error' });
            return;
        }

        setConnecting(integrationId);
        
        try {
            const returnPath = window.location.pathname; 
            
            // 1. Call the backend endpoint, passing the JWT token in the Authorization header.
            const response = await fetch(
                // We only need to send the return_path as a query param now.
                `${API_BASE_URL}/auth/google_sheets?return_path=${encodeURIComponent(returnPath)}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}` // <-- CRITICAL: Send the token
                    }
                }
            );

            if (!response.ok) {
                // Handle 401 Unauthorized (token expired/invalid) or other server-side errors
                let detail = 'Server error during connection initiation.';
                try {
                    const errorData = await response.json();
                    detail = errorData.detail || detail;
                } catch (e) {
                    detail = response.statusText || detail;
                }
                
                setStatusMessage({ text: `Connection failed: ${detail}`, type: 'error' });
                setConnecting(null);
                return;
            }

            // 2. Get the final Google OAuth URL from the backend response
            const data = await response.json();
            
            // 3. Redirect the user to the Google OAuth page
            window.location.href = data.auth_url;
            
        } catch (error) {
            console.error('Error connecting:', error);
            setStatusMessage({ text: 'Network or internal connection error.', type: 'error' });
            setConnecting(null);
        }
    };

    /**
     * Implementation for disconnecting an integration.
     */
    const handleDisconnect = useCallback(async (integrationId) => {
        if (integrationId !== 'google_sheets') return;
        
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            setStatusMessage({ text: 'Authentication token missing. Please log in.', type: 'error' });
            return;
        }
        
        setDisconnecting(integrationId);

        try {
            // Assuming the backend has a POST or DELETE endpoint for revoking tokens
            const response = await fetch(`${API_BASE_URL}/disconnect/${integrationId}`, {
                method: 'POST', 
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setStatusMessage({ text: `${integrationId.replace('_', ' ')} disconnected successfully.`, type: 'success' });
                fetchConnectedApps(); // Refresh the list to remove the card
            } else {
                // Read error message from backend if possible
                const errorData = await response.json().catch(() => ({ message: 'Server error' }));
                setStatusMessage({ text: `Failed to disconnect ${integrationId.replace('_', ' ')}: ${errorData.message || response.statusText}.`, type: 'error' });
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
            setStatusMessage({ text: 'Network error during disconnect.', type: 'error' });
        } finally {
            setDisconnecting(null);
        }
    }, [fetchConnectedApps]);

    // --- 1. Initial Data Fetch ---
    useEffect(() => {
        // Run once on mount to get the current connection status
        fetchConnectedApps();
    }, [fetchConnectedApps]); 
    
    // --- 2. OAuth Redirect and Status Handling ---
    useEffect(() => {
        // Handle OAuth redirect success/failure messages
        const connectedStatus = searchParams.get('connected');
        const type = searchParams.get('type');
        
        if (connectedStatus === 'true' && type === 'google_sheets') {
            setStatusMessage({ text: 'Google Sheets connected successfully! Fetching status...', type: 'success' });
            // Clean the URL parameters and refetch status
            window.history.replaceState(null, '', window.location.pathname);
            fetchConnectedApps();
        } else if (connectedStatus === 'false' && type === 'google_sheets') {
            setStatusMessage({ text: 'Google Sheets connection failed. Please try again.', type: 'error' });
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, [searchParams, fetchConnectedApps]);

    // --- 3. Status message timeout (Cleaned up) ---
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => {
                setStatusMessage(null);
            }, 6000); // 6 seconds for better visibility
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);


    const isConnected = (id) => connectedApps.some(app => app.id === id);

    // Helper for status message styling
    const getStatusMessageClasses = (type) => {
        switch (type) {
            case 'error': return "bg-red-900 border-red-700 text-red-300";
            case 'success': return "bg-green-900 border-green-700 text-green-300";
            case 'info': return "bg-blue-900 border-blue-700 text-blue-300";
            default: return "bg-gray-800 border-gray-600 text-gray-400";
        }
    };

    // --- UI Components ---
    const IntegrationCard = ({ integration, connected = false, connectedData = null }) => (
        <div className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300" 
                style={{ backgroundImage: `linear-gradient(135deg, ${integration.color.split(' ')[1]} ${integration.color.split(' ')[2]})` }}></div>
            
            {/* Status badge */}
            {connected && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-medium text-green-400">Connected</span>
                </div>
            )}
            
            {integration.popularity && !connected && (
                <div className="absolute top-4 right-4 bg-cyan-500/20 border border-cyan-500/50 rounded-full px-3 py-1">
                    <span className="text-xs font-medium text-cyan-400">{integration.popularity}</span>
                </div>
            )}

            {integration.comingSoon && !connected && (
                <div className="absolute top-4 right-4 bg-purple-500/20 border border-purple-500/50 rounded-full px-3 py-1">
                    <span className="text-xs font-medium text-purple-400">Coming Soon</span>
                </div>
            )}

            <div className="relative">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${integration.color} rounded-xl flex items-center justify-center text-3xl mb-4 shadow-lg`}>
                    {integration.icon}
                </div>

                {/* Content */}
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-1">{integration.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{integration.description}</p>
                    <span className="inline-block text-xs font-medium text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md">
                        {integration.category}
                    </span>
                </div>

                {/* Connected info */}
                {connected && connectedData && (
                    <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                        <p className="text-xs text-gray-400">
                            Last synced: {connectedData.connectedAt ? new Date(connectedData.connectedAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                )}

                {/* Action button */}
                {connected ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleDisconnect(integration.id)}
                            disabled={disconnecting === integration.id}
                            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm flex items-center justify-center gap-2 ${
                                disconnecting === integration.id
                                    ? 'bg-red-500/20 border border-red-500/50 text-red-400 cursor-wait'
                                    : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400'
                            }`}
                        >
                            {disconnecting === integration.id ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Disconnecting...
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4" />
                                    Disconnect
                                </>
                            )}
                        </button>
                        <button 
                            onClick={fetchConnectedApps} 
                            disabled={disconnecting === integration.id}
                            className="px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-300 rounded-lg font-medium transition-all duration-200 text-sm flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Sync
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleConnect(integration.id)}
                        disabled={integration.comingSoon || connecting === integration.id || !integration.isImplemented}
                        className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                            integration.comingSoon || !integration.isImplemented
                                ? 'bg-gray-700/30 border border-gray-700 text-gray-500 cursor-not-allowed'
                                : connecting === integration.id
                                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 cursor-wait'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                        }`}
                    >
                        {connecting === integration.id ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Connecting...
                            </>
                        ) : integration.comingSoon ? (
                            <>
                                <Zap className="w-4 h-4" />
                                Coming Soon
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Connect
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );

    // --- Main Render ---

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading integrations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                            <Database className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">Integrations</h1>
                            <p className="text-gray-400 mt-1">Connect your data sources for powerful analytics</p>
                        </div>
                    </div>
                    
                    {/* Status Message */}
                    {statusMessage && (
                        <div className={`p-4 mt-6 border rounded-xl shadow-lg flex items-center ${getStatusMessageClasses(statusMessage.type)}`}>
                            <Zap className="mr-3 w-5 h-5" /> 
                            <span className="font-medium">{statusMessage.text}</span>
                        </div>
                    )}
                    
                    {/* Stats bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Connected Apps</p>
                                    <p className="text-3xl font-bold text-white">{connectedApps.length}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Available</p>
                                    <p className="text-3xl font-bold text-white">{suggestedIntegrations.length}</p>
                                </div>
                                <Database className="w-8 h-8 text-cyan-400" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Coming Soon</p>
                                    <p className="text-3xl font-bold text-white">
                                        {suggestedIntegrations.filter(i => i.comingSoon).length}
                                    </p>
                                </div>
                                <Zap className="w-8 h-8 text-purple-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Connected Apps Section */}
                {connectedApps.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <h2 className="text-2xl font-bold text-white">Connected Apps</h2>
                            <span className="bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1 text-sm font-medium text-green-400">
                                {connectedApps.length} Active
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {connectedApps.map(app => {
                                const integration = suggestedIntegrations.find(i => i.id === app.id);
                                return integration ? (
                                    <IntegrationCard
                                        key={app.id}
                                        integration={integration}
                                        connected={true}
                                        connectedData={app}
                                    />
                                ) : null;
                            })}
                        </div>
                    </div>
                )}

                {/* Suggested Integrations */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <Plus className="w-6 h-6 text-cyan-400" />
                        <h2 className="text-2xl font-bold text-white">
                            {connectedApps.length > 0 ? 'Available Integrations' : 'Get Started'}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suggestedIntegrations
                            .filter(integration => !isConnected(integration.id))
                            .map(integration => (
                                <IntegrationCard
                                    key={integration.id}
                                    integration={integration}
                                    connected={false}
                                />
                            ))}
                    </div>
                </div>

                {/* Help section */}
                <div className="mt-12 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ExternalLink className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Need help connecting?</h3>
                            <p className="text-gray-400 mb-4">
                                Check our documentation for step-by-step guides on setting up integrations and managing your data sources.
                            </p>
                            <button className="px-6 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400 rounded-lg font-medium transition-all duration-200 flex items-center gap-2">
                                View Documentation
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;