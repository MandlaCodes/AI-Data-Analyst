import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// Import your page components
import Landing from "./pages/Landing";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard"; 

/**
 * Legal Components
 */
const LegalLayout = ({ title, children }) => (
  <div className="flex-1 flex flex-col items-center py-20 px-6 text-white bg-[#0a0118] min-h-screen">
    <div className="max-w-3xl w-full">
      <h1 className="text-5xl font-extrabold mb-10 bg-gradient-to-r from-white to-purple-500 bg-clip-text text-transparent">{title}</h1>
      <div className="space-y-6 text-gray-400 leading-relaxed text-lg">{children}</div>
      <button onClick={() => window.history.back()} className="mt-12 text-purple-400 hover:text-purple-300 font-bold uppercase tracking-widest text-sm">← Return</button>
    </div>
  </div>
);

const Privacy = () => <LegalLayout title="Privacy Policy"><p>MetriaAI adheres to Google API Services User Data Policy.</p></LegalLayout>;
const Terms = () => <LegalLayout title="Terms of Service"><p>Insights are AI-generated.</p></LegalLayout>;
const Contact = () => <LegalLayout title="Contact Support"><p>mandlandhlovu264@gmail.com</p></LegalLayout>;

function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null); 
  const [isHydrated, setIsHydrated] = useState(false); 
  const [isSyncingPayment, setIsSyncingPayment] = useState(false); // NEW: The "Lock"
  const [showToast, setShowToast] = useState(false);

  const checkAuth = async () => {
    const token = localStorage.getItem("adt_token");
    if (!token) return null;

    try {
      const response = await fetch(`https://ai-data-analyst-backend-1nuw.onrender.com/api/auth/me?v=${Date.now()}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache"
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const activeProfile = { ...userData, user_id: userData.id, token };
        localStorage.setItem("adt_profile", JSON.stringify(activeProfile));
        setProfile(activeProfile);
        return activeProfile;
      }
      return null;
    } catch (err) {
      console.error("Auth Sync Failed:", err);
      return null;
    }
  };

  useEffect(() => {
    const initApp = async () => {
      // 1. If we see the payment success flag, LOCK the router
      if (location.search.includes("payment=success")) {
        setIsSyncingPayment(true); 
        console.log("💳 Payment Success detected. Locking Redirect Guard...");

        let attempts = 0;
        const maxAttempts = 25; 

        while (attempts < maxAttempts) {
          console.log(`Syncing... ${attempts + 1}/${maxAttempts}`);
          const currentProfile = await checkAuth();
          
          if (currentProfile?.subscription_id || currentProfile?.is_active) {
            console.log("🚀 Subscription found!");
            setShowToast(true);
            setIsSyncingPayment(false); // UNLOCK
            setIsHydrated(true);
            navigate("/dashboard/overview", { replace: true });
            return; 
          }
          
          attempts++;
          await new Promise(res => setTimeout(res, 4000)); 
        }
        setIsSyncingPayment(false); // Unlock even if failed so user can see home
      } else {
        await checkAuth();
      }
      setIsHydrated(true);
    };
    
    initApp();
  }, [location.search]);

  const handleLoginSuccess = async (userId, token) => { 
    localStorage.setItem("adt_token", token);
    const success = await checkAuth();
    if (success) navigate(`/dashboard/overview`);
  };

  const handleLogout = () => {
    localStorage.clear();
    setProfile(null);
    navigate("/");
  };

  // 1. Loading State (While waking up or syncing payment)
  if (!isHydrated || isSyncingPayment) return (
    <div className="min-h-screen bg-[#0a0118] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin"></div>
            <h2 className="text-white font-black uppercase tracking-[0.2em] text-xl">Metria Neural Core</h2>
            <p className="text-purple-500/60 text-[10px] uppercase tracking-[0.4em] font-bold animate-pulse">
               {isSyncingPayment ? "Confirming Secure Payment & Initializing Dashboard" : "Synchronizing Session"}
            </p>
        </div>
    </div>
  );

  return (
    <>
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] animate-bounce">
          <div className="bg-purple-600 text-white px-6 py-3 rounded-full border border-white/20 shadow-2xl flex items-center gap-3">
            <span className="text-xl">🚀</span>
            <span className="font-bold tracking-tight text-sm uppercase">Subscription Active</span>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={profile ? <Navigate to="/dashboard/overview" replace /> : <Landing onGetStarted={() => navigate("/login")} />} />
        <Route path="/login" element={profile ? <Navigate to="/dashboard/overview" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} />

        {/* STRICT PROTECTED ROUTE: 
            If profile is missing but we ARE hydrated, go home. 
            If we ARE NOT hydrated, this route won't even be reached (handled by the loader above).
        */}
        <Route path="/dashboard/*" element={
          profile ? (
            <Dashboard profile={profile} onLogout={handleLogout} refetchProfile={checkAuth} /> 
          ) : (
            <Navigate to="/" replace />
          )
        }>
          <Route path="overview" element={<Dashboard.Overview profile={profile} />} />
          <Route path="analytics" element={<Dashboard.Analytics profile={profile} onLogout={handleLogout} />} />
          <Route path="integrations" element={<Dashboard.Integrations profile={profile} onLogout={handleLogout} refetchProfile={checkAuth} />} /> 
          <Route path="profile" element={<Dashboard.Profile profile={profile} />} />
          <Route path="trends" element={<Dashboard.Trends profile={profile} />} />
          <Route index element={<Navigate replace to="overview" />} />
        </Route>

        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Navigate to={profile ? "/dashboard/overview" : "/"} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen w-full bg-[#0a0118] m-0 p-0 flex flex-col relative z-0"> 
      <Router><AppWrapper /></Router>
    </div>
  );
}