import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FiMenu, FiX } from "react-icons/fi";
import { useData } from "../contexts/DataContext";

// Individual components for nested routes
import Analytics from "./Analytics";
import Integrations from "./Integrations";
import Profile from "./Profile";
import Overview from "./Overview";
import Trends from "./Trends";

const IntegrationsWrapper = ({ onLogout }) => {
    const { profile, refreshAll } = useData();
    const userId = profile?.id;

    return (
        <Integrations
            userId={userId}
            onLogout={onLogout}
            refetchProfile={refreshAll}
        />
    );
};

export default function Dashboard({ onLogout }) {
    const { profile } = useData();
    const location = useLocation();

    const currentTab = location.pathname.split("/").pop();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const customStyles = `
        /*
         * METRIA DESIGN SYSTEM
         * Deep lavender-grey canvas with subtle purple undertones.
         */

        :root {
            --metria-canvas: #E7E5ED;
            --metria-surface: #FFFFFF;
            --metria-accent: #6D3DF5;
            --metria-text: #17151F;
            --metria-muted: #656171;
            --metria-border: #DCD8E5;
        }

        html,
        body,
        #root {
            margin: 0 !important;
            padding: 0 !important;
            width: 100%;
            min-height: 100%;
            background-color: var(--metria-canvas) !important;
            overflow-x: hidden;
        }

        body {
            color: var(--metria-text);
        }

        .dashboard-container {
            position: relative;
            width: 100%;
            min-height: 100vh;
            background-color: var(--metria-canvas);
        }

        /*
         * Very subtle purple atmospheric lighting.
         * Keeps the page feeling premium without overpowering cards.
         */

        .metria-main-canvas {
            background-color: var(--metria-canvas);

            background-image:
                radial-gradient(
                    ellipse 65% 42% at 95% 0%,
                    rgba(126, 87, 220, 0.075),
                    transparent 75%
                ),
                radial-gradient(
                    ellipse 50% 38% at 0% 75%,
                    rgba(112, 73, 190, 0.035),
                    transparent 80%
                );

            background-attachment: fixed;
        }

        /*
         * SCROLLBAR
         */

        ::-webkit-scrollbar {
            width: 6px;
        }

        ::-webkit-scrollbar-track {
            background: #E2DFE9;
        }

        ::-webkit-scrollbar-thumb {
            background: #B3A0DC;
            border-radius: 999px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #8B68F5;
        }
    `;

    return (
        <div className="dashboard-container font-sans">
            <style>{customStyles}</style>

            {/* =====================================================
                MOBILE TOP NAVIGATION
            ===================================================== */}

            <div
                className="
                    lg:hidden
                    sticky top-0 z-50
                    flex items-center justify-between
                    px-4 py-3.5
                    bg-[#0D0B13]/95
                    backdrop-blur-md
                    border-b border-purple-500/10
                "
            >
                <h1
                    className="
                        text-[#C69BFF]
                        text-xl
                        font-bold
                        tracking-[-0.03em]
                    "
                >
                    MetriaAI
                </h1>

                <button
                    type="button"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="
                        w-10 h-10
                        flex items-center justify-center
                        text-white
                        bg-white/5
                        rounded-[10px]
                        border border-white/10
                        transition-colors
                        hover:bg-white/10
                    "
                    aria-label={
                        isSidebarOpen
                            ? "Close navigation"
                            : "Open navigation"
                    }
                >
                    {isSidebarOpen ? (
                        <FiX size={21} />
                    ) : (
                        <FiMenu size={21} />
                    )}
                </button>
            </div>

            <div
                className="
                    relative z-10
                    flex
                    min-h-screen
                    w-full
                "
            >
                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <aside
                    className={`
                        fixed
                        top-0 left-0
                        z-[60]

                        w-64
                        h-full

                        bg-[#08070C]
                        border-r border-purple-500/10

                        transition-transform
                        duration-300
                        ease-in-out

                        ${
                            isSidebarOpen
                                ? "translate-x-0"
                                : "-translate-x-full"
                        }

                        lg:translate-x-0
                    `}
                >
                    <Sidebar
                        profile={profile}
                        current={currentTab}
                        onLogout={onLogout}
                        closeMobileMenu={() =>
                            setIsSidebarOpen(false)
                        }
                    />
                </aside>

                {/* =================================================
                    MOBILE OVERLAY
                ================================================= */}

                {isSidebarOpen && (
                    <div
                        className="
                            fixed inset-0
                            z-50
                            bg-black/70
                            backdrop-blur-sm
                            lg:hidden
                        "
                        onClick={() =>
                            setIsSidebarOpen(false)
                        }
                    />
                )}

                {/* =================================================
                    MAIN APPLICATION CANVAS
                ================================================= */}

                <main
                    className="
                        metria-main-canvas

                        flex-1
                        lg:ml-64

                        min-w-0
                        min-h-screen

                        flex
                        flex-col

                        relative
                        z-20

                        text-[#17151F]
                    "
                >
                    {/* =============================================
                        PAGE CONTENT
                    ============================================= */}

                    <div
                        className="
                            w-full
                            flex-1
                        "
                    >
                        <Outlet />
                    </div>

                    {/* =============================================
                        FOOTER
                    ============================================= */}

                    <footer
                        className="
                            py-6
                            px-6

                            text-center
                            text-[10px]
                            font-semibold
                            uppercase
                            tracking-[0.25em]

                            text-[#858094]

                            border-t border-[#DCD8E5]/60

                            pointer-events-none
                        "
                    >
                        &copy; 2026 Metria AI
                        <span className="mx-2">
                            •
                        </span>
                        Encrypted Session
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