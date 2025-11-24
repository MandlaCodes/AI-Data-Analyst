import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Integrations({ profile }) {
  const [googleSheetsConnected, setGoogleSheetsConnected] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const fetchConnected = async () => {
      try {
        const res = await axios.get(
          `https://ai-data-analyst-backend-1nuw.onrender.com/connected-apps?user_id=${profile.user_id}`
        );
        setGoogleSheetsConnected(res.data.google_sheets);
      } catch (err) {
        console.error(err);
      }
    };

    fetchConnected();
  }, [profile]);

  const handleConnect = () => {
    window.location.href = `https://ai-data-analyst-backend-1nuw.onrender.com/auth/google_sheets?user_id=${profile.user_id}`;
  };

  const handleDisconnect = () => {
    setGoogleSheetsConnected(false);
    alert("Disconnected (simulate backend token deletion)");
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900/40 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/20">
      <h2 className="text-xl font-semibold mb-4">Google Sheets</h2>
      <p className="mb-6">{googleSheetsConnected ? "Connected" : "Not connected"}</p>
      {googleSheetsConnected ? (
        <button
          onClick={handleDisconnect}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={handleConnect}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
        >
          Connect
        </button>
      )}
    </div>
  );
}
