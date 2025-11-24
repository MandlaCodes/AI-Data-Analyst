import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";

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
    navigate("/"); // send user back to landing
  };

  return (
    <Routes>
      {/* Landing Page */}
      <Route
        path="/"
        element={
          profile ? (
            <Navigate to={`/dashboard?user_id=${profile.user_id}`} />
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
              navigate(`/dashboard?user_id=${p.user_id}`);
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
