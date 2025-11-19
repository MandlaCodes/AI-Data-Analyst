import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";
import Profile from "./Profile";
import Analytics from "./Analytics";
import Settings from "./Settings";
import Integrations from "./Integrations";

export default function Dashboard({ profile, onLogout }) {
  const [current, setCurrent] = useState("ai");

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-black via-gray-900 to-purple-900 text-white">
      
      {/* Sidebar stays fixed */}
      <div className="w-64 fixed top-0 left-0 h-full z-20">
        <Sidebar
          profile={profile}
          current={current}
          setCurrent={setCurrent}
          onLogout={onLogout}
        />
      </div>

      {/* Main content scrolls independently */}
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
