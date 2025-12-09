// src/pages/Integrations.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const API = "https://ai-data-analyst-backend-1nuw.onrender.com";

// ... (integrationsList remains the same) ...

export default function Integrations({ profile }) {
  const [connections, setConnections] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);

  // Helper function to handle a 401 error
  const handleUnauthorized = () => {
    console.error("401 Unauthorized: Clearing token and forcing re-login.");
    // 1. Clear the bad token
    localStorage.removeItem("adt_token");
    localStorage.removeItem("adt_profile");
    // 2. Set a visible error message
    setStatusMessage({
      text: "Your session has expired. Please log in again.",
      type: "error",
    });
    // NOTE: A proper router (e.g., react-router) would have a call here to navigate to '/login'.
    // Since we don't see the router, clearing the profile/token should cause the parent
    // component to redirect the user back to the Login page.
    window.location.reload(); // Force a full page refresh which should route to Login
  };


  useEffect(() => {
    if (!profile?.user_id) return;

    const token = localStorage.getItem("adt_token");
    if (!token) {
      // If profile exists but token doesn't, force cleanup/re-login
      handleUnauthorized();
      return; 
    }

    // --- LOGIC TO CHECK URL FOR REDIRECT STATUS (Stays the same) ---
    const urlParams = new URLSearchParams(window.location.search);
    const isConnectedRedirect = urlParams.get('connected') === 'true';
    const integrationType = urlParams.get('type');

    if (isConnectedRedirect && integrationType) {
        let currentProfile = JSON.parse(localStorage.getItem("adt_profile") || "{}");
        if (integrationType === 'google_sheets') {
            currentProfile.google_sheets_connected = true; 
        }
        localStorage.setItem("adt_profile", JSON.stringify(currentProfile));
        
        setStatusMessage({ 
            text: `${integrationType.toUpperCase()} is now successfully connected!`, 
            type: 'success' 
        });

        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
    // --- END REDIRECT LOGIC ---

    // Function to fetch connection status from the backend
    const fetchConnected = async () => {
      try {
        const res = await axios.get(
          `${API}/connected-apps?user_id=${profile.user_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const backendData = res.data || {};
        const normalized = {};
        
        integrationsList.forEach((i) => {
            normalized[i.key] = backendData[i.key] === true;
        });
        
        const localProfile = JSON.parse(localStorage.getItem("adt_profile") || "{}");
        if (localProfile.google_sheets_connected) {
            normalized.google_sheets = true;
        }

        setConnections(normalized);
      
      } catch (err) {
          // --- ROBUST 401 ERROR HANDLING ---
          if (err.response && err.response.status === 401) {
              handleUnauthorized();
              return; // Stop execution after initiating unauthorized flow
          }
          
          let errorDetail = "An unknown network error occurred.";
          if (err.response) {
              errorDetail = `Server Error ${err.response.status}: ${JSON.stringify(err.response.data || err.response.statusText)}`;
          } else if (err.request) {
              errorDetail = "No response received from the server (Server Down/Network Issue).";
          } else {
              errorDetail = err.message;
          }

          console.error("Failed to load connected apps:", errorDetail);
      }
    };

    fetchConnected();

    if (isConnectedRedirect) {
        const timer = setTimeout(() => setStatusMessage(null), 5000);
        return () => clearTimeout(timer);
    }
    
  }, [profile?.user_id]); 


  const handleConnect = (integration) => {
    // ... (rest of handleConnect stays the same)
    if (!integration.connectUrl) {
      setStatusMessage({ text: `Please upload your ${integration.name} file manually in the Analytics tab.`, type: 'info' });
      return;
    }
    window.location.href = `${API}/${integration.connectUrl}?user_id=${profile.user_id}`;
  };

  const handleDisconnect = (key) => {
    // ... (rest of handleDisconnect stays the same)
    setConnections((prev) => ({ ...prev, [key]: false }));
    
    if (key === 'google_sheets') {
        let currentProfile = JSON.parse(localStorage.getItem("adt_profile") || "{}");
        currentProfile.google_sheets_connected = false; 
        localStorage.setItem("adt_profile", JSON.stringify(currentProfile));
    }
    
    setStatusMessage({ text: `Successfully disconnected ${integrationsList.find(i => i.key === key).name}.`, type: 'error' });
  };

  const connectedApps = integrationsList.filter(
    (integration) => connections[integration.key]
  );

  const disconnectedApps = integrationsList.filter(
    (integration) => !connections[integration.key]
  );
  
  const getStatusColor = (type) => {
      if (type === 'success') return 'bg-green-600';
      if (type === 'error') return 'bg-red-600';
      return 'bg-blue-600';
  }


  const renderCard = (integration, isConnected, index) => (
    // ... (renderCard stays the same) ...
    <motion.div
        key={integration.key}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="flex flex-col justify-between p-6 rounded-3xl backdrop-blur-md border border-gray-700 shadow-lg relative transition-transform duration-300 transform hover:-translate-y-2 hover:scale-[1.02] hover:shadow-purple-500/40 bg-gradient-to-br from-black/30 to-black/60"
    >
        {/* ... (card content remains the same) ... */}
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
                            : "bg-red-400 shadow-md shadow-red-400/50"
                    }`}
                ></div>
            </div>
            <p className="text-gray-300 text-sm">{integration.description}</p>
            <p className="font-medium text-gray-200">
                {isConnected ? "Status: Connected" : "Status: Disconnected"}
            </p>
        </div>

        <div className="mt-4 relative z-10">
            {integration.connectUrl === null ? (
                <button
                    disabled
                    className="w-full py-3 px-6 rounded-xl font-semibold text-gray-500 bg-gray-800 border border-gray-700 cursor-not-allowed"
                >
                    Manual Upload Required
                </button>
            ) : isConnected ? (
                <button
                    onClick={() => handleDisconnect(integration.key)}
                    className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-300 transform hover:scale-[1.01] relative overflow-hidden"
                >
                    Disconnect
                </button>
            ) : (
                <button
                    onClick={() => handleConnect(integration)}
                    className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-[1.01] relative overflow-hidden"
                >
                    Connect
                </button>
            )}
        </div>
    </motion.div>
  );

  return (
    <div className="w-full h-full flex flex-col gap-12">
      <h1 className="text-4xl font-bold text-purple-300 mb-6">
        Data Integrations
      </h1>
      
      {/* Global Status Message */}
      {statusMessage && (
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-xl text-white font-semibold shadow-xl w-full max-w-6xl ${getStatusColor(statusMessage.type)}`}
          >
              {statusMessage.text}
          </motion.div>
      )}

      <div className="flex-1 flex flex-col gap-12 overflow-y-auto pb-8">
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
            <h2 className="text-2xl font-semibold text-gray-400 mb-4 tracking-wide">
              Available Integrations
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