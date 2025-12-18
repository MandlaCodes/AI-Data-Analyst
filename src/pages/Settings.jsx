import React, { useState, useEffect } from "react";
import { FiSettings, FiGlobe, FiDatabase, FiSave, FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiChevronRight, FiLock, FiXCircle } from "react-icons/fi";
// Assume framer-motion is available for animations

// --- MOCK API UTILITY (Unchanged) ---
const mockSaveSettingsAPI = (settings) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                localStorage.setItem('app_settings', JSON.stringify(settings));
                resolve();
            } catch (error) {
                // Example of a server/storage error simulation
                if (Math.random() < 0.1) {
                    reject(new Error("Network timeout during save."));
                } else {
                    reject(new Error("Failed to write to local storage."));
                }
            }
        }, 800);
    });
};

// --- SETTING ROW Component (Adapted for the new flat design) ---
const SettingRow = ({ title, description, children, isDivider = true }) => (
    <div className={`flex justify-between items-start pt-4 pb-4 ${isDivider ? 'border-b border-gray-800' : ''}`}>
        <div className="w-full pr-4">
            <p className="font-medium text-gray-300">{title}</p>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="flex justify-end items-center w-64 min-w-[25%]">
            {children}
        </div>
    </div>
);

// --- MAIN COMPONENT ---
export default function Settings() {
    const [generalSettings, setGeneralSettings] = useState({
        defaultSource: 'CSV Import',
        analysisRefreshInterval: 300, 
        enablePointerCursor: true,
        reduceMotion: false,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [isClearing, setIsClearing] = useState(false); // New state for cache clearing

    // Load Settings on Mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('app_settings');
        if (savedSettings) {
            try {
                const loadedSettings = JSON.parse(savedSettings);
                // Clean up obsolete/unused keys
                Object.keys(loadedSettings).forEach(key => {
                    if (!generalSettings.hasOwnProperty(key)) {
                        delete loadedSettings[key];
                    }
                });
                setGeneralSettings(loadedSettings);
            } catch (e) {
                setStatusMessage({ type: 'error', text: 'Error loading saved settings. Using defaults.' });
            }
        }
    }, []);

    // State Change Handler (Unified)
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setGeneralSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'analysisRefreshInterval' ? Number(value) : value),
        }));
    };

    // Save Handler (Functional, Asynchronous)
    const handleSave = async () => {
        setIsSaving(true);
        setStatusMessage(null);
        try {
            await mockSaveSettingsAPI(generalSettings);
            setStatusMessage({ type: 'success', text: 'Configuration saved successfully! Changes will apply on next refresh.' });
        } catch (error) {
            setStatusMessage({ type: 'error', text: `Failed to save settings: ${error.message}` });
        } finally {
            setIsSaving(false);
        }
    };
    
    // 1. CLEAR LOCAL CACHE FUNCTION
    const handleClearCache = () => {
        if (!window.confirm("Are you sure you want to clear the local cache? This will delete saved analyses and local data.")) {
            return;
        }

        setIsClearing(true);
        setStatusMessage(null);

        // --- Actual Cache Clearing Logic ---
        setTimeout(() => {
            try {
                // Clear all keys EXCEPT the main app settings, which we just saved.
                const keysToRemove = Object.keys(localStorage).filter(key => key.startsWith('analysis_') || key.startsWith('chart_'));
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                setIsClearing(false);
                setStatusMessage({ type: 'success', text: `Cleared ${keysToRemove.length} items from local cache successfully.` });
            } catch (error) {
                setIsClearing(false);
                setStatusMessage({ type: 'error', text: 'Failed to clear local cache.' });
            }
        }, 500);
    };

    // 2. SECURITY NAVIGATION FUNCTION (Simulated)
    const handleSecurityNavigation = () => {
        // In a real application, this would use react-router: navigate('/settings/security')
        setStatusMessage({ type: 'success', text: 'Redirecting to Security Page...' });
        console.log("Navigating to /settings/security");
    };


    const messageColor = statusMessage?.type === 'success' ? 'text-green-400 border-green-700' : 'text-red-400 border-red-700';

    return (
        // The container background is dark, and padding is removed from the sides of the main content box.
        <div className="w-full h-full text-white" >
            
            {/* Main Content Panel - Mimicking the flat, clean box design */}
            <div> 
                
                {/* Header (Similar to the image's "Settings" title) */}
                <div className="px-10 pt-8 pb-4 border-b border-gray-700/50">
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-purple-400">
                        <FiSettings size={28} className="text-pink-400"/> Settings
                    </h1>
                </div>

                {/* Status Message Display */}
                {statusMessage && (
                    <div
                        className={`p-4 mx-10 mt-6 rounded-lg border ${messageColor} bg-gray-900/50 flex items-center gap-3`}
                    >
                        {statusMessage.type === 'success' ? <FiCheckCircle size={20}/> : <FiAlertTriangle size={20}/>}
                        <p className="font-medium">{statusMessage.text}</p>
                    </div>
                )}

                {/* Settings Body */}
                <div className="px-10 py-6 space-y-8">
                    
                    {/* 1. User Experience Section */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-indigo-400 flex items-center gap-2"><FiGlobe/> User Experience</h2>
                        
                        {/* Use pointer cursor */}
                        <SettingRow 
                            title="Use pointer cursor" 
                            description="Change the cursor to a pointer when hovering over interactive elements.">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="enablePointerCursor" 
                                    checked={generalSettings.enablePointerCursor} 
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                            </label>
                        </SettingRow>

                        {/* Reduce Motion */}
                        <SettingRow 
                            title="Reduce motion" 
                            description="Reduce animations for popovers, modals, and sidebar transitions." 
                            isDivider={true}>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="reduceMotion" 
                                    checked={generalSettings.reduceMotion} 
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                            </label>
                        </SettingRow>
                        
                        {/* Interface Language - Placeholder for future expansion */}
                        <SettingRow 
                            title="Interface Language" 
                            description="Select the language for text and navigation." 
                            isDivider={false}>
                            <p className="text-gray-500">English (Default)</p>
                        </SettingRow>

                    </section>
                    
                    {/* Separator line */}
                    <div className="border-t border-gray-700/50 pt-4"></div>

                    {/* 2. Data Configuration Section */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-indigo-400 flex items-center gap-2"><FiDatabase/> Data Configuration</h2>
                        
                        {/* Default Data Source Identifier */}
                        <SettingRow 
                            title="Default Data Source Identifier" 
                            description="The name or path of the primary data source for analysis.">
                            <input 
                                type="text" 
                                name="defaultSource" 
                                value={generalSettings.defaultSource} 
                                onChange={handleChange}
                                placeholder="DataWarehouse-Live"
                                className="bg-gray-700 p-2 rounded-lg text-white w-64 border border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </SettingRow>

                        {/* Dashboard Refresh Interval */}
                        <SettingRow 
                            title="Dashboard Refresh Interval" 
                            description="How often the dashboard should attempt to fetch new data for live KPIs.">
                            <select 
                                name="analysisRefreshInterval" 
                                value={generalSettings.analysisRefreshInterval} 
                                onChange={handleChange}
                                className="bg-gray-700 p-2 rounded-lg text-white w-64 border border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value={0}>Manual Only</option>
                                <option value={300}>5 minutes</option>
                                <option value={600}>10 minutes</option>
                                <option value={1800}>30 minutes</option>
                            </select>
                        </SettingRow>

                        {/* Clear Local Cache */}
                        <SettingRow 
                            title="Clear Local Cache" 
                            description="Permanently delete all saved analysis snapshots and configuration data." 
                            isDivider={false}>
                            <button 
                                onClick={handleClearCache}
                                disabled={isClearing}
                                className={`flex items-center gap-2 text-sm font-medium bg-transparent border-0 transition ${isClearing ? 'text-gray-500' : 'text-red-400 hover:text-red-300'}`}
                            >
                                {isClearing ? (
                                    <>
                                        <FiRefreshCw size={14} className="animate-spin"/> Clearing...
                                    </>
                                ) : (
                                    <>
                                        Execute Purge <FiXCircle/>
                                    </>
                                )}
                            </button>
                        </SettingRow>
                    </section>
                    
                    {/* Separator line */}
                    <div className="border-t border-gray-700/50 pt-4"></div>

                    {/* 3. Security Quick Access */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-indigo-400 flex items-center gap-2"><FiLock/> Security Quick Access</h2>
                        
                        <SettingRow 
                            title="Manage Password & 2FA" 
                            description="Go to the dedicated security page to update login credentials and multi-factor authentication." 
                            isDivider={false}>
                            <button 
                                onClick={handleSecurityNavigation}
                                className="flex items-center gap-2 text-sm text-pink-400 hover:text-pink-300 font-medium bg-transparent border-0"
                            >
                                Go to Security <FiChevronRight/>
                            </button>
                        </SettingRow>
                    </section>

                </div>
                
                {/* Save Button Bar (Fixed to the bottom area for consistency) */}
                <div className="sticky bottom-0 bg-[#121626] border-t border-gray-700/50 px-10 py-4 flex justify-end shadow-2xl">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-3 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition flex items-center gap-3 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                    >
                        {isSaving ? (
                            <>
                                <FiRefreshCw size={18} className="animate-spin"/> Saving Configuration...
                            </>
                        ) : (
                            <>
                                <FiSave size={18}/> Save Changes
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}