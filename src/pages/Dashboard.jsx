import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";
import Integrations from "./Integrations";
import Analytics from "./Analytics";
import Profile from "./Profile";
import Settings from "./Settings";

export default function Dashboard({ profile, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("ai");

  // Sync tab based on URL query (from OAuth or manual navigation)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");

    switch (type) {
      case "google_sheets":
        setCurrent("integrations");
        break;
      case "profile":
        setCurrent("profile");
        break;
      case "analytics":
        setCurrent("analytics");
        break;
      case "settings":
        setCurrent("settings");
        break;
      default:
        setCurrent("ai");
    }
  }, [location.search]);

  // Optional: navigate manually to update URL query
  const switchTab = (tab) => {
    setCurrent(tab);
    navigate(`/dashboard?type=${tab}`);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-black via-gray-900 to-purple-900 text-white">
      {/* Sidebar */}
      <div className="w-64 fixed top-0 left-0 h-full z-20">
        <Sidebar
          profile={profile}
          current={current}
          setCurrent={switchTab}
          onLogout={onLogout}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64 p-6 overflow-y-auto">
        {current === "ai" && <ChatPanel profile={profile} />}
        {current === "integrations" && <Integrations profile={profile} />}
        {current === "analytics" && <Analytics profile={profile} />}
        {current === "profile" && <Profile profile={profile} />}
        {current === "settings" && <Settings />}
      </div>
    </div>
  );
}
