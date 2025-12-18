import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

// Individual components for nested routes
import Analytics from "./Analytics";
import Integrations from "./Integrations"; 
import Profile from "./Profile";
import Settings from "./Settings";
import Overview from "./Overview";
import Trends from "./Trends";
import Security from "./Security";

// Constant for the video
const BACKGROUND_VIDEO_URL = "/3163534-uhd_3840_2160_30fps.mp4"; 

// --- Integration Wrapper Component ---
const IntegrationsWrapper = ({ profile, onLogout, refetchProfile }) => {
    const userId = profile?.id; 
    return (
        <Integrations 
            userId={userId} 
            onLogout={onLogout} 
            refetchProfile={refetchProfile}
        />
    );
};

export default function Dashboard({ profile, onLogout, refetchProfile }) { 
    const location = useLocation();
    const currentTab = location.pathname.split("/").pop(); 

    const customStyles = `
        /* KILL ALL WHITE SPACE */
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #0a0118; /* Fallback */
            overflow-x: hidden;
        }

        .dashboard-container {
            position: relative;
            min-height: 100vh;
            width: 100vw;
            background: transparent;
        }

        .video-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            z-index: -1;
        }

        .video-background video {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            min-width: 100%;
            min-height: 100%;
            object-fit: cover;
        }

        /* Optional: Add a very light tint so text remains readable over the video */
        .video-overlay {
            position: fixed;
            inset: 0;
            background: rgba(10, 1, 24, 0.4); 
            z-index: 0;
        }
    `;

    return (
        <div className="dashboard-container text-white">
            <style>{customStyles}</style>

            {/* Background Video Layer */}
            <div className="video-background">
                <video src={BACKGROUND_VIDEO_URL} autoPlay loop muted playsInline />
                <div className="video-overlay" />
            </div>

            <div className="relative z-10 flex min-h-screen">
                {/* Sidebar: w-64 */}
                <div className="w-64 fixed top-0 left-0 h-full z-20">
                    <Sidebar profile={profile} current={currentTab} onLogout={onLogout} />
                </div>

                {/* Main content: ml-64 to clear sidebar, transparent background */}
                <main className="flex-1 ml-64 min-h-screen bg-transparent"> 
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

// Attach components for nested routes
Dashboard.Overview = Overview;
Dashboard.Analytics = Analytics;
Dashboard.Trends = Trends;
Dashboard.Integrations = IntegrationsWrapper; 
Dashboard.Security = Security;
Dashboard.Profile = Profile;
Dashboard.Settings = Settings;