// src/pages/Landing.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Contact from "./Contact";
import { FaChartLine, FaLightbulb, FaDesktop, FaQuestionCircle, FaStar, FaPlus, FaCodeBranch, FaServer, FaCogs, FaBrain, FaWrench } from "react-icons/fa"; // Updated icons for data focus
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

/* ---------- Configs ---------- */
const PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1508780709619-79562169bc64?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1400&q=80",
];

// ************************************************
// TRANSFORMED CONFIGS: Focused on AI Data Analysis
// ************************************************
const SOLUTIONS = [
  { icon: <FaBrain className="text-white/20 text-3xl mb-4" />, title: 'Predictive Modeling', description: 'Forecast future trends and identify high-value opportunities before they materialize using advanced ML models.' },
  { icon: <FaChartLine className="text-white/20 text-3xl mb-4" />, title: 'Automated Reporting Engine', description: 'Generate executive-ready dashboards and reports in real-time, eliminating manual data compilation.' },
  { icon: <FaServer className="text-white/20 text-3xl mb-4" />, title: 'Omni-Data Integration', description: 'Connect all your data silos (CRM, ERP, Spreadsheets) into a single, unified analytical twin.' },
  { icon: <FaCodeBranch className="text-white/20 text-3xl mb-4" />, title: 'Root Cause Analysis', description: 'Leverage AI to instantly drill down into complex data to pinpoint the true source of performance issues.' },
  { icon: <FaCogs className="text-white/20 text-3xl mb-4" />, title: 'Data Quality & Governance', description: 'Automatically clean, validate, and normalize datasets, ensuring your insights are always based on reliable data.' },
  { icon: <FaWrench className="text-white/20 text-3xl mb-4" />, title: 'Natural Language Query', description: 'Ask complex business questions in plain English and receive instant, visualized answers and explanations.' },
];


/* ---------- Helper: fade-in on scroll (Kept for continuity) ---------- */
function useScrollReveal() {
  // Existing implementation remains unchanged
  useEffect(() => {
    const els = document.querySelectorAll(".reveal-on-scroll");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ---------- Particle layers config (Kept) ---------- */
const particlesOptionsBg = {
  fullScreen: { enable: false },
  particles: {
    number: { value: 30 },
    color: { value: ["#223344", "#1b2b3a"] },
    opacity: { value: 0.06 },
    size: { value: { min: 1, max: 3 } },
    move: { enable: true, speed: 0.3, random: true, outModes: "out" },
    links: { enable: true, distance: 160, color: "#223344", opacity: 0.04, width: 1 },
  },
};

const particlesOptionsFront = {
  fullScreen: { enable: false },
  particles: {
    number: { value: 50 },
    color: { value: ["#9333ea", "#e91e63", "#d8b4fe"] }, 
    opacity: { value: 0.14 },
    size: { value: { min: 1, max: 3 } },
    move: { enable: true, speed: 0.8, random: true, outModes: "out" },
    links: { enable: true, distance: 120, color: "#9333ea", opacity: 0.08, width: 1 },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: "grab" },
      onClick: { enable: true, mode: "repulse" },
    },
  },
};

/* ---------- Main Component ---------- */
export default function Landing({ onGetStarted }) {
  useScrollReveal();

  // parallax scroll
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || window.pageYOffset || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative bg-[#0A0711] text-white min-h-screen overflow-x-hidden font-sans">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />

      {/* Custom CSS for the purple/pink glow, focus ring, and subtle background grid */}
      <style>{`
        :root{
          --c1:#9333ea; /* Purple */ 
          --c2:#e91e63; /* Pink */
          --c-mid: #c084fc; /* Tailwind purple-400 equivalent */
          --muted: rgba(255,255,255,0.06);
        }
        .glow-grad{ 
          background: linear-gradient(90deg, var(--c-mid), var(--c1)); 
          -webkit-background-clip:text; 
          background-clip:text; 
          -webkit-text-fill-color:transparent; 
        }
        .reveal-on-scroll { opacity:0; transform: translateY(20px); transition: all 700ms cubic-bezier(.2,.9,.2,1); }
        .reveal-on-scroll.revealed { opacity:1; transform: translateY(0); }
        .neon-grid { 
          background-image: linear-gradient(rgba(147,51,234,0.06) 1px, transparent 1px), 
                          linear-gradient(90deg, rgba(233,30,99,0.04) 1px, transparent 1px); 
          background-size: 40px 40px, 40px 40px; 
          opacity:0.3; 
          filter: blur(4px) saturate(1.2); 
          transform: translateZ(0); 
        }
        .new-badge {
            background: linear-gradient(90deg, #9333ea, #e91e63);
            border-radius: 9999px;
            padding: 2px 12px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            box-shadow: 0 0 15px rgba(147, 51, 234, 0.4);
        }
        .btn-primary {
            background: linear-gradient(90deg, #9333ea, #e91e63);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-primary:hover {
            box-shadow: 0 4px 20px rgba(147, 51, 234, 0.4);
            transform: translateY(-1px);
        }
      `}</style>

      {/* Background particle layer (far) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <Particles id="bg-particles" init={loadSlim} options={particlesOptionsBg} style={{ position: "absolute", inset: 0 }} />
        <div className="absolute inset-0 top-[-50vh] h-[100vh] w-full" style={{ background: 'radial-gradient(circle at center top, rgba(147, 51, 234, 0.1) 0%, rgba(10, 7, 17, 0) 60%)' }} />
      </div>

      {/* Foreground particles (parallaxed slightly, in front) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 5, pointerEvents: "none" }}>
        <Particles id="fg-particles" init={loadSlim} options={particlesOptionsFront} style={{ position: "absolute", inset: 0, transform: `translateY(${scrollY * 0.02}px)` }} />
      </div>

      {/* Header (using NeuraTwin branding) */}
      <header className="fixed top-0 left-0 right-0 z-20">
        <nav className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex items-center justify-center">
          <div className="px-4 py-2 text-xs font-semibold rounded-lg border border-white/20 bg-black/50 hover:bg-black/70 transition cursor-pointer flex items-center gap-2">
            <FaStar className="text-pink-400" />
            NEURATWIN ANALYTICS
          </div>
        </nav>
      </header>

      {/* HERO (Transformed for AI Data Analyst focus) */}
      <main className="pt-20 relative z-10">
        <section id="home" className="min-h-[84vh] flex flex-col items-center justify-center text-center px-6 md:px-10">
          <div className="max-w-4xl mx-auto w-full">
            
            {/* NEW App Badge (changed text) */}
            <div className="new-badge inline-block text-white mb-6">
                Meet NeuraTwin: Your Digital Analyst <span className="ml-2">→</span>
            </div>

            {/* Title (Transformed) */}
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 reveal-on-scroll">
              <span className="block text-white">Transforming</span>
              <span className="block glow-grad">Data into Actionable Insights.</span>
            </h1>

            {/* Subtext (Transformed) */}
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
              Harness the power of AI to ingest, clean, and analyze your complex business data. NeuraTwin delivers precise, predictive analytics, not just reports.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 items-center justify-center mb-16 reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
              <button onClick={onGetStarted} className="px-6 py-3 rounded-xl btn-primary font-semibold text-white">
                Start Analyzing 
              </button>
              <a href="#solutions" className="px-6 py-3 rounded-xl border border-white/20 text-gray-300 hover:text-white transition">
                <span className="mr-2">ⓘ</span> See Core Features
              </a>
            </div>

            {/* Ratings & Stats (Kept for visual density) */}
            <div className="flex justify-center gap-12 text-center text-gray-300 mb-16 reveal-on-scroll" style={{ transitionDelay: '300ms' }}>
                <div className="border-r border-white/10 pr-12">
                    <span className="block text-4xl font-bold text-white">4.9+</span>
                    <span className="block text-sm text-gray-500 mt-1">Analyst Rating</span>
                </div>
                <div>
                    <span className="block text-4xl font-bold text-white">20K+</span>
                    <span className="block text-sm text-gray-500 mt-1">Data Sets Processed</span>
                </div>
            </div>

            {/* Subtle Partner Logos (Data Sources) */}
            <div className="flex items-center justify-center gap-6 text-gray-500 text-lg reveal-on-scroll" style={{ transitionDelay: '400ms' }}>
                <span className="font-bold">Salesforce</span>
                <FaPlus className="text-white/10" />
                <span className="font-bold">Google Sheets</span>
                <FaPlus className="text-white/10" />
                <span className="font-bold">MySQL</span>
                <FaPlus className="text-white/10" />
                <span className="font-bold">HubSpot</span>
                <FaPlus className="text-white/10" />
                <span className="font-bold">Stripe</span>
                <FaPlus className="text-white/10" />
                <span className="font-bold">APIs</span>
            </div>

          </div>
        </section>

        {/* SOLUTIONS SECTION (Transformed to show specific data analyst tools) */}
        <section id="solutions" className="py-24 px-6 md:px-12 bg-black/10 relative">
          <div className="absolute inset-0 neon-grid pointer-events-none opacity-5" />
          <div className="max-w-6xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4 text-white reveal-on-scroll">
              Core Capabilities for Faster
            </h2>
             <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4 text-white reveal-on-scroll">
              Data-Driven Decisions
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto text-center mb-16 reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
              NeuraTwin’s modular design provides the precise tools needed to integrate, analyze, and act on your business intelligence instantly.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {SOLUTIONS.map((solution, i) => (
                <article
                  key={i}
                  className="p-8 rounded-2xl border border-white/10 bg-[#120D1A]/70 shadow-2xl reveal-on-scroll"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  {solution.icon} 
                  <h3 className="text-xl font-bold mb-3 text-white">
                    {solution.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {solution.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* MID-SECTION CTA (Transformed to Data/Insight Focus) */}
        <section id="cta-mid" className="py-20 px-6 md:px-12 bg-[#0A0711] relative">
          <div className="max-w-4xl mx-auto text-center reveal-on-scroll">
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              <span className="block text-white">Move from Raw Data to</span>
              <span className="block glow-grad">High-Impact Decisions with</span>
              <span className="block glow-grad">Zero Code Analytics</span>
            </h2>

            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              NeuraTwin simplifies the entire BI lifecycle: automatically connect systems, detect trends, and predict market outcomes in one platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 items-center justify-center">
              <button onClick={onGetStarted} className="px-6 py-3 rounded-xl btn-primary font-semibold text-white">
                Try NeuraTwin Today
              </button>
              <a href="#solutions" className="px-6 py-3 rounded-xl border border-white/20 text-gray-300 hover:text-white transition">
                <span className="mr-2">ⓘ</span> Request a Data Demo
              </a>
            </div>
          </div>
        </section>

        {/* FINAL CTA / FOOTER BLOCK (Transformed to Data Focus) */}
        <section id="cta-final" className="py-24 px-6 md:px-12 bg-black relative overflow-hidden">
          <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Content */}
            <div className="reveal-on-scroll left">
              <div className="text-pink-500 uppercase text-sm font-bold mb-2">LIMITED TIME OFFER</div>
              <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                Unlock the Full Power of Your Business Data
              </h2>
              <p className="text-gray-400 max-w-md mb-8">
                Start your free trial now and gain instant access to predictive analytics, automated reports, and unlimited data sources.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex gap-4 items-center">
                <button onClick={onGetStarted} className="px-6 py-3 rounded-xl btn-primary font-semibold text-white">
                  Get Started
                </button>
              </div>
            </div>

            {/* Right Image/Visualization (Kept structure, implied data visualization) */}
            <div className="relative h-96 reveal-on-scroll right">
                {/* The visualization with the pink upward arrow */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <img
                        src="https://images.unsplash.com/photo-1551288258-2089d41d1d86?auto=format&fit=crop&q=80&w=1400" // New image for data visualization
                        alt="AI Growth Visualization"
                        className="w-full h-full object-cover rounded-2xl opacity-60"
                        style={{ filter: 'grayscale(100%) brightness(50%)' }}
                    />
                    {/* Placeholder for the pink arrow and glow effect */}
                    <div className="absolute bottom-[-15%] right-0 w-3/4 h-3/4" style={{ background: 'radial-gradient(circle at 100% 100%, rgba(233, 30, 99, 0.4) 0%, transparent 70%)' }} />
                    <div className="absolute w-32 h-64 bg-pink-500/80 rounded-full" style={{ right: '15%', top: '25%', transform: 'rotate(-45deg)', boxShadow: '0 0 50px #e91e63' }} />
                </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-12 text-center text-gray-500 bg-black/50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-4">&copy; {new Date().getFullYear()} NeuraTwin — MN Web Solutions</div>
            <div className="text-sm">Instant insights. Powered by AI.</div>
          </div>
        </footer>
      </main>
    </div>
  );
}