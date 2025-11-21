import { useEffect, useState } from "react";

export default function Integrations() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/google/status")
      .then(res => res.json())
      .then(data => {
        setGoogleConnected(data.connected || false);
        setLastSynced(data.last_synced || null);
      })
      .catch(() => {});
  }, []);

  const connectGoogle = () => {
    window.location.href = "http://localhost:8000/google/auth";
  };

  const disconnectGoogle = () => {
    fetch("http://localhost:8000/google/disconnect", { method: "POST" })
      .then(() => {
        setGoogleConnected(false);
        setLastSynced(null);
      });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Integrations</h1>

      <div className="p-5 border rounded-xl bg-white">
        <h2 className="font-semibold text-lg">Google Sheets</h2>

        {googleConnected ? (
          <>
            <p className="text-green-600 font-semibold">Connected</p>
            {lastSynced && (
              <p className="text-gray-500 text-sm">Last synced: {lastSynced}</p>
            )}
            <button
              className="mt-3 bg-red-500 text-white px-4 py-2 rounded-lg"
              onClick={disconnectGoogle}
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-600">Not connected</p>
            <button
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg"
              onClick={connectGoogle}
            >
              Connect Google Sheets
            </button>
          </>
        )}
      </div>
    </div>
  );
}
