import React from "react";
import { NavLink } from "react-router-dom";
import { 
  FiPieChart, FiTrendingUp, FiDatabase, 
  FiUser, FiLogOut, FiHome 
} from "react-icons/fi";

// closeMobileMenu prop added to handle responsive closing logic
export default function Sidebar({ current, onLogout, closeMobileMenu }) {
  
  // Helper to trigger close only if the prop exists (mobile mode)
  const handleAutoClose = () => {
    if (closeMobileMenu) closeMobileMenu();
  };

  return (
    <div className="h-full w-full bg-black border-r border-purple-700 flex flex-col justify-between p-6 select-none">

      {/* ==== BRAND HEADER ==== */}
      <div>
        <h1 className="text-purple-400 text-2xl font-bold tracking-wide">MetriaAI</h1>

        {/* === MENU TITLE === */}
        <h3 className="mt-8 text-gray-400 text-xs uppercase font-semibold">Menu</h3>
        
        {/* MENU LINKS */}
        <nav className="flex flex-col gap-3 mt-3">

          <SidebarLink 
            icon={<FiHome />} 
            label="Overview" 
            to="/dashboard/overview"
            active={current === "overview"} 
            onClick={handleAutoClose}
          />

          <SidebarLink 
            icon={<FiPieChart />} 
            label="Analytics" 
            to="/dashboard/analytics" 
            active={current === "analytics"} 
            onClick={handleAutoClose}
          />

          <SidebarLink 
            icon={<FiTrendingUp />} 
            label="Trends" 
            to="/dashboard/trends" 
            active={current === "trends"} 
            onClick={handleAutoClose}
          />

          <SidebarLink 
            icon={<FiDatabase />} 
            label="Integrations" 
            to="/dashboard/integrations" 
            active={current === "integrations"} 
            onClick={handleAutoClose}
          />
        </nav>

        {/* === GENERAL SECTION === */}
        <h3 className="mt-10 text-gray-400 text-xs uppercase font-semibold">General</h3>

        <nav className="flex flex-col gap-3 mt-3">
          <SidebarLink 
            icon={<FiUser />} 
            label="Profile" 
            to="/dashboard/profile" 
            active={current === "profile"} 
            onClick={handleAutoClose}
          />
        </nav>
      </div>

      {/* === LOGOUT BUTTON ==== */}
      <button
        onClick={() => {
          handleAutoClose();
          onLogout();
        }}
        className="flex items-center gap-3 w-full py-2 mt-10 text-left text-gray-300 hover:text-purple-400 transition"
      >
        <FiLogOut size={18} />
        <span>Log out</span>
      </button>
    </div>
  );
}

// SidebarLink now accepts and triggers the onClick prop
function SidebarLink({ icon, label, to, active, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
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