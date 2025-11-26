// src/pages/Landing.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Contact from "./Contact";
import { FaChartLine, FaLightbulb, FaDesktop, FaQuestionCircle } from "react-icons/fa";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

/**
 * NeuraTwin Landing (Custom Layout 4)
 * - Loading boot overlay (full screen, typed lines)
 * - Parallax particle layers (background + foreground)
 * - SVG node graph (animated)
 * - Neon grid (CSS)
 * - Canvas text-morph particle effect (scroll target)
 * - Fade-in-on-scroll transitions from left/right alternately
 *
 * No three.js dependency here so it works with smaller installs.
 */

/* ---------- Configs ---------- */
const PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1508780709619-79562169bc64?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1400&q=80",
];

const BOOT_LINES = [
  "Initializing NeuraTwin...",
  "Loading data connectors...",
  "Calibrating analytics modules...",
  "Preparing dashboards...",
  "NeuraTwin ready.",
];

const HERO_PHRASES = [
  "act as a bridge between data and business strategy.",
  "translate complex data into actionable insights.",
  "provide easy-to-digest visualizations for executives.",
];

/* ---------- Helper: fade-in on scroll ---------- */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal-on-scroll");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            // if you want them to animate once, unobserve:
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

/* ---------- Canvas Text Morph (particles form text) ---------- */
function TextMorphCanvas({ text = "AI ANALYTICS", triggerRef }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // particles configuration
  const PARTICLE_COUNT = 800;

  // store particles
  const particlesRef = useRef([]);

  // generate random float
  const rnd = (min, max) => Math.random() * (max - min) + min;

  // create particles
  const initParticles = (w, h) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: rnd(0, w),
      y: rnd(0, h),
      tx: rnd(0, w),
      ty: rnd(0, h),
      vx: 0,
      vy: 0,
      size: rnd(0.8, 1.6),
      color: `rgba(6,182,212,${rnd(0.6, 1)})`,
    }));
  };

  // compute text pixel targets using offscreen canvas
  const computeTargetsFromText = useCallback((txt, w, h) => {
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d");
    // background transparent
    ctx.clearRect(0, 0, w, h);
    // large font sized to canvas
    let fontSize = Math.floor(w / (txt.length * 0.6));
    fontSize = Math.min(fontSize, Math.floor(h * 0.6));
    ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // gradient fill (not strictly needed)
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#06b6d4");
    grad.addColorStop(1, "#6b46ff");
    ctx.fillStyle = grad;
    ctx.fillText(txt, w / 2, h / 2);

    // sample pixels
    const img = ctx.getImageData(0, 0, w, h).data;
    const points = [];
    const gap = 6; // how dense target points are
    for (let y = 0; y < h; y += gap) {
      for (let x = 0; x < w; x += gap) {
        const i = (y * w + x) * 4;
        if (img[i + 3] > 128) {
          points.push({ x, y });
        }
      }
    }
    return points;
  }, []);

  // animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      ctx.scale(ratio, ratio);
      initParticles(canvas.clientWidth, canvas.clientHeight);
    };

    resize();
    window.addEventListener("resize", resize);

    let targets = computeTargetsFromText(text, canvas.clientWidth, canvas.clientHeight);

    // map particles to target points
    const assignTargets = () => {
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        const t = targets[i % targets.length];
        if (t) {
          p.tx = t.x + rnd(-2, 2);
          p.ty = t.y + rnd(-2, 2);
        } else {
          // fallback random target
          p.tx = rnd(0, canvas.clientWidth);
          p.ty = rnd(0, canvas.clientHeight);
        }
      }
    };

    // animation frame
    const step = () => {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      for (const p of particlesRef.current) {
        // simple spring physics towards target
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        p.vx += dx * 0.02;
        p.vy += dy * 0.02;
        // add friction
        p.vx *= 0.86;
        p.vy *= 0.86;
        // update positions
        p.x += p.vx;
        p.y += p.vy;
        // draw
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(step);
    };

    // start initially as scattered
    assignTargets();
    step();

    // trigger reassign targets when triggerRef intersects (scroll into view)
    let observer;
    if (triggerRef && triggerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              // recompute targets based on current canvas size and text
              targets = computeTargetsFromText(text, canvas.clientWidth, canvas.clientHeight);
              assignTargets();
            } else {
              // when leaving, scatter again (assign random targets)
              for (const p of particlesRef.current) {
                p.tx = rnd(0, canvas.clientWidth);
                p.ty = rnd(0, canvas.clientHeight);
              }
            }
          });
        },
        { threshold: 0.35 }
      );
      observer.observe(triggerRef.current);
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      if (observer && triggerRef.current) observer.unobserve(triggerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeTargetsFromText, text, triggerRef]);

  return (
    <div className="w-full h-[220px] md:h-[320px] bg-transparent rounded-lg overflow-hidden relative">
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      {/* overlay subtle text for accessibility */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <span className="text-white/5 font-bold tracking-wider"> {text} </span>
      </div>
    </div>
  );
}

/* ---------- SVG Node Graph (lightweight, animates) ---------- */
function NodeGraph({ className = "" }) {
  const [nodes] = useState(() =>
    Array.from({ length: 10 }).map(() => ({
      x: Math.random() * 92 + 4,
      y: Math.random() * 72 + 8,
      r: Math.random() * 4 + 2.5,
      color: Math.random() > 0.6 ? "#06b6d4" : "#6b46ff",
    }))
  );

  // create connections indices
  const connections = [];
  for (let i = 0; i < nodes.length; i++) {
    connections.push([i, (i + 1) % nodes.length]);
    if (Math.random() > 0.6) connections.push([i, (i + 2) % nodes.length]);
  }

  return (
    <svg viewBox="0 0 100 80" preserveAspectRatio="none" className={`w-full h-36 ${className}`}>
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#6b46ff" />
        </linearGradient>
      </defs>

      {/* lines */}
      {connections.map((c, idx) => {
        const a = nodes[c[0]];
        const b = nodes[c[1]];
        return (
          <line
            key={idx}
            x1={`${a.x}`}
            y1={`${a.y}`}
            x2={`${b.x}`}
            y2={`${b.y}`}
            stroke="url(#g1)"
            strokeOpacity={0.25 + Math.random() * 0.5}
            strokeWidth={0.3 + Math.random() * 0.9}
            style={{ transformOrigin: "50% 50%", animation: `pulse ${2.4 + Math.random() * 2}s ease-in-out infinite` }}
          />
        );
      })}

      {/* nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} opacity={0.95} />
        </g>
      ))}

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-0.6px); }
          100% { opacity: 0.2; transform: translateY(0); }
        }
      `}</style>
    </svg>
  );
}

/* ---------- Particle layers config (react-tsparticles) ---------- */
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
    color: { value: ["#06b6d4", "#6b46ff", "#00ffd5"] },
    opacity: { value: 0.14 },
    size: { value: { min: 1, max: 3 } },
    move: { enable: true, speed: 0.8, random: true, outModes: "out" },
    links: { enable: true, distance: 120, color: "#06b6d4", opacity: 0.08, width: 1 },
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

  // hero phrase cycling
  const [phraseIdx, setPhraseIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPhraseIdx((p) => (p + 1) % HERO_PHRASES.length), 4200);
    return () => clearInterval(iv);
  }, []);

  // loading overlay typing
  const [loading, setLoading] = useState(true);
  const [typed, setTyped] = useState("");
  const typingRef = useRef(null);

  useEffect(() => {
    let line = 0;
    let char = 0;
    typingRef.current = setInterval(() => {
      if (line >= BOOT_LINES.length) {
        clearInterval(typingRef.current);
        setTimeout(() => setLoading(false), 900);
        return;
      }
      setTyped(BOOT_LINES[line].slice(0, char + 1));
      char++;
      if (char >= BOOT_LINES[line].length) {
        line++;
        char = 0;
      }
    }, 40);
    return () => clearInterval(typingRef.current);
  }, []);

  // parallax scroll
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || window.pageYOffset || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // reference to text morph trigger
  const morphRef = useRef(null);

  return (
    <div className="relative bg-[#05060a] text-white min-h-screen overflow-x-hidden font-sans">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />

      {/* Small CSS used inline for convenience */}
      <style>{`
        :root{
          --c1:#06b6d4; --c2:#6b46ff; --muted: rgba(255,255,255,0.06);
        }
        .glow-grad{ background: linear-gradient(90deg,var(--c1),var(--c2)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
        .glass { background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid rgba(255,255,255,0.04); backdrop-filter: blur(8px); }
        .reveal-on-scroll { opacity:0; transform: translateX(32px); transition: all 700ms cubic-bezier(.2,.9,.2,1); }
        .reveal-on-scroll.revealed { opacity:1; transform: translateX(0); }
        .reveal-on-scroll.left { transform: translateX(-32px); }
        .neon-grid { background-image: linear-gradient(rgba(107,70,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px); background-size: 40px 40px, 40px 40px; opacity:0.6; filter: blur(6px) saturate(1.2); transform: translateZ(0); }
      `}</style>

      {/* Loading overlay (full screen) */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020205]">
          {/* background particle layer behind boot panel */}
          <Particles id="boot-bg" init={loadSlim} options={{
            fullScreen: { enable: false },
            particles: { number: { value: 40 }, color: { value: ["#071226", "#08122a"] }, opacity: { value: 0.08 }, size: { value: { min: 1, max: 3 } }, move: { enable: true, speed: 0.3 } }
          }} className="absolute inset-0" />
          <div className="relative z-10 w-[92%] max-w-xl p-8 rounded-2xl glass flex flex-col items-center gap-4">
            <div className="text-4xl md:text-5xl font-extrabold glow-grad">NeuraTwin</div>
            <div className="font-mono text-sm text-[#a6f0e6] min-h-[24px]">{typed}<span className="ml-2 inline-block w-[2px] h-4 bg-gradient-to-b from-var(--c1) to-var(--c2) animate-pulse" /></div>
            <div className="w-full h-2 rounded bg-white/3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#06b6d4] to-[#6b46ff] animate-[progress_2.8s_linear_1]"></div>
            </div>
            <div className="text-xs text-gray-300/80">Booting analytics engine · connecting to data sources</div>
          </div>
          <style>{`
            @keyframes progress { 0%{ width: 0%; } 100% { width: 100%; } }
            .animate-[progress_2.8s_linear_1] { animation: progress 2.8s linear 1 forwards; }
            .animate-pulse { animation: blinking 1s linear infinite; }
            @keyframes blinking { 0%{opacity:1}50%{opacity:0}100%{opacity:1} }
          `}</style>
        </div>
      )}

      {/* Background particle layer (far) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <Particles id="bg-particles" init={loadSlim} options={particlesOptionsBg} style={{ position: "absolute", inset: 0 }} />
      </div>

      {/* Foreground particles (parallaxed slightly, in front) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 5, pointerEvents: "none" }}>
        <Particles id="fg-particles" init={loadSlim} options={particlesOptionsFront} style={{ position: "absolute", inset: 0, transform: `translateY(${scrollY * 0.02}px)` }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20">
        <nav className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-extrabold glow-grad select-none">NeuraTwin</div>
            <div className="hidden md:block text-sm text-gray-400">AI Business Analyst Twin</div>
          </div>
          <div className="flex items-center gap-4">
            <ul className="hidden md:flex gap-6 text-sm text-gray-200 items-center">
              <li><a href="#home" className="hover:text-cyan-300">Home</a></li>
              <li><a href="#product" className="hover:text-cyan-300">Product</a></li>
              <li><a href="#faq" className="flex items-center gap-2 hover:text-cyan-300"><FaQuestionCircle /> FAQ</a></li>
            </ul>
            <div className="flex items-center gap-2">
              <Link to="#contact" className="text-sm px-3 py-2 border border-white/6 rounded hover:bg-white/5">Contact</Link>
              <button onClick={onGetStarted} className="px-4 py-2 rounded bg-gradient-to-r from-[#06b6d4] to-[#6b46ff] text-black font-semibold">Get started</button>
            </div>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <main className="pt-20 relative z-10">
        <section id="home" className="min-h-[84vh] flex items-center">
          <div className="max-w-6xl mx-auto w-full px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 reveal-on-scroll left">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                <span className="block text-white">Meet</span>
                <span className="block glow-grad text-5xl md:text-6xl">NeuraTwin</span>
                <span className="block text-lg md:text-xl mt-2 text-gray-300">Your AI-powered digital twin for business data</span>
              </h1>

              <p className="text-gray-300 max-w-xl">
                NeuraTwin ingests spreadsheets and business systems, cleans and visualizes data automatically, and produces executive-ready insights so your team can move faster.
              </p>

              <div className="flex gap-4 items-center">
                <button onClick={onGetStarted} className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#06b6d4] to-[#6b46ff] font-semibold text-black">Start with NeuraTwin</button>
                <a href="#product" className="text-sm text-gray-300 hover:text-cyan-300">See product</a>
              </div>

              <div className="mt-6 text-sm text-gray-400 flex gap-6">
                <div><strong className="text-white">Instant</strong> insights</div>
                <div><strong className="text-white">Auto dashboards</strong></div>
                <div><strong className="text-white">AI recommendations</strong></div>
              </div>
            </div>

            <div className="reveal-on-scroll right">
              <div className="glass p-5 rounded-2xl shadow-xl border border-white/6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-gray-400">Connected</div>
                    <div className="font-semibold">Google Sheets • Stripe • HubSpot</div>
                  </div>
                  <div className="text-sm text-gray-300">Live • <span className="text-cyan-300">Realtime</span></div>
                </div>

                <div className="bg-black/20 rounded-lg p-3 max-h-64 overflow-hidden">
                  <NodeGraph />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-black/10 rounded">
                    <div className="text-xs text-gray-400">Revenue (30d)</div>
                    <div className="font-bold">R 224,578</div>
                  </div>
                  <div className="p-3 bg-black/10 rounded">
                    <div className="text-xs text-gray-400">Avg Order</div>
                    <div className="font-bold">R 1,342</div>
                  </div>
                  <div className="p-3 bg-black/10 rounded">
                    <div className="text-xs text-gray-400">Active Sheets</div>
                    <div className="font-bold">6</div>
                  </div>
                  <div className="p-3 bg-black/10 rounded">
                    <div className="text-xs text-gray-400">Alerts</div>
                    <div className="font-bold text-amber-400">2</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="w-full h-2 rounded bg-white/3 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#06b6d4] to-[#6b46ff]" style={{ width: `${30 + (scrollY % 70)}%`, transition: "width .6s ease" }} />
                </div>
              </div>
            </div>
          </div>

          {/* subtle neon grid over hero bottom */}
          <div className="absolute left-0 right-0 bottom-0 h-40 neon-grid pointer-events-none" style={{ opacity: 0.14 }} />
        </section>

        {/* PRODUCT / ABOUT */}
        <section id="product" className="py-20 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 glow-grad reveal-on-scroll">What NeuraTwin Does</h2>

            <div className="grid md:grid-cols-3 gap-8">
              {PRODUCT_IMAGES.map((img, i) => (
                <article key={i} className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 reveal-on-scroll" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                  <div className="p-6 glass">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#06b6d4] to-[#6b46ff] flex items-center justify-center text-black">
                        {i === 0 ? <FaChartLine /> : i === 1 ? <FaLightbulb /> : <FaDesktop />}
                      </div>
                      <h3 className="text-xl font-semibold">Feature {i + 1}</h3>
                    </div>
                    <p className="text-gray-300">Description of feature {i + 1} with AI/data focus.</p>
                    <div className="mt-4">
                      <button className="text-sm px-3 py-2 rounded bg-white/6 hover:bg-white/8">Learn more</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* TEXT MORPH SECTION */}
        <section id="morph" className="py-10 px-6 md:px-12">
          <div className="max-w-6xl mx-auto reveal-on-scroll" ref={morphRef} style={{ display: "grid", gap: 16 }}>
            <h3 className="text-xl md:text-2xl font-semibold text-center glow-grad">Data that speaks</h3>
            <div className="mx-auto w-full md:w-3/4">
              <TextMorphCanvas text="AI ANALYTICS" triggerRef={morphRef} />
            </div>
            <p className="text-center text-gray-300 max-w-3xl mx-auto">
              Watch particles rearrange to form meaning — this is how NeuraTwin turns raw numbers into clear narratives.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 px-6 md:px-12 bg-[#06060b]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 glow-grad reveal-on-scroll">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "What is NeuraTwin?", a: "A digital twin that integrates business data and acts as your AI analyst — turning data into actionable insights." },
                { q: "Do I need technical skills?", a: "No — NeuraTwin automates data cleaning, visualization, and analysis for you." },
                { q: "Which data sources can I connect?", a: "Google Sheets, Excel, Stripe, HubSpot, CSVs, databases and APIs." },
              ].map((it, i) => (
                <details key={i} className="bg-black/20 p-5 rounded-lg reveal-on-scroll" style={{ transitionDelay: `${i * 80}ms` }}>
                  <summary className="cursor-pointer font-semibold">{it.q}</summary>
                  <p className="mt-3 text-gray-300">{it.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="py-16 px-6 md:px-12">
          <div className="max-w-4xl mx-auto reveal-on-scroll">
            <Contact title="Contact Us" />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-12 text-center text-gray-400">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-4">&copy; {new Date().getFullYear()} NeuraTwin — MN Web Solutions</div>
            <div className="text-sm">Built for fast decisions. Powered by AI.</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
