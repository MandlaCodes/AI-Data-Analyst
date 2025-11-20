import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

export default function Integrations() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("user_id");

  const [googleSheetsConnected, setGoogleSheetsConnected] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Check connected apps
  const fetchConnectedApps = async () => {
    if (!userId) return;

    try {
      const res = await axios.get(
        `https://ai-data-analyst-backend-1nuw.onrender.com/connected-apps`,
        { params: { user_id: userId } }
      );

      setGoogleSheetsConnected(res.data.google_sheets);
      setLastSync(res.data.google_sheets_last_sync);
    } catch (err) {
      console.error("Error fetching connected apps", err);
    }
  };

  useEffect(() => {
    fetchConnectedApps();
  }, [userId]);

  const connectGoogleSheets = () => {
    if (!userId) return;
    window.location.href = `https://ai-data-analyst-backend-1nuw.onrender.com/auth/google_sheets?user_id=${userId}`;
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Integrations</h1>

      <div className="mb-4">
        <button
          onClick={connectGoogleSheets}
          className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
            googleSheetsConnected
              ? "bg-green-500 hover:bg-green-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {googleSheetsConnected ? "Google Sheets Connected" : "Connect Google Sheets"}
        </button>
      </div>

      {googleSheetsConnected && lastSync && (
        <p className="text-gray-300 text-sm">
          Last connected: {new Date(lastSync).toLocaleString()}
        </p>
      )}
    </div>
  );
}
