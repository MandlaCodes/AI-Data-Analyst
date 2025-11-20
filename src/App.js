import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";

function AppWrapper() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  // Load saved profile from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("adt_profile");
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adt_profile");
    setProfile(null);
    navigate("/"); // send user back to landing
  };

  return (
    <Routes>
      {/* Landing Page */}
      <Route
        path="/"
        element={
          profile ? (
            <Navigate to="/dashboard" />
          ) : (
            <Landing onGetStarted={() => navigate("/onboarding")} />
          )
        }
      />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <Onboarding
            onComplete={(p) => {
              setProfile(p);
              localStorage.setItem("adt_profile", JSON.stringify(p));
              navigate("/dashboard");
            }}
          />
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard/*"
        element={
          profile ? (
            <Dashboard profile={profile} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
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
