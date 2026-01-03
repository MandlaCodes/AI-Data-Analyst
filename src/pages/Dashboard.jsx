import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FiMenu, FiX } from "react-icons/fi";

// Individual components for nested routes
import Analytics from "./Analytics";
import Integrations from "./Integrations"; 
import Profile from "./Profile";
import Overview from "./Overview";
import Trends from "./Trends";

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const customStyles = `
        /* FORCE TOTAL BLACKOUT & RESPONSIVE FIXES */
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #000000 !important; 
            overflow-x: hidden; 
            width: 100%;
            color: white;
        }

        .dashboard-container {
            position: relative;
            min-height: 100vh;
            width: 100%;
            background-color: #000000 !important; 
        }

        /* CUSTOM NEON SCROLLBAR */
        ::-webkit-scrollbar {
            width: 4px;
        }
        ::-webkit-scrollbar-track {
            background: #000000;
        }
        ::-webkit-scrollbar-thumb {
            background: #bc13fe;
            border-radius: 10px;
        }
    `;

    return (
        <div className="dashboard-container text-white font-sans">
            <style>{customStyles}</style>

            {/* --- MOBILE TOP NAVIGATION --- */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
                <h1 className="text-purple-400 text-xl font-black tracking-tighter uppercase">MetriaAI</h1>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-white bg-white/5 rounded-lg border border-white/10"
                >
                    {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
            </div>

            <div className="relative z-10 flex min-h-screen w-full">
                
                {/* --- SIDEBAR --- */}
                <aside className={`
                    w-64 fixed top-0 left-0 h-full z-[60] border-r border-white/5 bg-[#000000]
                    transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
                    lg:translate-x-0
                `}>
                    <Sidebar 
                        profile={profile} 
                        current={currentTab} 
                        onLogout={onLogout} 
                        closeMobileMenu={() => setIsSidebarOpen(false)} 
                    />
                </aside>

                {/* --- MOBILE OVERLAY --- */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* --- MAIN CONTENT AREA --- */}
                <main className="flex-1 lg:ml-64 min-h-screen flex flex-col min-w-0 relative z-20 bg-[#000000]"> 
                    
                    {/* Content Wrapper */}
                    <div className="w-full h-full flex-1 bg-[#000000] p-4 md:p-8 lg:p-10">
                        <div className="max-w-7xl mx-auto w-full">
                            <Outlet />
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="mt-auto p-10 text-center text-white/10 text-[10px] font-bold uppercase tracking-[0.6em] pointer-events-none">
                        &copy; 2026 Metria AI &bull; Encrypted Session
                    </footer>
                </main>
            </div>
        </div>
    );
}

// Sub-component assignments
Dashboard.Overview = Overview;
Dashboard.Analytics = Analytics;
Dashboard.Trends = Trends;
Dashboard.Integrations = IntegrationsWrapper; 
Dashboard.Profile = Profile;