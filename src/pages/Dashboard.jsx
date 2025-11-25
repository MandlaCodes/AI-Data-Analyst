import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

// Import individual components
import ChatPanel from "../components/ChatPanel";
import Analytics from "./Analytics";
import Integrations from "./Integrations";
import Profile from "./Profile";
import Settings from "./Settings";

export default function Dashboard({ profile, onLogout }) {
  const location = useLocation();
  const currentTab = location.pathname.split("/").pop(); // last segment

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-black via-gray-900 to-purple-900 text-white">
      {/* Sidebar */}
      <div className="w-64 fixed top-0 left-0 h-full z-20">
        <Sidebar profile={profile} current={currentTab} onLogout={onLogout} />
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64 p-6 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

// Attach components for nested routes
Dashboard.Chat = ChatPanel;
Dashboard.Analytics = Analytics;
Dashboard.Integrations = Integrations;
Dashboard.Profile = Profile;
Dashboard.Settings = Settings;
