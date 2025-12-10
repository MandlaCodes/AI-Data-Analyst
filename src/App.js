import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// Import your page components
import Landing from "./pages/Landing";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard"; // Assumes this is where the Dashboard.jsx content lives
import GoogleSheetsAnalysis from "./pages/GoogleSheetsAnalysis";

function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function: Fetches profile and token from localStorage
  const refetchProfile = () => {
    const savedProfile = localStorage.getItem("adt_profile");
    const savedToken = localStorage.getItem("adt_token"); 

    if (savedProfile) {
      // The profile object must contain the user_id that the Integrations component expects.
      setProfile({ ...JSON.parse(savedProfile), token: savedToken });
      return true;
    }
    setProfile(null);
    return false;
  };

  // Function to handle successful login
  const handleLoginSuccess = (userId, token) => { 
    // Create a full profile object for session state
    const newProfile = { user_id: userId, name: "User", token: token }; 
    setProfile(newProfile);
    // Save minimal profile and token separately
    localStorage.setItem("adt_profile", JSON.stringify({ user_id: userId, name: "User" }));
    localStorage.setItem("adt_token", token); 
    
    navigate(`/dashboard/overview?user_id=${userId}`);
  };

  useEffect(() => {
    refetchProfile(); 
    setLoading(false);
  }, [location.search]);

  const handleLogout = () => {
    localStorage.removeItem("adt_profile");
    localStorage.removeItem("adt_token"); 
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
            <Login onLoginSuccess={handleLoginSuccess} /> 
          )
        }
      />

      {/* Dashboard with nested routes */}
      <Route
        path="/dashboard/*"
        element={profile ? (
          // Pass main props to the Dashboard layout component
          <Dashboard profile={profile} onLogout={handleLogout} refetchProfile={refetchProfile} /> 
        ) : (
          <Navigate to="/" />
        )}
      >
        <Route path="overview" element={<Dashboard.Overview profile={profile} />} />
        <Route path="analytics" element={<Dashboard.Analytics profile={profile} onLogout={handleLogout} />} />
        
        {/* 🎯 FINAL FIX APPLIED: Pass onLogout prop to the Integrations route element */}
        <Route 
          path="integrations" 
          element={
            <Dashboard.Integrations 
              profile={profile} 
              onLogout={handleLogout} // <-- Ensures the wrapper component can pass this to Integrations.jsx
              refetchProfile={refetchProfile} 
            />
          } 
        /> 
        
        <Route path="profile" element={<Dashboard.Profile profile={profile} />} />
        <Route path="settings" element={<Dashboard.Settings profile={profile} />} />
        <Route path="trends" element={<Dashboard.Trends profile={profile} />} />
        <Route path="security" element={<Dashboard.Security profile={profile} onLogout={handleLogout} />} />
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