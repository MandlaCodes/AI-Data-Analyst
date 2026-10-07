import React from "react";
import {
    FiPlus,
    FiSave,
    FiCloudLightning
} from "react-icons/fi";
import { MdOutlineInsights } from "react-icons/md";

export const WorkbenchHeader = ({
    isSaving,
    onImport,
    onSave
}) => (
    <header className="w-full bg-white border-b border-[#E5E5E0]">
        
        <div className="
            w-full
            flex items-center justify-between
            gap-6
            px-6 md:px-8 lg:px-10
            py-5 md:py-6
        ">
            
            {/* LEFT SIDE */}
            <div className="flex items-center gap-4 min-w-0">
                
                {/* ICON */}
                <div className="
                    w-12 h-12
                    shrink-0
                    rounded-[14px]
                    bg-[#EEE9FF]
                    border border-[#DDD3FF]
                    flex items-center justify-center
                ">
                    <MdOutlineInsights
                        size={23}
                        className="text-[#6D3DF5]"
                    />
                </div>

                {/* TITLE */}
                <div className="min-w-0">
                    
                    <div className="flex items-center gap-3">
                        <h1 className="
                            text-[22px]
                            md:text-[25px]
                            font-bold
                            leading-tight
                            tracking-[-0.025em]
                            text-[#171717]
                        ">
                            Workbench
                        </h1>

                        <span className="
                            hidden sm:inline-flex
                            items-center
                            px-2.5
                            py-1
                            rounded-[7px]
                            bg-[#F2F2EF]
                            text-[11px]
                            leading-none
                            font-semibold
                            text-[#686863]
                        ">
                            v4.0.2
                        </span>
                    </div>

                    <div className="
                        flex items-center
                        gap-2.5
                        mt-1
                    ">
                        <p className="
                            text-[13px]
                            md:text-[14px]
                            leading-normal
                            text-[#70706B]
                            font-medium
                        ">
                            Analysis workspace
                        </p>

                        {isSaving && (
                            <>
                                <span className="
                                    w-1 h-1
                                    rounded-full
                                    bg-[#C3C3BE]
                                " />

                                <span className="
                                    flex items-center
                                    gap-1.5
                                    text-[12px]
                                    font-semibold
                                    text-[#6D3DF5]
                                ">
                                    <FiCloudLightning size={13} />
                                    Syncing
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE ACTIONS */}
            <div className="
                flex items-center
                gap-2.5
                shrink-0
            ">
                
                {/* SAVE */}
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="
                        hidden sm:flex
                        h-11
                        items-center
                        gap-2
                        px-5
                        rounded-[11px]

                        bg-white
                        border border-[#DEDED9]

                        text-[13px]
                        font-semibold
                        text-[#454541]

                        transition-all
                        duration-200

                        hover:bg-[#F7F7F5]
                        hover:border-[#CECEC8]
                        hover:text-[#171717]

                        disabled:opacity-40
                        disabled:cursor-not-allowed

                        active:scale-[0.98]
                    "
                >
                    <FiSave size={15} />

                    {isSaving
                        ? "Saving..."
                        : "Save"
                    }
                </button>

                {/* ADD DATA */}
                <button
                    onClick={onImport}
                    className="
                        h-11
                        flex items-center
                        gap-2
                        px-5

                        rounded-[11px]

                        bg-[#6D3DF5]
                        text-white

                        text-[13px]
                        font-semibold

                        shadow-[0_3px_10px_rgba(109,61,245,0.20)]

                        transition-all
                        duration-200

                        hover:bg-[#6032E7]
                        hover:shadow-[0_5px_14px_rgba(109,61,245,0.24)]

                        active:scale-[0.98]
                    "
                >
                    <FiPlus size={16} />

                    <span>
                        Add data
                    </span>
                </button>

            </div>
        </div>
    </header>
);