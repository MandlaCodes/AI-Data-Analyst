/**
 * components/Blog.js - The MetriaAI Neural Strategy Manifesto
 */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaRocket, FaLightbulb, FaShieldAlt } from "react-icons/fa";

export default function Blog() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      const currentScroll = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((currentScroll / scrollHeight) * 100);
    };
    window.addEventListener("scroll", updateScroll);
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#02010a] text-white selection:bg-purple-500/30 font-sans antialiased">
      {/* Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[2px] bg-purple-500 z-[110] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Nav */}
      <nav className="fixed w-full z-[100] bg-[#02010a]/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 text-gray-400 hover:text-white transition-all group">
            <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit to Terminal</span>
          </Link>
          
          {/* Logo integration */}
          <img src="/updated-metria-logo.png" alt="Metria Logo" className="h-5 md:h-7 object-contain opacity-90" />
          
          <div className="hidden md:block text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 animate-pulse">
            Neural Manifesto v1.0
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="max-w-4xl mx-auto px-6 pt-48 pb-10">
        <h1 className="text-6xl md:text-[110px] font-black tracking-tighter leading-[0.9] uppercase pb-6 italic">
          The Future<br/>
          <span className="text-purple-500 not-italic">Is Decided.</span>
        </h1>
        <p className="text-2xl md:text-4xl text-gray-400 font-light leading-tight mt-8">
          In an era of infinite noise, <span className="text-white font-medium italic underline decoration-purple-500 decoration-2 underline-offset-8">clarity is the only unfair advantage.</span> 
        </p>
      </header>

      {/* Main Image 1: The Vision */}
      <div className="max-w-5xl mx-auto px-6 mb-32">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[40px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <img 
            src="/blogpic1.jpg" 
            alt="The Vision" 
            className="relative w-full h-[400px] md:h-[600px] object-cover rounded-[40px] border border-white/10 shadow-2xl"
          />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 pb-32">
        
        <div className="space-y-32 text-gray-300 text-lg md:text-xl leading-relaxed">
          
          {/* THE PROVOCATION */}
          <section className="relative">
            <div className="absolute -left-10 top-0 w-1 h-full bg-gradient-to-b from-purple-500 to-transparent opacity-30 hidden md:block" />
            <p className="text-2xl md:text-3xl text-white font-bold mb-8 leading-snug">
              Most businesses are flying blind in a cockpit full of flashing lights.
            </p>
            <p className="mb-8 font-light">
              You collect data. You have spreadsheets. You have dashboards. But data isn't power—**understanding** is power. MetriaAI wasn't built to give you more charts; it was built to give you the one thing your business is starving for: <span className="text-purple-400 font-black uppercase tracking-tighter">Certainty.</span>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-12">
               {[
                "Executive intelligence", "Performance decoding", 
                "Risk pre-emption", "Tactical strategy", 
                "Revenue projections", "Neural trend tracking"
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-[11px] font-black text-white uppercase tracking-[0.2em] bg-white/5 p-4 rounded-xl border border-white/5">
                  <FaCheckCircle className="text-purple-500 shrink-0" /> {item}
                </div>
              ))}
            </div>
          </section>

          {/* THE DEFINITION */}
          <section>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-8 pb-4 leading-tight italic">
              01. The Neural Layer.
            </h2>
            <p className="mb-12">
              MetriaAI is your **Neural Strategy Layer**. It’s the bridge between raw, chaotic business information and the high-level decisions that define your future.
            </p>
            
            {/* Image 2: The Interface/Action */}
            <div className="mb-12 rounded-[30px] overflow-hidden border border-white/10 shadow-lg">
              <img src="/blogpic2.jpg" alt="Neural Interface" className="w-full object-cover" />
            </div>

            <div className="p-10 rounded-[40px] bg-gradient-to-br from-purple-600/20 via-[#02010a] to-black border border-purple-500/30">
              <p className="text-2xl font-black text-white uppercase mb-6 italic leading-none pb-2 tracking-tighter">The Terminal Philosophy:</p>
              <ul className="space-y-4 font-bold text-gray-300 uppercase text-sm tracking-widest">
                <li className="flex items-center gap-3"><FaLightbulb className="text-purple-500" /> No dashboard fatigue.</li>
                <li className="flex items-center gap-3"><FaShieldAlt className="text-purple-500" /> No guessing.</li>
                <li className="flex items-center gap-3"><FaRocket className="text-purple-500" /> Just aggressive growth.</li>
              </ul>
            </div>
          </section>

          {/* THE TARGET */}
          <section>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-8 pb-4 leading-tight italic">
              02. Who Needs This?
            </h2>
            <p className="mb-12">
              This isn't for those comfortable with "good enough." This is for the founders, the operators, and the scale-obsessed who understand that in 2026, **speed is the only currency.**
            </p>
            
            {/* Image 3: The Leaders */}
            <div className="mb-12">
               <img src="/blogpic3.jpg" alt="Strategic Leadership" className="w-full rounded-[40px] grayscale hover:grayscale-0 transition-all duration-1000 border border-white/5" />
            </div>

            <div className="space-y-12">
              <div className="border-b border-white/10 pb-8">
                <h4 className="text-purple-500 font-black uppercase text-xs tracking-[0.3em] mb-4">The Scalers</h4>
                <p className="text-white font-bold">E-commerce, SaaS, and Agencies that have data but lack the time to extract its secrets.</p>
              </div>
              <div className="border-b border-white/10 pb-8">
                <h4 className="text-purple-500 font-black uppercase text-xs tracking-[0.3em] mb-4">The Architects</h4>
                <p className="text-white font-bold">Founders who want to stop being "data entry clerks" and start being visionary architects.</p>
              </div>
            </div>
          </section>

          {/* THE ROI / OUTCOME */}
          <section>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-8 pb-4 leading-tight italic">
              03. The Outcome.
            </h2>
            
            {/* Image 4: The Result */}
            <div className="mb-12 rounded-[40px] overflow-hidden shadow-2xl shadow-purple-500/20">
              <img src="/blogpic4.jpg" alt="Business Growth" className="w-full h-auto" />
            </div>

            <p className="mb-12">
              Investing in MetriaAI isn't adding another subscription to your stack. It's installing an **Intelligence Layer** that protects your revenue and accelerates your vision.
            </p>
            <div className="text-center space-y-12">
               <div className="text-5xl md:text-8xl font-black text-white leading-none uppercase tracking-tighter">
                  <div className="pb-4">Better Leadership.</div>
                  <div className="pb-4">Better Strategy.</div>
                  <div className="pb-4 text-purple-500">Total Domination.</div>
               </div>
            </div>
          </section>

          {/* FINAL CALL */}
          <section className="pt-24 border-t border-white/10 text-center">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-500 mb-8">System Ready</h4>
            <p className="text-3xl md:text-6xl font-black tracking-tighter leading-tight mb-16 pb-4 italic">
              The tools of the past cannot build the future. 
            </p>
            <Link to="/login" className="group relative inline-flex items-center gap-6 px-16 py-8 bg-white text-black rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-2xl">
              Initialize Metria Core <FaRocket className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </section>

        </div>
      </main>

      <footer className="py-20 px-6 border-t border-white/5 text-center opacity-40">
        <div className="text-[10px] font-black uppercase tracking-[0.5em]">
          Metria Neural Systems — A New Paradigm. © 2026
        </div>
      </footer>
    </div>
  );
}