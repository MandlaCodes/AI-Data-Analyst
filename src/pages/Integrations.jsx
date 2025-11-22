import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

const Integrations = ({ userId }) => {
  const [googleSheetsConnected, setGoogleSheetsConnected] = useState(false);

  useEffect(() => {
    const fetchConnectedApps = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/connected-apps`, {
          params: { user_id: userId },
        });
        setGoogleSheetsConnected(res.data.google_sheets);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConnectedApps();
  }, [userId]);

  const handleConnect = () => {
    window.location.href = `${BACKEND_URL}/auth/google_sheets?user_id=${userId}`;
  };

  const handleDisconnect = () => {
    // simple disconnect: delete token on backend or just clear state
    setGoogleSheetsConnected(false);
    alert("Disconnected Google Sheets (token removal should happen in backend)");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">
        Connect your business data sources to get insights from business data
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Google Sheets Card */}
        <div className="bg-gradient-to-br from-purple-700 to-pink-600 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Google Sheets</h2>
            <p className="text-gray-200">Sync your spreadsheets for insights.</p>
          </div>
          <div className="mt-4">
            {googleSheetsConnected ? (
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition"
                onClick={handleConnect}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
