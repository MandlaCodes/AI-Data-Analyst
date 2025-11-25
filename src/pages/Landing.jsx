import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Contact from "./Contact";
import { FaChartLine, FaLightbulb, FaDesktop, FaQuestionCircle } from "react-icons/fa";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function Landing({ onGetStarted }) {
  const phrases = [
    "act as a bridge between data and business strategy.",
    "translate complex data into actionable insights.",
    "provide easy-to-digest visualizations for executives.",
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);

  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // Hero phrase cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseVisible(false);
      setTimeout(() => {
        setCurrentPhraseIndex((p) => (p + 1) % phrases.length);
        setPhraseVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setLoading(false), 1800);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  // FIXED tsparticles loader
  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  return (
    <div className="relative bg-gray-900 text-white overflow-x-hidden font-sans">
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap"
        rel="stylesheet"
      />

      {/* Custom CSS */}
      <style>{`
        body { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { display: none; }

        .fade-transition { transition: opacity .6s ease, transform .6s ease; }

        @keyframes blob {
          0%,100% { transform: translate(0,0) scale(1);}
          33% { transform: translate(30px,-50px) scale(1.1);}
          66% { transform: translate(-20px,20px) scale(0.9);}
        }

        @keyframes pulse-gradient {
          0% {background-position:0% 50%;}
          50% {background-position:100% 50%;}
          100% {background-position:0% 50%;}
        }

        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }

        .hover-glow:hover {
          box-shadow: 0 0 25px rgba(0,255,255,0.5),
                      0 0 50px rgba(128,0,255,0.3);
        }

        .futuristic-card {
          background: linear-gradient(135deg, rgba(20,20,20,0.85), rgba(40,40,40,0.85));
          border:1px solid rgba(0,255,255,0.15);
          backdrop-filter: blur(20px);
          transition: transform .6s ease, box-shadow .6s ease;
        }
        .futuristic-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 50px rgba(0,255,255,0.3),
                      0 10px 20px rgba(128,0,255,0.2);
        }

        .neon-grid-line {
          position:absolute;
          width:100%;
          height:2px;
          background: linear-gradient(to right, rgba(0,255,255,0.2), rgba(255,0,255,0.2));
          animation: floatLine 12s linear infinite;
        }
        @keyframes floatLine {
          0% {transform:translateY(0);}
          50% {transform:translateY(15px);}
          100% {transform:translateY(0);}
        }

        /* Loading */
        .loading-screen {
          position: fixed;
          top:0; left:0;
          width:100%; height:100%;
          display:flex; justify-content:center; align-items:center;
          background:#050505;
          z-index:9999;
          transition: opacity 1.8s ease, transform 1.8s ease;
        }
        .loading-fade-out {
          opacity:0;
          transform:translateY(-40px);
          pointer-events:none;
        }
        .loading-text {
          font-size:3rem;
          font-weight:800;
          background: linear-gradient(270deg,#00f0ff,#ff00ff,#00ff99);
          background-size:600% 600%;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          animation: pulse-gradient 3s ease infinite;
        }

        /* Hero fade */
        .hero-fade-in {
          opacity:0;
          transform:translateY(40px);
          animation: heroEnter 1.8s ease forwards;
        }
        @keyframes heroEnter {
          from {opacity:0; transform:translateY(40px);}
          to   {opacity:1; transform:translateY(0);}
        }
      `}</style>

      {/* LOADING SCREEN */}
      {loading && (
        <div className={`loading-screen ${fadeOut ? "loading-fade-out" : ""}`}>
          <Particles
            id="tsparticles"
            init={particlesInit}
            options={{
              fullScreen: false,
              background: { color: "#050505" },
              particles: {
                number: { value: 60, density: { enable: true, area: 800 } },
                color: { value: ["#00ffff", "#ff00ff", "#00ff99"] },
                opacity: { value: 0.5, random: true },
                size: { value: { min: 1, max: 4 }, random: true },
                move: { enable: true, speed: 1, random: true },
                links: {
                  enable: true,
                  distance: 150,
                  color: "#00ffff",
                  opacity: 0.3,
                  width: 1,
                },
              },
            }}
            className="absolute w-full h-full top-0 left-0 -z-10"
          />
          <div className="loading-text">AI Analyst</div>
        </div>
      )}

      {/* FLOATING GRID */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="neon-grid-line" style={{ top: `${i * 20}%` }} />
        ))}
      </div>

      {/* NAVBAR */}
      <nav className="w-full flex items-center justify-between px-8 py-6 fixed top-0 z-50 backdrop-blur-md bg-black/40 shadow-lg">
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 tracking-wide">
          AI Analyst
        </div>
        <ul className="flex gap-8 text-white font-medium">
          <li><Link to="#home" className="hover:text-cyan-400 transition-all">Home</Link></li>
          <li><Link to="#product" className="hover:text-cyan-400 transition-all">Product</Link></li>
          <li><Link to="#faq" className="hover:text-cyan-400 transition-all flex items-center gap-1"><FaQuestionCircle /> FAQ</Link></li>
        </ul>
        <Link
          to="#contact"
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-400 rounded-lg font-semibold text-white hover:from-purple-500 hover:to-cyan-300 hover-glow"
        >
          Contact Us
        </Link>
      </nav>

      {/* HERO SECTION */}
      <section
        id="home"
        className={`relative min-h-screen flex flex-col justify-center items-center text-center px-6 py-32 lg:pb-40 z-10 ${
          loading ? "opacity-0" : "hero-fade-in"
        }`}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover -z-10 brightness-75"
        >
          <source src="/12421439_3840_2160_30fps.mp4" type="video/mp4" />
        </video>

        {/* Blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-700 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

        <div className="max-w-4xl w-full text-center px-4">
          <h2 className="text-7xl md:text-6xl font-extrabold mb-16 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white">
            Hello, I'm your AI Data Analyst
          </h2>

          <h2 className="text-lg md:text-2xl lg:text-3xl text-gray-200 mb-8">
            <span className="text-white font-semibold mr-2">Here to</span>
            <span
              className="text-cyan-400 fade-transition inline-block"
              style={{ opacity: phraseVisible ? 1 : 0 }}
            >
              {phrases[currentPhraseIndex]}
            </span>
          </h2>

          <div className="text-gray-300 max-w-3xl mx-auto mb-12 text-lg md:text-xl">
            Relax and let me be your personal smart manager for data analysis.
            I turn complex datasets into clear insights, stunning visualizations, and actionable business decisions.
          </div>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <button
              onClick={onGetStarted}
              className="px-12 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-400 hover:from-purple-500 hover:to-cyan-300 text-lg font-semibold hover-glow transform hover:scale-105 transition"
            >
              Get Started
            </button>
            <Link
              to="#contact"
              className="px-8 py-4 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 text-lg font-medium hover-glow transform hover:scale-105 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section id="product" className="py-24 md:py-32 px-6 md:px-32 bg-black relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">What This Tool Does</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              icon: <FaChartLine size={36} className="animate-pulse text-cyan-400" />,
              title: "Data Strategy",
              desc: "Analyze complex datasets to uncover actionable business insights.",
            },
            {
              icon: <FaLightbulb size={36} className="animate-pulse text-purple-400" />,
              title: "Smart Insights",
              desc: "Provide clear insights that help executives make data-driven decisions.",
            },
            {
              icon: <FaDesktop size={36} className="animate-pulse text-pink-400" />,
              title: "Interactive Visualizations",
              desc: "Generate intuitive dashboards with trends, KPIs, and analytics.",
            },
          ].map((item, idx) => (
            <div key={idx} className="futuristic-card p-8 rounded-3xl flex flex-col items-start gap-5">
              <div className="p-5 rounded-full bg-black/30 w-20 h-20 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
              <p className="text-gray-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 md:py-32 px-6 md:px-32 bg-gray-900 text-white relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400">
          Frequently Asked Questions
        </h2>

        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {[
            { q: "How do I get started?", a: "Click the Get Started button to begin the setup." },
            { q: "Do you generate custom dashboards?", a: "Yes, tailored dashboards are supported." },
            { q: "Can it connect to external data sources?", a: "Yes — databases, APIs, Google Sheets, and more." },
          ].map((item, idx) => (
            <details
              key={idx}
              className="bg-white/5 backdrop-blur-md p-5 rounded-xl cursor-pointer hover:bg-cyan-500/10 transition"
            >
              <summary className="text-lg font-semibold">{item.q}</summary>
              <p className="mt-3 text-gray-300">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact">
        <Contact title="Contact Us" />
      </section>

      {/* FOOTER */}
      <footer className="py-16 md:py-24 bg-gray-900 text-gray-400 text-center">
        <p>&copy; {new Date().getFullYear()} MN Web Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
}
