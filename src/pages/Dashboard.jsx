import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

// Import individual components for nested routes
import Analytics from "./Analytics";
import Integrations from "./Integrations"; // This is the component we fixed
import Profile from "./Profile";
import Settings from "./Settings";
import Overview from "./Overview";
import Trends from "./Trends";
import Security from "./Security";

// --- Integration Wrapper Component ---
// This wrapper maps the 'profile' object received from AppWrapper 
// to the 'userId' prop expected by the Integrations component.
const IntegrationsWrapper = ({ profile, onLogout, refetchProfile }) => {
    // CRITICAL FIX: Extract user_id from profile and map it to the expected prop name
    const userId = profile?.user_id; 

    return (
        <Integrations 
            userId={userId} 
            onLogout={onLogout} // For 401 Unauthorized handling
            refetchProfile={refetchProfile} // For component refresh if needed
        />
    );
};
// -------------------------------------


// Dashboard Layout Component
export default function Dashboard({ profile, onLogout, refetchProfile }) { 
  const location = useLocation();
  const currentTab = location.pathname.split("/").pop(); 

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
Dashboard.Overview = Overview;
Dashboard.Analytics = Analytics;
Dashboard.Trends = Trends;
// FINAL FIX APPLIED HERE: Use the wrapper component
Dashboard.Integrations = IntegrationsWrapper; 
Dashboard.Security = Security;
Dashboard.Profile = Profile;
Dashboard.Settings = Settings;