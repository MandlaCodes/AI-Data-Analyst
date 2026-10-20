/**
 * components/Landing.jsx — MetriaAI landing page
 * Keeps the existing onGetStarted flow, routes, and visual direction.
 * Claims describe supported workflows without implying unverified certifications,
 * predictive models, SQL connections, or guaranteed results.
 */
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaChartLine, FaBrain, FaArrowRight, FaRocket, FaBars, FaTimes,
  FaPlus, FaMinus, FaCheckCircle, FaMicrochip, FaDatabase,
  FaMagic, FaBookOpen, FaFileExcel, FaComments, FaLayerGroup,
} from "react-icons/fa";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const PRIMARY = "#a855f7";
const ACCENT = "#c026d3";
const DARK = "#02010a";
const AI_HEAD_HERO = "/updated-metria-logo.png";
const AI_IMAGE_SERVICE = "/photo-1666875753105-c63a6f3bdc86.avif";

const SOLUTIONS = [
  {
    icon: <FaBrain />,
    title: "Executive Briefings",
    desc: "Turn imported business data into readable summaries, key findings, and suggested next steps.",
  },
  {
    icon: <FaChartLine />,
    title: "Opportunity Detection",
    desc: "Explore performance trends, emerging risks, and opportunities in the data you upload.",
  },
];

const BENEFITS = [
  { title: "Identify Trends", desc: "See how performance changes over time." },
  { title: "Spot Risks", desc: "Surface metrics worth investigating." },
  { title: "Growth Opportunities", desc: "Find strong performers and areas to improve." },
  { title: "Ask in Plain English", desc: "Explore your data through conversation." },
];

const FAQS = [
  {
    q: "How is MetriaAI different from a dashboard tool like Tableau?",
    a: "Traditional dashboards help you explore charts and metrics. MetriaAI combines visualizations with an AI-generated executive briefing and a conversational analyst, so you can ask follow-up questions about your uploaded data. Review important recommendations against the source data before acting on them.",
  },
  {
    q: "How is my data handled?",
    a: "MetriaAI analyzes the datasets you choose to upload or import. For information about storage, access, and retention, please review our Privacy Policy.",
  },
  {
    q: "Can I analyze more than one dataset?",
    a: "Yes. Cross Analysis lets you analyze multiple active datasets together and explore potential relationships between them. Results depend on the structure and quality of your data.",
  },
  {
    q: "What data can I start with?",
    a: "You can begin with an Excel or CSV spreadsheet. Google Sheets import is also supported where available in your workspace. You don't need to set up a SQL database to get started.",
  },
];

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
.metria-landing, .metria-landing * { box-sizing: border-box; }
.metria-landing { font-family: 'Plus Jakarta Sans', sans-serif; color: white; background: ${DARK}; overflow-x: clip; }
.metria-landing .mono { font-family: 'JetBrains Mono', monospace; }
.metria-landing .reveal { opacity: 0; transform: translateY(20px); transition: opacity .8s ease, transform .8s cubic-bezier(.2,.8,.2,1); }
.metria-landing .reveal.show { opacity: 1; transform: none; }
.metria-landing .reveal-text { clip-path: polygon(0 0,0 0,0 100%,0 100%); transform: translateX(-15px); transition: clip-path .8s cubic-bezier(.77,0,.175,1), transform .8s cubic-bezier(.77,0,.175,1); }
.metria-landing .reveal.show .reveal-text { clip-path: polygon(0 0,100% 0,100% 100%,0 100%); transform: translateX(0); }
.metria-landing .delay-1 { transition-delay: .2s; }
.metria-landing .delay-2 { transition-delay: .4s; }
.metria-landing .gradient-text { display:inline-block; background:linear-gradient(to right,#fff 20%,${PRIMARY} 50%,${ACCENT} 80%); -webkit-background-clip:text; background-clip:text; color:transparent; background-size:200% auto; animation:metria-shine 4s linear infinite; padding-right:.35em; margin-right:-.35em; padding-bottom:.15em; line-height:1.2; }
@keyframes metria-shine { to { background-position:200% center; } }
.metria-landing .glass-morphism { background:rgba(255,255,255,.03); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.08); }
.metria-landing .mobile-menu-container { overflow:hidden; max-height:0; opacity:0; transition:max-height .5s cubic-bezier(.4,0,.2,1),opacity .3s ease-out; }
.metria-landing .mobile-menu-container.open { max-height:100vh; opacity:1; }
.metria-landing .hero-visual-container { position:relative; width:fit-content; border-radius:40px; padding:3px; margin:0 auto; isolation:isolate; overflow:hidden; box-shadow:0 0 80px rgba(168,85,247,.2); }
.metria-landing .hero-visual-container::before { content:''; position:absolute; width:200%; height:200%; top:-50%; left:-50%; background:conic-gradient(from 0deg,transparent 0%,${PRIMARY} 25%,${ACCENT} 50%,transparent 75%); animation:metria-scan-rotate 6s linear infinite; z-index:-2; }
.metria-landing .hero-visual-container::after { content:''; position:absolute; inset:2px; background:${DARK}; border-radius:38px; z-index:-1; }
.metria-landing .hero-visual { display:block; width:auto; max-width:min(82vw,550px); max-height:32vh; object-fit:contain; border-radius:37px; filter:contrast(1.1) brightness(1.1); animation:metria-pulse 4s ease-in-out infinite; -webkit-mask-image:radial-gradient(circle,black 75%,rgba(0,0,0,.5) 95%,transparent 100%); mask-image:radial-gradient(circle,black 75%,rgba(0,0,0,.5) 95%,transparent 100%); }
@media (min-width:1024px) { .metria-landing .hero-visual { max-height:65vh; } }
@keyframes metria-scan-rotate { to { transform:rotate(360deg); } }
@keyframes metria-pulse { 0%,100% { opacity:.95; transform:scale(1); } 50% { opacity:1; transform:scale(1.02); } }
.metria-landing .pricing-card { transition:background .4s ease,border-color .4s ease; border:1px solid rgba(255,255,255,.07); }
.metria-landing .pricing-card:hover { background:rgba(168,85,247,.05); border-color:rgba(168,85,247,.35); }
.metria-landing .animate-slideDown { animation:metria-slideDown .3s ease-out forwards; }
@keyframes metria-slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
.metria-landing .animate-spin-slow { animation:metria-spin 8s linear infinite; }
@keyframes metria-spin { to { transform:rotate(360deg); } }
.metria-landing :is(a,button):focus-visible { outline:2px solid ${PRIMARY}; outline-offset:4px; }
.metria-landing section[id] { scroll-margin-top:96px; }
@media (prefers-reduced-motion:reduce) { .metria-landing .reveal, .metria-landing .reveal-text { opacity:1; transform:none; clip-path:none; transition:none; } .metria-landing .hero-visual, .metria-landing .gradient-text, .metria-landing .animate-spin-slow { animation:none; } }
`;

/**
 * Optional productScreenshot: public URL for a REAL MetriaAI dashboard screenshot.
 * Omit it until an actual screenshot is added to /public; no fake UI is shown.
 */
export default function Landing({ onGetStarted, productScreenshot = null }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [particlesReady, setParticlesReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    initParticlesEngine(async engine => { await loadSlim(engine); })
      .then(() => { if (mounted) setParticlesReady(true); })
      .catch(error => console.warn("Particles unavailable:", error));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll(".metria-landing .reveal");
    if (!('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add("show"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [productScreenshot]);

  // Keep the existing onGetStarted prop for compatibility with parent components.
  // Route explicitly to the requested auth mode, without requiring a new route.
  const openAuth = (mode) => {
    setIsMenuOpen(false);
    navigate(mode === "signup" ? "/login?mode=signup" : "/login");
  };
  const getStarted = () => openAuth("signup");
  const accessWorkspace = () => openAuth("login");

  return (
    <div className="metria-landing min-h-screen">
      <style>{styles}</style>
      {particlesReady && (
        <Particles id="metria-landing-particles" options={{
          fullScreen: { enable: true, zIndex: 0 },
          particles: {
            number: { value: 25 }, color: { value: PRIMARY },
            links: { enable: true, opacity: 0.1, distance: 150, color: PRIMARY },
            move: { enable: true, speed: 0.4 }, size: { value: 1.2 },
          },
        }} />
      )}

      {/* HEADER */}
      <header className="fixed inset-x-0 top-0 z-[200] bg-[#02010a]/90 backdrop-blur-xl border-b border-white/5">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 py-5" aria-label="Main navigation">
          <a href="#top" className="flex items-center gap-2 group" aria-label="MetriaAI home">
            <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <FaRocket className="text-white text-xs" />
            </span>
            <span className="font-extrabold text-xl tracking-tighter">MetriaAI</span>
          </a>
          <div className="hidden md:flex gap-8 text-[10px] uppercase font-bold tracking-widest text-gray-400">
            <a href="#solutions" className="hover:text-white transition-colors">The Engine</a>
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <button type="button" onClick={accessWorkspace} className="hidden md:block text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 glass-morphism rounded-xl hover:bg-white/10 transition-all">
            Access Workspace
          </button>
          <button type="button" className="md:hidden text-2xl text-white p-2" onClick={() => setIsMenuOpen(v => !v)} aria-label={isMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMenuOpen} aria-controls="metria-mobile-nav">
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </nav>
        <div id="metria-mobile-nav" className={`mobile-menu-container ${isMenuOpen ? "open" : ""} md:hidden bg-[#02010a] border-b border-white/10`} aria-hidden={!isMenuOpen}>
          <div className="flex flex-col items-start gap-8 px-10 py-10">
            <a href="#solutions" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase tracking-tighter">The Engine</a>
            <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase tracking-tighter">Blog</Link>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase tracking-tighter">Pricing</a>
            <a href="#faq" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase tracking-tighter">FAQ</a>
            <button type="button" onClick={accessWorkspace} className="w-full text-sm font-black uppercase tracking-widest py-5 bg-purple-600 rounded-xl shadow-lg">Access Workspace</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main id="top" className="relative z-10">
        <section className="relative min-h-[90svh] md:min-h-[100svh] flex items-center px-6 md:px-12 pt-32 md:pt-24 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 md:gap-12 items-center w-full relative z-10">
            <div className="reveal flex justify-center items-center relative order-1 lg:order-2 mt-4 md:mt-0">
              <div className="absolute -inset-10 lg:-inset-20 bg-purple-600/10 blur-[60px] lg:blur-[120px] rounded-full" />
              <div className="hero-visual-container"><img src={AI_HEAD_HERO} className="hero-visual" alt="MetriaAI visual identity" /></div>
            </div>
            <div className="reveal text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold mb-4 tracking-widest uppercase reveal-text mx-auto lg:mx-0">
                <FaMicrochip className="animate-spin-slow" /> AI-Powered Business Analytics
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-8xl font-black leading-[1.0] mb-6 tracking-tighter reveal-text delay-1">
                Decisions. <br /><span className="gradient-text italic">Automated.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-xl mb-8 md:mb-10 leading-relaxed reveal-text delay-2 mx-auto lg:mx-0">
                Upload your spreadsheets, uncover trends, generate executive briefings, and ask questions about your business data — all in one workspace.
              </p>
              <div className="flex justify-center lg:justify-start reveal-text delay-2">
                <button type="button" onClick={getStarted} className="w-full sm:w-auto px-12 py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:bg-gray-100 transition-colors">
                  Get MetriaAI Today <FaArrowRight className="inline ml-2" />
                </button>
              </div>
              <p className="mt-5 text-xs text-gray-500 reveal-text delay-2">Start with Excel or CSV. No SQL setup required.</p>
            </div>
          </div>
        </section>

        {/* Workflow strip replaces unverified SOC 2 / ISO / GDPR badges */}
        <div className="py-7 md:py-10 border-y border-white/5 bg-black/20 relative">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-5 text-gray-400 text-xs sm:text-sm font-bold tracking-wide">
            <div className="flex items-center justify-center gap-3"><FaFileExcel className="text-purple-400" /> Upload your data</div>
            <div className="flex items-center justify-center gap-3"><FaChartLine className="text-purple-400" /> Explore trends and KPIs</div>
            <div className="flex items-center justify-center gap-3"><FaComments className="text-purple-400" /> Ask MetriaAI</div>
          </div>
        </div>

        {/* FEATURES */}
        <section id="solutions" className="py-12 md:py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 reveal relative min-h-[350px] md:min-h-[450px] overflow-hidden rounded-[32px] group">
                <img src={AI_IMAGE_SERVICE} className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105" alt="Illustration of business analytics charts" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-8 md:p-12 flex flex-col justify-end">
                  <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-widest mb-3"><FaLayerGroup /> Multiple datasets</div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Cross-Dataset Intelligence</h2>
                  <p className="text-gray-300 max-w-lg mb-2 text-sm md:text-base">Analyze multiple datasets together to explore patterns and potential relationships across your business.</p>
                  <span className="text-xs text-gray-400">Results depend on your data's structure and quality.</span>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                {SOLUTIONS.map((solution, i) => (
                  <div key={i} className="reveal glass-morphism p-8 rounded-[32px] pricing-card flex-1">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 text-xl mb-6">{solution.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{solution.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{solution.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Real product screenshot — displayed only when provided */}
        {productScreenshot && (
          <section className="pb-12 md:pb-28 px-6" aria-label="MetriaAI product preview">
            <div className="max-w-7xl mx-auto reveal">
              <div className="text-center mb-8"><p className="text-purple-400 text-xs uppercase tracking-[.3em] font-bold mb-3">Inside MetriaAI</p><h2 className="text-3xl md:text-5xl font-black tracking-tight">See the workspace in action.</h2></div>
              <div className="glass-morphism rounded-[28px] p-2 md:p-4 overflow-hidden shadow-2xl shadow-purple-950/20">
                <img src={productScreenshot} alt="Screenshot of the actual MetriaAI analytics workspace" loading="lazy" className="w-full h-auto rounded-[20px]" />
              </div>
              <p className="text-gray-500 text-xs text-center mt-4">Example workspace. Insights depend on the uploaded dataset.</p>
            </div>
          </section>
        )}

        {/* STRATEGY */}
        <section className="pb-12 md:pb-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="glass-morphism rounded-[40px] p-8 md:p-16 border-l-4 border-purple-500 reveal">
              <div className="grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 leading-[1.1]">Data is noise. <br /><span className="text-purple-500">Strategy is clarity.</span></h2>
                  <p className="text-gray-400 text-lg leading-relaxed mb-8">Most businesses have more metrics than time to interpret them. MetriaAI helps turn spreadsheets and KPIs into understandable analysis and actionable questions.</p>
                  <Link to="/blog" className="inline-flex items-center gap-3 px-8 py-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 font-bold uppercase tracking-widest text-xs hover:bg-purple-500 hover:text-white transition-all">Explore Our Insights <FaBookOpen /></Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {BENEFITS.map((item, idx) => (
                    <div key={idx} className="p-4 md:p-6 bg-white/5 rounded-2xl border border-white/5">
                      <h3 className="text-white text-sm md:text-base font-bold mb-2">{item.title}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-12 md:py-32 px-6">
          <div className="max-w-7xl mx-auto text-center reveal">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic">Executive Plans.</h2>
            <div className="flex justify-center mt-8 md:mt-12">
              <div className="reveal w-full max-w-lg p-8 md:p-12 rounded-[40px] glass-morphism pricing-card relative">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest whitespace-nowrap">Pro Plan</span>
                <div className="text-center mb-8 md:mb-10">
                  <h3 className="text-2xl font-bold mb-4">MetriaAI Pro</h3>
                  <div className="flex items-center justify-center"><span className="text-6xl md:text-7xl font-black">$89</span><span className="text-gray-400 text-lg ml-2">/month</span></div>
                  <p className="text-gray-500 text-xs mt-3">USD · Subscription</p>
                </div>
                <div className="space-y-4 md:space-y-5 mb-10 md:mb-12 text-left">
                  {["AI data analyst and follow-up questions", "Excel and CSV data analysis", "Multi-dataset Cross Analysis", "Executive briefings and visualizations"].map((feature, i) => (
                    <div key={i} className="flex items-center gap-4 text-gray-300"><FaCheckCircle className="text-purple-500 shrink-0" /><span className="text-sm font-medium">{feature}</span></div>
                  ))}
                </div>
                <button type="button" onClick={getStarted} className="w-full py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-colors">Get MetriaAI Today</button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-12 md:py-32 px-6 bg-black/10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-8 md:mb-12 italic text-center">Frequently Asked Questions.</h2>
            <div className="space-y-2 md:space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="border-b border-white/5 reveal">
                  <h3>
                    <button type="button" onClick={() => setActiveFaq(v => v === i ? null : i)} aria-expanded={activeFaq === i} aria-controls={`metria-faq-${i}`} className="w-full py-5 md:py-6 flex justify-between items-center gap-5 text-left hover:text-purple-400 transition-colors">
                      <span className="font-bold tracking-tight text-sm md:text-base">{faq.q}</span>
                      {activeFaq === i ? <FaMinus className="text-xs shrink-0" /> : <FaPlus className="text-xs shrink-0" />}
                    </button>
                  </h3>
                  {activeFaq === i && <div id={`metria-faq-${i}`} className="pb-6 text-gray-400 text-sm leading-relaxed animate-slideDown">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-12 md:py-20 border-t border-white/5 bg-black/40 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-8 md:mb-10">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-lg flex items-center justify-center"><FaRocket className="text-white text-xs" /></div>
            <span className="font-black text-xl tracking-tighter text-white">MetriaAI</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 md:mb-12 text-[10px] font-bold uppercase tracking-[.2em] text-gray-500">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms of Service</Link>
            <Link to="/contact" className="hover:text-white">Support</Link>
          </div>
          <p className="text-[10px] text-gray-600 font-mono tracking-[.3em] uppercase text-center">© {new Date().getFullYear()} Metria Neural Systems.</p>
        </div>
      </footer>
    </div>
  );
}
