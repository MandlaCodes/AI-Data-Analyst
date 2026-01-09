/**
 * components/Blog.js - Modern Editorial Business Strategy Manifesto
 */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FaArrowLeft, FaCheckCircle, FaRocket, FaBullseye, FaArrowRight, FaQuestionCircle 
} from "react-icons/fa";

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
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-transparent z-[110] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Nav */}
      <nav className="fixed w-full z-[100] bg-[#02010a]/60 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all">
            <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Terminal</span>
          </Link>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500">
            Manifesto <span className="text-white/20 mx-2">|</span> v1.0
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative pt-48 pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent -z-10 opacity-50" />
        
        <div className="max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-[110px] font-black tracking-tight leading-[0.85] mb-12 uppercase italic">
            MetriaAI:<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/30 not-italic">Neural Strategy.</span>
          </h1>
          <p className="max-w-3xl text-xl md:text-3xl text-gray-400 font-light leading-snug">
            Businesses collect more data than ever… but most of it never turns into clear decisions. <span className="text-white font-medium">MetriaAI changes that.</span>
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 pb-32">
        
        {/* Left Sticky Sidebar */}
        <aside className="lg:col-span-4 lg:sticky lg:top-32 lg:h-fit">
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">The Core Mission</h3>
            </div>
            <p className="text-lg text-white font-bold leading-tight mb-6">
              Transforming raw spreadsheets into executive-ready intelligence.
            </p>
            <div className="space-y-3">
               {[
                "Executive summaries", "Risk assessments", "Growth opportunities", 
                "Actionable strategy", "Revenue impact", "Trend tracking"
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <FaCheckCircle className="text-purple-600 text-xs" /> {item}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-32">
          
          {/* SECTION 1: WHAT IS IT? */}
          <section>
            <div className="flex items-center gap-4 mb-12">
              <span className="text-purple-500 font-mono text-sm">01</span>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">The Intelligence Layer</h2>
            </div>
            <div className="space-y-8 text-gray-400 text-xl leading-relaxed">
              <p>
                MetriaAI is an AI-powered business assistant that tells you <span className="text-white underline decoration-purple-500 underline-offset-8">what is happening, why it’s happening, and what you should do next.</span>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["Plain-English insights", "Strategic decisions", "Clear next steps", "Autonomous synthesis"].map(q => (
                  <div key={q} className="bg-white/[0.03] p-6 rounded-2xl border border-white/5">
                    <p className="text-sm font-black text-white uppercase tracking-widest">{q}</p>
                  </div>
                ))}
              </div>

              <div className="p-10 rounded-[32px] bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/20">
                <p className="text-2xl font-medium text-white mb-6">A senior data analyst + strategy consultant in one AI platform.</p>
                <div className="flex flex-wrap gap-6 font-mono text-[10px] text-purple-400 uppercase tracking-[0.2em]">
                  <span>[ NO CODING ]</span>
                  <span>[ NO DASHBOARD OVERLOAD ]</span>
                  <span className="text-white underline">JUST ANSWERS.</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: THE PAIN */}
          <section className="relative">
             <div className="flex items-center gap-4 mb-12">
              <span className="text-purple-500 font-mono text-sm">02</span>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">The Pain We Solve</h2>
            </div>
            <div className="bg-white text-black p-12 rounded-[48px] space-y-8">
              <p className="text-2xl font-black leading-tight uppercase">Most businesses have data… but not clarity.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm font-bold uppercase tracking-tight opacity-80">
                <div>• GA4 feels overwhelming</div>
                <div>• Opportunities get missed</div>
                <div>• Reports take hours</div>
                <div>• Problems discovered too late</div>
                <div>• Decisions based on guessing</div>
                <div>• Analysts are too expensive</div>
              </div>
              <div className="pt-8 border-t border-black/10">
                <p className="text-purple-600 font-black uppercase text-xs tracking-[0.2em] mb-4">The Result:</p>
                <p className="text-2xl font-black tracking-tighter">MetriaAI replaces confusion with confidence, turning static numbers into tactical strategy.</p>
              </div>
            </div>
          </section>

          {/* SECTION 3: WHO IS IT FOR? */}
          <section>
             <div className="flex items-center gap-4 mb-12">
              <span className="text-purple-500 font-mono text-sm">03</span>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">Built For Growth</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-purple-500 font-black uppercase text-xs tracking-widest">Ideal Users:</h4>
                <ul className="space-y-4 text-xl font-bold text-white">
                  <li>• E-commerce store owners</li>
                  <li>• Marketing agencies</li>
                  <li>• Startups & SMEs</li>
                  <li>• Ops & Growth teams</li>
                </ul>
              </div>
              <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5">
                <h4 className="text-gray-500 font-black uppercase text-xs tracking-widest mb-4 text-center">The Selection Criteria</h4>
                <p className="text-sm text-gray-400 leading-relaxed text-center italic">
                  "If you have data but don’t have time to analyze it, or want recommendations instead of charts, MetriaAI is built for you."
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4: THE VALUE (WHY PAY?) */}
          <section>
             <div className="flex items-center gap-4 mb-12">
              <span className="text-purple-500 font-mono text-sm">04</span>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">The Bottom Line</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {[
                "Uncover missed revenue", "Identify failing trends", "Optimize sales strategy", 
                "Reduce costly mistakes", "Make faster decisions", "Cut consultant costs"
              ].map(val => (
                <div key={val} className="group p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-purple-600 transition-all duration-500">
                  <div className="flex items-center gap-4">
                    <FaBullseye className="text-purple-500 group-hover:text-white transition-colors" />
                    <span className="text-xs font-black uppercase tracking-widest group-hover:text-white">{val}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center space-y-6">
               <p className="text-5xl font-black tracking-tighter italic">You aren't paying for "another tool".</p>
               <p className="text-xl text-gray-500 uppercase tracking-widest">You are paying for:</p>
               <div className="text-4xl md:text-6xl font-black text-white uppercase leading-[0.85]">
                  Better Leadership. <br/>
                  Better Strategy. <br/>
                  Better Outcomes.
               </div>
            </div>
          </section>

          {/* Final Call to Action */}
          <section className="pt-24 border-t border-white/10 text-center">
             <p className="text-2xl md:text-4xl font-black tracking-tighter leading-tight mb-12">
                MetriaAI transforms business data into clear strategy — helping companies make smarter, faster, more confident decisions.
              </p>
              <Link to="/login" className="inline-flex items-center gap-4 px-12 py-6 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:bg-purple-600 hover:text-white transition-all shadow-2xl">
                Initialize Metria Engine <FaRocket />
              </Link>
          </section>

        </div>
      </main>

      <footer className="py-20 px-6 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
          <div>Metria Neural Systems © 2026</div>
          <div className="flex gap-8">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}