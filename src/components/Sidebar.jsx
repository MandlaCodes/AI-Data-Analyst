import React from "react";
import { motion } from "framer-motion";

export default function Sidebar({ profile, current, setCurrent, onLogout }) {
  const items = [
    { id: "ai", label: "AI Ask" },
    { id: "integrations", label: "Integrations" },
    { id: "profile", label: "Profile" },
    { id: "analytics", label: "Analytics" },
    { id: "settings", label: "Settings" },
    { id: "logout", label: "Log out" },
  ];

  return (
    <div className="w-64 p-4 bg-black/50 backdrop-blur-md border-r border-gray-800 min-h-screen text-white flex flex-col">
      <div className="mb-6">
        <div className="text-xl font-bold text-purple-200">
          {profile?.businessName || "Your Business"}
        </div>
        <div className="text-xs text-gray-400">
          {profile?.industry || "Industry"}
        </div>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {items.map((it) => (
          <motion.button
            key={it.id}
            onClick={() => (it.id === "logout" ? onLogout() : setCurrent(it.id))}
            whileHover={{ x: 5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`p-3 rounded-lg border border-gray-800 transition-all ${
              current === it.id
                ? "bg-gradient-to-r from-purple-600/50 via-indigo-600/40 to-purple-600/50 shadow-[0_0_15px_rgba(128,0,255,0.7)]"
                : "hover:bg-gradient-to-r hover:from-purple-700/20 hover:to-indigo-700/10"
            }`}
          >
            {it.label}
          </motion.button>
        ))}
      </nav>

      <div className="pt-6 text-xs text-gray-400">MN Web Solutions — AI Digital Twin</div>
    </div>
  );
}
