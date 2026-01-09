import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard"; 

function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null); 
  const [isHydrated, setIsHydrated] = useState(false); 
  const [showToast, setShowToast] = useState(false);

  // 1. HARD REDIRECT LOGIC (Bypasses React State)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("payment") === "success") {
        console.log("CRITICAL: Payment redirect detected. Forcing Sync.");
        
        const runEmergencySync = async () => {
            let attempts = 0;
            const max = 25;
            const token = localStorage.getItem("adt_token");

            // If we have no token, we can't sync. Return home.
            if (!token) {
                console.error("NO TOKEN FOUND IN STORAGE");
                window.location.href = "/login";
                return;
            }

            while (attempts < max) {
                try {
                    const res = await fetch(`https://ai-data-analyst-backend-1nuw.onrender.com/api/auth/me?v=${Date.now()}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    const data = await res.json();

                    if (data.is_active || data.subscription_id) {
                        const fullProfile = { ...data, user_id: data.id, token };
                        localStorage.setItem("adt_profile", JSON.stringify(fullProfile));
                        
                        // THIS IS THE BRUTE FORCE:
                        // Instead of navigate(), we force a page reload to the target
                        window.location.href = "/dashboard/overview";
                        return;
                    }
                } catch (e) { console.log("Syncing..."); }
                
                attempts++;
                await new Promise(r => setTimeout(r, 4000));
            }
            window.location.href = "/"; // Failed after 25 tries
        };
        runEmergencySync();
    }
  }, [location.search]);

  // 2. STANDARD AUTH CHECK (For normal logins)
  const checkAuth = async () => {
    const token = localStorage.getItem("adt_token");
    if (!token) return null;
    try {
      const res = await fetch(`https://ai-data-analyst-backend-1nuw.onrender.com/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const p = { ...data, user_id: data.id, token };
        setProfile(p);
        setIsHydrated(true);
        return p;
      }
    } catch (e) { console.error(e); }
    setIsHydrated(true);
    return null;
  };

  useEffect(() => {
    if (!location.search.includes("payment=success")) {
        checkAuth();
    }
  }, [location.pathname]);

  // If we are currently in the middle of a payment redirect, show ONLY the loader
  if (location.search.includes("payment=success")) {
    return (
        <div className="min-h-screen bg-[#0a0118] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-t-purple-500 border-purple-500/20 rounded-full animate-spin mb-4"></div>
            <h1 className="text-white font-bold tracking-[0.5em] uppercase text-xs">Finalizing Neural Activation</h1>
            <p className="text-gray-500 text-[10px] mt-2 italic">Do not close this window...</p>
        </div>
    );
  }

  if (!isHydrated) return null;

  return (
    <Routes>
      <Route path="/" element={profile ? <Navigate to="/dashboard/overview" /> : <Landing onGetStarted={() => navigate("/login")} />} />
      <Route path="/login" element={profile ? <Navigate to="/dashboard/overview" /> : <Login onLoginSuccess={() => window.location.reload()} />} />
      
      <Route path="/dashboard/*" element={profile ? <Dashboard profile={profile} onLogout={() => { localStorage.clear(); window.location.href="/"; }} /> : <Navigate to="/" />} >
          <Route path="overview" element={<Dashboard.Overview profile={profile} />} />
          <Route path="analytics" element={<Dashboard.Analytics profile={profile} />} />
          <Route path="integrations" element={<Dashboard.Integrations profile={profile} refetchProfile={checkAuth} />} />
          <Route index element={<Navigate to="overview" />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <div className="min-h-screen w-full bg-[#0a0118]">
      <Router><AppWrapper /></Router>
    </div>
  );
}