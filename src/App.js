import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import GoogleSheetsAnalysis from "./pages/GoogleSheetsAnalysis";

function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);

  // Restore profile from localStorage or URL param
  useEffect(() => {
    const saved = localStorage.getItem("adt_profile");
    if (saved) {
      setProfile(JSON.parse(saved));
    } else {
      const searchParams = new URLSearchParams(location.search);
      const userId = searchParams.get("user_id");
      if (userId) {
        const tempProfile = { user_id: userId, name: "User" };
        setProfile(tempProfile);
        localStorage.setItem("adt_profile", JSON.stringify(tempProfile));
      }
    }
  }, [location.search]);

  const handleLogout = () => {
    localStorage.removeItem("adt_profile");
    setProfile(null);
    navigate("/"); // back to landing
  };

  return (
    <Routes>
      <Route
        path="/"
        element={profile ? (
          <Navigate to={`/dashboard/ai?user_id=${profile.user_id}`} />
        ) : (
          <Landing onGetStarted={() => navigate("/onboarding")} />
        )}
      />

      <Route
        path="/onboarding"
        element={
          <Onboarding
            onComplete={(p) => {
              setProfile(p);
              localStorage.setItem("adt_profile", JSON.stringify(p));
              navigate(`/dashboard/ai?user_id=${p.user_id}`);
            }}
          />
        }
      />

      {/* Dashboard with nested routes */}
      <Route
        path="/dashboard/*"
        element={profile ? (
          <Dashboard profile={profile} onLogout={handleLogout} />
        ) : (
          <Navigate to="/" />
        )}
      >
        <Route path="ai" element={<Dashboard.Chat profile={profile} />} />
        <Route path="analytics" element={<Dashboard.Analytics profile={profile} onLogout={handleLogout} />} />
        <Route path="integrations" element={<Dashboard.Integrations profile={profile} />} />
        <Route path="profile" element={<Dashboard.Profile profile={profile} />} />
        <Route path="settings" element={<Dashboard.Settings profile={profile} />} />
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
