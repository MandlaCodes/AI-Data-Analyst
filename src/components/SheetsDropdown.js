import React, { useState, useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";

export default function SheetsDropdown({ sheetsList, selectedSheet, setSelectedSheet }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedName = selectedSheet 
        ? (sheetsList.find(s => s.id === selectedSheet)?.name || "-- Choose Sheet --")
        : "-- Choose Sheet --";

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3 flex justify-between items-center rounded-lg text-left transition duration-300 ${isOpen ? 'bg-gray-700 border-purple-500' : 'bg-gray-800 border-gray-700'} border text-white`}
            >
                <span className={`truncate ${selectedSheet ? 'text-white' : 'text-gray-400'}`}>{selectedName}</span>
                <FiChevronDown size={18} className={`ml-2 transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 rounded-lg bg-gray-900 shadow-2xl border border-purple-900/50 overflow-hidden z-20 max-h-60 overflow-y-auto">
                    {sheetsList.map(sheet => (
                        <div key={sheet.id} onClick={() => { setSelectedSheet(sheet.id); setIsOpen(false); }} className="p-3 text-sm cursor-pointer hover:bg-gray-800 text-gray-300">
                            {sheet.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}