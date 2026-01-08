import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FiMenu, FiX, FiCheckCircle, FiLoader } from "react-icons/fi";

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
    const navigate = useNavigate();
    const currentTab = location.pathname.split("/").pop(); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // --- SUCCESS SEQUENCE STATE ---
    const [activationStage, setActivationStage] = useState(null); // null, 'success', 'preparing'
    const [isVisible, setIsVisible] = useState(false); // For fluid fade transitions

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("payment") === "success") {
            handleSuccessSequence();
        }
    }, [location.search]);

    const handleSuccessSequence = async () => {
        // Initial fade in
        setActivationStage('success');
        setTimeout(() => setIsVisible(true), 10);
        
        // 1. Payment Success Message Duration
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // 2. Transition to "Preparing" (Fade out/in)
        setIsVisible(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        setActivationStage('preparing');
        setIsVisible(true);
        
        // 3. --- CRITICAL BACKGROUND SYNC ---
        // We force a direct fetch from the backend to ensure the 'is_active' status is captured
        const savedToken = localStorage.getItem("adt_token");
        if (savedToken) {
            try {
                const response = await fetch("https://ai-data-analyst-backend-1nuw.onrender.com/api/auth/me", {
                    headers: { "Authorization": `Bearer ${savedToken}` }
                });
                
                if (response.ok) {
                    const updatedUser = await response.json();
                    // Update LocalStorage immediately
                    localStorage.setItem("adt_profile", JSON.stringify(updatedUser));
                    // Trigger the refetch in App.js to sync the global state
                    if (refetchProfile) await refetchProfile();
                }
            } catch (err) {
                console.error("Dashboard sync failed:", err);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 4. Final Fade Out and reveal Dashboard
        setIsVisible(false);
        await new Promise(resolve => setTimeout(resolve, 600));
        setActivationStage(null);
        
        // Navigate to overview with the fresh 'active' state
        navigate("/dashboard/overview", { replace: true });
    };

    const customStyles = `
        /* FORCE TOTAL BLACKOUT */
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

        /* ACTIVATION OVERLAY */
        .activation-overlay {
            position: fixed;
            inset: 0;
            background: #000000;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: opacity 0.6s ease-in-out, transform 0.6s ease-in-out;
            opacity: 0;
            pointer-events: none;
        }
        .activation-overlay.visible {
            opacity: 1;
            pointer-events: auto;
        }

        .neon-text {
            text-shadow: 0 0 10px #bc13fe, 0 0 20px #bc13fe, 0 0 40px #bc13fe;
        }

        .spinner-custom {
            animation: spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* CUSTOM NEON SCROLLBAR */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #000000; }
        ::-webkit-scrollbar-thumb {
            background: #bc13fe;
            border-radius: 10px;
        }
    `;

    return (
        <div className="dashboard-container text-white font-sans">
            <style>{customStyles}</style>

            {/* --- ACTIVATION OVERLAY (Smooth Transitions) --- */}
            {activationStage && (
                <div className={`activation-overlay ${isVisible ? 'visible' : ''}`}>
                    <div className={`transition-all duration-700 transform ${isVisible ? 'scale-100' : 'scale-90'}`}>
                        {activationStage === 'success' ? (
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full"></div>
                                    <FiCheckCircle size={80} className="text-green-400 mb-6 relative z-10" />
                                </div>
                                <h2 className="text-4xl font-black uppercase tracking-[0.2em] text-white">
                                    Payment Successful
                                </h2>
                                <p className="text-white/30 text-[10px] mt-4 tracking-widest uppercase italic">
                                    Transaction Verified &bull; Neural Node Authorized
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <FiLoader size={70} className="text-purple-500 mb-8 spinner-custom" />
                                <h2 className="text-3xl font-black uppercase tracking-[0.5em] text-purple-400 neon-text animate-pulse">
                                    Preparing Metria
                                </h2>
                                <div className="mt-6 flex gap-2">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
                                </div>
                                <p className="text-white/20 text-[9px] mt-8 tracking-[0.8em] uppercase">
                                    Initializing Neural Core // Engine 5.0
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                    <div className="w-full h-full flex-1 bg-[#000000]">
                        <div className="w-full">
                            <Outlet />
                        </div>
                    </div>

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