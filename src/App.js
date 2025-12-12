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
 * navigates, and handles conditional rendering (Login vs. Dashboard).
 */
function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null); // Holds { user_id, email, token }
  const [loading, setLoading] = useState(true);

  // Function: Fetches profile and token from localStorage
  const refetchProfile = () => {
    const savedProfile = localStorage.getItem("adt_profile");
    const savedToken = localStorage.getItem("adt_token"); 

    if (savedProfile && savedToken) {
      try {
        const userProfile = JSON.parse(savedProfile);
        // Recreate the full profile object with the token
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

  // Function to handle successful login/signup
  const handleLoginSuccess = (userId, token) => { 
    // NOTE: Login.jsx handles saving the profile (including email) and token to localStorage.
    const savedProfile = JSON.parse(localStorage.getItem("adt_profile"));
    
    const newProfile = { user_id: userId, email: savedProfile?.email || "User", token: token }; 
    setProfile(newProfile);
    
    // Navigate to the dashboard (User ID is NOT needed in URL, as auth is via JWT)
    navigate(`/dashboard/overview`);
  };

  // Effect runs once on mount to check initial auth status
  useEffect(() => {
    refetchProfile(); 
    setLoading(false);
  }, [location.pathname]); // Dependency on pathname allows re-check after external redirects (like OAuth)

  const handleLogout = () => {
    localStorage.removeItem("adt_profile");
    localStorage.removeItem("adt_token"); 
    setProfile(null);
    navigate("/");
  };

  if (loading) return null; // Simple loading check

  return (
    <Routes>
      {/* 1. Landing Page / Root Route */}
      <Route
        path="/"
        element={profile ? (
          <Navigate to={`/dashboard/overview`} /> // Authenticated users go straight to overview
        ) : (
          <Landing onGetStarted={() => navigate("/login")} /> 
        )}
      />

      {/* 2. Login Route */}
      <Route
        path="/login"
        element={
          profile ? (
            <Navigate to={`/dashboard/overview`} /> // Prevent logged-in users from seeing login
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} /> 
          )
        }
      />

      {/* 3. Private Route: Dashboard with Nested Routes */}
      <Route
        path="/dashboard/*"
        element={profile ? (
          // Pass main props to the Dashboard layout component
          <Dashboard profile={profile} onLogout={handleLogout} refetchProfile={refetchProfile} /> 
        ) : (
          <Navigate to="/" /> // Redirect unauthenticated users to landing
        )}
      >
        {/* Nested Routes (Rendered via <Outlet> in Dashboard.js) */}
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
        
        {/* Default dashboard path when navigating to /dashboard */}
        <Route index element={<Navigate replace to="overview" />} />
      </Route>

      {/* 4. Standalone Google Sheets Page */}
      <Route
        path="/google-sheets-analysis"
        element={profile ? <GoogleSheetsAnalysis profile={profile} /> : <Navigate to="/" />}
      />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
}

/**
 * Main App component to define the Router context and global styling.
 */
export default function App() {
  return (
    // Ensure the entire application takes up the full viewport height.
    <div className="h-screen w-full"> 
      <Router>
        <AppWrapper />
      </Router>
    </div>
  );
}