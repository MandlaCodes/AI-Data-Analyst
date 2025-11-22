import React, { useEffect, useState } from "react";
import {
  FcGoogle,
  FcDocument,
  FcOpenedFolder,
  FcBarChart,
} from "react-icons/fc";

export default function Integrations() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState("");

  useEffect(() => {
    async function loadSheets() {
      try {
        const res = await fetch("http://localhost:8000/list-sheets");
        const data = await res.json();

        if (data.sheets) {
          setSheets(data.sheets);
        } else {
          setSheets([]);
        }
      } catch (err) {
        setSheets([]);
      } finally {
        setLoading(false);
      }
    }

    loadSheets();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">Integrations</h1>
        <p className="text-gray-500 mt-2 text-lg">
          Connect your data sources and manage synced applications.
        </p>
      </div>

      {/* CONNECTED APPS - FROM ANALYTICS */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          Connected Apps
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          <div className="p-6 border rounded-xl flex flex-col items-center hover:shadow transition">
            <FcGoogle size={38} />
            <p className="mt-3 font-medium">Google Sheets</p>
          </div>

          <div className="p-6 border rounded-xl flex flex-col items-center hover:shadow transition">
            <FcDocument size={38} />
            <p className="mt-3 font-medium">Docs</p>
          </div>

          <div className="p-6 border rounded-xl flex flex-col items-center hover:shadow transition">
            <FcOpenedFolder size={38} />
            <p className="mt-3 font-medium">Drive</p>
          </div>

          <div className="p-6 border rounded-xl flex flex-col items-center hover:shadow transition">
            <FcBarChart size={38} />
            <p className="mt-3 font-medium">Analytics</p>
          </div>
        </div>
      </div>

      {/* SELECT GOOGLE SHEET - FROM ANALYTICS */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Select Google Sheet</h2>
        <p className="text-gray-500">
          Choose the spreadsheet you'd like to sync and analyze.
        </p>

        {loading ? (
          <p className="text-gray-400">Loading sheets...</p>
        ) : sheets.length === 0 ? (
          <p className="text-red-500">
            No spreadsheets found. Try reconnecting Google Sheets.
          </p>
        ) : (
          <select
            className="border p-3 rounded-xl w-full text-lg"
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(e.target.value)}
          >
            <option value="">Select a spreadsheet…</option>

            {sheets.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* SELECTED SHEET PREVIEW */}
      {selectedSheet && (
        <div className="p-6 border rounded-xl bg-gray-50 mt-4">
          <h3 className="text-xl font-semibold">Selected Sheet</h3>
          <p className="text-gray-500 mt-2">{selectedSheet}</p>
        </div>
      )}
    </div>
  );
}
