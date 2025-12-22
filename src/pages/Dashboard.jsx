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

const BACKGROUND_VIDEO_URL = "/3163534-uhd_3840_2160_30fps.mp4"; 

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
        /* RESET & BASE */
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #0a0118;
            overflow-x: hidden; /* Prevent horizontal scroll at the root */
            width: 100%;
        }

        .dashboard-container {
            position: relative;
            min-height: 100vh;
            width: 100%;
            overflow: hidden; /* Critical for containing chart expansion */
        }

        /* BACKGROUND VIDEO HANDLING */
        .video-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
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

        .video-overlay {
            position: fixed;
            inset: 0;
            background: linear-gradient(
                to bottom right, 
                rgba(10, 1, 24, 0.6), 
                rgba(20, 5, 40, 0.4)
            ); 
            z-index: 0;
        }

        /* CUSTOM SCROLLBAR FOR DASHBOARD (Dark Theme) */
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(167, 139, 240, 0.3);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(167, 139, 240, 0.5);
        }
    `;

    return (
        <div className="dashboard-container text-white">
            <style>{customStyles}</style>

            {/* Background Video Layer */}
            <div className="video-background">
                <video 
                    src={BACKGROUND_VIDEO_URL} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    poster="/video-fallback-bg.jpg" // Good practice for slow loads
                />
                <div className="video-overlay" />
            </div>

            <div className="relative z-10 flex min-h-screen w-full">
                {/* Sidebar: Fixed width 
                   Note: On mobile, you might want to hide this or make it a drawer 
                */}
                <aside className="w-64 fixed top-0 left-0 h-full z-20 border-r border-white/5 bg-black/20 backdrop-blur-md">
                    <Sidebar profile={profile} current={currentTab} onLogout={onLogout} />
                </aside>

                {/* MAIN CONTENT AREA 
                   ml-64: Pushes content past the fixed sidebar
                   min-w-0: CRITICAL - Allows flex items to shrink below their 'natural' size
                   max-w-full: Keeps the container within the viewport
                   overflow-x-hidden: Safety net for chart rendering issues
                */}
                <main className="flex-1 ml-64 min-h-screen bg-transparent flex flex-col min-w-0 max-w-full overflow-x-hidden"> 
                    
                    {/* Inner wrapper for padding and layout spacing */}
                    <div className="w-full px-6 py-8 md:px-10">
                        {/* Outlet renders the child components (Analytics, Overview, etc.)
                            The children should now stay within bounds.
                        */}
                        <Outlet />
                    </div>

                    {/* Optional Footer */}
                    <footer className="mt-auto p-6 text-center text-gray-500 text-xs">
                        &copy; 2025 AI Data Analyst. All rights reserved.
                    </footer>
                </main>
            </div>
        </div>
    );
}

// Attach components for nested routes (for routing reference)
Dashboard.Overview = Overview;
Dashboard.Analytics = Analytics;
Dashboard.Trends = Trends;
Dashboard.Integrations = IntegrationsWrapper; 
Dashboard.Security = Security;
Dashboard.Profile = Profile;
Dashboard.Settings = Settings;