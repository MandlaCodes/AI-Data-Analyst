import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";

// Public logos
const appLogos = {
  "Google Sheets":
    "https://upload.wikimedia.org/wikipedia/commons/4/4f/Google_Sheets_icon_%282020%29.svg",
};

export default function Analytics() {
  const navigate = useNavigate();
  const [connectedApps, setConnectedApps] = useState([]);
  const [profile, setProfile] = useState(null);

  // Restore profile from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("adt_profile");
    if (saved) {
      setProfile(JSON.parse(saved));
    } else {
      navigate("/"); // fallback to landing if no profile
    }
  }, [navigate]);

  // Fetch connected apps
  useEffect(() => {
    if (!profile) return;

    const fetchConnectedApps = async () => {
      try {
        const res = await axios.get(
          `https://ai-data-analyst-backend-1nuw.onrender.com/connected-apps?user_id=${profile.user_id}`
        );
        const apps = [];
        if (res.data.google_sheets)
          apps.push({
            name: "Google Sheets",
            description:
              "Analyze your spreadsheets and generate actionable insights effortlessly.",
            path: "/google-sheets-analysis",
          });
        setConnectedApps(apps);
      } catch (err) {
        console.error(err);
      }
    };

    fetchConnectedApps();
  }, [profile]);

  // Navigate to selected app
  const handleUseApp = (app) => {
    navigate(app.path, { state: { profile } }); // pass profile via state
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("adt_profile");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-black via-gray-900 to-purple-900 text-white">
      {/* Sidebar */}
      <div className="w-64 fixed top-0 left-0 h-full z-20">
        <Sidebar profile={profile} current="analytics" onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-6 space-y-8 overflow-auto">
        {/* Page Header */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
            Analytics
          </h1>
          <p className="text-gray-300 text-lg">
            Select a connected app to analyze your business data and generate
            insights.
          </p>
        </div>

        {/* Connected Apps Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectedApps.map((app) => (
            <div
              key={app.name}
              className="bg-gray-900/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex flex-col justify-between shadow-xl hover:scale-105 hover:shadow-2xl transition-transform cursor-pointer"
              onClick={() => handleUseApp(app)}
            >
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={appLogos[app.name]}
                  alt={app.name}
                  className="w-12 h-12"
                />
                <h2 className="text-xl md:text-2xl font-semibold text-white">
                  {app.name}
                </h2>
              </div>
              <p className="text-gray-300 mb-6">{app.description}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent double navigation
                  handleUseApp(app);
                }}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all"
              >
                Use {app.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
