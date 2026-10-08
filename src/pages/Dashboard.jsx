
import React, { useEffect, useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FiMenu, FiX } from "react-icons/fi";
import { useData } from "../contexts/DataContext";

// Individual components for nested routes
import Analytics from "./Analytics";
import Integrations from "./Integrations";
import Profile from "./Profile";
import Overview from "./Overview";
import Trends from "./Trends";

/* ============================================================
   INTEGRATIONS WRAPPER
============================================================ */

const IntegrationsWrapper = ({ onLogout }) => {
  const { profile, refreshAll } = useData();

  const userId =
    profile?.id ||
    profile?.user_id ||
    profile?.userId ||
    null;

  return (
    <Integrations
      userId={userId}
      onLogout={onLogout}
      refetchProfile={refreshAll}
    />
  );
};

/* ============================================================
   DASHBOARD
============================================================ */

export default function Dashboard({ onLogout }) {
  const { profile } = useData();

  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentTab =
    location.pathname.split("/").filter(Boolean).pop() ||
    "overview";

  /*
   * Close the mobile sidebar whenever the route changes.
   * This prevents the overlay from remaining visible after
   * navigating to Overview, Analytics, or Integrations.
   */
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  /*
   * Support older Overview navigation that points to
   * /ask-metria.
   *
   * Ask Metria lives inside Analytics, so redirect the
   * legacy path to Analytics and preserve the question.
   *
   * This does not create or replace an existing route.
   */
  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, "");

    if (
      path === "/ask-metria" ||
      path === "/dashboard/ask-metria"
    ) {
      const analyticsPath =
        path.startsWith("/dashboard/")
          ? "/dashboard/analytics"
          : "/analytics";

      navigate(analyticsPath, {
        replace: true,
        state: {
          ...(location.state || {}),
          openAskMetria: true,
          openMetria: true,
          initialQuestion:
            location.state?.initialQuestion || "",
          source:
            location.state?.source || "overview",
        },
      });
    }
  }, [location.pathname, location.state, navigate]);

  const customStyles = `
    /* FORCE TOTAL BLACKOUT & RESPONSIVE FIXES */
    html,
    body {
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
        <h1 className="text-purple-400 text-xl font-black tracking-tighter uppercase">
          MetriaAI
        </h1>

        <button
          type="button"
          aria-label={
            isSidebarOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={isSidebarOpen}
          onClick={() =>
            setIsSidebarOpen((previous) => !previous)
          }
          className="p-2 text-white bg-white/5 rounded-lg border border-white/10"
        >
          {isSidebarOpen ? (
            <FiX size={24} />
          ) : (
            <FiMenu size={24} />
          )}
        </button>
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        {/* --- SIDEBAR --- */}
        <aside
          className={`
            w-64 fixed top-0 left-0 h-full z-[60]
            border-r border-white/5 bg-[#000000]
            transition-transform duration-300 ease-in-out
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

        {/* --- MOBILE OVERLAY --- */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
            onClick={() =>
              setIsSidebarOpen(false)
            }
            aria-hidden="true"
          />
        )}

        {/* --- MAIN CONTENT AREA --- */}

<main
  className={`flex-1 lg:ml-64 min-h-screen flex flex-col min-w-0 relative z-20 ${
    currentTab === "overview" ? "bg-[#E9ECF3]" : "bg-[#000000]"
  }`}
>
  <div
    className={`w-full flex-1 ${
      currentTab === "overview" ? "bg-[#E9ECF3]" : "bg-[#000000]"
    }`}
  >
    <div className="w-full">
      <Outlet />
    </div>
  </div>

  <footer
    className={`mt-auto p-10 text-center text-[10px] font-bold uppercase tracking-[0.6em] pointer-events-none ${
      currentTab === "overview"
        ? "bg-[#E9ECF3] text-slate-400"
        : "bg-black text-white/10"
    }`}
  >
    &copy; 2026 Metria AI &bull; Encrypted Session
  </footer>
</main>

      </div>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENT ASSIGNMENTS
============================================================ */

Dashboard.Overview = Overview;
Dashboard.Analytics = Analytics;
Dashboard.Trends = Trends;
Dashboard.Integrations = IntegrationsWrapper;
Dashboard.Profile = Profile;
