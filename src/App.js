// src/App.js

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// Import your page components
import Landing from "./pages/Landing";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard"; 
import GoogleSheetsAnalysis from "./pages/GoogleSheetsAnalysis";

/**
 * AppWrapper component manages the global authentication state,
 * navigates, and handles conditional rendering.
 */
function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null); 
  const [loading, setLoading] = useState(true);

  const refetchProfile = () => {
    const savedProfile = localStorage.getItem("adt_profile");
    const savedToken = localStorage.getItem("adt_token"); 

    if (savedProfile && savedToken) {
      try {
        const userProfile = JSON.parse(savedProfile);
        setProfile({ ...userProfile, token: savedToken });
        return true;
      } catch (e) {
        console.error("Error parsing profile from localStorage:", e);
        return false;
      }
    }
    setProfile(null);
    return false;
  };

  const handleLoginSuccess = (userId, token) => { 
    const savedProfile = JSON.parse(localStorage.getItem("adt_profile"));
    const newProfile = { user_id: userId, email: savedProfile?.email || "User", token: token }; 
    setProfile(newProfile);
    navigate(`/dashboard/overview`);
  };

  useEffect(() => {
    refetchProfile(); 
    setLoading(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("adt_profile");
    localStorage.removeItem("adt_token"); 
    setProfile(null);
    navigate("/");
  };

  if (loading) return null;

  return (
    <Routes>
      {/* 1. Landing Page */}
      <Route
        path="/"
        element={profile ? (
          <Navigate to="/dashboard/overview" />
        ) : (
          <Landing onGetStarted={() => navigate("/login")} /> 
        )}
      />

      {/* 2. Login Route */}
      <Route
        path="/login"
        element={
          profile ? (
            <Navigate to="/dashboard/overview" />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} /> 
          )
        }
      />

      {/* 3. Private Route: Dashboard */}
      <Route
        path="/dashboard/*"
        element={profile ? (
          <Dashboard profile={profile} onLogout={handleLogout} refetchProfile={refetchProfile} /> 
        ) : (
          <Navigate to="/" />
        )}
      >
        <Route path="overview" element={<Dashboard.Overview profile={profile} />} />
        <Route path="analytics" element={<Dashboard.Analytics profile={profile} onLogout={handleLogout} />} />
        <Route 
          path="integrations" 
          element={
            <Dashboard.Integrations 
              profile={profile} 
              onLogout={handleLogout} 
              refetchProfile={refetchProfile} 
            />
          } 
        /> 
        <Route path="profile" element={<Dashboard.Profile profile={profile} />} />
        <Route path="settings" element={<Dashboard.Settings profile={profile} />} />
        <Route path="trends" element={<Dashboard.Trends profile={profile} />} />
        <Route path="security" element={<Dashboard.Security profile={profile} onLogout={handleLogout} />} />
        <Route index element={<Navigate replace to="overview" />} />
      </Route>

      {/* 4. Standalone Pages */}
      <Route
        path="/google-sheets-analysis"
        element={profile ? <GoogleSheetsAnalysis profile={profile} /> : <Navigate to="/" />}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

/**
 * Main App component.
 * FIX: Changed h-screen to min-h-screen and added background color 
 * to eliminate white space throughout the entire SaaS.
 */
export default function App() {
  return (
    <div className="min-h-screen w-full bg-[#0a0118] m-0 p-0 flex flex-col"> 
      <Router>
        <AppWrapper />
      </Router>
    </div>
  );
}