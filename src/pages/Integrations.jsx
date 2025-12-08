import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
// Added useNavigate for programmatic navigation (though not strictly needed here, it's good practice)
import { useNavigate } from "react-router-dom"; 

const integrationsList = [
  {
    key: "google_sheets",
    name: "Google Sheets",
    description:
      "Sync your business data to allow the AI Analyst to generate insights and charts automatically.",
    connectUrl: "auth/google_sheets",
    isOAuth: true,
  },
  {
    key: "excel",
    name: "Excel / OneDrive",
    description:
      "Upload or sync your Excel files from OneDrive to feed your AI Analyst with your spreadsheet data.",
    connectUrl: null,
    isOAuth: false,
  },
  {
    key: "hubspot",
    name: "HubSpot",
    description:
      "Connect HubSpot to track marketing, sales, and CRM metrics automatically.",
    connectUrl: "auth/hubspot",
    isOAuth: true,
  },
  {
    key: "stripe",
    name: "Stripe",
    description:
      "Connect your Stripe account to track revenue and payment metrics in real-time.",
    connectUrl: "auth/stripe",
    isOAuth: true,
  },
  {
    key: "airtable",
    name: "Airtable",
    description:
      "Connect your Airtable bases to integrate structured data directly into your AI Analyst.",
    connectUrl: "auth/airtable",
    isOAuth: true,
  },
  {
    key: "other",
    name: "Other",
    description:
      "Upload CSV or JSON files from any other source to feed custom data to your AI Analyst.",
    connectUrl: null,
    isOAuth: false,
  },
];

const BACKEND_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

// Custom Modal Component to replace alert() (Keep this as is)
const MessageModal = ({ show, title, message, onConfirm, onCancel, confirmText, isConnectFlow }) => {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="w-full max-w-md rounded-2xl bg-gray-800 p-6 shadow-2xl border border-purple-600/50"
            >
              <h3 className="text-2xl font-bold text-white mb-3 border-b border-gray-700 pb-2">
                {title}
              </h3>
              <p className="text-gray-300 mb-6">{message}</p>
              <div className="flex justify-end space-x-4">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded-xl text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    {isConnectFlow ? "Cancel" : "Close"}
                  </button>
                )}
                {onConfirm && (
                  <button
                    onClick={onConfirm}
                    className="px-4 py-2 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/50"
                  >
                    {confirmText || "Confirm"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
};


export default function Integrations({ profile }) {
    const navigate = useNavigate(); // Initialize useNavigate
    const [connections, setConnections] = useState({});
    const [modalState, setModalState] = useState({
        show: false,
        title: "",
        message: "",
        onConfirm: null,
        onCancel: () => setModalState({ ...modalState, show: false }),
        confirmText: "Confirm",
        isConnectFlow: false,
    });

    // CRITICAL: Get URL parameters once on load
    const [searchParams] = useState(new URLSearchParams(window.location.search));
    const connectedStatus = searchParams.get("connected"); // "true" or null
    const connectedType = searchParams.get("type");       // "google_sheets" or null

    const fetchConnected = useCallback(async () => {
        // Use Authorization header for authenticated requests
        const token = localStorage.getItem("adt_token"); 
        if (!profile || !token) return;

        try {
            const res = await axios.get(
                `${BACKEND_BASE_URL}/connected-apps`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setConnections(res.data);
        } catch (err) {
            console.error("Failed to fetch connected apps:", err);
        }
    }, [profile]);

    useEffect(() => {
        // 1. Check if we just returned from a successful OAuth flow
        if (connectedStatus === "true" && connectedType === "google_sheets") {
            // Show success message
            setModalState({
                show: true,
                title: "Google Sheets Connected!",
                message: "Your data is now securely linked and ready for AI analysis. You can start using it in the Analytics tab.",
                onConfirm: () => setModalState({ ...modalState, show: false }),
                onCancel: null,
                confirmText: "Continue",
                isConnectFlow: false,
            });

            // CRITICAL: Clean the URL parameters to prevent this block from running again
            // and keep the user on the current /dashboard/integrations page.
            window.history.replaceState({}, document.title, window.location.pathname); 
        }

        // 2. Always fetch the connection status on load or after a successful redirect
        fetchConnected();
    }, [fetchConnected, connectedStatus, connectedType]); // Depend on parameters and fetchConnected

    const handleConnect = (integration) => {
        if (!profile) {
            // ... (keep profile check logic as is) ...
            setModalState({
              show: true,
              title: "Profile Required",
              message: "Please ensure your user profile is loaded before attempting to connect an integration.",
              onConfirm: null,
              onCancel: () => setModalState({ ...modalState, show: false }),
              confirmText: "OK",
              isConnectFlow: false,
            });
            return;
        }

        if (!integration.connectUrl) {
            // ... (keep manual data source check logic as is) ...
            setModalState({
              show: true,
              title: "Manual Data Source",
              message:
                "This integration requires manual file upload (CSV, JSON, or Excel). Please use the 'Upload Data' feature on the dashboard.",
              onConfirm: null,
              onCancel: () => setModalState({ ...modalState, show: false }),
              confirmText: "Got it",
              isConnectFlow: false,
            });
            return;
        }

        // For OAuth Integrations
        const confirmRedirection = () => {
            // Actual redirection happens here after confirmation
            // We pass the user_id via URL parameter, which the backend reads and includes 
            // in the state parameter for the final Google OAuth URL.
            window.location.href = `${BACKEND_BASE_URL}/${integration.connectUrl}?user_id=${profile.user_id}`;
        };

        setModalState({
            show: true,
            title: `Connect to ${integration.name}`,
            message: `You will be redirected to ${integration.name}'s secure website to authorize this connection. This may require you to sign in to your ${integration.name} account to grant permission. You are NOT logging into the AI Analyst application again.`,
            onConfirm: confirmRedirection,
            onCancel: () => setModalState({ ...modalState, show: false }),
            confirmText: "Proceed to Connect",
            isConnectFlow: true,
        });
    };

    const handleDisconnect = (key) => {
        // Disconnect logic (Simulation for now, until backend delete endpoint is implemented)
        setConnections((prev) => ({ ...prev, [key]: false }));
        setModalState({
            show: true,
            title: "Disconnected",
            message: `Disconnected ${integrationsList.find(i => i.key === key).name}. (Simulated backend token deletion)`,
            onConfirm: null,
            onCancel: () => setModalState({ ...modalState, show: false }),
            confirmText: "Close",
            isConnectFlow: false,
        });
    };

    const connectedApps = integrationsList.filter(
        (integration) => connections[integration.key]
    );
    const disconnectedApps = integrationsList.filter(
        (integration) => !connections[integration.key]
    );

    // ... (rest of renderCard and the main return JSX remains the same) ...
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

            <MessageModal {...modalState} />
        </div>
    );
}