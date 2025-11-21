import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";
import Integrations from "./Integrations";
import Profile from "./Profile";
import Analytics from "./Analytics";
import Settings from "./Settings";

export default function Dashboard({ profile, onLogout }) {
  const location = useLocation();
  const [current, setCurrent] = useState("ai");

  // Sync tab based on URL query
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get("type");

    if (type === "google_sheets") {
      setCurrent("integrations");
    }
    // You can add more logic for other apps later
  }, [location.search]);

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-black via-gray-900 to-purple-900 text-white">
      
      <div className="w-64 fixed top-0 left-0 h-full z-20">
        <Sidebar
          profile={profile}
          current={current}
          setCurrent={setCurrent}
          onLogout={onLogout}
        />
      </div>

      <div className="flex-1 ml-64 p-6 overflow-y-auto">
        {current === "ai" && <ChatPanel profile={profile} />}
        {current === "integrations" && <Integrations />}
        {current === "profile" && <Profile profile={profile} />}
        {current === "analytics" && <Analytics />}
        {current === "settings" && <Settings />}
      </div>
    </div>
  );
}
