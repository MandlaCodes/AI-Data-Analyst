import React, { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [page, setPage] = useState("landing");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("adt_profile");
    if (saved) {
      setProfile(JSON.parse(saved));
      setPage("dashboard");
    }
  }, []);

  return (
    <>
      {page === "landing" && (
        <Landing onGetStarted={() => setPage("onboarding")} />
      )}

      {page === "onboarding" && (
        <Onboarding
          onComplete={(p) => {
            setProfile(p);
            setPage("dashboard");
          }}
        />
      )}

      {page === "dashboard" && (
        <Dashboard
          profile={profile}
          onLogout={() => {
            localStorage.removeItem("adt_profile");
            setProfile(null);
            setPage("landing");
          }}
        />
      )}
    </>
  );
}

