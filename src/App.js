import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard";
import GoogleSheetsAnalysis from "./pages/GoogleSheetsAnalysis";

function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🟢 NEW FUNCTION: Fetches profile and token from localStorage
  const refetchProfile = () => {
    const savedProfile = localStorage.getItem("adt_profile");
    const savedToken = localStorage.getItem("adt_token"); // Assuming your JWT is saved here

    if (savedProfile) {
      // Update the profile to include the token
      setProfile({ ...JSON.parse(savedProfile), token: savedToken });
      return true;
    }
    setProfile(null);
    return false;
  };

  // Function to handle successful login (You may need to update your Login.jsx to pass the token)
  // Assuming login now passes the token along with the userId
  const handleLoginSuccess = (userId, token) => { 
    // Create a full profile object for session state
    const newProfile = { user_id: userId, name: "User", token: token }; 
    setProfile(newProfile);
    // Save minimal profile and token separately (good practice)
    localStorage.setItem("adt_profile", JSON.stringify({ user_id: userId, name: "User" }));
    localStorage.setItem("adt_token", token); 
    
    // Redirect to the dashboard
    navigate(`/dashboard/overview?user_id=${userId}`);
  };

  useEffect(() => {
    // Check local storage for existing session data and token on initial load
    refetchProfile(); 
    setLoading(false);
  }, [location.search]);

  const handleLogout = () => {
    localStorage.removeItem("adt_profile");
    localStorage.removeItem("adt_token"); // <-- Also clear the token
    setProfile(null);
    navigate("/");
  };

  if (loading) return null;

  return (
    <Routes>
      <Route
        path="/"
        element={profile ? (
          <Navigate to={`/dashboard/overview?user_id=${profile.user_id}`} />
        ) : (
          <Landing onGetStarted={() => navigate("/login")} /> 
        )}
      />

      <Route
        path="/login"
        element={
          profile ? (
            <Navigate to={`/dashboard/overview?user_id=${profile.user_id}`} />
          ) : (
            // NOTE: You must update your Login.jsx to call handleLoginSuccess(userId, token)
            <Login onLoginSuccess={handleLoginSuccess} /> 
          )
        }
      />

      {/* Dashboard with nested routes */}
      <Route
        path="/dashboard/*"
        element={profile ? (
          // 🟢 PASSED: refetchProfile to the Dashboard component
          <Dashboard profile={profile} onLogout={handleLogout} refetchProfile={refetchProfile} /> 
        ) : (
          <Navigate to="/" />
        )}
      >
        <Route path="overview" element={<Dashboard.Overview profile={profile} />} />
        <Route path="analytics" element={<Dashboard.Analytics profile={profile} onLogout={handleLogout} />} />
        {/* 🟢 PASSED: refetchProfile to the Integrations component */}
        <Route path="integrations" element={<Dashboard.Integrations profile={profile} refetchProfile={refetchProfile} />} /> 
        <Route path="profile" element={<Dashboard.Profile profile={profile} />} />
        <Route path="settings" element={<Dashboard.Settings profile={profile} />} />
        <Route path="trends" element={<Dashboard.Trends profile={profile} />} />
        <Route path="security" element={<Dashboard.Security profile={profile}/>} />
      </Route>

      <Route
        path="/google-sheets-analysis"
        element={profile ? <GoogleSheetsAnalysis profile={profile} /> : <Navigate to="/" />}
      />

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