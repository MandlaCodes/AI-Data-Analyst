import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaChartLine, FaBrain, FaServer, FaCogs, FaCheck, FaLock, FaBolt, FaWrench, FaArrowRight, FaAngleDown, FaUser, FaDatabase } from "react-icons/fa"; 
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

// Dark neon purple theme
const PRIMARY_COLOR = "#a855f7"; // Neon Purple
const ACCENT_COLOR = "#c026d3"; // Bright Magenta/Fuchsia
const DARK_BG = "#0a0118"; // Deep dark purple
const CARD_BG = "#1a0b2e"; // Dark purple

// ... (HERO_STATS, SOLUTIONS, ABSOLUTE_ADVANTAGE, IMAGE CONSTANTS remain the same) ...
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
const AI_IMAGE_SERVICE = "https://images.unsplash.com/photo-1516110833965-cccd8aa052f9?q=80&w=1500&auto=format&fit=crop";
const AI_IMAGE_BOTTOM = "frontend/public/pexels-jakubzerdzicki-30572289.jpg";

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
            { threshold: 0.18 }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);
}

const particlesOptionsBg = {
    fullScreen: { enable: false },
    particles: {
        number: { value: 25 },
        color: { value: ["#2d1b4e", "#3b1f5c"] },
        opacity: { value: 0.05 },
        size: { value: { min: 1, max: 2 } },
        move: { enable: true, speed: 0.2, random: true, outModes: "out" },
        links: { enable: true, distance: 150, color: "#3b1f5c", opacity: 0.03, width: 1 },
    },
};

const particlesOptionsFront = {
    fullScreen: { enable: false },
    particles: {
        number: { value: 40 },
        color: { value: [PRIMARY_COLOR, ACCENT_COLOR] }, 
        opacity: { value: 0.1 },
        size: { value: { min: 1, max: 2.5 } },
        move: { enable: true, speed: 0.6, random: true, outModes: "out" },
        links: { enable: true, distance: 100, color: PRIMARY_COLOR, opacity: 0.06, width: 1 },
    },
    interactivity: {
        events: {
            onHover: { enable: true, mode: "grab" },
            onClick: { enable: true, mode: "repulse" },
        },
    },
};

const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    
    .landing-page-container {
        background: linear-gradient(135deg, ${DARK_BG} 0%, #1a0b2e 40%, #2d1b4e 100%);
    }
    
    .reveal-on-scroll {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    }
    
    .reveal-on-scroll.revealed {
        opacity: 1;
        transform: translateY(0);
    }
    
    .btn-primary-modern {
        background: white;
        color: ${DARK_BG};
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
    }
    
    .btn-primary-modern:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
    }
    
    .btn-secondary-modern {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
    }
    
    .btn-secondary-modern:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
    }
    
    .glass-card {
        background: rgba(30, 41, 59, 0.4);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
    }
    
    .glass-card:hover {
        background: rgba(30, 41, 59, 0.6);
        border-color: rgba(168, 85, 247, 0.4);
        transform: translateY(-4px);
    }
    
    .gradient-text {
        background: linear-gradient(135deg, ${ACCENT_COLOR}, #a855f7, #7c3aed);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    /* Animation for the Main Hero Heading */
    @keyframes neon-flicker {
        0%, 100% { 
            text-shadow: 0 0 5px ${PRIMARY_COLOR}, 0 0 10px ${PRIMARY_COLOR}, 0 0 15px ${ACCENT_COLOR}; 
        }
        50% { 
            text-shadow: none;
        }
    }

    .neon-heading {
        animation: neon-flicker 1.5s infinite alternate;
    }

    .hero-image-glow {
        position: relative;
    }
    
    .hero-image-glow::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120%;
        height: 120%;
        background: radial-gradient(circle, rgba(168, 85, 247, 0.3), transparent 70%);
        filter: blur(60px);
        z-index: -1;
    }

    /* Animation for the moving border */
    @keyframes border-glow-move {
        0% { background-position: 0% 50%; }
        100% { background-position: 100% 50%; }
    }

    .moving-border-container {
        padding: 3px; /* Border thickness */
        background: ${CARD_BG};
        border-radius: 26px; /* 3xl border radius - 2px padding */
        position: relative;
        overflow: hidden;
    }

    .moving-border-container::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 26px;
        background: linear-gradient(
            45deg,
            ${PRIMARY_COLOR},
            ${ACCENT_COLOR},
            ${PRIMARY_COLOR},
            #7c3aed
        );
        background-size: 400% 400%;
        animation: border-glow-move 6s ease-in-out infinite alternate;
        z-index: 1;
        opacity: 0.8;
        filter: blur(10px); /* Add a slight blur to the glow */
    }

    .moving-border-content {
        position: relative;
        z-index: 2;
        border-radius: 24px;
        overflow: hidden;
    }

    .social-icon {
        width: 45px;
        height: 45px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .social-icon:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-3px);
    }
`;

export default function Landing({ onGetStarted }) {
    useScrollReveal();

    const [scrollY, setScrollY] = useState(0);
    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY || window.pageYOffset || 0);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const particlesInit = (engine) => loadSlim(engine);

    return (
        <div className="relative text-white min-h-screen overflow-x-hidden landing-page-container">
            <style>{customStyles}</style>

            {/* Background particles */}
            {/* ... (Particles code remains the same) ... */}
            <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
                <Particles id="bg-particles" init={particlesInit} options={particlesOptionsBg} style={{ position: "absolute", inset: 0 }} />
            </div>

            {/* Foreground particles */}
            <div style={{ position: "fixed", inset: 0, zIndex: 5, pointerEvents: "none" }}>
                <Particles id="fg-particles" init={particlesInit} options={particlesOptionsFront} style={{ position: "absolute", inset: 0, transform: `translateY(${scrollY * 0.02}px)` }} />
            </div>

            {/* Header */}
            {/* ... (Header code remains the same) ... */}
            <header className="fixed top-0 left-0 right-0 z-20 bg-[#0a0118]/80 backdrop-blur-md border-b border-purple-500/10">
                <nav className="max-w-[1400px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded flex items-center justify-center">
                            <FaBrain className="text-white text-sm" />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight">
                            MAND<span className="gradient-text">SIGHT</span>
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link to="/auth/login" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition text-sm font-medium">
                            <FaUser className="text-sm" />
                            Sign In
                        </Link>
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 transition text-sm font-semibold">
                            <span>Menu</span>
                            <span className="text-lg">☰</span>
                        </button>
                    </div>
                </nav>
            </header>

            {/* HERO SECTION */}
            <main className="pt-20 relative z-10">
                <section id="hero" className="min-h-screen flex items-center justify-start px-6 md:px-10 relative overflow-hidden">
                    <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
                        
                        {/* Left Content */}
                        <div className="z-10 reveal-on-scroll">
                            <h1 className="text-7xl md:text-8xl font-black leading-none mb-6">
                                Mand<span className="gradient-text neon-heading">Sight</span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-300 max-w-xl mb-8 leading-relaxed">
                                Transforming Data into Actionable Insights
                            </p>

                            {/* Checklist */}
                            <div className="flex flex-col gap-3 mb-10">
                                <div className="flex items-center gap-3 text-gray-300">
                                    <FaCheck className="text-lg text-purple-400" />
                                    <span className="font-medium">No-Code Predictive Modeling</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <FaCheck className="text-lg text-purple-400" />
                                    <span className="font-medium">Automated Reporting Engine</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-5 mb-12">
                                <button onClick={onGetStarted} className="flex items-center gap-3 px-8 py-4 rounded-full btn-primary-modern font-semibold text-base">
                                    Get Started
                                    <FaArrowRight />
                                </button>
                                <a href="#contact" className="flex items-center gap-3 px-8 py-4 rounded-full btn-secondary-modern font-semibold text-base text-white">
                                    <FaDatabase className="text-lg" />
                                    Connect With Us
                                </a>
                            </div>
                            
                            <a href="#solutions" className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm uppercase tracking-widest font-medium">
                                <FaAngleDown className="text-base" />
                                SCROLL TO EXPLORE
                            </a>
                        </div>

                        {/* Right Image - NOW ANIMATED */}
                        <div className="relative z-10 hero-image-glow reveal-on-scroll">
                            <div className="moving-border-container"> 
                                <div className="moving-border-content">
                                    <img
                                        src={AI_HEAD_HERO} 
                                        alt="AI Neural Network"
                                        className="w-full h-auto object-cover rounded-2xl"
                                        style={{
                                            filter: 'brightness(80%) saturate(130%)',
                                            mixBlendMode: 'screen'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* STATS STRIP */}
                {/* ... (Stats strip code remains the same) ... */}
                <section id="stats" className="py-16 px-6 md:px-10 bg-black/30 backdrop-blur-sm border-y border-white/5">
                    <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 reveal-on-scroll">
                        {HERO_STATS.map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-4xl md:text-5xl font-black gradient-text mb-2">{stat.value}</div>
                                <div className="text-sm font-semibold text-white mb-1">{stat.label}</div>
                                <div className="text-xs text-gray-400">{stat.sub}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SOLUTIONS SECTION */}
                {/* ... (Solutions section remains the same) ... */}
                <section id="solutions" className="py-24 px-6 md:px-10 relative">
                    <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                        
                        {/* Left Side: Image Block */}
                        <div className="relative h-96 min-h-[400px] reveal-on-scroll hero-image-glow">
                            <img
                                src={AI_IMAGE_SERVICE}
                                alt="Visualized Data Network"
                                className="w-full h-full object-cover object-center rounded-2xl"
                                style={{ filter: 'brightness(60%) saturate(120%)' }}
                            />
                            <div className="absolute inset-0 flex items-end p-8 rounded-2xl" style={{ background: 'linear-gradient(to top, #000000e0 0%, transparent 60%)' }}>
                                <h3 className="text-3xl font-extrabold text-white leading-tight">
                                    Predictive Analysis <span className="text-gray-400">→</span>
                                </h3>
                            </div>
                        </div>

                        {/* Right Side: Services List */}
                        <div className="reveal-on-scroll">
                            <span className="text-sm font-bold uppercase tracking-widest text-purple-400">OUR CORE CAPABILITIES</span>
                            <h2 className="text-4xl md:text-5xl font-black mt-4 mb-10 leading-tight">
                                <span className="gradient-text">AI-Powered</span> Solutions for Your Enterprise
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {SOLUTIONS.map((service, i) => (
                                    <div key={i} className="glass-card p-6 rounded-xl">
                                        {service.icon}
                                        <h3 className="text-xl font-bold my-3">{service.title}</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            {service.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* ADVANTAGE SECTION */}
                {/* ... (Advantage section remains the same) ... */}
                <section id="advantage" className="py-24 px-6 md:px-10 bg-black/20">
                    <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        
                        <div className="reveal-on-scroll">
                            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                                The <span className="gradient-text">MandSight</span> Advantage for Your Business
                            </h2>
                            
                            <div className="space-y-4 mb-10">
                                {ABSOLUTE_ADVANTAGE.map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 p-5 glass-card rounded-xl">
                                        <FaCheck className="text-xl text-purple-500 mt-1 shrink-0" />
                                        <span className="text-base font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <button onClick={onGetStarted} className="px-8 py-4 rounded-full btn-primary-modern font-semibold text-base">
                                Start Predictive Analysis Now
                            </button>
                        </div>

                        <div className="relative reveal-on-scroll hero-image-glow">
                            <img
                                src={AI_IMAGE_BOTTOM}
                                alt="AI Dashboard"
                                className="w-full h-auto rounded-2xl"
                                style={{ filter: 'brightness(70%) saturate(120%)' }}
                            />
                            <div className="absolute inset-0 flex items-end p-8 rounded-2xl" style={{ background: 'linear-gradient(to top, #000000e0 0%, transparent 60%)' }}>
                                <h3 className="text-3xl font-extrabold text-white leading-tight">
                                    Maximize Your ROI <span className="text-gray-400">→</span>
                                </h3>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Social Links */}
                {/* ... (Social links remain the same) ... */}
                <div className="fixed right-8 bottom-8 flex gap-3 z-20">
                    <div className="social-icon">
                        <span className="text-white font-bold">𝕏</span>
                    </div>
                    <div className="social-icon">
                        <span className="text-white text-lg">⚡</span>
                    </div>
                    <div className="social-icon">
                        <span className="text-white text-sm font-semibold">in</span>
                    </div>
                </div>

                {/* FOOTER */}
                {/* ... (Footer remains the same) ... */}
                <footer className="py-12 text-center bg-black/50 border-t border-white/5">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="flex justify-center items-center gap-3 mb-4">
                            <FaBrain className="text-2xl text-purple-400" />
                            <span className="text-xl font-extrabold tracking-tight">
                                MandSight <span className="text-gray-500">Analytics</span>
                            </span>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">© {new Date().getFullYear()} MandSight — MN Web Solutions</div>
                        <div className="text-xs text-gray-500">The APEX of Data Intelligence.</div>
                    </div>
                </footer>
            </main>
        </div>
    );
}