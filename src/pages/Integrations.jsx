import React, { useEffect, useState } from "react";
import { CheckCircleIcon, XCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import axios from "axios";

const availableApps = [
  { name: "Google Sheets", key: "google_sheets", connected: false, lastSync: null },
  { name: "HubSpot", key: "hubspot", connected: false, lastSync: null },
  { name: "Salesforce", key: "salesforce", connected: false, lastSync: null },
  { name: "Slack", key: "slack", connected: false, lastSync: null },
  { name: "Mailchimp", key: "mailchimp", connected: false, lastSync: null },
];

export default function Integrations({ profile }) {
  const [apps, setApps] = useState(availableApps);
  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState(profile?.email || null);

  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  // --------------------------
  // Load connected apps
  // --------------------------
  const fetchConnectedApps = async (email) => {
    if (!email) return;
    try {
      const res = await axios.get(`${BACKEND}/connected-apps`, {
        params: { user_email: email },
      });
      const statuses = res.data;
      setApps((prev) =>
        prev.map((app) => ({
          ...app,
          connected: statuses[app.key] || false,
          lastSync: statuses[`${app.key}_last_sync`] || null,
        }))
      );
    } catch (err) {
      console.log("No connected apps yet");
    }
  };

  useEffect(() => {
    // Check if user_email is in URL query (after OAuth)
    const params = new URLSearchParams(window.location.search);
    const emailFromUrl = params.get("user_email");
    if (emailFromUrl) {
      setUserEmail(emailFromUrl);
      fetchConnectedApps(emailFromUrl);
      // Clean up URL
      window.history.replaceState({}, document.title, "/integrations");
    } else {
      fetchConnectedApps(userEmail);
    }

    // Listen for OAuth postMessage
    const handleMessage = (e) => {
      if (e.data === "oauth-success") {
        fetchConnectedApps(userEmail);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [userEmail]);

  // --------------------------
  // Connect / Disconnect
  // --------------------------
  const connectIntegration = (app) => {
    if (!userEmail) return alert("No user logged in");
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      `${BACKEND}/auth/${app.key}?user_email=${userEmail}`,
      "oauth",
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  const disconnect = async (appKey) => {
    if (!userEmail) return;
    await axios.post(`${BACKEND}/disconnect`, {
      user_email: userEmail,
      app: appKey,
    });
    setApps((prev) =>
      prev.map((app) =>
        app.key === appKey ? { ...app, connected: false, lastSync: null } : app
      )
    );
  };

  // --------------------------
  // Render
  // --------------------------
  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(search.toLowerCase())
  );
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
          <div
            key={app.key}
            className="p-6 bg-gray-800/70 border border-gray-700 rounded-3xl shadow-lg"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl text-white">{app.name}</h3>
              {app.connected ? (
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-400" />
              )}
            </div>

            <p
              className={`text-sm mb-3 ${
                app.connected ? "text-green-300" : "text-red-300"
              }`}
            >
              {app.connected ? "Connected" : "Not connected"}
            </p>

            {app.lastSync && (
              <p className="text-gray-400 text-xs mb-2">Last synced: {app.lastSync}</p>
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
