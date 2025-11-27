// src/pages/Integrations.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const integrationsList = [
  {
    key: "google_sheets",
    name: "Google Sheets",
    description:
      "Sync your business data to allow the AI Analyst to generate insights and charts automatically.",
    connectUrl: "auth/google_sheets",
  },
  {
    key: "excel",
    name: "Excel / OneDrive",
    description:
      "Upload or sync your Excel files from OneDrive to feed your AI Analyst with your spreadsheet data.",
    connectUrl: null,
  },
  {
    key: "hubspot",
    name: "HubSpot",
    description:
      "Connect HubSpot to track marketing, sales, and CRM metrics automatically.",
    connectUrl: "auth/hubspot",
  },
  {
    key: "stripe",
    name: "Stripe",
    description:
      "Connect your Stripe account to track revenue and payment metrics in real-time.",
    connectUrl: "auth/stripe",
  },
  {
    key: "airtable",
    name: "Airtable",
    description:
      "Connect your Airtable bases to integrate structured data directly into your AI Analyst.",
    connectUrl: "auth/airtable",
  },
  {
    key: "other",
    name: "Other",
    description:
      "Upload CSV or JSON files from any other source to feed custom data to your AI Analyst.",
    connectUrl: null,
  },
];

export default function Integrations({ profile }) {
  const [connections, setConnections] = useState({});

  useEffect(() => {
    if (!profile) return;

    const fetchConnected = async () => {
      try {
        const res = await axios.get(
          `https://ai-data-analyst-backend-1nuw.onrender.com/connected-apps?user_id=${profile.user_id}`
        );
        setConnections(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchConnected();
  }, [profile]);

  const handleConnect = (integration) => {
    if (!integration.connectUrl)
      return alert("Upload or manually connect this data source here.");
    window.location.href = `https://ai-data-analyst-backend-1nuw.onrender.com/${integration.connectUrl}?user_id=${profile.user_id}`;
  };

  const handleDisconnect = (key) => {
    setConnections((prev) => ({ ...prev, [key]: false }));
    alert(`Disconnected ${key} (simulate backend token deletion)`);
  };

  const connectedApps = integrationsList.filter(
    (integration) => connections[integration.key]
  );
  const disconnectedApps = integrationsList.filter(
    (integration) => !connections[integration.key]
  );

  const renderCard = (integration, isConnected, index) => (
    <motion.div
      key={integration.key}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`flex flex-col justify-between p-6 rounded-3xl backdrop-blur-md border border-gray-700 shadow-lg relative transition-transform duration-300 transform hover:-translate-y-2 hover:scale-[1.02] hover:shadow-purple-500/40 bg-gradient-to-br from-black/30 to-black/60`}
    >
      {/* Inner Glow on hover */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 opacity-0 transition-opacity duration-500 hover:opacity-40"></div>

      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-purple-300">
            {integration.name}
          </h2>
          <div
            className={`w-4 h-4 rounded-full ${
              isConnected
                ? "bg-green-400 shadow-md shadow-green-400/50 animate-pulse"
                : "bg-red-400 shadow-md shadow-red-400/50 animate-pulse"
            }`}
          ></div>
        </div>
        <p className="text-gray-300 text-sm">{integration.description}</p>
        <p className="font-medium text-gray-200">
          {isConnected ? "Connected" : "Not Connected"}
        </p>
      </div>

      <div className="mt-4 relative z-10">
        {isConnected ? (
          <button
            onClick={() => handleDisconnect(integration.key)}
            className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-500 transform hover:-translate-y-1 hover:scale-105 relative overflow-hidden"
          >
            Disconnect
            <span className="absolute inset-0 bg-white/10 animate-pulse opacity-0 hover:opacity-30 rounded-xl pointer-events-none"></span>
          </button>
        ) : (
          <button
            onClick={() => handleConnect(integration)}
            className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-500 transform hover:-translate-y-1 hover:scale-105 relative overflow-hidden"
          >
            Connect
            <span className="absolute inset-0 bg-white/10 animate-pulse opacity-0 hover:opacity-30 rounded-xl pointer-events-none"></span>
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="w-full h-full flex flex-col gap-12 overflow-hidden">
      <h1 className="text-4xl font-bold text-purple-300 mb-6">
        Data Integrations
      </h1>

      <div className="flex-1 flex flex-col gap-12 overflow-hidden">
        {connectedApps.length > 0 && (
          <div className="w-full max-w-6xl">
            <h2 className="text-2xl font-semibold text-green-400 mb-4 tracking-wide">
              Connected Apps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectedApps.map((integration, i) =>
                renderCard(integration, true, i)
              )}
            </div>
          </div>
        )}

        {disconnectedApps.length > 0 && (
          <div className="w-full max-w-6xl">
            <h2 className="text-2xl font-semibold text-red-400 mb-4 tracking-wide">
              Disconnected Apps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {disconnectedApps.map((integration, i) =>
                renderCard(integration, false, i)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
