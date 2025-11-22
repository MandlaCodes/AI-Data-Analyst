import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Integrations({ userId }) {
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConnectedApps() {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:8000/connected-apps?user_id=${userId}`);
        setConnected(res.data.google_sheets);
        setLastSync(res.data.google_sheets_last_sync);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchConnectedApps();
  }, [userId]);

  const handleConnect = () => {
    window.location.href = `http://localhost:8000/auth/google_sheets?user_id=${userId}`;
  };

  const handleDisconnect = () => {
    alert("Disconnect feature not implemented yet");
  };

  return (
    <div className="p-10 bg-gray-900 min-h-screen text-white font-sans">
      <h1 className="text-3xl font-bold mb-6">
        Connect your business data sources to get insights from business data
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-500 rounded-2xl p-6 shadow-xl transform transition-transform duration-500 hover:scale-105 hover:shadow-2xl hover:translate-y-[-5px]">
            <h2 className="text-xl font-semibold mb-2">Google Sheets</h2>
            {connected ? (
              <>
                <p className="text-sm mb-4">
                  Connected - Last sync: {new Date(lastSync).toLocaleString()}
                </p>
                <button
                  onClick={handleDisconnect}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
