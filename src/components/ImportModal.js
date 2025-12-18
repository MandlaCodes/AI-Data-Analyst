import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiX, FiCloud, FiChevronRight } from "react-icons/fi";
import { FaGoogleDrive, FaSpinner } from "react-icons/fa";

export function ImportModal({ 
    onClose, selectedApps, setSelectedApps, selectedSheet, 
    setSelectedSheet, setCsvToImport, csvToImport, onImport 
}) {
    const [sheets, setSheets] = useState([]); 
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedApps?.includes("google_sheets")) {
            const fetchSheets = async () => {
                setLoading(true);
                try {
                    const res = await axios.get("https://ai-data-analyst-backend-1nuw.onrender.com/google/sheets", {
                        headers: { Authorization: `Bearer ${localStorage.getItem("adt_token")}` }
                    });
                    // FIX: Your backend returns { "files": [...] }
                    setSheets(res.data?.files || []); 
                } catch (err) {
                    console.error("Fetch error:", err);
                    setSheets([]); 
                } finally {
                    setLoading(false);
                }
            };
            fetchSheets();
        }
    }, [selectedApps]);

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-[#05070A] w-full max-w-xl rounded-[3rem] border border-white/10 p-10 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="font-black italic uppercase text-white tracking-widest text-lg">Ingestion_Center</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2"><FiX size={24} /></button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setSelectedApps(["google_sheets"])} 
                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center ${selectedApps?.includes("google_sheets") ? "border-purple-500 bg-purple-500/10" : "border-white/5 bg-white/5"}`}>
                            <FaGoogleDrive size={30} className="mb-2 text-green-500" />
                            <div className="text-[10px] font-black uppercase text-white">Google Sheets</div>
                        </button>
                        <button onClick={() => setSelectedApps(["other"])} 
                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center ${selectedApps?.includes("other") ? "border-purple-500 bg-purple-500/10" : "border-white/5 bg-white/5"}`}>
                            <FiCloud size={30} className="mb-2 text-blue-500" />
                            <div className="text-[10px] font-black uppercase text-white">Local CSV</div>
                        </button>
                    </div>

                    {selectedApps?.includes("google_sheets") && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                            <label className="text-[10px] font-black text-slate-500 uppercase px-2">Select Spreadsheet</label>
                            {loading ? (
                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <FaSpinner className="animate-spin text-purple-500" />
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Syncing Drive...</span>
                                </div>
                            ) : (
                                <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)} 
                                    className="w-full bg-[#0F111A] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-purple-500 transition-all">
                                    <option value="" className="bg-black text-slate-500">-- Choose a File --</option>
                                    {sheets.map(s => <option key={s.id} value={s.id} className="bg-black">{s.name}</option>)}
                                </select>
                            )}
                        </div>
                    )}

                    {selectedApps?.includes("other") && (
                        <input type="file" accept=".csv" onChange={(e) => setCsvToImport(e.target.files[0])} 
                            className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-purple-600 file:text-white" />
                    )}
                </div>

                <button onClick={onImport} disabled={(!selectedSheet && !csvToImport) || loading}
                    className="w-full mt-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] transition-all disabled:opacity-20 flex justify-center items-center gap-2">
                    Initialize Stream <FiChevronRight />
                </button>
            </div>
        </div>
    );
}