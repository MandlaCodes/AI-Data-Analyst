/**
 * components/ImportModal.js - VERSION: METRIA AI NEURAL SYNC (PRODUCTION)
 * FIX: Direct injection of sheet name into the import function.
 */
import React, { useState } from "react";
import { FiX, FiUploadCloud, FiDatabase, FiFileText, FiCheck, FiAlertTriangle, FiLoader } from "react-icons/fi";
import { SiGooglesheets } from "react-icons/si";

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
    const [dragActive, setDragActive] = useState(false);
    const [isPickerLoading, setIsPickerLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [sheetId, setSheetId] = useState(""); 

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

            if (!tokenRes.ok) {
                const errData = await tokenRes.json();
                throw new Error(errData.detail || "Connect Google in Integrations first.");
            }
            
            const { access_token } = await tokenRes.json();

            const picker = new window.google.picker.PickerBuilder()
                .setDeveloperKey(process.env.REACT_APP_GOOGLE_DEVELOPER_KEY) 
                .setAppId(process.env.REACT_APP_GOOGLE_APP_ID)
                .setOAuthToken(access_token) 
                .addView(new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS))
                .setOrigin(window.location.protocol + "//" + window.location.host)
                .setCallback((data) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const doc = data.docs[0];
                        setSelectedSheet(doc.name); // Store Name
                        setSheetId(doc.id);         // Store ID
                        setSelectedApps(["google_sheets"]);
                    }
                    if (data.action === window.google.picker.Action.PICKED || data.action === window.google.picker.Action.CANCEL) {
                        setIsPickerLoading(false);
                    }
                })
                .build();

            picker.setVisible(true);
        } catch (err) {
            setErrorMessage(err.message || "Failed to sync with Google Drive.");
            setIsPickerLoading(false);
        }
    };

    const handleAppToggle = (appId) => {
        if (appId === "google_sheets") {
            handleGoogleSheetSelect();
        } else {
            setSelectedApps([appId]);
            setSelectedSheet(""); 
            setSheetId("");
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) setCsvToImport(e.target.files[0]);
    };

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) setCsvToImport(e.dataTransfer.files[0]);
    };

    const canImport = (selectedApps.includes("google_sheets") && sheetId) || 
                      (selectedApps.includes("other") && csvToImport);

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-[#050505] border border-white/10 rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                <div className="p-10 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Neural Core Ingest</h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">Select Data Stream</p>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="p-10 space-y-6">
                    {errorMessage && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest">
                            <FiAlertTriangle size={16} />
                            {errorMessage}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <button 
                            onClick={() => handleAppToggle("google_sheets")}
                            disabled={isPickerLoading}
                            className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${
                                selectedApps.includes("google_sheets") 
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                                : 'bg-white/5 border-transparent text-slate-600 hover:bg-white/10'
                            }`}
                        >
                            {isPickerLoading ? <FiLoader className="animate-spin" size={40} /> : <SiGooglesheets size={40} />}
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Google Sheets</span>
                        </button>

                        <button 
                            onClick={() => handleAppToggle("other")}
                            className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${
                                selectedApps.includes("other") 
                                ? 'bg-purple-500/10 border-purple-500 text-purple-400' 
                                : 'bg-white/5 border-transparent text-slate-600 hover:bg-white/10'
                            }`}
                        >
                            <FiFileText size={40} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Local CSV</span>
                        </button>
                    </div>

                    {sheetId && selectedApps.includes("google_sheets") && (
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] flex items-center justify-between animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500 rounded-xl text-black"><FiCheck size={20} /></div>
                                <div>
                                    <p className="text-[9px] text-emerald-500/50 font-black uppercase">Handshake Verified</p>
                                    <p className="text-white font-mono text-[11px] truncate max-w-[280px]">{selectedSheet}</p>
                                </div>
                            </div>
                            <button onClick={handleGoogleSheetSelect} className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] text-white font-black uppercase tracking-widest transition-all">Relink</button>
                        </div>
                    )}

                    {selectedApps.includes("other") && (
                        <div 
                            className={`relative border-2 border-dashed rounded-[2.5rem] p-16 transition-all text-center ${dragActive ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 bg-white/[0.02]'}`}
                            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                        >
                            <input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={handleFileChange} />
                            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-4">
                                {csvToImport ? (
                                    <>
                                        <div className="p-6 bg-purple-500 rounded-2xl text-white shadow-xl"><FiCheck size={32} /></div>
                                        <p className="text-white font-bold tracking-tight">{csvToImport.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <FiUploadCloud size={48} className="text-slate-800" />
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Drop Neural Stream</p>
                                    </>
                                )}
                            </label>
                        </div>
                    )}
                </div>

                <div className="p-10 bg-white/[0.01] border-t border-white/5 mt-auto">
                    <button 
                        disabled={!canImport}
                        onClick={() => onImport(sheetId, selectedSheet)} 
                        className="w-full py-7 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.5em] hover:bg-purple-600 hover:text-white transition-all disabled:opacity-5 active:scale-[0.97] flex items-center justify-center gap-4 group"
                    >
                        <FiDatabase className="group-hover:scale-125 transition-transform" size={20} />
                        Import data
                    </button>
                </div>
            </div>
        </div>
    );
};