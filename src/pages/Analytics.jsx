import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Analytics({ profile }) {
  const [connectedApps, setConnectedApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [sheetsList, setSheetsList] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheetData, setSheetData] = useState([]);

  useEffect(() => {
    if (!profile) return;

    const fetchConnectedApps = async () => {
      const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/connected-apps?user_id=${profile.user_id}`);
      const apps = [];
      if (res.data.google_sheets) apps.push("Google Sheets");
      setConnectedApps(apps);
    };

    fetchConnectedApps();
  }, [profile]);

  const handleAppSelect = async (app) => {
    setSelectedApp(app);
    if (app === "Google Sheets") {
      const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/sheets-list/${profile.user_id}`);
      setSheetsList(res.data.sheets);
    }
  };

  const handleInterpretData = async () => {
    if (!selectedSheet) return;
    const res = await axios.get(`https://ai-data-analyst-backend-1nuw.onrender.com/sheets/${profile.user_id}/${selectedSheet}`);
    setSheetData(res.data.values);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white mb-6">
        Connect your business data sources to get insights from business data
      </h1>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Connected Apps</h2>
        <div className="flex gap-4 flex-wrap">
          {connectedApps.map((app) => (
            <button
              key={app}
              onClick={() => handleAppSelect(app)}
              className={`px-4 py-2 rounded-md font-semibold ${
                selectedApp === app ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {app} {selectedApp === app && "✓"}
            </button>
          ))}
        </div>
      </div>

      {selectedApp === "Google Sheets" && sheetsList.length > 0 && (
        <div className="space-y-4">
          <select
            className="px-4 py-2 rounded-md bg-gray-800 text-white"
            onChange={(e) => setSelectedSheet(e.target.value)}
          >
            <option value="">Select a datasheet</option>
            {sheetsList.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.name}
              </option>
            ))}
          </select>

          {selectedSheet && (
            <button
              onClick={handleInterpretData}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-md font-semibold"
            >
              Interpret Data
            </button>
          )}
        </div>
      )}

      {sheetData.length > 0 && (
        <div className="overflow-auto mt-6">
          <table className="table-auto border-collapse border border-gray-500 w-full text-white">
            <tbody>
              {sheetData.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-4 py-2">
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
