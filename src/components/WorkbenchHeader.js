import React from "react";
import { FiPlus, FiSave, FiCloudLightning } from "react-icons/fi";
import { MdOutlineInsights } from "react-icons/md";

export const WorkbenchHeader = ({
    isSaving,
    onImport,
    onSave
}) => (
    <header className="w-full bg-[#F3F3F1]">
        <div className="w-full px-5 md:px-7 lg:px-8 pt-6 pb-4">
            
            <div className="
                flex items-center justify-between gap-5
                bg-white
                border border-[#E7E7E2]
                rounded-[18px]
                px-5 md:px-6
                py-4
                shadow-[0_1px_2px_rgba(20,20,20,0.03),0_8px_24px_rgba(20,20,20,0.035)]
            ">
                
                {/* LEFT */}
                <div className="flex items-center gap-3.5 min-w-0">
                    
                    <div className="
                        w-10 h-10
                        shrink-0
                        rounded-[12px]
                        bg-[#EEE9FF]
                        border border-[#DDD3FF]
                        flex items-center justify-center
                    ">
                        <MdOutlineInsights
                            size={19}
                            className="text-[#6D3DF5]"
                        />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <h1 className="
                                text-[19px] md:text-[21px]
                                leading-none
                                font-semibold
                                tracking-[-0.035em]
                                text-[#171717]
                            ">
                                Workbench
                            </h1>

                            <span className="
                                hidden sm:inline-flex
                                px-2 py-1
                                rounded-md
                                bg-[#F3F3F1]
                                text-[9px]
                                leading-none
                                font-semibold
                                text-[#777771]
                            ">
                                v4.0.2
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                            <p className="
                                text-[11px]
                                leading-none
                                text-[#8B8B86]
                                font-medium
                            ">
                                Analysis workspace
                            </p>

                            {isSaving && (
                                <>
                                    <span className="w-[3px] h-[3px] rounded-full bg-[#C7C7C2]" />

                                    <span className="
                                        flex items-center gap-1.5
                                        text-[10px]
                                        font-medium
                                        text-[#6D3DF5]
                                    ">
                                        <FiCloudLightning size={11} />
                                        Syncing
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 shrink-0">
                    
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="
                            hidden sm:flex
                            h-9
                            items-center gap-2
                            px-3.5
                            rounded-[10px]
                            border border-[#E5E5E0]
                            bg-white
                            text-[#555550]
                            text-[11px]
                            font-semibold
                            transition-all duration-200
                            hover:bg-[#F7F7F5]
                            hover:text-[#171717]
                            disabled:opacity-40
                            active:scale-[0.98]
                        "
                    >
                        <FiSave size={13} />
                        {isSaving ? "Saving" : "Save"}
                    </button>

                    <button
                        onClick={onImport}
                        className="
                            h-9
                            flex items-center gap-2
                            px-4
                            rounded-[10px]
                            bg-[#6D3DF5]
                            text-white
                            text-[11px]
                            font-semibold
                            shadow-[0_3px_10px_rgba(109,61,245,0.18)]
                            transition-all duration-200
                            hover:bg-[#6032E7]
                            hover:shadow-[0_5px_14px_rgba(109,61,245,0.22)]
                            active:scale-[0.98]
                        "
                    >
                        <FiPlus size={14} />
                        <span className="hidden xs:inline">
                            Add data
                        </span>
                    </button>

                </div>
            </div>
        </div>
    </header>
);