import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Analytics({ userId }) {
  const [connectedApps, setConnectedApps] = useState({});
  const [selectedApp, setSelectedApp] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    async function fetchConnectedApps() {
      try {
        const res = await axios.get(`http://localhost:8000/connected-apps?user_id=${userId}`);
        setConnectedApps(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchConnectedApps();
  }, [userId]);

  const handleSelectApp = async (appName) => {
    setSelectedApp(appName);
    setSheetData([]);
    if (appName === "google_sheets") {
      setLoadingSheets(true);
      try {
        const res = await axios.get(`http://localhost:8000/sheets-list/${userId}`);
        setSheets(res.data.sheets);
        setSelectedSheet(null);
      } catch (err) {
        console.error(err);
      }
      setLoadingSheets(false);
    }
  };

  const handleSelectSheet = (e) => {
    setSelectedSheet(e.target.value);
    setSheetData([]);
  };

  const handleInterpretData = async () => {
    if (!selectedSheet) return;
    setLoadingData(true);
    try {
      const res = await axios.get(`http://localhost:8000/sheets/${userId}/${selectedSheet}`);
      setSheetData(res.data.values);
    } catch (err) {
      console.error(err);
    }
    setLoadingData(false);
  };

  return (
    <div className="p-10 bg-gray-900 min-h-screen text-white font-sans">
      <h1 className="text-3xl font-bold mb-6">
        Connect your business data sources to get insights from business data
      </h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Connected Apps</h2>
        {Object.keys(connectedApps).map((app) => {
          if (connectedApps[app]) {
            return (
              <button
                key={app}
                onClick={() => handleSelectApp(app)}
                className={`mr-4 mb-2 px-4 py-2 rounded-lg transform transition-transform duration-300 hover:scale-105 ${
                  selectedApp === app ? "bg-indigo-600" : "bg-purple-600"
                } hover:bg-indigo-500`}
              >
                {app.replace("_", " ").toUpperCase()}
              </button>
            );
          }
          return null;
        })}
      </div>

      {selectedApp === "google_sheets" && (
        <div className="mb-6 flex items-center space-x-4">
          {loadingSheets ? (
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <select
                value={selectedSheet || ""}
                onChange={handleSelectSheet}
                className="p-2 rounded-lg text-black"
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
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Interpret Data
                </button>
              )}
            </>
          )}
        </div>
      )}

      {loadingData && (
        <div className="flex justify-center items-center my-6">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {sheetData.length > 0 && !loadingData && (
        <div className="overflow-auto border border-gray-700 rounded-lg p-4 transition-transform transform hover:scale-105">
          <table className="min-w-full border-collapse border border-gray-600">
            <tbody>
              {sheetData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border border-gray-600 p-2 text-center"
                    >
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
