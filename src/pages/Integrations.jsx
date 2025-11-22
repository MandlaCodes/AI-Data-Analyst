import React, { useState, useEffect } from "react";

export default function Integrations() {
  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  const [connected, setConnected] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // Fetch connection status only
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`${BACKEND}/google/status?user_id=123`);
        const data = await res.json();
        setConnected(data.connected);
        setLastSynced(data.last_synced);
      } catch (err) {
        console.error("Failed to load connection status:", err);
      }
    }
    fetchStatus();
  }, []);

  // Redirect to Google OAuth on backend (PRODUCTION)
  const connectGoogle = () => {
    window.location.href = `${BACKEND}/google/auth?user_id=123`;
  };

  const disconnectGoogle = async () => {
    try {
      await fetch(`${BACKEND}/google/disconnect?user_id=123`, {
        method: "POST",
      });
      setConnected(false);
      setLastSynced(null);
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Integrations</h1>

      <div className="rounded-lg border p-6 shadow-sm bg-white dark:bg-neutral-900">
        <h2 className="text-xl font-semibold mb-2">Google Sheets</h2>

        {connected ? (
          <>
            <p className="text-green-500 font-medium">Connected</p>

            {lastSynced && (
              <p className="text-sm text-neutral-500">
                Last synced: {lastSynced}
              </p>
            )}

            <button
              onClick={disconnectGoogle}
              className="mt-4 px-4 py-2 rounded bg-red-600 text-white"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <p className="text-neutral-500">Not Connected</p>
            <button
              onClick={connectGoogle}
              className="mt-4 px-4 py-2 rounded bg-blue-600 text-white"
            >
              Connect Google Sheets
            </button>
          </>
        )}
      </div>
    </div>
  );
}
