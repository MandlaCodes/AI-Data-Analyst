import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

export default function Analytics() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  const location = useLocation();

  // -------------------------------
  // GET USER ID FROM URL ALWAYS
  // -------------------------------
  const searchParams = new URLSearchParams(location.search);
  const userId = searchParams.get("user_id") || "123";

  // -------------------------------
  // FETCH GOOGLE SHEETS
  // -------------------------------
  const fetchSheets = async () => {
    try {
      const res = await axios.get(`${BACKEND}/sheets-list/${userId}`);
      setSheets(res.data.sheets || []);
    } catch (err) {
      console.log("Failed to load sheets:", err);
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // RUN ON PAGE LOAD
  // -------------------------------
  useEffect(() => {
    fetchSheets();
  }, []);

  // -------------------------------
  // IF USER JUST RETURNED FROM GOOGLE OAUTH
  // FORCE RELOAD SHEETS
  // -------------------------------
  useEffect(() => {
    const justConnected = searchParams.get("connected") === "true";
    const type = searchParams.get("type");

    if (justConnected && type === "google_sheets") {
      fetchSheets();
      window.history.replaceState({}, document.title, "/dashboard/analytics");
    }
  }, [location.search]);

  return (
    <div className="space-y-10">
      <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500">
        Analytics Dashboard
      </h2>

      <p className="text-gray-300 text-lg">
        Create strategic business insights that enable confident, data-driven decisions.
      </p>

      {/* ---------------- Connected Apps ---------------- */}
      <div>
        <h3 className="text-xl font-bold text-white mb-3">Connected Apps</h3>
        <p className="text-gray-400">Tap a logo to select source</p>

        <div className="mt-4 flex gap-6">
          <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg"
              alt="Google Sheets"
              className="w-10 h-10"
            />
          </div>
        </div>
      </div>

      {/* ---------------- Select Sheet ---------------- */}
      <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-4">Select Google Sheet</h3>

        {loading ? (
          <p className="text-gray-300">Loading spreadsheets...</p>
        ) : sheets.length === 0 ? (
          <p className="text-red-400">
            No spreadsheets found. Check the Integrations page if you expected sheets.
          </p>
        ) : (
          <ul className="space-y-2">
            {sheets.map((sheet) => (
              <li key={sheet.id} className="text-white bg-gray-700 p-3 rounded-xl">
                {sheet.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
