/**
 * Overview.js - VERSION: METRIA AI (PERMANENT HIGH-ENERGY DESIGN)
 * UPDATED: 2026-01-16
 * REASON: Refactored Welcome Screen into Onboard.jsx component
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiArrowRight, FiShield, FiZap, 
    FiTarget, FiTerminal, FiActivity, FiCpu, FiX, 
    FiUser, FiSun, FiCloud, FiCloudRain, FiWind
} from "react-icons/fi";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler,
} from "chart.js";

// IMPORT NEW ONBOARD COMPONENT
import Onboard from "./Onboard"; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const textFadeVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export default function Overview({ profile }) {
    const navigate = useNavigate();
    const userToken = localStorage.getItem("adt_token");
    
    const [allDatasets, setAllDatasets] = useState([]);
    const [aiInsights, setAiInsights] = useState(null);
    const [trends, setTrends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCard, setExpandedCard] = useState(null); 

    const [weatherData, setWeatherData] = useState({
        greeting: "",
        weatherSentence: "System initializing...",
        icon: <FiCpu className="text-purple-500" />
    });

    // Handle Weather & Greeting
    useEffect(() => {
        const getBaseGreeting = () => {
            const hour = new Date().getHours();
            if (hour < 12) return "Good morning";
            if (hour < 18) return "Good afternoon";
            return "Good evening";
        };

        const fetchWeather = async (lat, lon) => {
            const base = getBaseGreeting();
            try {
                const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                const { temperature, weathercode } = res.data.current_weather;
                const temp = `${Math.round(temperature)}°C`;
                
                let sentence = "";
                let icon = <FiSun />;

                if (weathercode === 0) {
                    sentence = `It's a clear, ${temp} day—perfect for deep analysis.`;
                    icon = <FiSun className="text-yellow-400" />;
                } else if (weathercode <= 3) {
                    sentence = `It's a calm, ${temp} cloudy day to focus on the numbers.`;
                    icon = <FiCloud className="text-white/60" />;
                } else if (weathercode >= 51) {
                    sentence = `It's raining and ${temp}; a perfect day to dive into data.`;
                    icon = <FiCloudRain className="text-purple-400" />;
                } else {
                    sentence = `It's ${temp} with some wind outside. Ready to analyze.`;
                    icon = <FiWind className="text-purple-400" />;
                }
                setWeatherData({ greeting: base, weatherSentence: sentence, icon });
            } catch (e) {
                setWeatherData({ greeting: base, weatherSentence: "System link established. Ready for today.", icon: <FiCpu className="text-purple-500" /> });
            }
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => setWeatherData({ greeting: getBaseGreeting(), weatherSentence: "System ready. Let's dive in.", icon: <FiCpu className="text-purple-500" /> })
            );
        } else {
            setWeatherData({ greeting: getBaseGreeting(), weatherSentence: "System ready. Let's dive in.", icon: <FiCpu className="text-purple-500" /> });
        }
    }, []);

    // FETCH LATEST AI RUN AND DATASETS WITH UNIVERSAL MAPPING
    useEffect(() => {
        const fetchData = async () => {
            if (!userToken) {
                setIsLoading(false);
                return;
            }
            try {
                const [currentRes, trendsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/analysis/current`, { headers: { Authorization: `Bearer ${userToken}` } }),
                    axios.get(`${API_BASE_URL}/analysis/trends`, { headers: { Authorization: `Bearer ${userToken}` } })
                ]);
                
                if (currentRes.data?.page_state) {
                    const state = currentRes.data.page_state;
                    const datasets = state.allDatasets || [];
                    setAllDatasets(datasets);

                    const raw = state.ai_insight || datasets[0]?.aiStorage || null;
                    
                    if (raw) {
                        setAiInsights({
                            summary: raw["Main Discovery"] || raw.summary || "Scan complete.",
                            risk: raw["Risks to Watch"] || raw.risk || "No major risks detected.",
                            opportunity: raw["Next Big Move"] || raw.opportunity || "Analyzing growth vectors...",
                            action: raw["Top Action"] || raw.action || "Awaiting tactical priority.",
                            impact: raw["Impact (R)"] || raw.impact || raw.roi_impact || "N/A"
                        });
                    }
                }
                
                const mappedTrends = (trendsRes.data || []).map(t => ({
                    ...t,
                    summary: t.summary || t["Main Discovery"]
                }));
                setTrends(mappedTrends);

            } catch (e) {
                console.error("Metria Fetch Error:", e);
            } finally {
                setTimeout(() => setIsLoading(false), 1200);
            }
        };
        fetchData();
    }, [userToken]);

    const getChartData = () => {
        const ds = allDatasets[0];
        if (!ds?.data || ds.data.length < 2) return null;
        
        const valIdx = ds.numericCols?.[0] ?? 1;
        const sample = ds.data.slice(1, 26); 
        
        return {
            labels: sample.map(() => ""),
            datasets: [{
                data: sample.map(row => {
                    const v = parseFloat(String(row[valIdx]).replace(/,/g, ''));
                    return isNaN(v) ? 0 : v;
                }),
                borderColor: '#bc13fe',
                borderWidth: 3,
                pointRadius: 0,
                fill: true,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, 'rgba(188, 19, 254, 0.12)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    return gradient;
                },
                tension: 0.4,
            }]
        };
    };

    if (isLoading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="relative">
                <FiCpu className="text-purple-500 mb-4" size={50} />
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
            </motion.div>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 font-mono text-[9px] text-purple-500/60 tracking-[1em] uppercase text-center">
                Metria AI<br/>Establishing Link
            </motion.span>
        </div>
    );

    const latestTrend = trends[0] || {};
    const insightSummary = aiInsights?.summary || "I'm scanning your datasets now to see what's changed.";

    return (
        <motion.div 
            initial="hidden" animate="visible" variants={containerVariants}
            className="w-full text-white font-sans p-0 overflow-x-hidden flex flex-col relative z-10 bg-black min-h-screen"
        >
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 px-4 md:px-8 pt-6 relative z-10 gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                        <FiTerminal className="text-purple-500" size={18} />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white/90">Metria Intelligence</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] text-emerald-500/80 font-bold uppercase tracking-widest">Neural Link Active</span>
                        </div>
                    </div>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(188, 19, 254, 0.3)" }} whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/dashboard/analytics")} 
                    className="w-full md:w-auto px-8 py-3 bg-purple-600 text-white rounded-full font-bold text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all"
                >
                    Access Workbench <FiArrowRight />
                </motion.button>
            </header>

            <main className="flex-1 space-y-4 px-4 md:px-8 relative z-10 pb-8">
                {allDatasets.length === 0 ? (
                    /* RENDER ONBOARD COMPONENT FOR NEW USERS */
                    <Onboard 
                        profile={profile} 
                        weatherData={weatherData} 
                        onAction={() => navigate("/dashboard/analytics")} 
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-12 gap-4">
                            <motion.section 
                                variants={itemVariants}
                                className="col-span-12 relative overflow-hidden border border-white/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 flex flex-col justify-between min-h-[400px] md:min-h-[420px] group shadow-[0_0_40px_rgba(255,255,255,0.03)] bg-white/[0.04] transition-all duration-500"
                            >
                                <div className="absolute inset-0 opacity-40 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.15), transparent 70%)` }}
                                />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-5 mb-6 md:mb-8">
                                        <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-white">Executive overview</span>
                                    </div>
                                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-tight md:leading-none mb-6 md:mb-10 uppercase text-white">
                                        {weatherData.greeting}, {profile?.first_name || "Agent"}.
                                    </h1>
                                    <div className="max-w-5xl md:pl-2">
                                        <motion.p variants={textFadeVariants} className="text-white/40 text-lg md:text-xl lg:text-2xl font-light italic tracking-tight block mb-4">
                                            {weatherData.weatherSentence}
                                        </motion.p>
                                        <motion.p variants={textFadeVariants} className="text-white text-xl md:text-2xl lg:text-4xl font-normal leading-snug tracking-tight block italic">
                                            {insightSummary}
                                        </motion.p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-8 sm:gap-20 mt-12 relative z-10 border-t border-white/5 pt-8">
                                    <div>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-2">Impact Projection</p>
                                        <p className="text-3xl md:text-4xl font-black text-white">{aiInsights?.impact || "---"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-2">Confidence</p>
                                        <p className="text-3xl md:text-4xl font-black text-purple-500 shadow-[0_0_20px_rgba(188,19,254,0.2)]">
                                            {latestTrend.confidence ? `${(latestTrend.confidence * 100).toFixed(0)}%` : "98%"}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-6 md:left-10 right-6 md:left-10 h-1 rounded-t-full bg-white shadow-[0_0_20px_white]" />
                            </motion.section>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InsightCard 
                                title="Risk Matrix" 
                                content={aiInsights?.risk} 
                                icon={FiShield} 
                                accentColor="rgba(188, 19, 254, 0.4)"
                                isPurple 
                                onClick={() => setExpandedCard({ title: "Risk Matrix", content: aiInsights?.risk, icon: FiShield, color: "text-purple-400" })} 
                            />
                            <InsightCard 
                                title="Growth Vectors" 
                                content={aiInsights?.opportunity} 
                                icon={FiZap} 
                                accentColor="rgba(255, 255, 255, 0.15)"
                                onClick={() => setExpandedCard({ title: "Growth Vectors", content: aiInsights?.opportunity, icon: FiZap, color: "text-white" })} 
                            />
                            <InsightCard 
                                title="Tactical Priority" 
                                content={aiInsights?.action} 
                                icon={FiTarget} 
                                accentColor="rgba(188, 19, 254, 0.4)"
                                isPurple 
                                onClick={() => setExpandedCard({ title: "Tactical Priority", content: aiInsights?.action, icon: FiTarget, color: "text-purple-400" })} 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <motion.section variants={itemVariants} className="col-span-12 md:col-span-4 bg-white/[0.03] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
                                <div className="flex items-center gap-3 text-white/30 mb-8">
                                    <FiUser size={18} />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em]">Identity Profile</h4>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { label: "Current Operator", value: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Independent Agent" },
                                        { label: "Sector Focus", value: profile?.industry || "Quantitative Markets" }
                                    ].map((item, idx) => (
                                        <div key={idx} className="border-b border-white/5 pb-4">
                                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em] mb-2">{item.label}</p>
                                            <p className="text-sm text-white font-black uppercase tracking-tighter">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>

                            <motion.section variants={itemVariants} 
                                whileHover={{ y: -5 }} 
                                onClick={() => navigate("/dashboard/analytics")}
                                className="col-span-12 md:col-span-8 bg-purple-900/10 border border-purple-500/30 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 cursor-pointer shadow-[0_0_40px_rgba(188,19,254,0.05)] transition-all relative overflow-hidden" 
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 relative z-10 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-purple-500 uppercase tracking-[0.5em] mb-2">
                                            <FiActivity className="animate-pulse" /> Active Telemetry
                                        </div>
                                        <h4 className="text-white text-2xl md:text-3xl font-black uppercase tracking-tighter">{allDatasets[0]?.name || "Primary Node"}</h4>
                                    </div>
                                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full border border-purple-500/40 bg-purple-500/20 text-white flex items-center justify-center shadow-[0_0_15px_rgba(188,19,254,0.3)]">
                                        <FiArrowRight size={20} />
                                    </div>
                                </div>
                                <div className="h-[120px] md:h-[140px] -mx-4 opacity-100">
                                    {allDatasets.length > 0 && <Line data={getChartData()} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display: false } } }} />}
                                </div>
                            </motion.section>
                        </div>
                    </>
                )}
            </main>

            <AnimatePresence>
                {expandedCard && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/98 backdrop-blur-2xl">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} className="bg-white/[0.02] border border-white/10 w-full max-w-5xl rounded-[2rem] md:rounded-[4rem] p-8 md:p-16 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                            <div className={`flex flex-col md:flex-row items-start md:items-center gap-6 ${expandedCard.color} mb-8 md:mb-12`}>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <expandedCard.icon className="w-8 h-8 md:w-11 md:h-11" />
                                </div>
                                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-[0.3em] md:tracking-[0.5em]">{expandedCard.title}</h2>
                            </div>
                            <button onClick={() => setExpandedCard(null)} className="absolute top-6 right-6 md:top-12 md:right-12 text-white/20 hover:text-white transition-colors">
                                <FiX className="w-8 h-8 md:w-10 md:h-10" />
                            </button>
                            <div className="text-xl md:text-3xl text-white/90 leading-relaxed font-light italic">
                                {expandedCard.content}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

const InsightCard = ({ title, content, icon: Icon, onClick, isPurple, accentColor }) => {
    return (
        <motion.div 
            variants={itemVariants} 
            onClick={onClick}
            whileHover={{ y: -5, scale: 1.01 }} 
            className={`relative overflow-hidden border rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 transition-all duration-500 cursor-pointer flex flex-col min-h-[260px] md:min-h-[280px] ${
                isPurple 
                ? 'bg-purple-900/20 border-purple-500/40 shadow-[0_0_40px_rgba(188,19,254,0.1)]' 
                : 'bg-white/[0.04] border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.03)]'
            }`} 
        >
            <div className="absolute inset-0 opacity-40 pointer-events-none"
                style={{ background: `radial-gradient(circle at 20% 20%, ${accentColor}, transparent 70%)` }}
            />
            <div className="relative z-10">
                <div className="flex items-center gap-5 mb-6 md:mb-8">
                    <div className={`p-3 md:p-4 rounded-2xl border shadow-2xl transition-all duration-500 ${
                        isPurple 
                        ? 'bg-purple-600 border-purple-400 text-white shadow-purple-500/40' 
                        : 'bg-white border-white text-black shadow-white/20'
                    }`}>
                        <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className={`text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] ${isPurple ? 'text-purple-300' : 'text-white'}`}>
                        {title}
                    </span>
                </div>
                <div className="text-[14px] md:text-[15px] text-white/90 leading-relaxed italic">
                    {content ? (
                        <p className="line-clamp-4">{content}</p>
                    ) : (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-2 bg-white/10 rounded w-full" />
                            <div className="h-2 bg-white/10 rounded w-4/5" />
                        </div>
                    )}
                </div>
            </div>
            <div className={`absolute bottom-0 left-8 md:left-10 right-8 md:right-10 h-1 rounded-t-full ${
                isPurple ? 'bg-purple-500 shadow-[0_0_20px_#bc13fe]' : 'bg-white shadow-[0_0_20px_white]'
            }`} />
        </motion.div>
    );
};