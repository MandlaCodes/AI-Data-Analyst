import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Integrations from "./pages/Integrations";

export default function App() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("adt_profile");
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            profile ? (
              <Navigate to="/dashboard" />
            ) : (
              <Landing onGetStarted={() => {}} />
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
        <Route
          path="/integrations"
          element={<Integrations />}
        />
      </Routes>
    </Router>
  );
}
