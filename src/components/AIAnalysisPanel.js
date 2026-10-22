/**
 * components/AIAnalysisPanel.js - NEURAL INTELLIGENCE ENGINE
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaRedo, FaSearch, FaRobot, FaCreditCard, FaVolumeUp, FaCopy
} from 'react-icons/fa';
import {
    FiShield, FiZap, FiCpu, FiX, FiTarget, FiCheckCircle, FiFileText, FiArrowRight
} from 'react-icons/fi';

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

// Replace with your actual Paddle Price ID from your Paddle Dashboard
// Paddle price is configured on the FastAPI server.

// Sub-component: Audio Waveform
const AudioWaveform = ({ color = "#bc13fe" }) => (
    <div className="flex items-center gap-1 h-4">
        {[...Array(4)].map((_, i) => (
            <motion.div
                key={i}
                animate={{ height: [4, 16, 8, 14, 4] }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                }}
                className="w-1 rounded-full"
                style={{ backgroundColor: color }}
            />
        ))}
    </div>
);

// Sub-component: Insight Card
const InsightCard = ({ title, content, icon: Icon, isPurple, onClick }) => (
    <div
        onClick={onClick}
        className="relative group bg-[#111116] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col transition-all duration-300 hover:border-white/20 hover:translate-y-[-4px] shadow-2xl cursor-pointer"
    >
        <div
            className="h-1.5 w-full opacity-80"
            style={{ backgroundColor: isPurple ? '#bc13fe' : '#a5b4fc' }}
        />

        <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div
                    className={`p-3 rounded-xl bg-white/5 ${
                        isPurple ? 'text-[#bc13fe]' : 'text-indigo-400'
                    }`}
                >
                    <Icon size={20} />
                </div>

                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <div
                        className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            isPurple ? 'bg-[#bc13fe]' : 'bg-indigo-400'
                        }`}
                    />
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">
                        Live Stream
                    </span>
                </div>
            </div>

            <h4 className="text-white font-bold text-lg mb-3 tracking-tight group-hover:text-indigo-300 transition-colors">
                {title}
            </h4>

            <p className="text-white text-sm leading-relaxed mb-8 line-clamp-4 font-medium">
                {content || "Analyzing dataset metrics..."}
            </p>

            <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-center gap-3 text-[10px] text-white uppercase tracking-[0.2em] font-bold">
                    <FiCheckCircle
                        className={isPurple ? 'text-[#bc13fe]' : 'text-indigo-400'}
                    />
                    Verified Metrics
                </div>

                <div className="flex items-center gap-3 text-[10px] text-white uppercase tracking-[0.2em] font-bold">
                    <FiCheckCircle
                        className={isPurple ? 'text-[#bc13fe]' : 'text-indigo-400'}
                    />
                    High Confidence
                </div>
            </div>

            <button
                className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                    isPurple
                        ? 'bg-[#bc13fe]/10 text-[#bc13fe] border border-[#bc13fe]/20'
                        : 'bg-white/5 text-white/40 border border-white/10'
                }`}
            >
                View Strategy Brief
            </button>
        </div>
    </div>
);

// Sub-component: Typewriter
const TypewriterText = ({ text, delay = 5 }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        setDisplayedText("");

        if (!text) return;

        let currentIndex = 0;

        const timer = setInterval(() => {
            if (currentIndex < text.length) {
                setDisplayedText(text.substring(0, currentIndex + 1));
                currentIndex++;
            } else {
                clearInterval(timer);
            }
        }, delay);

        return () => clearInterval(timer);
    }, [text, delay]);

    return <span>{displayedText}</span>;
};

const AIAnalysisPanel = ({
    datasets = [],
    onUpdateAI,
    analysisMode = "single",
    activeDatasetIndex = 0,
    crossAnalysis = null,
    onRunCrossAnalysis
}) => {
    const [loading, setLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState("");
    const [accessInfo, setAccessInfo] = useState(null);
    const [verifyingPayment, setVerifyingPayment] = useState(false);
    const paymentPollRef = useRef(false);
    const [analysisPhase, setAnalysisPhase] = useState(0);
    const [expandedCard, setExpandedCard] = useState(null);
    const [isFullReportOpen, setIsFullReportOpen] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [copied, setCopied] = useState(false);
    const panelRef = useRef(null);
    const actionRef = useRef(null);
    const lastDatasetRef = useRef(null);

    const userToken = localStorage.getItem("adt_token");

    const userProfile = useMemo(() => {
        try {
            const stored = localStorage.getItem("adt_profile");
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }, []);

    /**
     * Cross-analysis mode.
     *
     * Supports BOTH:
     * 1. Explicit parent mode: analysisMode="cross"
     * 2. Multiple datasets being supplied directly.
     *
     * This preserves compatibility with existing callers.
     */
    const isCrossAnalysis =
        analysisMode === "cross" || datasets.length > 1;

    /**
     * Active dataset for normal/single analysis.
     *
     * Falls back safely to datasets[0] if activeDatasetIndex is invalid.
     */
    const activeDataset =
        datasets[activeDatasetIndex] || datasets[0] || null;

    /**
     * Insights displayed by this panel.
     *
     * Cross mode -> crossAnalysis result owned by parent.
     * Single mode -> existing dataset.aiStorage behaviour.
     */
    const aiInsights = isCrossAnalysis
        ? (crossAnalysis || activeDataset?.aiStorage || null)
        : activeDataset?.aiStorage;

    // Bring the next action into view when the selected dataset changes.
    // Do not jump on first mount, or while a report is already available.
    useEffect(() => {
        const key = activeDataset?.id ?? activeDataset?.name ?? activeDataset?.filename ?? activeDatasetIndex;
        if (!activeDataset || aiInsights || loading) return;
        if (lastDatasetRef.current === null) {
            lastDatasetRef.current = key;
            return;
        }
        if (lastDatasetRef.current !== key) {
            lastDatasetRef.current = key;
            const timer = setTimeout(() => {
                actionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 180);
            return () => clearTimeout(timer);
        }
    }, [activeDataset, activeDatasetIndex, aiInsights, loading]);

    // Focus the ready-state CTA and temporarily prevent unnecessary page scrolling.
    // Keep smaller screens scrollable so the action is never clipped.
    useEffect(() => {
        if (loading || aiInsights || !activeDataset) return;
        if (!window.matchMedia('(min-width: 1024px)').matches) return;

        const timer = window.setTimeout(() => {
            actionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
        const lockTimer = window.setTimeout(() => {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        }, 550);
        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousBodyOverflow = document.body.style.overflow;
        return () => {
            window.clearTimeout(timer);
            window.clearTimeout(lockTimer);
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.style.overflow = previousBodyOverflow;
        };
    }, [loading, aiInsights, activeDataset]);

    // Loading phase step descriptions
    const phases = useMemo(() => {
        if (isCrossAnalysis) {
            return [
                "Mapping dataset relationships...",
                "Normalizing shared business dimensions...",
                "Testing relationships and metric consistency...",
                "Finding cross-dataset drivers...",
                "Evaluating combined business impact...",
                "Assembling cross-business strategy..."
            ];
        }

        return [
            "Initializing Data Engine...",
            "Evaluating core dataset metrics and parameters...",
            "Analyzing statistical variance and performance...",
            "Identifying primary bottlenecks and anomalies...",
            "Simulating strategic scenarios and financial impact...",
            "Assembling executive synthesis report..."
        ];
    }, [isCrossAnalysis]);

    useEffect(() => {
        window.speechSynthesis.getVoices();
    }, []);

    useEffect(() => {
        let interval;

        if (loading) {
            interval = setInterval(() => {
                setAnalysisPhase(prev =>
                    prev < phases.length - 1 ? prev + 1 : prev
                );
            }, 2000);
        } else {
            setAnalysisPhase(0);
        }

        return () => clearInterval(interval);
    }, [loading, phases.length]);

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text || "");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    const toggleSpeech = (textOverride) => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        let contentToRead = textOverride;

        if (isFullReportOpen && aiInsights) {
            if (isCrossAnalysis) {
                contentToRead = `
                    Cross-dataset strategy update.
                    Summary: ${aiInsights.summary || ""}.
                    Dataset relationship: ${
                        aiInsights.relationship ||
                        aiInsights.relationship_summary ||
                        aiInsights.dataset_relationship ||
                        ""
                    }.
                    Key driver: ${
                        aiInsights.root_cause ||
                        aiInsights.cross_driver ||
                        ""
                    }.
                    Risks: ${aiInsights.risk || ""}.
                    Opportunities: ${aiInsights.opportunity || ""}.
                    Action items: ${aiInsights.action || ""}.
                    Business impact: ${aiInsights.roi_impact || ""}.
                `;
            } else {
                contentToRead = `
                    Executive strategy update.
                    Summary: ${aiInsights.summary || ""}.
                    Primary bottleneck: ${aiInsights.root_cause || ""}.
                    Identified risks: ${aiInsights.risk || ""}.
                    Opportunity: ${aiInsights.opportunity || ""}.
                    Action items: ${aiInsights.action || ""}.
                `;
            }
        }

        if (!contentToRead) return;

        const utterance = new SpeechSynthesisUtterance(contentToRead);
        const voices = window.speechSynthesis.getVoices();

        const britishVoice = voices.find(
            v =>
                v.lang.includes('en-GB') &&
                (
                    v.name.includes('Female') ||
                    v.name.includes('UK') ||
                    v.name.includes('Google')
                )
        );

        utterance.voice =
            britishVoice ||
            voices.find(v => v.lang.includes('en-GB')) ||
            voices[0];

        utterance.rate = 0.85;
        utterance.pitch = 1.1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    // Subscription and trial status are always read from the backend.
    const getAnalysisAccess = async () => {
        const token = localStorage.getItem("adt_token");
        if (!token) throw new Error("Please sign in again.");
        const response = await axios.get(`${API_BASE_URL}/ai/analysis-access`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setAccessInfo(response.data);
        return response.data;
    };

    useEffect(() => {
        if (!userToken) return;
        getAnalysisAccess().catch(err => {
            console.warn("Could not load analysis entitlement", err);
        });
        // Refresh entitlement when account changes or panel mounts.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userToken]);

    const openPaddleCheckout = async () => {
        setAnalysisError("");
        const token = localStorage.getItem("adt_token");
        if (!token) {
            setAnalysisError("Please sign in again to subscribe.");
            return;
        }
        if (!window.Paddle?.Checkout?.open) {
            setAnalysisError("Checkout is still loading. Please try again.");
            return;
        }
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/billing/checkout`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const transactionId = response.data?.transaction_id;
            if (!transactionId) throw new Error("Checkout transaction was not created.");
            window.Paddle.Checkout.open({ transactionId });
        } catch (error) {
            if (error.response?.status === 409) {
                try {
                    const access = await getAnalysisAccess();
                    if (access.is_pro) {
                        setAnalysisError("");
                        return;
                    }
                } catch (_) { /* Preserve original checkout error below. */ }
            }
            setAnalysisError(
                error.response?.data?.detail || error.message ||
                "Unable to start checkout. Please try again."
            );
        }
    };

    const executeAnalysisCall = async () => {
        if (loading) return;
        setLoading(true);
        setAnalysisError("");
        try {
            if (isCrossAnalysis) {
                if (typeof onRunCrossAnalysis !== "function") {
                    throw new Error("Cross-analysis is unavailable. Please try again.");
                }
                // The parent cross-analysis handler must call the protected
                // /ai/analyze endpoint. This frontend check is not enforcement.
                await onRunCrossAnalysis(datasets);
            } else {
                const dataset = activeDataset;
                if (!dataset) throw new Error("Select a dataset first.");
                const rawRows = dataset.rows || dataset.data ||
                    dataset.raw || dataset.records || [];
                const payloadContext = rawRows.length > 0 ? rawRows : dataset;
                const response = await axios.post(
                    `${API_BASE_URL}/ai/analyze`,
                    { context: payloadContext },
                    { headers: {
                        Authorization: `Bearer ${localStorage.getItem("adt_token")}`,
                        "Content-Type": "application/json"
                    } }
                );
                if (response.data && typeof onUpdateAI === "function") {
                    onUpdateAI(dataset.id, response.data);
                }
            }
            await getAnalysisAccess();
        } catch (error) {
            const detail = error.response?.data?.detail;
            const code = typeof detail === "object" ? detail?.code : null;
            if (error.response?.status === 402 || code === "SUBSCRIPTION_REQUIRED") {
                setAccessInfo(prev => ({ ...prev, can_analyze: false, free_analysis_available: false }));
                setAnalysisError("Your free analysis has been used. Upgrade to generate another.");
                openPaddleCheckout();
            } else if (error.response?.status === 409) {
                setAnalysisError("An analysis is already running. Please wait a moment.");
            } else {
                setAnalysisError(
                    (typeof detail === "string" && detail) ||
                    error.message || "Analysis failed. Please try again."
                );
            }
            console.error("AI Analysis failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async () => {
        if (loading || verifyingPayment) return;
        if (datasets.length === 0 || !localStorage.getItem("adt_token")) {
            setAnalysisError("Please sign in and import a dataset first.");
            return;
        }
        setAnalysisError("");
        try {
            const access = await getAnalysisAccess();
            if (!access.can_analyze) {
                openPaddleCheckout();
                return;
            }
            await executeAnalysisCall();
        } catch (error) {
            setAnalysisError("Couldn't verify your analysis access. Please try again.");
        }
    };

    // App.js owns the Paddle callback. Listen for its global event instead
    // of overwriting Paddle.Update from inside this panel.
    useEffect(() => {
        let cancelled = false;
        const onPaymentCompleted = async () => {
            if (paymentPollRef.current) return;
            paymentPollRef.current = true;
            setVerifyingPayment(true);
            setAnalysisError("");
            try {
                let verified = false;
                for (let attempt = 0; attempt < 12 && !cancelled; attempt++) {
                    const token = localStorage.getItem("adt_token");
                    if (!token) break;
                    try {
                        const result = await axios.get(`${API_BASE_URL}/ai/analysis-access`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (cancelled) return;
                        setAccessInfo(result.data);
                        if (result.data?.is_pro) {
                            verified = true;
                            break;
                        }
                    } catch (_) {
                        // Retry while the Paddle webhook is being processed.
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                if (cancelled) return;
                if (verified) {
                    setAnalysisError("");
                    window.dispatchEvent(new CustomEvent("metria_subscription_activated"));
                } else {
                    setAnalysisError("Payment completed, but subscription activation is still processing. Please retry shortly.");
                }
            } finally {
                if (!cancelled) {
                    setVerifyingPayment(false);
                    paymentPollRef.current = false;
                }
            }
        };
        const refreshAccess = () => {
            setAnalysisError("");
            getAnalysisAccess().catch(() => {});
        };
        window.addEventListener("paddle_payment_success", onPaymentCompleted);
        window.addEventListener("metria_subscription_activated", refreshAccess);
        return () => {
            cancelled = true;
            window.removeEventListener("paddle_payment_success", onPaymentCompleted);
            window.removeEventListener("metria_subscription_activated", refreshAccess);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={panelRef}
            className={`relative overflow-hidden transition-all duration-700 ${!loading && !aiInsights ? "px-3 py-3 md:px-5 md:py-4" : "px-5 py-7 md:px-10 md:py-10"}`}
        >
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[140px] rounded-full pointer-events-none" />

            {/* Header Area: shown for active analysis or existing results only */}
            {(loading || aiInsights) && <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                        <FiCpu className="text-indigo-400 w-8 h-8" />
                    </div>

                    <div>
                        <h2 className="text-[13px] font-black uppercase tracking-[0.6em] text-white">
                            {userProfile?.organization || "ORGANIZATION"}{" "}
                            <span className="text-indigo-400">
                                {isCrossAnalysis
                                    ? "CROSS-DATA INTELLIGENCE"
                                    : "INTELLIGENCE"}
                            </span>
                        </h2>

                        <div className="flex items-center gap-3 mt-2">
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    loading
                                        ? 'bg-indigo-400 animate-pulse'
                                        : 'bg-emerald-500'
                                }`}
                            />

                            <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                                {loading
                                    ? (
                                        isCrossAnalysis
                                            ? "Cross-Analyzing Business Signals"
                                            : "Synthesizing Data"
                                    )
                                    : (
                                        isCrossAnalysis
                                            ? "Cross-Dataset Decision Engine Active"
                                            : "Neural Decision Engine Active"
                                    )
                                }
                            </span>
                        </div>
                    </div>
                </div>

                {aiInsights && !loading && (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsFullReportOpen(true)}
                            className="flex items-center gap-3 px-8 py-4 bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <FiFileText />
                            View Full Brief
                        </button>

                        <button
                            onClick={runAnalysis}
                            className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                        >
                            <FaRedo className="text-[9px]" />
                            Sync Live Feed
                        </button>
                    </div>
                )}
            </div>}

            {(analysisError || verifyingPayment) && (
                <div role="status" className="relative z-10 mb-8 rounded-2xl border border-indigo-400/30 bg-indigo-400/10 px-6 py-4 text-sm text-white">
                    {verifyingPayment ? "Verifying your subscription with Paddle…" : analysisError}
                    {!verifyingPayment && !accessInfo?.is_pro && accessInfo?.can_analyze === false && (
                        <button type="button" onClick={openPaddleCheckout}
                            className="ml-4 rounded-lg bg-indigo-400 px-4 py-2 font-bold text-black hover:bg-white">
                            Upgrade
                        </button>
                    )}
                </div>
            )}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-20 flex flex-col items-center justify-center relative z-10"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <FiCpu className="text-indigo-400 mb-10 w-20 h-20 opacity-40" />
                        </motion.div>

                        <h3 className="text-white/80 text-[12px] font-bold uppercase tracking-[0.8em] text-center">
                            {phases[analysisPhase]}
                        </h3>
                    </motion.div>
                ) : aiInsights ? (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12 relative z-10"
                    >
                        {/* Executive Summary Card */}
                        <div className="p-12 md:p-16 rounded-[3rem] bg-[#111116] border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="flex justify-between items-start mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-1 w-12 bg-indigo-400 rounded-full" />

                                    <span className="text-indigo-400 text-[12px] font-black uppercase tracking-[0.6em]">
                                        {isCrossAnalysis
                                            ? "CROSS-DATA EXECUTIVE BRIEF"
                                            : "EXECUTIVE SUMMARY BRIEF"}
                                    </span>
                                </div>

                                <button
                                    onClick={() =>
                                        handleCopy(aiInsights.summary)
                                    }
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-all font-bold uppercase tracking-wider"
                                    title="Copy executive message"
                                >
                                    <FaCopy size={12} />
                                    {copied ? "Copied!" : "Copy Brief"}
                                </button>
                            </div>

                            <div className="text-2xl md:text-3xl text-white font-medium leading-[1.5] tracking-tight max-w-5xl">
                                <TypewriterText text={aiInsights.summary} />
                            </div>
                        </div>

                        {/* Middle Stat Panels */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-10 md:p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-xl relative overflow-hidden">
                                <div className="p-4 w-fit bg-indigo-500/10 rounded-2xl text-indigo-400 mb-8 border border-indigo-500/20">
                                    <FaSearch size={20} />
                                </div>

                                <h4 className="text-[13px] font-black text-white uppercase tracking-[0.4em] mb-4">
                                    {isCrossAnalysis
                                        ? "KEY DATASET RELATIONSHIP & DRIVER"
                                        : "PRIMARY BOTTLENECK & DISCOVERY"}
                                </h4>

                                <div className="text-white text-2xl leading-[1.6] font-semibold">
                                    {isCrossAnalysis
                                        ? (
                                            aiInsights.relationship ||
                                            aiInsights.relationship_summary ||
                                            aiInsights.dataset_relationship ||
                                            aiInsights.root_cause ||
                                            "Evaluating relationship between datasets..."
                                        )
                                        : aiInsights.root_cause}
                                </div>
                            </div>

                            <div className="p-10 md:p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-xl relative overflow-hidden">
                                <div className="p-4 w-fit bg-emerald-500/10 rounded-2xl text-emerald-400 mb-8 border border-emerald-500/20">
                                    <FaCreditCard size={20} />
                                </div>

                                <h4 className="text-[13px] font-black text-white uppercase tracking-[0.4em] mb-4">
                                    {isCrossAnalysis
                                        ? "COMBINED BUSINESS IMPACT"
                                        : "PROJECTED FINANCIAL & ROI IMPACT"}
                                </h4>

                                <div className="text-white text-2xl leading-[1.6] font-semibold">
                                    Value Delta:{" "}
                                    <span className="text-emerald-400">
                                        {aiInsights.roi_impact ||
                                            "Recalculating yield..."}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Action / Risk Matrix */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InsightCard
                                title={
                                    isCrossAnalysis
                                        ? "Cross-Dataset Risks"
                                        : "Identified Risks"
                                }
                                content={aiInsights?.risk}
                                icon={FiShield}
                                isPurple
                                onClick={() =>
                                    setExpandedCard({
                                        title: isCrossAnalysis
                                            ? "Cross-Dataset Risks"
                                            : "Identified Risks",
                                        content: aiInsights?.risk,
                                        icon: FiShield,
                                        color: "text-[#bc13fe]"
                                    })
                                }
                            />

                            <InsightCard
                                title={
                                    isCrossAnalysis
                                        ? "Cross-Dataset Opportunities"
                                        : "Strategic Opportunities"
                                }
                                content={aiInsights?.opportunity}
                                icon={FiZap}
                                onClick={() =>
                                    setExpandedCard({
                                        title: isCrossAnalysis
                                            ? "Cross-Dataset Opportunities"
                                            : "Strategic Opportunities",
                                        content: aiInsights?.opportunity,
                                        icon: FiZap,
                                        color: "text-indigo-400"
                                    })
                                }
                            />

                            <InsightCard
                                title={
                                    isCrossAnalysis
                                        ? "Priority Cross-Dataset Action"
                                        : "Immediate Priority Action"
                                }
                                content={aiInsights?.action}
                                icon={FiTarget}
                                isPurple
                                onClick={() =>
                                    setExpandedCard({
                                        title: isCrossAnalysis
                                            ? "Priority Cross-Dataset Action"
                                            : "Immediate Priority Action",
                                        content: aiInsights?.action,
                                        icon: FiTarget,
                                        color: "text-[#bc13fe]"
                                    })
                                }
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.section
                        ref={actionRef}
                        key="ready"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        aria-label="Generate your strategic brief"
                        className="relative z-10 mx-auto w-full max-w-[1120px] overflow-hidden rounded-[28px] border border-purple-400/25 bg-[#0c0715] px-6 py-7 text-center shadow-[0_20px_70px_rgba(0,0,0,0.38)] md:px-12 md:py-9"
                    >
                        <div className="pointer-events-none absolute inset-x-10 top-0 h-32 rounded-full bg-purple-600/10 blur-3xl" />
                        <div className="relative flex flex-col items-center">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/20 bg-[#211032] shadow-[0_0_35px_rgba(168,85,247,0.12)]">
                                <FiZap size={25} className="text-purple-200" />
                            </div>
                            <span className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-purple-300">
                                Metria Intelligence Engine
                            </span>
                            <h3 className="text-[23px] font-bold tracking-tight text-white md:text-[27px]">
                                Ready to uncover what matters?
                            </h3>
                            <p className="mt-3 max-w-[640px] text-[13px] leading-relaxed text-[#a8a0b4]">
                                Turn your dataset into actionable insights and a strategic brief.
                            </p>
                            <button
                                type="button"
                                onClick={runAnalysis}
                                disabled={loading || verifyingPayment || datasets.length === 0}
                                className="group mt-6 inline-flex w-full max-w-[420px] items-center justify-center gap-3 rounded-xl border border-purple-300/25 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-4 text-[13px] font-bold text-white shadow-[0_10px_35px_rgba(147,51,234,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-[0_14px_40px_rgba(147,51,234,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FiZap size={16} />
                                Generate Strategic Brief
                                <FiArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                            </button>
                            {!accessInfo?.is_pro && accessInfo?.free_analysis_available && (
                                <div className="mt-5 inline-flex items-center gap-2 text-xs text-[#b4a5c7]">
                                    <FiCheckCircle size={13} className="text-emerald-400" />
                                    FIRST ANALYSIS SESSION FREE!
                                </div>
                            )}
                            {accessInfo?.is_pro && (
                                <div className="mt-5 inline-flex items-center gap-2 text-xs text-[#b4a5c7]">
                                    <FiCheckCircle size={13} className="text-emerald-400" />
                                    MetriaAI Pro active
                                </div>
                            )}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {(expandedCard || isFullReportOpen) && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setExpandedCard(null);
                                setIsFullReportOpen(false);
                                window.speechSynthesis.cancel();
                                setIsSpeaking(false);
                            }}
                            className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-6xl max-h-[85vh] bg-[#0a0a0f] border border-white/10 rounded-[3.5rem] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(188,19,254,0.1)]"
                        >
                            <div className="p-8 md:p-12 flex justify-between items-center border-b border-white/5 bg-[#111116]">
                                <div className="flex items-center gap-6">
                                    <div
                                        className={`p-5 bg-white/5 rounded-2xl ${
                                            isFullReportOpen
                                                ? 'text-[#a5b4fc]'
                                                : (
                                                    expandedCard
                                                        ? expandedCard.color
                                                        : ''
                                                )
                                        }`}
                                    >
                                        {isFullReportOpen
                                            ? <FiFileText size={30} />
                                            : (
                                                expandedCard &&
                                                <expandedCard.icon size={30} />
                                            )}
                                    </div>

                                    <h3 className="text-white text-3xl font-bold uppercase tracking-tight">
                                        {isFullReportOpen
                                            ? (
                                                isCrossAnalysis
                                                    ? "Full Cross-Analysis Brief"
                                                    : "Full Strategic Brief"
                                            )
                                            : (
                                                expandedCard &&
                                                expandedCard.title
                                            )}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() =>
                                            toggleSpeech(
                                                isFullReportOpen
                                                    ? ""
                                                    : (
                                                        expandedCard
                                                            ? expandedCard.content
                                                            : ""
                                                    )
                                            )
                                        }
                                        className={`flex items-center gap-4 px-8 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest border transition-all ${
                                            isSpeaking
                                                ? 'bg-[#bc13fe]/20 text-[#bc13fe] border-[#bc13fe]/30'
                                                : 'bg-white/5 text-white border-white/10 hover:bg-white hover:text-black'
                                        }`}
                                    >
                                        {isSpeaking ? (
                                            <>
                                                <AudioWaveform />
                                                Mute Briefing
                                            </>
                                        ) : (
                                            <>
                                                <FaVolumeUp />
                                                Voice Strategy
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setExpandedCard(null);
                                            setIsFullReportOpen(false);
                                            window.speechSynthesis.cancel();
                                            setIsSpeaking(false);
                                        }}
                                        className="p-5 bg-white/5 rounded-full text-white border border-white/10 hover:bg-red-500/20 transition-all"
                                    >
                                        <FiX size={26} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 md:p-20 bg-[#050505]/80">
                                {isFullReportOpen ? (
                                    <div className="space-y-16 max-w-4xl mx-auto font-sans">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">
                                                    {isCrossAnalysis
                                                        ? "01 Combined Executive Summary"
                                                        : "01 Executive Summary"}
                                                </span>

                                                <button
                                                    onClick={() =>
                                                        handleCopy(
                                                            aiInsights?.summary
                                                        )
                                                    }
                                                    className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300"
                                                >
                                                    <FaCopy />
                                                    Copy Summary
                                                </button>
                                            </div>

                                            <p className="text-white text-3xl font-light leading-relaxed">
                                                {aiInsights?.summary}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-4">
                                                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">
                                                    {isCrossAnalysis
                                                        ? "02 Key Dataset Relationship"
                                                        : "02 Primary Bottlenecks"}
                                                </span>

                                                <p className="text-white/80 text-xl leading-relaxed font-medium">
                                                    {isCrossAnalysis
                                                        ? (
                                                            aiInsights?.relationship ||
                                                            aiInsights?.relationship_summary ||
                                                            aiInsights?.dataset_relationship ||
                                                            aiInsights?.root_cause
                                                        )
                                                        : aiInsights?.root_cause}
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">
                                                    {isCrossAnalysis
                                                        ? "03 Cross-Dataset Risks"
                                                        : "03 Operational & Data Risks"}
                                                </span>

                                                <p className="text-white/80 text-xl leading-relaxed font-medium">
                                                    {aiInsights?.risk}
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em]">
                                                    {isCrossAnalysis
                                                        ? "04 Combined Opportunities"
                                                        : "04 Growth Opportunities"}
                                                </span>

                                                <p className="text-white/80 text-xl leading-relaxed font-medium">
                                                    {aiInsights?.opportunity}
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">
                                                    {isCrossAnalysis
                                                        ? "05 Recommended Cross-Dataset Action"
                                                        : "05 Strategic Action Items"}
                                                </span>

                                                <p className="text-white/80 text-xl leading-relaxed font-medium">
                                                    {aiInsights?.action}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    expandedCard && (
                                        <p className="text-white/95 text-3xl md:text-5xl leading-[1.45] font-light tracking-tight">
                                            {expandedCard.content}
                                        </p>
                                    )
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIAnalysisPanel;