/**
 * components/Landing.js - CROSS-DEVICE VIEWPORT OPTIMIZED
 */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaChartLine, FaBrain, FaServer, FaWrench,
  FaArrowRight, FaRocket, FaShieldAlt,
  FaBars, FaTimes, FaPlus, FaMinus,
  FaCheckCircle, FaMicrochip, FaDatabase, FaMagic
} from "react-icons/fa";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

/* ---------------- DATA ---------------- */
const PRIMARY = "#a855f7";
const ACCENT = "#c026d3";
const DARK = "#02010a";

const SOLUTIONS = [
  { icon: <FaBrain />, title: "Executive Synthesis", desc: "MetriaAI turns complex datasets into actionable strategic briefings, risk alerts, and ROI opportunities." },
  { icon: <FaChartLine />, title: "Predictive Intelligence", desc: "Spot growth opportunities and stop churn before it impacts your P&L." },
  { icon: <FaDatabase />, title: "Zero-Setup Integration", desc: "Connect Google Sheets, SQL, or CSVs. Metria auto-maps your schema without manual data cleaning." },
  { icon: <FaMagic />, title: "Autonomous SQL", desc: "Metria writes its own queries to find answers. No more waiting for the data team to build reports." },
];

const FAQS = [
  { q: "How is Metria different from a dashboard tool like Tableau?", a: "Tableau shows you what happened; Metria tells you why it happened and what to do next. It is an autonomous agent that acts as a Lead Data Analyst, delivering finished strategy instead of just raw charts." },
  { q: "How secure is my data connection?", a: "Metria uses enterprise-grade AES-256 encryption. We utilize read-only access to your data streams, meaning your original data is never modified, only analyzed." },
  { q: "Can I use Metria for multi-dataset comparison?", a: "Yes. Our 'Comparison Mode' allows you to synthesize insights across multiple disparate datasets simultaneously to find cross-departmental correlations." }
];

const AI_HEAD_HERO = "/updated-metria-logo.png";
const AI_IMAGE_SERVICE = "/photo-1666875753105-c63a6f3bdc86.avif";

/* ---------------- STYLES ---------------- */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

* { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; scroll-behavior: smooth; }
.mono { font-family: 'JetBrains Mono', monospace; }

body { background: ${DARK}; overflow-x: hidden; color: white; margin: 0; }

.reveal { opacity: 0; transform: translateY(20px); transition: 1s cubic-bezier(0.2, 0.8, 0.2, 1); }
.reveal.show { opacity: 1; transform: none; }

.reveal-text {
  clip-path: polygon(0 0, 0 0, 0 100%, 0% 100%);
  transform: translateX(-15px);
  transition: clip-path 0.8s cubic-bezier(0.77, 0, 0.175, 1), transform 0.8s cubic-bezier(0.77, 0, 0.175, 1);
}

.reveal.show .reveal-text {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  transform: translateX(0);
}

.delay-1 { transition-delay: 0.2s; }
.delay-2 { transition-delay: 0.4s; }

.gradient-text {
  display: inline-block;
  background: linear-gradient(to right, #fff 20%, ${PRIMARY} 50%, ${ACCENT} 80%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: shine 4s linear infinite;
  padding-right: 0.35em;
  margin-right: -0.35em;
  padding-bottom: 0.1em;
  line-height: 1.1;
}

@keyframes shine { to { background-position: 200% center; } }

.glass-morphism {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-visual-container {
  position: relative;
  width: fit-content;
  border-radius: 40px;
  background: transparent;
  padding: 3px;
  margin: 0 auto;
  z-index: 1;
  overflow: hidden;
  box-shadow: 0 0 80px rgba(168, 85, 247, 0.2);
}

.hero-visual-container::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background: conic-gradient(from 0deg, transparent 0%, ${PRIMARY} 25%, ${ACCENT} 50%, transparent 75%);
  animation: scan-rotate 6s linear infinite;
  z-index: -1;
}

.hero-visual-container::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: ${DARK};
  border-radius: 38px;
  z-index: -1;
}

.hero-visual {
  display: block;
  max-height: 30vh; 
  width: auto;
  border-radius: 37px;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
  filter: contrast(1.1) brightness(1.1);
  animation: pulse-breathing 4s ease-in-out infinite;
  position: relative;
  z-index: 1;
  -webkit-mask-image: radial-gradient(circle, black 75%, rgba(0,0,0,0.5) 95%, transparent 100%);
  mask-image: radial-gradient(circle, black 75%, rgba(0,0,0,0.5) 95%, transparent 100%);
}

@media (min-width: 1024px) {
  .hero-visual { max-height: 65vh; }
}

.hero-visual-container:hover .hero-visual {
  transform: scale(1.06) rotate(1deg);
  filter: contrast(1.2) brightness(1.2);
}

@keyframes scan-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse-breathing {
  0%, 100% { transform: scale(1); opacity: 0.95; }
  50% { transform: scale(1.02); opacity: 1; }
}

.hero-fragment {
  position: absolute;
  width: 8px; height: 8px;
  background: ${PRIMARY};
  opacity: 0.5;
  border-radius: 2px;
  animation: float-fragments 6s linear infinite;
  z-index: 2;
}

@keyframes float-fragments {
  0% { transform: translate(0,0) rotate(0deg); }
  50% { transform: translate(-20px, 20px) rotate(180deg); opacity: 0.8; }
  100% { transform: translate(0,0) rotate(360deg); }
}

.marquee-container { display: flex; overflow: hidden; user-select: none; mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent); }
.marquee-content { display: flex; flex-shrink: 0; min-width: 100%; gap: 4rem; animation: scroll 30s linear infinite; }
@keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-100%); } }

.pricing-card { transition: 0.4s ease; border: 1px solid rgba(255,255,255,0.05); }
.pricing-card:hover { background: rgba(168, 85, 247, 0.05); border-color: ${PRIMARY}55; }

.animate-slideDown { animation: slideDown 0.3s ease-out forwards; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.animate-spin-slow { animation: spin-slow 8s linear infinite; }
`;

export default function Landing({ onGetStarted }) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("show");
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const particlesInit = engine => loadSlim(engine);

  return (
    <div className="min-h-screen bg-[#02010a]">
      <style>{styles}</style>

      <Particles
        init={particlesInit}
        options={{
          fullScreen: { enable: true, zIndex: 0 },
          particles: { 
            number: { value: 25 }, 
            color: { value: PRIMARY }, 
            links: { enable: true, opacity: 0.1, distance: 150, color: PRIMARY }, 
            move: { enable: true, speed: 0.4 }, 
            size: { value: 1.2 } 
          }
        }}
      />
      
      {/* HEADER */}
      <header className="fixed w-full z-[100] bg-[#02010a]/80 backdrop-blur-lg border-b border-white/5">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <FaRocket className="text-white text-xs" />
            </div>
            <span className="font-extrabold text-xl tracking-tighter uppercase">Metria</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-8 text-[10px] uppercase font-bold tracking-widest text-gray-400">
            <a href="#solutions" className="hover:text-white transition-colors">The Engine</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">Documentation</a>
          </div>

          <button 
            onClick={onGetStarted} 
            className="hidden md:block text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 glass-morphism rounded-xl hover:bg-white/10 transition-all"
          >
            Access Terminal
          </button>

          {/* Mobile Toggle */}
          <button className="md:hidden text-2xl text-white p-2 relative z-[110]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </nav>

        {/* MOBILE MENU OVERLAY */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-[#02010a] z-[105] flex flex-col items-center justify-center gap-8 animate-slideDown md:hidden">
            <a href="#solutions" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase tracking-tighter hover:text-purple-500 transition-colors">The Engine</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase tracking-tighter hover:text-purple-500 transition-colors">Pricing</a>
            <a href="#faq" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase tracking-tighter hover:text-purple-500 transition-colors">Documentation</a>
            <button 
              onClick={() => { onGetStarted(); setIsMenuOpen(false); }} 
              className="mt-4 text-[12px] font-bold uppercase tracking-widest px-8 py-4 bg-white text-black rounded-xl"
            >
              Access Terminal
            </button>
          </div>
        )}
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative h-[100svh] min-h-[600px] flex items-center px-6 md:px-12 pt-12 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full relative z-10">
          
          <div className="reveal flex justify-center items-center relative order-1 lg:order-2">
            <div className="absolute -inset-10 lg:-inset-20 bg-purple-600/10 blur-[60px] lg:blur-[120px] rounded-full" />
            <div className="hero-visual-container">
              <img src={AI_HEAD_HERO} className="hero-visual" alt="Metria Core Visual" />
              {[...Array(6)].map((_, i) => (
                <span 
                  key={i} 
                  className="hero-fragment hidden lg:block" 
                  style={{ 
                    top: `${15 + Math.random() * 70}%`, 
                    left: `${15 + Math.random() * 70}%`,
                    animationDelay: `${i * 0.4}s`
                  }} 
                />
              ))}
            </div>
          </div>

          <div className="reveal text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold mb-4 tracking-widest uppercase reveal-text mx-auto lg:mx-0">
               <FaMicrochip className="animate-spin-slow" /> Metria Neural Engine Active
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.05] mb-4 tracking-tighter reveal-text delay-1">
              Decisions. <br />
              <span className="gradient-text italic">Automated.</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white max-w-2xl mb-10 leading-relaxed reveal-text delay-2 mx-auto lg:mx-0">
              MetriaAI - the autonomous AI data analyst that eliminates manual analysis. Just import your business data and let Metria deliver executive-ready insights in seconds.
            </p>
            <div className="flex justify-center lg:justify-start reveal-text delay-2">
              <button onClick={onGetStarted} className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-xl font-black text-[14px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20">
                Get Metria <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST MARQUEE */}
      <div className="py-10 border-y border-white/5 bg-black/20 relative z-10">
        <div className="marquee-container">
          <div className="marquee-content">
            {["SOC2_COMPLIANT", "ENCRYPTED_DATA_NODES", "ISO_27001_READY", "GDPR_ENFORCED", "REALTIME_SYNTHESIS"].map((text, i) => (
              <div key={i} className="flex items-center gap-4 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <FaShieldAlt className="text-lg" />
                <span className="text-xl font-bold tracking-tighter italic uppercase">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. FEATURE GRID */}
      <section id="solutions" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 reveal relative min-h-[450px] overflow-hidden rounded-[32px] group">
              <img src={AI_IMAGE_SERVICE} className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105" alt="Neural Hub" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-12 flex flex-col justify-end">
                <h3 className="text-3xl font-bold mb-4 reveal-text">Neural Context Mapping</h3>
                <p className="text-gray-300 max-w-sm mb-6 reveal-text delay-1">Connect your industry-specific data and let MetriaAI map correlations across marketing, sales, and operations automatically.</p>
                <div className="flex gap-2 reveal-text delay-2">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur text-[10px] font-bold rounded-full uppercase tracking-widest">Confidence Score: 98.4%</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {SOLUTIONS.slice(0, 2).map((s, i) => (
                <div key={i} className="reveal glass-morphism p-8 rounded-[32px] pricing-card flex-1">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 text-xl mb-6">{s.icon}</div>
                  <h4 className="text-xl font-bold mb-2 reveal-text">{s.title}</h4>
                  <p className="text-gray-400 text-sm reveal-text delay-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 italic reveal-text">Executive Plans.</h2>
            <p className="text-gray-500 max-w-lg mx-auto uppercase text-xs font-bold tracking-widest reveal-text delay-1">Unleash the full power of autonomous data strategy.</p>
          </div>
          <div className="flex justify-center">
            <div className="reveal w-full max-w-lg p-12 rounded-[40px] glass-morphism pricing-card border-purple-500/40 relative">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest">Most Advanced AI</span>
              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold mb-4 tracking-tight reveal-text">Metria Pro Terminal</h3>
                <div className="flex items-center justify-center reveal-text delay-1">
                  <span className="text-7xl font-black">$89</span>
                  <span className="text-gray-500 text-lg ml-2">/mo</span>
                </div>
              </div>
              <div className="space-y-5 mb-12">
                {[
                  "Multi Data Source ingestion",
                  "Autonomous SQL & Python Generation",
                  "Comparison Mode Analytics",
                  "Automated PDF Executive Briefings",
                  "Direct Slack Intelligence Alerts",
                  "Priority Neural Core Access"
                ].map((f, j) => (
                  <div key={j} className="flex items-center gap-4 text-gray-300 reveal-text" style={{ transitionDelay: `${0.1 * j}s` }}>
                    <FaCheckCircle className="text-purple-500 shrink-0" /> 
                    <span className="text-sm font-medium">{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={onGetStarted} className="w-full py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:invert transition-all">
                Hire Your AI Analyst Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section id="faq" className="py-32 px-6 bg-black/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black tracking-tighter mb-12 italic text-center reveal-text">Operations FAQ.</h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b border-white/5 reveal">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full py-6 flex justify-between items-center text-left hover:text-purple-400 transition-colors"
                >
                  <span className="font-bold tracking-tight reveal-text">{faq.q}</span>
                  {activeFaq === i ? <FaMinus className="text-xs" /> : <FaPlus className="text-xs" />}
                </button>
                {activeFaq === i && (
                  <div className="pb-6 text-gray-400 text-sm leading-relaxed animate-slideDown">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 border-t border-white/5 bg-black/40 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <FaRocket className="text-white text-xs" />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase text-white">MetriaAI</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Neural Engine Operational</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-12 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 relative z-50">
            <Link to="/privacy" className="hover:text-purple-400 transition-all duration-300">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-purple-400 transition-all duration-300">Terms of Service</Link>
            <Link to="/contact" className="hover:text-purple-400 transition-all duration-300">Contact Support</Link>
            <a href="#solutions" className="hover:text-purple-400 transition-all duration-300">The Engine</a>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] text-gray-600 font-mono tracking-[0.3em] uppercase text-center">
              © {new Date().getFullYear()} Metria Neural Systems — The Future of Decision Intelligence.
            </p>
            <div className="flex gap-4 opacity-20">
              <FaShieldAlt className="text-white text-sm" />
              <FaDatabase className="text-white text-sm" />
              <FaServer className="text-white text-sm" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}