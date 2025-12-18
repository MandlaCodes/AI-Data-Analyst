import React from "react";
import { FiX, FiUploadCloud, FiChevronDown, FiCheckCircle, FiDatabase, FiCloud } from "react-icons/fi";
import { MdOutlineTableChart } from "react-icons/md";

const SourceCard = ({ icon: Icon, title, description, isSelected, onClick, disabled }) => (
    <div 
        onClick={onClick} 
        className={`group relative p-5 rounded-2xl cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center gap-5 border-2 ${
            disabled ? 'opacity-40 cursor-not-allowed bg-slate-900/50 border-slate-800' : 
            isSelected ? 'border-purple-500 bg-purple-500/5 shadow-[0_20px_40px_rgba(168,85,247,0.15)] -translate-y-1' : 
            'border-slate-800 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-800/60 hover:-translate-y-1'
        }`}
    >
        {/* Animated Accent Line */}
        <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full transition-all duration-500 ${isSelected ? 'bg-purple-500 opacity-100' : 'bg-transparent opacity-0'}`} />

        <div className={`p-3.5 rounded-2xl transition-all duration-500 ${
            isSelected ? 'bg-purple-500 text-white rotate-[360deg]' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
        }`}>
            <Icon size={24} />
        </div>

        <div className="flex-1">
            <h4 className={`font-bold text-lg tracking-tight transition-colors duration-300 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{title}</h4>
            <p className={`text-xs font-medium transition-colors duration-300 ${isSelected ? 'text-purple-300' : 'text-slate-500'}`}>{description}</p>
        </div>

        <div className={`transition-all duration-500 transform ${isSelected ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 rotate-12'}`}>
            <div className="bg-emerald-500 rounded-full p-1.5 shadow-lg shadow-emerald-500/40">
                <FiCheckCircle size={14} className="text-slate-950" />
            </div>
        </div>
    </div>
);

const SheetsDropdown = ({ sheetsList, selectedSheet, setSelectedSheet }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const selected = sheetsList.find(s => s.id === selectedSheet);
    
    return (
        <div className="relative">
            <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)} 
                className={`w-full p-4 flex justify-between items-center rounded-2xl text-left transition-all duration-500 ease-out backdrop-blur-xl border ${
                    isOpen ? 'bg-slate-800 border-purple-500 shadow-2xl shadow-purple-500/10' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                } text-sm font-semibold text-white`}
            >
                <div className="flex items-center gap-3">
                    <FiCloud className={selected ? "text-purple-400" : "text-slate-500"} />
                    <span className={`truncate ${selected ? 'text-white' : 'text-slate-500'}`}>
                        {selected ? selected.name : "Select Data Stream..."}
                    </span>
                </div>
                <FiChevronDown size={18} className={`transition-transform duration-500 ease-in-out ${isOpen ? 'rotate-180 text-purple-400' : 'text-slate-500'}`} />
            </button>
            
            {isOpen && (
                <div className="absolute left-0 right-0 mt-3 rounded-2xl bg-slate-800/95 border border-slate-700/50 shadow-2xl z-[100] backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-300">
                    <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                        {sheetsList.length > 0 ? (
                            sheetsList.map((sheet, i) => (
                                <div 
                                    key={sheet.id} 
                                    onClick={() => { setSelectedSheet(sheet.id); setIsOpen(false); }} 
                                    className={`p-3.5 text-sm rounded-xl mb-1 cursor-pointer transition-all duration-200 ${
                                        sheet.id === selectedSheet ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {sheet.name}
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-2 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
                                <span className="text-xs text-slate-500 font-medium">Scanning Cloud Storage...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const ImportModal = ({ onClose, selectedApps, setSelectedApps, sheetsList, selectedSheet, setSelectedSheet, setCsvToImport, csvToImport, onImport }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-500">
        
        <div className="bg-slate-900/80 border border-white/10 w-full max-w-xl rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.7)] relative animate-in zoom-in-95 slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            
            {/* Top Kinetic Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-[1px]" />

            <div className="p-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-purple-400 font-bold text-[10px] uppercase tracking-[0.3em]">
                            <FiDatabase /> Data Ingestion
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">Connect Source</h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-2xl transition-all duration-300 text-slate-500 active:scale-90"
                    >
                        <FiX size={20} />
                    </button>
                </div>
                
                <div className="space-y-8">
                    {/* Google Sheets */}
                    <div className="space-y-4">
                        <SourceCard 
                            icon={MdOutlineTableChart} 
                            title="Google Sheets" 
                            description="Live sync with cloud workbooks"
                            isSelected={selectedApps.includes("google_sheets")} 
                            onClick={() => setSelectedApps(prev => prev.includes("google_sheets") ? [] : ["google_sheets"])} 
                        />
                        
                        {selectedApps.includes("google_sheets") && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
                                <SheetsDropdown 
                                    sheetsList={sheetsList} 
                                    selectedSheet={selectedSheet} 
                                    setSelectedSheet={setSelectedSheet} 
                                />
                            </div>
                        )}
                    </div>

                    {/* Local CSV */}
                    <div className="space-y-4">
                        <input 
                            type="file" 
                            accept=".csv" 
                            className="hidden" 
                            id="csv-upload" 
                            onChange={(e) => { 
                                if(e.target.files[0]) { 
                                    setCsvToImport(e.target.files[0]); 
                                    setSelectedApps(prev => [...new Set([...prev, "other"])]); 
                                }
                            }} 
                        />
                        <label htmlFor="csv-upload" className="block cursor-pointer">
                            <SourceCard 
                                icon={FiUploadCloud} 
                                title="Local CSV" 
                                description={csvToImport ? `Ready: ${csvToImport.name}` : "Upload from your computer"} 
                                isSelected={selectedApps.includes("other")} 
                            />
                        </label>
                    </div>

                    {/* Execution Button */}
                    <button 
                        onClick={onImport} 
                        className="group relative w-full mt-4 h-16 bg-white text-slate-950 rounded-[1.25rem] font-black text-sm uppercase tracking-widest overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-[0.96]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                            Initialize Import
                        </span>
                    </button>
                </div>
            </div>
        </div>
    </div>
);