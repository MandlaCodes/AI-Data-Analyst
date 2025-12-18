import React from "react";
import { FiX, FiUploadCloud, FiChevronDown, FiCheckCircle } from "react-icons/fi";
import { MdOutlineTableChart } from "react-icons/md";

const SourceCard = ({ icon: Icon, title, description, isSelected, onClick, disabled }) => (
    <div 
        onClick={onClick} 
        className={`p-5 rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-4 border-2 ${
            disabled ? 'opacity-50 cursor-not-allowed bg-gray-900/50 border-gray-800' : 
            isSelected ? 'border-purple-500 bg-purple-900/10 shadow-lg shadow-purple-900/50' : 
            'border-gray-800 hover:border-cyan-500/50 bg-gray-900/60'
        }`} 
        style={{ backdropFilter: 'blur(4px)' }}
    >
        <Icon size={32} className={isSelected ? "text-purple-400" : "text-gray-400"} />
        <div className="flex-1">
            <h4 className="font-semibold text-white">{title}</h4>
            <p className="text-xs text-gray-400">{description}</p>
        </div>
        {isSelected && <FiCheckCircle size={20} className="text-cyan-400" />}
    </div>
);

const SheetsDropdown = ({ sheetsList, selectedSheet, setSelectedSheet }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const selectedName = selectedSheet ? (sheetsList.find(s => s.id === selectedSheet)?.name || "-- Choose Sheet --") : "-- Choose Sheet --";
    
    return (
        <div className="relative">
            <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)} 
                className={`w-full p-3 flex justify-between items-center rounded-lg text-left transition duration-300 ${
                    isOpen ? 'bg-gray-700 border-purple-500' : 'bg-gray-800 border-gray-700 hover:border-purple-500/50'
                } border text-white`}
            >
                <span className={`truncate ${selectedSheet ? 'text-white' : 'text-gray-400'}`}>{selectedName}</span>
                <FiChevronDown size={18} className={`ml-2 transform transition-transform ${isOpen ? 'rotate-180 text-purple-400' : 'rotate-0 text-gray-400'}`} />
            </button>
            
            {isOpen && (
                <div className="absolute left-0 right-0 mt-2 rounded-lg bg-slate-800 shadow-2xl border border-purple-500/50 z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {sheetsList.length > 0 ? (
                            sheetsList.map(sheet => (
                                <div 
                                    key={sheet.id} 
                                    onClick={() => { setSelectedSheet(sheet.id); setIsOpen(false); }} 
                                    className={`p-3 text-sm rounded-md mb-1 cursor-pointer transition-colors ${
                                        sheet.id === selectedSheet ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                                >
                                    {sheet.name}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-xs text-gray-500 italic">No sheets found in account</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const ImportModal = ({ onClose, selectedApps, setSelectedApps, sheetsList, selectedSheet, setSelectedSheet, setCsvToImport, csvToImport, onImport }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Removed overflow-hidden from here to allow dropdown to pop out */}
        <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl relative">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Import Data</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <FiX size={24} />
                </button>
            </div>
            
            <div className="p-8 space-y-6">
                <div className="space-y-4">
                    <SourceCard 
                        icon={MdOutlineTableChart} 
                        title="Google Sheets" 
                        description="Import from your connected drive"
                        isSelected={selectedApps.includes("google_sheets")} 
                        onClick={() => setSelectedApps(prev => prev.includes("google_sheets") ? [] : ["google_sheets"])} 
                    />
                    
                    {selectedApps.includes("google_sheets") && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <SheetsDropdown 
                                sheetsList={sheetsList} 
                                selectedSheet={selectedSheet} 
                                setSelectedSheet={setSelectedSheet} 
                            />
                        </div>
                    )}
                </div>

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
                            description={csvToImport ? `Ready: ${csvToImport.name}` : "Upload from computer"} 
                            isSelected={selectedApps.includes("other")} 
                        />
                    </label>
                </div>

                <button 
                    onClick={onImport} 
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-all mt-4"
                >
                    Import Selected
                </button>
            </div>
        </div>
    </div>
);