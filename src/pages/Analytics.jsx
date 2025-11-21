import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

export default function Analytics() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const userId = searchParams.get("user_id") || "123";

  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  const [isConnected, setIsConnected] = useState(false);
  const [sheets, setSheets] = useState([]);

  // -----------------------------
  //  FETCH GOOGLE SHEETS STATUS
  // -----------------------------
  const fetchConnectedApps = async () => {
    try {
      const res = await axios.get(
        `${BACKEND}/connected-apps?user_id=${userId}`
      );
      const status = res.data.google_sheets || false;
      setIsConnected(status);
      return status;
    } catch (err) {
      console.log("Error checking connection", err);
      return false;
    }
  };

  // -----------------------------
  //  LIST SHEETS (same function as Integrations)
  // -----------------------------
  const fetchSheets = async () => {
    try {
      const res = await axios.get(`${BACKEND}/sheets-list/${userId}`);
      const sheetList = res.data.sheets || [];
      setSheets(sheetList);
    } catch (err) {
      console.log("Sheets fetch error:", err);
      setSheets([]);
    }
  };

  // -----------------------------
  //  INITIAL LOAD
  // -----------------------------
  useEffect(() => {
    fetchConnectedApps().then((connected) => {
      if (connected) fetchSheets();
    });
  }, []);

  // -----------------------------
  //  RELOAD AFTER OAUTH REDIRECT
  // -----------------------------
  useEffect(() => {
    const justConnected = searchParams.get("connected") === "true";
    const app = searchParams.get("type");

    if (justConnected && app === "google_sheets") {
      fetchConnectedApps().then((connected) => {
        if (connected) fetchSheets();
      });

      window.history.replaceState({}, document.title, "/dashboard/analytics");
    }
  }, [location.search]);

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
        Analytics Dashboard
      </h1>

      {!isConnected ? (
        <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
          <p className="text-red-400 text-lg">
            Google Sheets is not connected.
          </p>
          <p className="text-gray-400 text-sm">
            Go to Integrations and connect Google Sheets.
          </p>
        </div>
      ) : (
        <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl text-white font-bold">Your Google Sheets</h2>

            <button
              onClick={fetchSheets}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
            >
              Refresh
            </button>
          </div>

          {sheets.length === 0 ? (
            <p className="text-gray-400 mt-4">No sheets found.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {sheets.map((sheet) => (
                <li
                  key={sheet.id}
                  className="p-3 bg-gray-700 rounded-xl text-white"
                >
                  {sheet.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
