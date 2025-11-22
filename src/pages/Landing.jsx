import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Contact from "./Contact";
import { FaChartLine, FaLightbulb, FaDesktop, FaQuestionCircle } from "react-icons/fa";

export default function Landing({ onGetStarted }) {
  const phrases = [
    "act as a bridge between data and business strategy.",
    "translate complex data into actionable insights.",
    "provide easy-to-digest visualizations for executives.",
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);
  const heroRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseVisible(false);
      setTimeout(() => {
        setCurrentPhraseIndex((p) => (p + 1) % phrases.length);
        setPhraseVisible(true);
      }, 450);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.classList.add("opacity-0", "translate-y-6");
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.classList.remove("opacity-0", "translate-y-6");
        el.classList.add("opacity-100", "translate-y-0", "transition-all", "duration-700", "ease-out");
      }, 80);
    });
  }, []);

  return (
    <div className="relative bg-gray-900 text-white overflow-x-hidden font-sans">
      <style>{`
        ::-webkit-scrollbar { display: none; }
        .fade-transition { transition: opacity .45s ease, transform .45s ease; }
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .hover-glow:hover { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(128, 0, 255, 0.3); }
        .futuristic-card { background: linear-gradient(135deg, rgba(20,20,20,0.8), rgba(40,40,40,0.8)); border: 1px solid rgba(0,255,255,0.2); }
      `}</style>

      {/* NAVBAR */}
      <nav className="w-full flex items-center justify-between px-8 py-6 fixed top-0 z-50 backdrop-blur-md bg-black/40 shadow-lg">
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 tracking-wide">
          AI Analyst
        </div>

        <ul className="flex gap-8 text-white font-medium">
          <li><Link to="#home" className="hover:text-cyan-400 transition-all duration-300 ease-out">Home</Link></li>
          <li><Link to="#product" className="hover:text-cyan-400 transition-all duration-300 ease-out">Product</Link></li>
          <li>
            <Link
              to="#faq"
              className="hover:text-cyan-400 transition-all duration-300 ease-out flex items-center gap-1"
            >
              <FaQuestionCircle /> FAQ
            </Link>
          </li>
        </ul>

        <Link
          to="#contact"
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-400 rounded-lg text-white font-semibold hover:from-purple-500 hover:to-cyan-300 transition shadow-lg hover-glow"
        >
          Contact Us
        </Link>
      </nav>

      {/* HERO */}
      <section
        id="home"
        className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 py-32 lg:pb-40 z-10"
      >
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-20 brightness-75">
          <source src="/12421439_3840_2160_30fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black/70 -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-700 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

        <div ref={heroRef} className="max-w-4xl w-full px-4 text-center overflow-visible">
          {/* KEEP THIS EXACT */}
          <h2 className="text-7xl md:text-6xl font-extrabold mb-16 leading-[1.3] md:leading-[1.2] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white">
            Hello, I'm your AI Data Analyst
          </h2>

          <h2 className="text-lg md:text-2xl lg:text-3xl text-gray-200 mb-8">
            <span className="text-white font-semibold mr-2">Here to</span>
            <span
              className={`text-cyan-400 fade-transition inline-block`}
              style={{ opacity: phraseVisible ? 1 : 0 }}
              aria-live="polite"
            >
              {phrases[currentPhraseIndex]}
            </span>
          </h2>

          <div className="text-gray-300 max-w-3xl mx-auto mb-12 text-lg md:text-xl leading-relaxed">
            Relax and let me be your personal smart manager for data analysis. I turn complex data into 
            clear insights, sleek visualizations, and actionable business direction.
          </div>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <button
              onClick={onGetStarted}
              className="px-12 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-400 hover:from-purple-500 hover:to-cyan-300 transition shadow-xl text-lg font-semibold text-white hover:shadow-cyan-500/70 transform hover:scale-105 hover-glow"
            >
              Get Started
            </button>

            <Link
              to="#contact"
              className="px-8 py-4 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 transition text-lg font-medium hover:scale-105 hover-glow"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section id="product" className="py-24 md:py-32 px-6 md:px-32 bg-black relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white tracking-wide">
          What This Tool Does
        </h2>

        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              icon: <FaChartLine size={36} className="animate-pulse text-cyan-400" />,
              title: "Data Strategy",
              desc: "Analyze complex datasets to uncover actionable business strategies and growth opportunities."
            },
            {
              icon: <FaLightbulb size={36} className="animate-pulse text-purple-400" />,
              title: "Smart Insights",
              desc: "Provide clear, digestible insights that allow executives to make informed, data-driven decisions."
            },
            {
              icon: <FaDesktop size={36} className="animate-pulse text-pink-400" />,
              title: "Interactive Visualizations",
              desc: "Deliver clean and intuitive dashboards that highlight key metrics, trends, and KPIs effortlessly."
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="futuristic-card backdrop-blur-3xl rounded-3xl p-8 shadow-2xl hover:scale-105 transform transition duration-500 flex flex-col items-start gap-5 hover:shadow-cyan-500/50 hover-glow"
            >
              <div className="p-5 bg-black/30 rounded-full flex items-center justify-center w-20 h-20">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-2xl text-white tracking-tight">{feature.title}</h3>
              <p className="text-gray-300 text-base leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 md:py-32 px-6 md:px-32 bg-gray-900 text-white relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 tracking-wide">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {[
            { q: "How do I get started?", a: "Click the Get Started button and fill out the form." },
            { q: "Do you provide custom dashboards?", a: "Yes! I tailor dashboards to your business needs." },
            { q: "Can I integrate this with existing data sources?", a: "Absolutely. We support most APIs and databases." },
          ].map((item, index) => (
            <details key={index} className="bg-white/5 backdrop-blur-md p-5 rounded-xl cursor-pointer hover:bg-cyan-500/10 transition-all duration-300">
              <summary className="font-semibold text-lg">{item.q}</summary>
              <p className="mt-3 text-gray-300 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact">
        <Contact title="Contact Us" />
      </section>

      {/* FOOTER */}
      <footer className="py-16 md:py-24 bg-gray-900 text-gray-400 text-center relative z-10 tracking-wide">
        <p>&copy; {new Date().getFullYear()} MN Web Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
}
