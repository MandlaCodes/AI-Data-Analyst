import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Analytics({ profile }) {
  const [connectedApps, setConnectedApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState("");
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [sheetData, setSheetData] = useState([]);

  useEffect(() => {
    if (!profile) return;

    const fetchConnectedApps = async () => {
      try {
        const res = await axios.get(
          `https://ai-data-analyst-backend-1nuw.onrender.com/connected-apps?user_id=${profile.user_id}`
        );
        const apps = [];
        if (res.data.google_sheets) apps.push("Google Sheets");
        setConnectedApps(apps);
      } catch (err) {
        console.error(err);
      }
    };

    fetchConnectedApps();
  }, [profile]);

  const handleSelectApp = async (app) => {
    setSelectedApp(app);
    setSelectedSheet("");
    setSheetData([]);
    if (app === "Google Sheets") {
      try {
        const res = await axios.get(
          `https://ai-data-analyst-backend-1nuw.onrender.com/sheets-list/${profile.user_id}`
        );
        setSheets(res.data.sheets);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSelectSheet = (e) => {
    setSelectedSheet(e.target.value);
    setSheetData([]);
  };

  const handleInterpretData = async () => {
    if (!selectedSheet) return;
    try {
      const res = await axios.get(
        `https://ai-data-analyst-backend-1nuw.onrender.com/sheets/${profile.user_id}/${selectedSheet}`
      );
      setSheetData(res.data.values);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/40 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/20">
        <h2 className="text-xl font-semibold mb-4">Connected Apps</h2>
        {connectedApps.length === 0 && <p>No apps connected yet.</p>}
        <div className="flex gap-4 flex-wrap">
          {connectedApps.map((app) => (
            <button
              key={app}
              onClick={() => handleSelectApp(app)}
              className={`py-2 px-4 rounded-lg font-bold transition-all ${
                selectedApp === app ? "bg-green-500" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {app} {selectedApp === app && "✓"}
            </button>
          ))}
        </div>
      </div>

      {selectedApp === "Google Sheets" && sheets.length > 0 && (
        <div className="bg-gray-900/40 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/20">
          <h3 className="text-lg font-semibold mb-2">Select a Sheet</h3>
          <select
            className="p-2 rounded-lg text-black font-bold mb-4"
            value={selectedSheet}
            onChange={handleSelectSheet}
          >
            <option value="">Select a datasheet</option>
            {sheets.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.name}
              </option>
            ))}
          </select>
          {selectedSheet && (
            <button
              onClick={handleInterpretData}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg ml-4"
            >
              Interpret Data
            </button>
          )}
        </div>
      )}

      {sheetData.length > 0 && (
        <div className="bg-gray-900/40 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/20 overflow-x-auto">
          <table className="w-full text-white border-collapse">
            <tbody>
              {sheetData.map((row, i) => (
                <tr key={i} className="border-b border-white/20">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2 border-r border-white/20">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
