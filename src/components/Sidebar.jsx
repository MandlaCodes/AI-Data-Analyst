import React from "react";
import { NavLink } from "react-router-dom";
import { 
  FiPieChart, FiTrendingUp, FiDatabase, FiSettings, 
  FiShield, FiUser, FiLogOut, FiHome 
} from "react-icons/fi";

export default function Sidebar({ current, onLogout }) {
  return (
    <div className="h-full w-full bg-black border-r border-purple-700 flex flex-col justify-between p-6 select-none">

      {/* ==== BRAND HEADER ==== */}
      <div>
        <h1 className="text-purple-400 text-2xl font-bold tracking-wide">NeuraTwin</h1>

        {/* === MENU TITLE === */}
        <h3 className="mt-8 text-gray-400 text-xs uppercase font-semibold">Menu</h3>
        
        {/* MENU LINKS */}
        <nav className="flex flex-col gap-3 mt-3">

          {/* FIXED: Overview now uses /overview not /ai */}
          <SidebarLink 
            icon={<FiHome />} 
            label="Overview" 
            to="/dashboard/overview"
            active={current === "overview"} 
          />

          <SidebarLink 
            icon={<FiPieChart />} 
            label="Analytics" 
            to="/dashboard/analytics" 
            active={current === "analytics"} 
          />

          <SidebarLink 
            icon={<FiTrendingUp />} 
            label="Trends" 
            to="/dashboard/trends" 
            active={current === "trends"} 
          />

          <SidebarLink 
            icon={<FiDatabase />} 
            label="Integrations" 
            to="/dashboard/integrations" 
            active={current === "integrations"} 
          />
        </nav>

        {/* === GENERAL SECTION === */}
        <h3 className="mt-10 text-gray-400 text-xs uppercase font-semibold">General</h3>

        <nav className="flex flex-col gap-3 mt-3">
          <SidebarLink icon={<FiSettings />} label="Settings" to="/dashboard/settings" active={current === "settings"} />
          <SidebarLink icon={<FiShield />} label="Security" to="/dashboard/security" active={current === "security"} />
          <SidebarLink icon={<FiUser />} label="Profile" to="/dashboard/profile" active={current === "profile"} />
        </nav>
      </div>

      {/* === LOGOUT BUTTON ==== */}
      <button
        onClick={onLogout}
        className="flex items-center gap-3 w-full py-2 mt-10 text-left text-gray-300 hover:text-purple-400 transition"
      >
        <FiLogOut size={18} />
        <span>Log out</span>
      </button>
    </div>
  );
}


function SidebarLink({ icon, label, to, active }) {
  return (
    <NavLink
      to={to}
      className={`flex items-center gap-3 p-2 rounded-lg transition-all
        ${active 
          ? "bg-purple-700 text-white font-semibold" 
          : "text-gray-300 hover:bg-purple-900 hover:text-white"
        }
      `}
    >
      {icon}
      {label}
    </NavLink>
  );
}
