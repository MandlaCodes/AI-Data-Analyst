import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaBuilding, FaBriefcase, FaArrowRight, FaShieldAlt, FaArrowLeft, FaDesktop } from "react-icons/fa";
import { FiLoader, FiCheckCircle, FiMail, FiChevronDown } from "react-icons/fi";

const INDUSTRIES = [
  "Finance & Banking", "Healthcare", "E-commerce",
  "SaaS & Tech", "Manufacturing", "Marketing", "Fitness", "Fashion", "Warehouse", "Real Estate"
];

export default function Login({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "", password: "", firstName: "", lastName: "", org: "", industry: ""
  });
  const [status, setStatus] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      const response = await fetch(`https://ai-data-analyst-backend-1nuw.onrender.com${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus({ message: data.detail || data.error || "Login Failed.", type: "error" });
        return;
      }

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
      setStatus({ message: "Network Error. Please try again.", type: "error" });
    }
  };

  const pageStyles = `
    body, html {
      margin: 0;
      padding: 0;
      overflow-x: hidden !important;
      min-height: 100vh;
      background-color: #02010a;
    }
    @keyframes pulse-slow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }
    /* Premium Smooth Reveal */
    @keyframes premium-reveal {
      from { 
        opacity: 0; 
        transform: translateY(30px) scale(0.98); 
        filter: blur(10px);
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
        filter: blur(0);
      }
    }
    .animate-premium {
      animation: premium-reveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .stagger-1 { animation-delay: 0.1s; opacity: 0; }
    .stagger-2 { animation-delay: 0.2s; opacity: 0; }
    .stagger-3 { animation-delay: 0.3s; opacity: 0; }

    .bg-grid {
      background-size: 40px 40px;
      background-image: radial-gradient(circle, rgba(168, 85, 247, 0.1) 1px, transparent 1px);
    }
    .input-focus-effect:focus-within {
      box-shadow: 0 0 20px rgba(168, 85, 247, 0.15);
      border-color: rgba(168, 85, 247, 0.5);
    }
  `;

  return (
    <div className="min-h-screen w-full flex bg-[#02010a] text-white font-sans relative overflow-hidden">
      <style>{pageStyles}</style>
      
      {isLoggedIn && (
        <div className="fixed inset-0 z-[100] bg-[#02010a] flex flex-col items-center justify-center animate-in fade-in duration-700">
          <div className="relative">
             <div className="absolute inset-0 blur-2xl bg-purple-500/50 animate-pulse" />
             <FiCheckCircle size={100} className="text-purple-400 relative z-10" />
          </div>
          <h2 className="text-5xl font-black mt-8 tracking-tighter uppercase italic">Success</h2>
          <p className="text-purple-500/60 font-mono text-xs mt-4 tracking-[0.5em] animate-pulse">OPENING DASHBOARD...</p>
        </div>
      )}

      {/* DESKTOP LEFT PANEL */}
      <div className="hidden lg:flex relative w-1/2 h-screen items-center justify-center overflow-hidden border-r border-white/5 bg-grid sticky top-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="relative z-20 text-center px-12 animate-premium stagger-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-400 text-[9px] font-bold uppercase tracking-[0.2em] mb-8">
            <FaShieldAlt className="animate-pulse" /> Secure Connection
          </div>
          <h2 className="text-8xl font-black italic tracking-tighter leading-none mb-6">
            METRIA<span className="text-purple-500">.</span>
          </h2>
          <p className="text-slate-400 text-lg font-medium italic tracking-wide mb-12 max-w-sm mx-auto">
            Advanced AI for your business data. Simple, fast, and powerful.
          </p>
          <button
            onClick={() => { setIsSignup(!isSignup); setStep(1); setStatus(null); }}
            className="group px-10 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500"
          >
            {isSignup ? "Go to Login" : "Create an Account"}
          </button>
        </div>
      </div>

      {/* FORM RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-0 relative py-20 lg:py-0">
        <div 
          key={isSignup ? `signup-${step}` : "login"} 
          className="w-full max-w-md space-y-8 relative z-10 px-8 animate-premium stagger-2"
        >
          
          {/* MOBILE OPTIMIZATION NOTICE */}
          <div className="lg:hidden flex items-center gap-4 p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl mb-8">
            <FaDesktop className="text-purple-500 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-relaxed">
              Experience is <span className="text-purple-400">optimized for desktop</span>. Smaller screens may limit advanced visualizer features.
            </p>
          </div>

          {/* Back button for Sign Up Step 2 */}
          {isSignup && step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-purple-500 transition-colors mb-4"
            >
              <FaArrowLeft /> Back
            </button>
          )}

          <div className="space-y-3">
            <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">
              {isSignup ? "Sign Up" : "Login"}
            </h1>
            <div className="h-1 w-12 bg-purple-500" />
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.3em]">
              {isSignup ? `Step ${step} of 2` : "Enter your details below"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && step === 2 ? (
              <div className="space-y-4">
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
                  <input 
                    id="organization_name_input"
                    name="org" 
                    placeholder="COMPANY NAME" 
                    autoComplete="off"
                    value={formData.org} 
                    onChange={handleChange} 
                    required 
                    className="w-full bg-transparent p-4 pl-12 text-xs font-bold outline-none placeholder:text-white/20" 
                  />
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
              <div className="space-y-4">
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
                  {isSignup ? (step === 1 ? "Next Step" : "Create Account") : "Login Now"}
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {status && (
            <div className={`text-center font-mono text-[10px] uppercase tracking-[0.1em] p-3 border border-current/20 rounded-lg animate-in fade-in slide-in-from-top-2 ${status.type === 'error' ? 'text-red-500 bg-red-500/5' : 'text-purple-400 bg-purple-400/5'}`}>
              {status.message}
            </div>
          )}

          {/* MOBILE TOGGLE CTA */}
          <div className="text-center lg:hidden pt-4 pb-12 stagger-3 animate-premium">
             <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setStep(1); setStatus(null); }}
              className="px-6 py-3 border border-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-purple-400 transition-all bg-white/5"
            >
              {isSignup ? "Have an account? Login" : "No account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}