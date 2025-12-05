import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login.jsx"; // FIX: Setting to .jsx. Please verify file is named 'Login.jsx'
import Dashboard from "./pages/Dashboard";
import GoogleSheetsAnalysis from "./pages/GoogleSheetsAnalysis";

function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to handle successful login, receiving the user ID from the Login component
  const handleLoginSuccess = (userId) => {
    // Create a minimal profile object for session state
    const newProfile = { user_id: userId, name: "User" }; 
    setProfile(newProfile);
    localStorage.setItem("adt_profile", JSON.stringify(newProfile));
    
    // Redirect to the dashboard
    navigate(`/dashboard/overview?user_id=${userId}`);
  };

  useEffect(() => {
    // Check local storage for existing session data
    const saved = localStorage.getItem("adt_profile");
    if (saved) {
      setProfile(JSON.parse(saved));
    }
    // Note: The previous logic to extract userId from query params is now
    // primarily handled by the Login component calling handleLoginSuccess.
    // Keeping this simple for initial load check.
    setLoading(false);
  }, [location.search]);

  const handleLogout = () => {
    localStorage.removeItem("adt_profile");
    setProfile(null);
    navigate("/");
  };

  if (loading) return null;

  return (
    <Routes>

      {/* Landing Page (Now points to /login if unauthenticated) */}
      <Route
        path="/"
        element={profile ? (
          <Navigate to={`/dashboard/overview?user_id=${profile.user_id}`} />
        ) : (
          // Landing page should now point users to the new /login route
          <Landing onGetStarted={() => navigate("/login")} /> 
        )}
      />

      {/* Login Route (Replaces Onboarding) */}
      <Route
        path="/login" // New path
        element={
          profile ? (
            <Navigate to={`/dashboard/overview?user_id=${profile.user_id}`} />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} /> // Use the Login component
          )
        }
      />

      {/* Dashboard with nested routes (remains unchanged) */}
      <Route
        path="/dashboard/*"
        element={profile ? (
          <Dashboard profile={profile} onLogout={handleLogout} />
        ) : (
          <Navigate to="/" />
        )}
      >
        <Route path="overview" element={<Dashboard.Overview profile={profile} />} />
        <Route path="analytics" element={<Dashboard.Analytics profile={profile} onLogout={handleLogout} />} />
        <Route path="integrations" element={<Dashboard.Integrations profile={profile} />} />
        <Route path="profile" element={<Dashboard.Profile profile={profile} />} />
        <Route path="settings" element={<Dashboard.Settings profile={profile} />} />
        <Route path="trends" element={<Dashboard.Trends profile={profile} />} />
        <Route path="security" element={<Dashboard.Security profile={profile}/>} />
      </Route>

      {/* Google Sheets Analysis */}
      <Route
        path="/google-sheets-analysis"
        element={profile ? <GoogleSheetsAnalysis profile={profile} /> : <Navigate to="/" />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}