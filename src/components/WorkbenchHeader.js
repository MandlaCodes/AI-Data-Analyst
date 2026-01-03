import React from "react";
import { FiPlus, FiSave, FiCloudLightning } from "react-icons/fi";
import { MdOutlineInsights } from "react-icons/md";

export const WorkbenchHeader = ({ isSaving, onImport, onSave }) => (
    /* METRIA AI SLIM-LINE PROTOCOL:
        - Fixed width compatibility: Reduced horizontal padding and font sizes.
        - Responsive icon handling: Uses className for sizing to avoid Babel errors.
    */
    <header className="sticky top-0 z-40 w-full bg-black border-b border-white/10 box-border overflow-hidden">
        <div className="flex justify-between items-center gap-2 md:gap-4 px-4 md:px-6 py-4 md:py-6 mx-auto w-full">
            
            {/* BRANDING: COMPACTED */}
            <div className="flex items-center gap-3 md:gap-4 min-w-0 shrink">
                <div className="relative shrink-0 hidden xs:block">
                    <div className="absolute inset-0 bg-purple-600/30 blur-2xl animate-pulse" />
                    <div className="relative bg-white p-2 md:p-2.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        <MdOutlineInsights className="text-black w-4 h-4 md:w-5 md:h-5" />
                    </div>
                </div>
                
                <div className="flex flex-col min-w-0">
                    <h2 className="text-lg md:text-2xl font-black text-white tracking-tighter uppercase leading-none whitespace-nowrap">
                        Workbench<span className="text-purple-500">_</span>
                    </h2>
                    <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-1.5">
                        <span className="text-[7px] md:text-[9px] font-mono font-bold text-white/20 uppercase tracking-[0.2em] md:tracking-[0.3em] whitespace-nowrap">
                            v4.0.2 // Core
                        </span>
                        {isSaving && (
                            <div className="flex items-center gap-1 text-[7px] md:text-[9px] text-purple-400 font-black uppercase tracking-[0.1em] md:tracking-[0.2em] animate-pulse whitespace-nowrap">
                                <FiCloudLightning className="w-2.5 h-2.5" /> Syncing
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ACTION CENTER: COMPACTED ISLAND */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <div className="flex items-center bg-white/[0.03] p-1 rounded-xl md:rounded-[1.2rem] border border-white/10 shadow-xl">
                    <button 
                        onClick={onImport} 
                        className="group flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-white hover:bg-purple-600 text-black hover:text-white rounded-lg md:rounded-[1rem] font-black text-[8px] md:text-[9px] uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all duration-300 active:scale-95"
                    >
                        <FiPlus className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-600 group-hover:text-white" /> 
                        <span className="hidden xs:inline">Import</span>
                    </button>
                    
                    <div className="w-[1px] h-5 md:h-6 bg-white/10 mx-1 md:mx-1.5" />
                    
                    <button 
                        onClick={onSave} 
                        disabled={isSaving} 
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-[1rem] font-black text-[8px] md:text-[9px] uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all duration-300 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/5 disabled:opacity-10 active:scale-95"
                    >
                        <FiSave className="w-3 h-3 md:w-3.5 md:h-3.5" /> 
                        <span className="hidden xs:inline">{isSaving ? "Finalizing" : "Save"}</span>
                        {isSaving && <span className="xs:hidden">...</span>}
                    </button>
                </div>
            </div>
        </div>

        {/* The Metria Horizon Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
);