/**
 * App.js - Metria Neural Engine Core Routing
 */
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// Page Components
import Landing from "./pages/Landing";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard"; 
import GoogleSheetsAnalysis from "./pages/GoogleSheetsAnalysis";
import Blog from "./components/Blog"; 

/**
 * ScrollToTop - Automatically resets window position on route changes
 */
const useScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
};

/**
 * Legal & Support Layout Wrapper
 */
const LegalLayout = ({ title, children }) => (
  <div className="flex-1 flex flex-col items-center py-20 px-6 text-white bg-[#02010a] min-h-screen">
    <div className="max-w-3xl w-full">
      <h1 className="text-4xl md:text-5xl font-black mb-10 bg-gradient-to-r from-white to-purple-500 bg-clip-text text-transparent italic tracking-tighter">
        {title}
      </h1>
      <div className="space-y-6 text-gray-400 leading-relaxed text-lg border-l border-white/10 pl-8">
        {children}
      </div>
      <button 
        onClick={() => window.history.back()} 
        className="mt-12 text-purple-400 hover:text-purple-300 transition-colors font-bold uppercase tracking-widest text-[10px]"
      >
        &larr; Return to Terminal
      </button>
    </div>
  </div>
);

const Privacy = () => (
  <LegalLayout title="Privacy Policy">
    <p className="mono text-xs text-purple-500 mb-4 uppercase tracking-widest">Effective: Jan 2026</p>
    <h2 className="text-white text-xl font-bold">1. Neural Data Integrity</h2>
    <p>MetriaAI accesses Google Workspace data via secure OAuth. We utilize read-only permissions to ensure your source data remains untouched.</p>
    <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-gray-300 my-8">
      <strong className="text-white">Google API Compliance:</strong><br/>
      MetriaAI adheres to the Google API Services User Data Policy, including Limited Use requirements. We do not sell user data to third-party model trainers.
    </div>
    <h2 className="text-white text-xl font-bold mt-8">2. Data Erasure</h2>
    <p>Users maintain the "Right to be Forgotten." Disconnecting your integration immediately flushes session-based caches from our edge nodes.</p>
  </LegalLayout>
);

const Terms = () => (
  <LegalLayout title="Terms of Service">
    <h2 className="text-white text-xl font-bold">1. AI Synthesis Disclaimer</h2>
    <p>MetriaAI provides autonomous analysis. While our confidence scores are high, all AI-generated strategy should be reviewed by a human operator before capital allocation.</p>
    <h2 className="text-white text-xl font-bold mt-8">2. Usage Limits</h2>
    <p>The "Neural Engine" is designed for executive use. High-frequency automated scraping of the Metria terminal is strictly prohibited.</p>
  </LegalLayout>
);

const Contact = () => (
  <LegalLayout title="Neural Support">
    <p>For technical inquiries regarding API hooks, custom integrations, or billing, contact our engineering desk.</p>
    <div className="mt-10 p-8 rounded-[32px] bg-white/5 border border-white/5">
      <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-[10px] opacity-50">Direct Uplink</h3>
      <p className="text-purple-400 font-mono text-xl mb-6 select-all">mandlandhlovu264@gmail.com</p>
      <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-[10px] opacity-50">Global Response Time</h3>
      <p className="text-gray-400 text-sm">Typical latency for support queries is 24 hours.</p>
    </div>
  </LegalLayout>
);

/**
 * AppWrapper - Handles state logic and authenticated routing
 */
function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null); 
  const [loading, setLoading] = useState(true);

  // Initialize scroll reset
  useScrollToTop();

  const refetchProfile = () => {
    const savedProfile = localStorage.getItem("adt_profile");
    const savedToken = localStorage.getItem("adt_token"); 

    if (savedProfile && savedToken) {
      try {
        const userProfile = JSON.parse(savedProfile);
        setProfile({ ...userProfile, token: savedToken });
        return true;
      } catch (e) {
        console.error("Profile Parse Error:", e);
        return false;
      }
    }
    setProfile(null);
    return false;
  };

  const handleLoginSuccess = (userId, token) => { 
    const savedProfile = JSON.parse(localStorage.getItem("adt_profile"));
    const newProfile = { user_id: userId, email: savedProfile?.email || "User", token: token }; 
    setProfile(newProfile);
    navigate(`/dashboard/overview`);
  };

  useEffect(() => {
    refetchProfile(); 
    setLoading(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("adt_profile");
    localStorage.removeItem("adt_token"); 
    setProfile(null);
    navigate("/");
  };

  if (loading) return null;

  return (
    <Routes>
      {/* Landing Page */}
      <Route
        path="/"
        element={profile ? (
          <Navigate to="/dashboard/overview" replace />
        ) : (
          <Landing onGetStarted={() => navigate("/login")} /> 
        )}
      />

      {/* Auth */}
      <Route
        path="/login"
        element={profile ? (
          <Navigate to="/dashboard/overview" replace />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} /> 
        )}
      />

      {/* Dashboard Sub-Routes */}
      <Route
        path="/dashboard/*"
        element={profile ? (
          <Dashboard profile={profile} onLogout={handleLogout} refetchProfile={refetchProfile} /> 
        ) : (
          <Navigate to="/" replace />
        )}
      >
        <Route path="overview" element={<Dashboard.Overview profile={profile} />} />
        <Route path="analytics" element={<Dashboard.Analytics profile={profile} onLogout={handleLogout} />} />
        <Route 
          path="integrations" 
          element={
            <Dashboard.Integrations 
              profile={profile} 
              onLogout={handleLogout} 
              refetchProfile={refetchProfile} 
            />
          } 
        /> 
        <Route path="profile" element={<Dashboard.Profile profile={profile} />} />
        <Route path="trends" element={<Dashboard.Trends profile={profile} />} />
        <Route index element={<Navigate replace to="overview" />} />
      </Route>

      {/* Specialized Tools */}
      <Route
        path="/google-sheets-analysis"
        element={profile ? <GoogleSheetsAnalysis profile={profile} /> : <Navigate to="/" replace />}
      />

      {/* Static / Information Pages */}
      <Route path="/blog" element={<Blog />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Main Entry Point
 */
export default function App() {
  return (
    <div className="min-h-screen w-full bg-[#02010a] m-0 p-0 flex flex-col relative"> 
      <Router>
        <AppWrapper />
      </Router>
    </div>
  );
}