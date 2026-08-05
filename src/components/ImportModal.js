/**
 * components/ImportModal.js - VERSION: METRIA AI NEURAL SYNC (PRODUCTION)
 * UPDATED: Added Microsoft Excel Integration Option
 */
import React, { useState, useRef } from "react";
import { FiX, FiUploadCloud, FiDatabase, FiFileText, FiCheck, FiAlertTriangle, FiLoader, FiPlus, FiTrash2, FiExternalLink } from "react-icons/fi";
import { SiGooglesheets, SiMicrosoftexcel } from "react-icons/si";

const API_BASE_URL = 'https://ai-data-analyst-backend-1nuw.onrender.com';

export const ImportModal = ({ 
    onClose, 
    selectedApps, 
    setSelectedApps, 
    selectedSheet, 
    setSelectedSheet, 
    setCsvToImport, 
    csvToImport, 
    onImport 
}) => {
    const [isPickerLoading, setIsPickerLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const fileInputRef = useRef(null);
    
    const [sheetIds, setSheetIds] = useState([]); 
    const [sheetNames, setSheetNames] = useState([]);

    const handleGoogleSheetSelect = async () => {
        setIsPickerLoading(true);
        setErrorMessage(null);
        const internalToken = localStorage.getItem("adt_token"); 

        if (!window.google || !window.google.picker) {
            setErrorMessage("Google SDK not ready. Please refresh.");
            setIsPickerLoading(false);
            return;
        }

        try {
            const tokenRes = await fetch(`${API_BASE_URL}/google-token`, {
                headers: { 'Authorization': `Bearer ${internalToken}` }
            });

            if (!tokenRes.ok) throw new Error("ACCESS_REQUIRED");
            
            const { access_token } = await tokenRes.json();

            const picker = new window.google.picker.PickerBuilder()
                .setDeveloperKey(process.env.REACT_APP_GOOGLE_DEVELOPER_KEY) 
                .setAppId(process.env.REACT_APP_GOOGLE_APP_ID)
                .setOAuthToken(access_token) 
                .addView(new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS))
                .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                .setOrigin(window.location.protocol + "//" + window.location.host)
                .setCallback((data) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const docs = data.docs;
                        setSheetIds(prev => [...new Set([...prev, ...docs.map(d => d.id)])]);
                        setSheetNames(prev => {
                            const combinedNames = [...prev, ...docs.map(d => d.name)];
                            setSelectedSheet([...new Set(combinedNames)].join(", "));
                            return [...new Set(combinedNames)];
                        });
                        setSelectedApps(["google_sheets"]);
                    }
                    if (data.action === window.google.picker.Action.PICKED || data.action === window.google.picker.Action.CANCEL) {
                        setIsPickerLoading(false);
                    }
                })
                .build();

            picker.setVisible(true);
        } catch (err) {
            if (err.message === "ACCESS_REQUIRED") {
                setErrorMessage("Google Account Not Linked");
            } else {
                setErrorMessage(err.message || "Failed to sync with Google Drive.");
            }
            setIsPickerLoading(false);
        }
    };

    const handleExcelSelect = async () => {
        setIsPickerLoading(true);
        setErrorMessage(null);
        const internalToken = localStorage.getItem("adt_token");

        try {
            const tokenRes = await fetch(`${API_BASE_URL}/excel-token`, {
                headers: { 'Authorization': `Bearer ${internalToken}` }
            });

            if (!tokenRes.ok) {
                throw new Error("EXCEL_ACCESS_REQUIRED");
            }
            
            const { access_token } = await tokenRes.json();

            // Fetch user's Excel files from OneDrive using Microsoft Graph
            const filesRes = await fetch("https://graph.microsoft.com/v1.0/me/drive/root/search(q='.xlsx')?select=id,name", {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });

            if (!filesRes.ok) throw new Error("Failed to fetch files from OneDrive.");

            const data = await filesRes.json();
            const files = data.value || [];

            if (files.length === 0) {
                setErrorMessage("No Excel files found in your OneDrive.");
                setIsPickerLoading(false);
                return;
            }

            setSheetIds([files[0].id]);
            setSheetNames([files[0].name]);
            setSelectedSheet(files[0].name);
            setSelectedApps(["excel"]);
            setIsPickerLoading(false);

        } catch (err) {
            if (err.message === "EXCEL_ACCESS_REQUIRED") {
                setErrorMessage("Microsoft Account Not Linked");
            } else {
                setErrorMessage(err.message || "Failed to sync with Microsoft OneDrive.");
            }
            setIsPickerLoading(false);
        }
    };

    const removeSheet = (index) => {
        const updatedNames = sheetNames.filter((_, i) => i !== index);
        const updatedIds = sheetIds.filter((_, i) => i !== index);
        setSheetNames(updatedNames);
        setSheetIds(updatedIds);
        setSelectedSheet(updatedNames.join(", "));
    };

    const handleAppToggle = (appId) => {
        if (appId === "google_sheets") {
            handleGoogleSheetSelect();
        } else if (appId === "excel") {
            handleExcelSelect();
        } else {
            setSelectedApps([appId]);
            setSelectedSheet(""); 
            setSheetIds([]);
            setSheetNames([]);
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e) => { 
        if (e.target.files && e.target.files[0]) {
            setCsvToImport(e.target.files[0]);
        }
    };

    const canImport = (selectedApps.includes("google_sheets") && sheetIds.length > 0) || 
                      (selectedApps.includes("excel") && sheetIds.length > 0) ||
                      (selectedApps.includes("other") && csvToImport);

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".csv"
            />

            <div className="relative w-full max-w-2xl bg-[#050505] border border-white/10 rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
                
                <div className="p-10 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Neural Core Ingest</h2>
                        <p className="text-white text-[10px] font-bold uppercase tracking-[0.4em] mt-1 opacity-100">Select Data Stream</p>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="p-10 space-y-6 overflow-y-auto">
                    {errorMessage === "Google Account Not Linked" && (
                        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex flex-col items-center text-center gap-3 animate-pulse">
                            <FiAlertTriangle className="text-amber-500" size={24} />
                            <div>
                                <h4 className="text-white font-black text-[11px] uppercase tracking-widest">Connection Required</h4>
                                <p className="text-white text-[11px] mt-1 font-medium">Google Sheets is not authorized. Go to the Integrations Page.</p>
                            </div>
                            <button 
                                onClick={() => { onClose(); window.location.href = '/dashboard/integrations'; }} 
                                className="mt-2 flex items-center gap-2 text-white bg-amber-600/20 px-4 py-2 rounded-full border border-white/20 font-black text-[9px] uppercase tracking-widest hover:bg-amber-500 transition-all"
                            >
                                Go to Integrations <FiExternalLink />
                            </button>
                        </div>
                    )}

                    {errorMessage === "Microsoft Account Not Linked" && (
                        <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] flex flex-col items-center text-center gap-3 animate-pulse">
                            <FiAlertTriangle className="text-blue-500" size={24} />
                            <div>
                                <h4 className="text-white font-black text-[11px] uppercase tracking-widest">Microsoft Connection Required</h4>
                                <p className="text-white text-[11px] mt-1 font-medium">Excel is not authorized. Go to the Integrations Page to connect your account.</p>
                            </div>
                            <button 
                                onClick={() => { 
                                    const token = localStorage.getItem("adt_token");
                                    onClose(); 
                                    window.location.href = `${API_BASE_URL}/auth/excel?token=${token}`; 
                                }} 
                                className="mt-2 flex items-center gap-2 text-white bg-blue-600/20 px-4 py-2 rounded-full border border-white/20 font-black text-[9px] uppercase tracking-widest hover:bg-blue-500 transition-all"
                            >
                                Connect Excel <FiExternalLink />
                            </button>
                        </div>
                    )}

                    {errorMessage && errorMessage !== "Google Account Not Linked" && errorMessage !== "Microsoft Account Not Linked" && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
                            <FiAlertTriangle /> {errorMessage}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <button onClick={() => handleAppToggle("google_sheets")} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${selectedApps.includes("google_sheets") ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-transparent text-slate-600'}`}>
                            <SiGooglesheets size={32} />
                            <span className="text-[9px] font-black uppercase tracking-wider">Google Sheets</span>
                        </button>
                        
                        <button onClick={() => handleAppToggle("excel")} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${selectedApps.includes("excel") ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-white/5 border-transparent text-slate-600'}`}>
                            {isPickerLoading ? <FiLoader className="animate-spin" size={32} /> : <SiMicrosoftexcel size={32} />}
                            <span className="text-[9px] font-black uppercase tracking-wider">Microsoft Excel</span>
                        </button>

                        <button onClick={() => handleAppToggle("other")} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${selectedApps.includes("other") ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-white/5 border-transparent text-slate-600'}`}>
                            <FiFileText size={32} />
                            <span className="text-[9px] font-black uppercase tracking-wider">{csvToImport ? csvToImport.name : "Local CSV"}</span>
                        </button>
                    </div>
                </div>

                <div className="p-10 bg-white/[0.01] border-t border-white/5 mt-auto">
                    <button 
                        disabled={!canImport}
                        onClick={() => onImport(sheetIds, sheetNames)} 
                        className="w-full py-7 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.5em] hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-5 flex items-center justify-center gap-4 group"
                    >
                        <FiDatabase size={20} />
                        Import Streams
                    </button>
                </div>
            </div>
        </div>
    );
};