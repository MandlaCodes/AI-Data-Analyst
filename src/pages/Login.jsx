/**
 * components/Login.js - AUTH + ACTIVATION SYSTEM
 * Integration: Polar Checkout redirect with optimized state handling
 */
import React, { useState } from "react";
import { FaUser, FaLock, FaBuilding, FaBriefcase, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import { FiLoader, FiCheckCircle, FiMail, FiChevronDown, FiCreditCard } from "react-icons/fi";

const INDUSTRIES = [
  "Finance & Banking", "Healthcare", "E-commerce",
  "SaaS & Tech", "Manufacturing", "Marketing", "Fitness", "Fashion", "Warehouse", "Real Estate"
];

const BACKEND_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

export default function Login({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "", password: "", firstName: "", lastName: "", org: "", industry: ""
  });
  const [status, setStatus] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Step transition for Signup
    if (isSignup && step === 1) {
      setStep(2);
      return;
    }

    setStatus({ message: "Connecting to system...", type: "info" });
    
    try {
      const endpoint = isSignup ? "/auth/signup" : "/auth/login";
      const payload = isSignup ? {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        organization: formData.org,
        industry: formData.industry
      } : { email: formData.email, password: formData.password };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus({ message: data.detail || data.error || "Action Failed.", type: "error" });
        return;
      }

      // --- SIGNUP FLOW: TRIGGER POLAR CHECKOUT ---
      if (isSignup) {
        setStatus({ message: "Account Created. Initializing Secure Checkout...", type: "info" });
        setIsRedirecting(true);

        const checkoutRes = await fetch(`${BACKEND_URL}/payments/create-checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email })
        });

        const checkoutData = await checkoutRes.json();
        
        if (checkoutData.url) {
          // Use replace to ensure they don't loop back to the form on "Back" button
          window.location.replace(checkoutData.url);
          return;
        } else {
          setStatus({ message: "Checkout failed to initialize. Please login to retry.", type: "error" });
          setIsRedirecting(false);
          return;
        }
      }

      // --- LOGIN FLOW ---
      if (data.token) {
        localStorage.setItem("adt_token", data.token);
        if (data.user) {
          localStorage.setItem("adt_profile", JSON.stringify(data.user));
        }
        setIsLoggedIn(true);
        setTimeout(() => {
          onLoginSuccess(data.user_id, data.token);
        }, 1500);
      }
    } catch (err) {
      setStatus({ message: "Network Error. Verify your connection.", type: "error" });
    }
  };

  const pageStyles = `
    body, html { margin: 0; padding: 0; overflow: hidden !important; height: 100vh; width: 100vw; background-color: #02010a; }
    @keyframes pulse-slow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
    .bg-grid { background-size: 40px 40px; background-image: radial-gradient(circle, rgba(168, 85, 247, 0.1) 1px, transparent 1px); }
    .input-focus-effect:focus-within { box-shadow: 0 0 20px rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.5); }
  `;

  return (
    <div className="h-screen w-screen flex bg-[#02010a] text-white font-sans overflow-hidden fixed inset-0">
      <style>{pageStyles}</style>
      
      {/* Overlay for Success or Redirecting State */}
      {(isLoggedIn || isRedirecting) && (
        <div className="fixed inset-0 z-[100] bg-[#02010a] flex flex-col items-center justify-center animate-in fade-in duration-700">
          <div className="relative">
             <div className="absolute inset-0 blur-2xl bg-purple-500/50 animate-pulse" />
             {isRedirecting ? 
              <FiCreditCard size={100} className="text-purple-400 relative z-10 animate-bounce" /> :
              <FiCheckCircle size={100} className="text-purple-400 relative z-10" />
             }
          </div>
          <h2 className="text-5xl font-black mt-8 tracking-tighter uppercase italic">
            {isRedirecting ? "Activate" : "Success"}
          </h2>
          <p className="text-purple-500/60 font-mono text-xs mt-4 tracking-[0.5em] animate-pulse">
            {isRedirecting ? "SECURE CHECKOUT INITIALIZING..." : "OPENING DASHBOARD..."}
          </p>
        </div>
      )}

      {/* Left Branding Panel */}
      <div className="hidden lg:flex relative w-1/2 h-full items-center justify-center overflow-hidden border-r border-white/5 bg-grid">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="relative z-20 text-center px-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-400 text-[9px] font-bold uppercase tracking-[0.2em] mb-8">
            <FaShieldAlt className="animate-pulse" /> Secure 256-bit Connection
          </div>
          <h2 className="text-8xl font-black italic tracking-tighter leading-none mb-6">
            METRIA<span className="text-purple-500">.</span>
          </h2>
          <p className="text-slate-400 text-lg font-medium italic tracking-wide mb-12 max-w-sm mx-auto">
            Advanced AI for your business data. Deploy your analyst in seconds.
          </p>
          <button
            onClick={() => { setIsSignup(!isSignup); setStep(1); setStatus(null); }}
            className="group px-10 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500"
          >
            {isSignup ? "Existing Member? Login" : "New? Hire Your Analyst"}
          </button>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-0 relative">
        <div className="w-full max-w-md space-y-8 relative z-10 px-8">
          <div className="space-y-3">
            <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">
              {isSignup ? "Sign Up" : "Login"}
            </h1>
            <div className="h-1 w-12 bg-purple-500" />
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.3em]">
              {isSignup ? `Step ${step} of 2` : "Identification Required"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && step === 2 ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group input-focus-effect border border-white/10 bg-white/5 rounded-xl overflow-hidden transition-all">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/40 group-focus-within:text-purple-500 transition-colors" />
                    <input name="firstName" placeholder="FIRST NAME" value={formData.firstName} onChange={handleChange} required className="w-full bg-transparent p-4 pl-12 text-xs font-bold outline-none placeholder:text-white/20" />
                  </div>
                  <div className="relative group input-focus-effect border border-white/10 bg-white/5 rounded-xl overflow-hidden transition-all">
                    <input name="lastName" placeholder="LAST NAME" value={formData.lastName} onChange={handleChange} required className="w-full bg-transparent p-4 text-xs font-bold outline-none placeholder:text-white/20" />
                  </div>
                </div>
                <div className="relative group input-focus-effect border border-white/10 bg-white/5 rounded-xl overflow-hidden transition-all">
                  <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/40 group-focus-within:text-purple-500 transition-colors" />
                  <input id="org" name="org" placeholder="COMPANY NAME" autoComplete="off" value={formData.org} onChange={handleChange} required className="w-full bg-transparent p-4 pl-12 text-xs font-bold outline-none placeholder:text-white/20" />
                </div>
                <div className="relative group input-focus-effect border border-white/10 bg-white/5 rounded-xl overflow-hidden transition-all">
                  <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/40 group-focus-within:text-purple-500 transition-colors" />
                  <select name="industry" value={formData.industry} onChange={handleChange} required className="w-full bg-transparent p-4 pl-12 text-xs font-bold appearance-none outline-none text-white/50 focus:text-white transition-all">
                    <option value="" className="bg-[#02010a]">SELECT INDUSTRY</option>
                    {INDUSTRIES.map(ind => <option key={ind} value={ind} className="bg-[#02010a]">{ind.toUpperCase()}</option>)}
                  </select>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="relative group input-focus-effect border border-white/10 bg-white/5 rounded-xl overflow-hidden transition-all">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/40 group-focus-within:text-purple-500 transition-colors" />
                  <input type="email" name="email" value={formData.email} placeholder="EMAIL ADDRESS" onChange={handleChange} required className="w-full bg-transparent p-5 pl-12 text-xs font-bold outline-none placeholder:text-white/20" />
                </div>
                <div className="relative group input-focus-effect border border-white/10 bg-white/5 rounded-xl overflow-hidden transition-all">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/40 group-focus-within:text-purple-500 transition-colors" />
                  <input type="password" name="password" value={formData.password} placeholder="PASSWORD" onChange={handleChange} required className="w-full bg-transparent p-5 pl-12 text-xs font-bold outline-none placeholder:text-white/20" />
                </div>
              </div>
            )}

            <button type="submit" className="w-full group relative flex items-center justify-center gap-3 py-5 bg-purple-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-300 shadow-2xl shadow-purple-500/20">
              {status?.type === "info" ? <FiLoader className="animate-spin" size={18} /> : (
                <>
                  {isSignup ? (step === 1 ? "Next Step" : "Hire Your AI Analyst") : "Authorized Login"}
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {status && (
            <div className={`text-center font-mono text-[10px] uppercase tracking-[0.1em] p-3 border border-current/20 rounded-lg ${status.type === 'error' ? 'text-red-500 bg-red-500/5' : 'text-purple-400 bg-purple-400/5'}`}>
              {status.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}