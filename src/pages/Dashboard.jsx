// Dashboard Layout Component (Dashboard.jsx)
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

// Import individual components for nested routes
import Analytics from "./Analytics";
import Integrations from "./Integrations"; 
import Profile from "./Profile";
import Settings from "./Settings";
import Overview from "./Overview";
import Trends from "./Trends";
import Security from "./Security";

// --- Integration Wrapper Component ---
const IntegrationsWrapper = ({ profile, onLogout, refetchProfile }) => {
    // 💡 FIX: Use profile.id, as that is the standard backend ID we stored in Login.jsx
    const userId = profile?.id; 

    return (
        <Integrations 
            userId={userId} 
            onLogout={onLogout} 
            refetchProfile={refetchProfile}
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
            {/* Sidebar: Fixed, w-64 */}
            <div className="w-64 fixed top-0 left-0 h-full z-20">
                {/* 💡 Note: Sidebar receives the user profile */}
                <Sidebar profile={profile} current={currentTab} onLogout={onLogout} />
            </div>

            {/* Main content: Only ml-64 to clear the sidebar. NO vertical padding. */}
            <div className="flex-1 ml-64 overflow-y-auto"> 
                {/* 💡 Outlet renders the nested route (Analytics, Settings, etc.) */}
                <Outlet />
            </div>
        </div>
    );
}

// Attach components for nested routes
Dashboard.Overview = Overview;
Dashboard.Analytics = Analytics;
Dashboard.Trends = Trends;
// 💡 IMPORTANT: Integrations uses the Wrapper component to pass the correct userId
Dashboard.Integrations = IntegrationsWrapper; 
Dashboard.Security = Security;
Dashboard.Profile = Profile;
Dashboard.Settings = Settings;