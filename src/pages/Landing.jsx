import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChartLine, FaBrain, FaServer, FaCogs, FaCheck, FaLock, FaBolt, FaWrench, FaArrowRight, FaAngleDown, FaUser, FaDatabase } from "react-icons/fa";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

// Theme Constants
const PRIMARY_COLOR = "#a855f7";
const ACCENT_COLOR = "#c026d3";
const DARK_BG = "#0a0118";
const CARD_BG = "#1a0b2e";

const HERO_STATS = [
    { value: '4.9+', label: 'Analyst Rating', sub: 'Verified Reviews' },
    { value: '20K+', label: 'Data Sets Processed', sub: 'Validated by AI' },
    { value: '15+', label: 'Integrations', sub: 'CRMs, ERPs, APIs' },
    { value: '10X', label: 'Faster Insights', sub: 'Avg. Time Reduction' },
];

const SOLUTIONS = [
    { icon: <FaBrain className="text-3xl text-purple-400" />, title: 'Predictive Modeling', description: 'Forecast future trends and identify high-value opportunities before they materialize using advanced ML models.' },
    { icon: <FaChartLine className="text-3xl text-purple-400" />, title: 'Automated Reporting Engine', description: 'Generate executive-ready dashboards and reports in real-time, eliminating manual data compilation.' },
    { icon: <FaServer className="text-3xl text-purple-400" />, title: 'Omni-Data Integration', description: 'Connect all your data silos (CRM, ERP, Spreadsheets) into a single, unified analytical twin.' },
    { icon: <FaWrench className="text-3xl text-purple-400" />, title: 'Natural Language Query (NLQ)', description: 'Ask complex business questions in plain English and receive instant, visualized answers and explanations.' },
];

const ABSOLUTE_ADVANTAGE = [
    'Zero Code Analytics: Deployment in Minutes',
    'Root Cause Analysis with Instant Drill-down',
    'Data Quality & Governance Automation',
    'End-to-End Encryption and Compliance',
];

const AI_HEAD_HERO = "/background1.jpg";
const AI_IMAGE_SERVICE = "/photo-1666875753105-c63a6f3bdc86.avif";
const AI_IMAGE_BOTTOM = "/pexels-jakubzerdzicki-30572289.jpg";

const PRO_PLAN = {
    title: 'Executive Insight Plan',
    price: 89,
    features: [
        'Unlimited Data Pipelines',
        'Predictive Modeling (Tier 2)',
        'Automated Executive Summaries',
        'Dedicated Cloud Compute (500 units)',
        '24/7 Priority Support',
        'Data Governance & Compliance Suite',
    ],
};

function useScrollReveal() {
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
            { threshold: 0.1 }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);
}

const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
    .landing-page-container { background: transparent; min-height: 100vh; width: 100%; position: relative; }
    .reveal-on-scroll { opacity: 0; transform: translateY(20px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
    .reveal-on-scroll.revealed { opacity: 1; transform: translateY(0); }
    .btn-primary-modern { background: white; color: ${DARK_BG}; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1); }
    .btn-primary-modern:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2); }
    .btn-secondary-modern { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); transition: all 0.3s ease; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .gradient-text { background: linear-gradient(135deg, ${ACCENT_COLOR}, #a855f7, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    @keyframes neon-flicker { 0%, 100% { text-shadow: 0 0 5px ${PRIMARY_COLOR}, 0 0 10px ${PRIMARY_COLOR}; } 50% { text-shadow: none; } }
    .neon-heading { animation: neon-flicker 1.5s infinite alternate; }
    .hero-image-glow::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 110%; height: 110%; background: radial-gradient(circle, rgba(168, 85, 247, 0.25), transparent 70%); filter: blur(50px); z-index: -1; }
    @keyframes border-glow-move { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
    .moving-border-container { padding: 2px; background: ${CARD_BG}; border-radius: 20px; position: relative; overflow: hidden; }
    .moving-border-container::before { content: ''; position: absolute; inset: 0; border-radius: 20px; background: linear-gradient(45deg, ${PRIMARY_COLOR}, ${ACCENT_COLOR}, ${PRIMARY_COLOR}, #7c3aed); background-size: 400% 400%; animation: border-glow-move 6s ease-in-out infinite alternate; z-index: 1; opacity: 0.8; }
    .moving-border-content { position: relative; z-index: 2; border-radius: 18px; overflow: hidden; background: ${CARD_BG}; }
`;

export default function Landing({ onGetStarted }) {
    useScrollReveal();
    const particlesInit = (engine) => loadSlim(engine);

    return (
        <div className="relative text-white min-h-screen overflow-x-hidden landing-page-container">
            <style>{customStyles}</style>

            {/* HIGH-END NEURAL PARTICLES */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <Particles 
                    id="tsparticles" 
                    init={particlesInit} 
                    options={{
                        fullScreen: { enable: false },
                        fpsLimit: 120,
                        interactivity: {
                            events: {
                                onHover: { enable: true, mode: "grab" },
                                resize: true,
                            },
                            modes: {
                                grab: {
                                    distance: 220,
                                    links: { opacity: 0.4, color: PRIMARY_COLOR }
                                },
                            },
                        },
                        particles: {
                            number: { value: 90, density: { enable: true, area: 900 } },
                            color: { value: [PRIMARY_COLOR, ACCENT_COLOR, "#6366f1"] },
                            links: {
                                enable: true,
                                color: PRIMARY_COLOR,
                                distance: 160,
                                opacity: 0.15,
                                width: 1,
                                triangles: { enable: true, opacity: 0.03 } // This creates the geometric AI mesh
                            },
                            move: {
                                enable: true,
                                speed: 0.6,
                                direction: "none",
                                random: true,
                                outModes: { default: "bounce" }
                            },
                            size: { value: { min: 1, max: 3 } },
                            opacity: {
                                value: { min: 0.1, max: 0.4 },
                                animation: { enable: true, speed: 1, minimumValue: 0.1 }
                            }
                        },
                        detectRetina: true,
                    }} 
                    className="absolute inset-0" 
                />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-transparent border-b border-white/5">
                <nav className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded flex items-center justify-center">
                            <FaBrain className="text-white text-sm" />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight uppercase">METRIA<span className="gradient-text">AI</span></span>
                    </div>
                    <Link to="/auth/login" className="px-5 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium flex items-center gap-2">
                        <FaUser /> Sign In
                    </Link>
                </nav>
            </header>

            <main className="relative z-10 bg-transparent pt-24">
                {/* HERO SECTION */}
                <section className="min-h-screen flex items-center px-6 lg:px-10 bg-transparent">
                    <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="reveal-on-scroll">
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-4">
                                Metria<span className="gradient-text neon-heading">AI</span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-300 max-w-xl mb-6">
                                Transforming Data into Actionable Insights. The APEX of enterprise intelligence.
                            </p>
                            <div className="flex flex-col gap-2 mb-8">
                                <div className="flex items-center gap-3 text-gray-300 font-medium"><FaCheck className="text-purple-400" /> No-Code Predictive Modeling</div>
                                <div className="flex items-center gap-3 text-gray-300 font-medium"><FaCheck className="text-purple-400" /> Automated Reporting Engine</div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <button onClick={onGetStarted} className="px-8 py-3.5 rounded-full btn-primary-modern font-bold flex items-center gap-2">Get Started <FaArrowRight /></button>
                                <a href="#solutions" className="px-8 py-3.5 rounded-full btn-secondary-modern font-bold text-white">Connect</a>
                            </div>
                        </div>

                        <div className="relative hero-image-glow reveal-on-scroll flex justify-center lg:justify-end">
                            <div className="moving-border-container max-w-md w-full"> 
                                <div className="moving-border-content">
                                    <img src={AI_HEAD_HERO} alt="AI" className="w-full h-auto object-cover" style={{ filter: 'brightness(95%) saturate(120%)', mixBlendMode: 'screen' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* STATS SECTION */}
                <section className="py-12 px-6 border-y border-white/5 bg-transparent">
                    <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                        {HERO_STATS.map((stat, i) => (
                            <div key={i} className="text-center reveal-on-scroll">
                                <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{stat.value}</div>
                                <div className="text-sm font-semibold text-white">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SOLUTIONS */}
                <section id="solutions" className="py-24 px-6 bg-transparent">
                    <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
                        <div className="hero-image-glow reveal-on-scroll">
                            <img src={AI_IMAGE_SERVICE} alt="Services" className="w-full h-[400px] object-cover rounded-2xl" style={{ filter: 'brightness(80%)' }} />
                        </div>
                        <div className="reveal-on-scroll">
                            <span className="text-sm font-bold text-purple-400 tracking-widest uppercase">Our Capabilities</span>
                            <h2 className="text-4xl md:text-5xl font-black mt-4 mb-10"><span className="gradient-text">AI-Powered</span> Enterprise Solutions</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {SOLUTIONS.map((s, i) => (
                                    <div key={i} className="glass-card p-6 rounded-xl">
                                        {s.icon}
                                        <h3 className="text-xl font-bold my-3">{s.title}</h3>
                                        <p className="text-gray-300 text-sm">{s.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ABSOLUTE ADVANTAGE */}
                <section className="py-20 px-6 bg-transparent">
                    <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="reveal-on-scroll">
                            <h2 className="text-4xl font-black mb-6">The <span className="gradient-text">Absolute</span> Advantage</h2>
                            <div className="space-y-4">
                                {ABSOLUTE_ADVANTAGE.map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-white/10 p-4 rounded-lg border border-white/10">
                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <FaCheck className="text-purple-400 text-xs" />
                                        </div>
                                        <span className="font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="reveal-on-scroll">
                            <img src={AI_IMAGE_BOTTOM} alt="Advantage" className="rounded-2xl shadow-2xl border border-white/10" />
                        </div>
                    </div>
                </section>

                {/* PRICING */}
                <section className="py-24 px-6 bg-transparent">
                    <div className="max-w-[800px] mx-auto text-center reveal-on-scroll">
                        <h2 className="text-5xl font-black mb-12">Select Your <span className="gradient-text">Power</span></h2>
                        <div className="moving-border-container">
                            <div className="moving-border-content p-10 bg-[#1a0b2e]/80 text-left">
                                <p className="text-xl font-bold mb-4 flex items-center gap-2"><FaBolt className="text-yellow-400" /> {PRO_PLAN.title}</p>
                                <div className="text-6xl font-black gradient-text mb-8">${PRO_PLAN.price}<span className="text-lg text-gray-400">/mo</span></div>
                                <ul className="space-y-4 mb-10">
                                    {PRO_PLAN.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-3"><FaCheck className="text-purple-400" /> {f}</li>
                                    ))}
                                </ul>
                                <button className="w-full py-4 rounded-full btn-primary-modern font-bold uppercase tracking-widest">Activate Insight</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="py-10 text-center bg-transparent border-t border-white/5">
                    <p className="text-sm text-gray-400">© {new Date().getFullYear()} MetriaAI — MN Web Solutions</p>
                </footer>
            </main>
        </div>
    );
}