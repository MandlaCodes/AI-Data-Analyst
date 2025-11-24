import React, { useEffect, useState } from "react";

export default function Integrations({ profile }) {
  const [googleSheetsConnected, setGoogleSheetsConnected] = useState(false);

  const userId = profile?.user_id;

  const handleConnect = () => {
    if (!userId) return alert("User ID missing");
    window.location.href = `https://ai-data-analyst-backend-1nuw.onrender.com/auth/google_sheets?user_id=${userId}`;
  };

  const handleDisconnect = () => {
    alert("Disconnect not implemented yet.");
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white mb-6">
        Connect your business data sources to get insights from business data
      </h1>

      <div className="bg-gradient-to-r from-purple-800 to-blue-800 p-6 rounded-xl shadow-lg flex justify-between items-center hover:scale-105 transition-transform duration-300">
        <div>
          <h2 className="text-xl font-semibold">Google Sheets</h2>
          <p className="text-gray-200">Sync your spreadsheets to analyze business data.</p>
        </div>

        <div>
          {!googleSheetsConnected ? (
            <button
              onClick={handleConnect}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-md font-semibold"
            >
              Connect
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-md font-semibold"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
