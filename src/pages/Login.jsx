import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaBuilding, FaBriefcase, FaArrowRight } from "react-icons/fa";
import { FiLoader, FiCheckCircle, FiMail, FiChevronDown } from "react-icons/fi";

const INDUSTRIES = [
  "Finance & Banking", "Healthcare", "E-commerce",
  "SaaS & Tech", "Manufacturing", "Marketing", "Other"
];

export default function Login({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "", password: "", firstName: "", lastName: "", org: "", industry: ""
  });
  const [status, setStatus] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignup && step === 1) {
      setStep(2);
      return;
    }

    setStatus({ message: "Synchronizing...", type: "info" });
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
        setStatus({ message: data.detail || data.error || "Access Denied.", type: "error" });
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
      } else {
        throw new Error("Invalid Response Map");
      }
    } catch (err) {
      setStatus({ message: "Core Connection Failed.", type: "error" });
    }
  };

  return (
    <div className="login-page-container min-h-screen w-full flex bg-[#0a0118] text-white font-sans overflow-hidden">
      {isLoggedIn && (
        <div className="fixed inset-0 z-[100] bg-[#0a0118] flex flex-col items-center justify-center animate-in fade-in duration-500">
          <FiCheckCircle size={80} className="text-purple-500 animate-bounce" />
          <h2 className="text-5xl font-black mt-6 tracking-tighter uppercase italic">Identity Verified</h2>
          <p className="text-slate-500 font-mono text-sm mt-2">CONFIGURING ANALYST WORKBENCH...</p>
        </div>
      )}

      <div className="hidden lg:flex relative w-1/2 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black z-10" />
        <div className="absolute top-[-10%] right-[-10%] w-full h-full border-[1px] border-purple-500/20 rounded-full rotate-12" />
        <div className="relative z-20 text-center space-y-8">
          <h2 className="text-7xl font-black italic tracking-tighter leading-none">METRIA<span className="text-purple-500">AI.</span></h2>
          <p className="text-slate-400 font-medium italic tracking-wide">Next-generation autonomous data intelligence.</p>
          <button
            onClick={() => { setIsSignup(!isSignup); setStep(1); setStatus(null); }}
            className="px-12 py-4 border border-white/10 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all"
          >
            {isSignup ? "Switch to Login" : "Initialize Account"}
          </button>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#1a0b2e]/50 backdrop-blur-xl">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">
              {isSignup ? (step === 1 ? "Start Journey" : "Build Profile") : "Welcome Back"}
            </h1>
            <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">
              {isSignup ? `Step ${step} of 2` : "Secure Terminal Access"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignup && step === 2 ? (
              <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/50" />
                    <input name="firstName" placeholder="First Name" onChange={handleChange} required className="w-full bg-white/5 border-b border-white/10 p-4 pl-12 rounded-t-xl outline-none focus:border-purple-500 transition-all" />
                  </div>
                  <div className="relative">
                    <input name="lastName" placeholder="Last Name" onChange={handleChange} required className="w-full bg-white/5 border-b border-white/10 p-4 rounded-t-xl outline-none focus:border-purple-500 transition-all" />
                  </div>
                </div>
                <div className="relative">
                  <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/50" />
                  <input name="org" placeholder="Organization Name" onChange={handleChange} required className="w-full bg-white/5 border-b border-white/10 p-4 pl-12 outline-none focus:border-purple-500 transition-all" />
                </div>
                <div className="relative">
                  <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/50" />
                  <select name="industry" onChange={handleChange} required className="w-full bg-white/5 border-b border-white/10 p-4 pl-12 appearance-none outline-none focus:border-purple-500 transition-all">
                    <option value="" className="bg-[#1a0b2e]">Select Industry</option>
                    {INDUSTRIES.map(ind => <option key={ind} value={ind} className="bg-[#1a0b2e]">{ind}</option>)}
                  </select>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-500">
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" />
                  <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required className="w-full bg-white/5 border-b border-white/10 p-4 pl-12 rounded-t-xl outline-none focus:border-purple-500 transition-all" />
                </div>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" />
                  <input type="password" name="password" placeholder="Password" onChange={handleChange} required className="w-full bg-white/5 border-b border-white/10 p-4 pl-12 rounded-t-xl outline-none focus:border-purple-500 transition-all" />
                </div>
              </div>
            )}

            <button type="submit" className="w-full group flex items-center justify-center gap-3 py-5 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-purple-600 hover:text-white transition-all shadow-xl shadow-purple-500/10">
              {status?.type === "info" ? <FiLoader className="animate-spin" size={20} /> : (
                <>
                  {isSignup ? (step === 1 ? "Next: Profile" : "Finalize Identity") : "Enter Terminal"}
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {status && (
            <div className={`text-center font-bold text-[10px] uppercase tracking-widest ${status.type === 'error' ? 'text-red-500' : 'text-purple-400'}`}>
              {status.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}