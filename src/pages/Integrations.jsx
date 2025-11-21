import React, { useEffect, useState } from "react";
import { CheckCircleIcon, XCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useLocation } from "react-router-dom";

const availableApps = [
  { name: "Google Sheets", key: "google_sheets", connected: false, lastSync: null, sheets: [] },
  { name: "HubSpot", key: "hubspot", connected: false, lastSync: null },
  { name: "Salesforce", key: "salesforce", connected: false, lastSync: null },
  { name: "Slack", key: "slack", connected: false, lastSync: null },
  { name: "Mailchimp", key: "mailchimp", connected: false, lastSync: null },
];

export default function Integrations() {
  const location = useLocation();
  const [apps, setApps] = useState(availableApps);
  const [search, setSearch] = useState("");

  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  // Get userId from query params
  const searchParams = new URLSearchParams(location.search);
  const userId = searchParams.get("user_id") || "123";

  // Fetch connected apps and optionally sheets
  const fetchConnectedApps = async () => {
    try {
      const res = await axios.get(`${BACKEND}/connected-apps?user_id=${userId}`);
      const statuses = res.data; // e.g., { google_sheets: true, google_sheets_last_sync: "..." }

      setApps((prev) =>
        prev.map((app) => ({
          ...app,
          connected: statuses[app.key] || false,
          lastSync: statuses[`${app.key}_last_sync`] || null,
        }))
      );

      // If Google Sheets connected, fetch sheets immediately
      if (statuses.google_sheets) {
        fetchSheets();
      }
    } catch (err) {
      console.log("No connected apps yet");
    }
  };

  // Fetch actual Google Sheets list
  const fetchSheets = async () => {
    try {
      const res = await axios.get(`${BACKEND}/sheets-list/${userId}`);
      setApps((prev) =>
        prev.map((app) =>
          app.key === "google_sheets"
            ? { ...app, sheets: res.data.spreadsheets || [] }
            : app
        )
      );
    } catch (err) {
      console.log("Error fetching sheets:", err);
    }
  };

  // Load apps on mount
  useEffect(() => {
    fetchConnectedApps();
  }, []);

  // Handle OAuth return from Google
  useEffect(() => {
    const justConnected = searchParams.get("connected") === "true";
    const appType = searchParams.get("type");

    if (justConnected && appType) {
      fetchConnectedApps();
      // Clean URL so query params don't persist
      window.history.replaceState({}, document.title, "/dashboard/integrations");
    }
  }, [location.search]);

  // Start OAuth flow
  const connectIntegration = (app) => {
    window.location.href = `${BACKEND}/auth/${app.key}?user_id=${userId}`;
  };

  // Disconnect
  const disconnect = async (appKey) => {
    await axios.post(`${BACKEND}/disconnect`, { user_id: userId, app: appKey });
    setApps((prev) =>
      prev.map((app) =>
        app.key === appKey ? { ...app, connected: false, lastSync: null, sheets: [] } : app
      )
    );
  };

  const filteredApps = apps.filter((app) => app.name.toLowerCase().includes(search.toLowerCase()));
  const connectedCount = apps.filter((app) => app.connected).length;

  return (
    <div className="space-y-10">
      <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500">
        Integrations
      </h2>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-gray-900/70 p-4 rounded-2xl border border-gray-700">
          <CheckCircleIcon className="w-6 h-6 text-green-400" />
          <span>{connectedCount} Connected</span>
        </div>

        <div className="flex items-center gap-2 bg-gray-900/70 p-4 rounded-2xl border border-gray-700">
          <XCircleIcon className="w-6 h-6 text-red-400" />
          <span>{apps.length - connectedCount} Not Connected</span>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search integrations..."
        className="w-full md:w-1/3 p-3 rounded-xl bg-gray-800 border border-gray-700 text-white"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map((app) => (
          <div key={app.key} className="p-6 bg-gray-800/70 border border-gray-700 rounded-3xl shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl text-white">{app.name}</h3>
              {app.connected ? (
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-400" />
              )}
            </div>

            <p className={`text-sm mb-3 ${app.connected ? "text-green-300" : "text-red-300"}`}>
              {app.connected ? "Connected" : "Not connected"}
            </p>

            {app.lastSync && <p className="text-gray-400 text-xs mb-2">Last synced: {app.lastSync}</p>}

            {/* Show actual Google Sheets if connected */}
            {app.key === "google_sheets" && app.connected && app.sheets.length > 0 && (
              <ul className="mb-2 text-sm text-white/80">
                {app.sheets.map((sheet) => (
                  <li key={sheet.id} className="border-b border-gray-700 py-1">{sheet.name}</li>
                ))}
              </ul>
            )}

            {!app.connected ? (
              <button
                onClick={() => connectIntegration(app)}
                className="w-full py-2 mt-2 bg-indigo-600 rounded-xl text-white flex items-center justify-center gap-2"
              >
                Connect <PlusCircleIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => disconnect(app.key)}
                className="w-full py-2 mt-2 bg-red-600 rounded-xl text-white"
              >
                Disconnect
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
