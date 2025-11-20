import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Integrations from "./pages/Integrations";

function AppWrapper() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("adt_profile");
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  return (
    <Routes>
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
      <Route
        path="/onboarding"
        element={<Onboarding onComplete={(p) => setProfile(p)} />}
      />
      <Route
        path="/dashboard"
        element={
          <Dashboard
            profile={profile}
            onLogout={() => {
              localStorage.removeItem("adt_profile");
              setProfile(null);
            }}
          />
        }
      />
      <Route path="/integrations" element={<Integrations />} />
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
