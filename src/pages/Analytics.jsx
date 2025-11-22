import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

const Analytics = ({ userId }) => {
  const [connectedApps, setConnectedApps] = useState({});
  const [selectedApp, setSelectedApp] = useState("");
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [sheetData, setSheetData] = useState([]);

  useEffect(() => {
    const fetchConnectedApps = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/connected-apps`, {
          params: { user_id: userId },
        });
        setConnectedApps(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConnectedApps();
  }, [userId]);

  const handleAppSelect = async (app) => {
    setSelectedApp(app);
    if (app === "google_sheets") {
      try {
        const res = await axios.get(`${BACKEND_URL}/sheets-list/${userId}`);
        setSheets(res.data.sheets);
        setSelectedSheet("");
        setSheetData([]);
      } catch (err) {
        console.error(err);
        alert("Error fetching sheets. Make sure Google Sheets is connected.");
      }
    }
  };

  const handleSheetSelect = (e) => {
    setSelectedSheet(e.target.value);
  };

  const handleInterpretData = async () => {
    if (!selectedSheet) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/sheets/${userId}/${selectedSheet}`);
      setSheetData(res.data.values);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">
        Connect your business data sources to get insights from business data
      </h1>

      <div className="mb-6">
        <h2 className="text-xl mb-2">Connected Apps</h2>
        <div className="flex gap-4">
          {connectedApps.google_sheets && (
            <button
              className={`px-4 py-2 rounded-lg ${
                selectedApp === "google_sheets"
                  ? "bg-purple-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => handleAppSelect("google_sheets")}
            >
              Google Sheets
            </button>
          )}
        </div>
      </div>

      {selectedApp === "google_sheets" && (
        <div className="mb-6">
          <h2 className="text-lg mb-2">Select a Sheet</h2>
          <select
            className="p-2 rounded-lg text-black"
            onChange={handleSheetSelect}
            value={selectedSheet}
          >
            <option value="">Select...</option>
            {sheets.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.name}
              </option>
            ))}
          </select>

          {selectedSheet && (
            <button
              className="ml-4 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition"
              onClick={handleInterpretData}
            >
              Interpret Data
            </button>
          )}
        </div>
      )}

      {sheetData.length > 0 && (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-gray-800 rounded-lg">
            <tbody>
              {sheetData.map((row, i) => (
                <tr key={i} className="border-b border-gray-700">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2">
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
};

export default Analytics;
