import React from "react";
import { FiPlus, FiSave, FiCloudLightning } from "react-icons/fi";
import { MdOutlineInsights } from "react-icons/md";

export const WorkbenchHeader = ({ isSaving, onImport, onSave }) => (
    /* max-w-full + box-border: Prevents the horizontal scroll/overflow.
       left-0 + right-0: Ensures it anchors perfectly to both sides.
    */
    <header className="sticky top-0 z-40 w-full max-w-full bg-[#0B0F1A]/90 backdrop-blur-2xl border-b border-white/[0.08] box-border">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 px-6 md:px-10 py-6 mx-auto">
            
            {/* Branding - Scaled for high visibility */}
            <div className="flex items-center gap-5 min-w-0">
                <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-purple-600/20 blur-xl animate-pulse" />
                    <div className="relative bg-[#161B2C] border border-white/10 p-3 rounded-2xl">
                        <MdOutlineInsights size={28} className="text-purple-500" />
                    </div>
                </div>
                
                <div className="flex flex-col truncate">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none truncate">
                            Workbench<span className="text-purple-500">.</span>
                        </h2>
                        <div className="shrink-0 flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <span className="text-[9px] font-black text-emerald-500 tracking-widest uppercase">Live</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest truncate opacity-70">
                            Core_System_v4.0
                        </span>
                        {isSaving && (
                            <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-black uppercase tracking-widest animate-pulse whitespace-nowrap">
                                <FiCloudLightning size={12} /> Syncing
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Group - Modern Island */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center bg-white/[0.03] p-1 rounded-2xl border border-white/[0.08]">
                    <button 
                        onClick={onImport} 
                        className="flex items-center gap-2.5 px-6 py-3 hover:bg-white/[0.05] text-slate-300 hover:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                        <FiPlus size={18} className="text-purple-500" /> 
                        Import
                    </button>
                    
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    
                    <button 
                        onClick={onSave} 
                        disabled={isSaving} 
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all text-slate-300 hover:text-emerald-400 disabled:opacity-20"
                    >
                        <FiSave size={18} /> 
                        {isSaving ? "Saving" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    </header>
);