import React, {
    useState,
    useEffect,
    useRef,
    useMemo
} from "react";

import axios from "axios";

import {
    FiSend,
    FiCpu,
    FiMic,
    FiMicOff,
    FiClock,
    FiMessageSquare,
    FiVolume2,
    FiVolumeX,
    FiMaximize2,
    FiMinimize2,
    FiUserCheck,
    FiX,
    FiZap,
    FiActivity,
    FiPlay,
    FiPause
} from "react-icons/fi";

const API_BASE_URL =
    "https://ai-data-analyst-backend-1nuw.onrender.com";

const VOICE_PREFERENCE_KEY =
    "metria_voice_enabled";

export const MetriaFollowUp = ({
    activeDataset,
    activeDatasets = [],
    authToken
}) => {
    // ============================================================
    // CORE CHAT STATE
    // ============================================================

    const [isVisible, setIsVisible] =
        useState(false);

    const [messages, setMessages] =
        useState([]);

    const [inputQuery, setInputQuery] =
        useState("");

    const [isAnalyzing, setIsAnalyzing] =
        useState(false);

    // ============================================================
    // VOICE / PRESENCE STATE
    // ============================================================

    /*
     * Voice defaults ON.
     *
     * If the user explicitly switched voice off before,
     * remember that preference.
     */
    const [voiceEnabled, setVoiceEnabled] =
        useState(() => {
            try {
                const saved =
                    localStorage.getItem(
                        VOICE_PREFERENCE_KEY
                    );

                if (saved === null) {
                    return true;
                }

                return saved === "true";
            } catch {
                return true;
            }
        });

    const [isListening, setIsListening] =
        useState(false);

    const [isSpeaking, setIsSpeaking] =
        useState(false);

    /*
     * Browsers can reject autoplay even when voice is enabled.
     *
     * If that happens we retain the audio and surface a
     * "Tap to hear Metria" action instead of silently failing.
     */
    const [
        pendingAudioBase64,
        setPendingAudioBase64
    ] = useState(null);

    const [
        voiceNeedsInteraction,
        setVoiceNeedsInteraction
    ] = useState(false);

    const [
        hasUserInteracted,
        setHasUserInteracted
    ] = useState(false);

    // ============================================================
    // UI STATE
    // ============================================================

    const [
        showHistoryDropdown,
        setShowHistoryDropdown
    ] = useState(false);

    const [
        pastSessions,
        setPastSessions
    ] = useState([]);

    const [
        isExpanded,
        setIsExpanded
    ] = useState(false);

    // ============================================================
    // REFS
    // ============================================================

    const audioRef =
        useRef(null);

    const conversationEndRef =
        useRef(null);

    const recognitionRef =
        useRef(null);

    // ============================================================
    // DATASET CONTEXT
    // ============================================================

    const datasetsInContext =
        Array.isArray(
            activeDatasets
        ) &&
        activeDatasets.length > 0
            ? activeDatasets
            : activeDataset
                ? [activeDataset]
                : [];

    const primaryDataset =
        datasetsInContext.length > 0
            ? datasetsInContext[
                  datasetsInContext.length - 1
              ]
            : null;

    const isMultiDataset =
        datasetsInContext.length > 1;

    const datasetNames =
        datasetsInContext.map(
            (dataset) =>
                dataset?.name ||
                "Unnamed Dataset"
        );

    const datasetContextKey =
        datasetsInContext
            .map(
                (dataset) =>
                    `${
                        dataset?.id ?? ""
                    }:${
                        dataset?.name ?? ""
                    }`
            )
            .join("|");

    // ============================================================
    // METRIA PRESENCE STATE
    // ============================================================

    const presenceState =
        useMemo(() => {
            if (isListening) {
                return {
                    label:
                        "Listening",
                    subLabel:
                        "Voice input active",
                    tone:
                        "red"
                };
            }

            if (isAnalyzing) {
                return {
                    label:
                        "Thinking",
                    subLabel:
                        isMultiDataset
                            ? `Synthesizing ${datasetsInContext.length} data sources`
                            : "Analyzing business context",
                    tone:
                        "purple"
                };
            }

            if (isSpeaking) {
                return {
                    label:
                        "Speaking",
                    subLabel:
                        "Delivering analysis",
                    tone:
                        "emerald"
                };
            }

            return {
                label:
                    "Ready",
                subLabel:
                    isMultiDataset
                        ? `${datasetsInContext.length} sources in context`
                        : "Analyst standing by",
                tone:
                    "emerald"
            };
        }, [
            isListening,
            isAnalyzing,
            isSpeaking,
            isMultiDataset,
            datasetsInContext.length
        ]);

    // ============================================================
    // REMEMBER VOICE PREFERENCE
    // ============================================================

    useEffect(() => {
        try {
            localStorage.setItem(
                VOICE_PREFERENCE_KEY,
                String(
                    voiceEnabled
                )
            );
        } catch {
            // Local storage failure should never break Metria.
        }
    }, [voiceEnabled]);

    // ============================================================
    // REGISTER FIRST USER INTERACTION
    // ============================================================

    useEffect(() => {
        const unlock = () => {
            setHasUserInteracted(
                true
            );
        };

        window.addEventListener(
            "pointerdown",
            unlock,
            {
                once: true
            }
        );

        window.addEventListener(
            "keydown",
            unlock,
            {
                once: true
            }
        );

        return () => {
            window.removeEventListener(
                "pointerdown",
                unlock
            );

            window.removeEventListener(
                "keydown",
                unlock
            );
        };
    }, []);

    // ============================================================
    // AUTO SCROLL CONVERSATION
    // ============================================================

    useEffect(() => {
        conversationEndRef.current
            ?.scrollIntoView({
                behavior:
                    "smooth",
                block:
                    "nearest"
            });
    }, [
        messages,
        isAnalyzing,
        isSpeaking
    ]);

    // ============================================================
    // VOICE HELPERS
    // ============================================================

    const stopVoice = () => {
        if (
            audioRef.current
        ) {
            audioRef.current.pause();

            audioRef.current.currentTime =
                0;

            audioRef.current =
                null;
        }

        setIsSpeaking(
            false
        );
    };

    const playAudioBase64 =
        async (
            audioBase64
        ) => {
            if (
                !audioBase64 ||
                !voiceEnabled
            ) {
                return;
            }

            stopVoice();

            const audio =
                new Audio(
                    `data:audio/mpeg;base64,${audioBase64}`
                );

            audioRef.current =
                audio;

            audio.onended =
                () => {
                    setIsSpeaking(
                        false
                    );

                    setPendingAudioBase64(
                        null
                    );

                    setVoiceNeedsInteraction(
                        false
                    );

                    audioRef.current =
                        null;
                };

            audio.onerror =
                () => {
                    setIsSpeaking(
                        false
                    );

                    audioRef.current =
                        null;
                };

            try {
                setIsSpeaking(
                    true
                );

                await audio.play();

                setPendingAudioBase64(
                    null
                );

                setVoiceNeedsInteraction(
                    false
                );
            } catch (err) {
                console.warn(
                    "Browser prevented Metria voice autoplay:",
                    err
                );

                setIsSpeaking(
                    false
                );

                setPendingAudioBase64(
                    audioBase64
                );

                setVoiceNeedsInteraction(
                    true
                );
            }
        };

    const handleManualVoiceStart =
        async () => {
            if (
                !pendingAudioBase64
            ) {
                return;
            }

            setHasUserInteracted(
                true
            );

            await playAudioBase64(
                pendingAudioBase64
            );
        };

    // ============================================================
    // DATASET WELCOME / CONTEXT RESET
    // ============================================================

    useEffect(() => {
        if (
            datasetsInContext.length ===
            0
        ) {
            setIsVisible(
                false
            );

            setMessages(
                []
            );

            stopVoice();

            return;
        }

        const timer =
            setTimeout(
                () => {
                    setIsVisible(
                        true
                    );

                    let welcomeText;

                    if (
                        datasetsInContext.length >
                        1
                    ) {
                        welcomeText =
                            `I've loaded ${datasetsInContext.length} active data sources: ` +
                            `${datasetNames.join(", ")}. ` +
                            `I can analyze each source independently or connect them where ` +
                            `the evidence supports a relationship. Ask me what's driving performance, ` +
                            `where the risk is, what you're missing, or what I think you should do next.`;
                    } else {
                        welcomeText =
                            `I've finished reviewing "${datasetsInContext[0]?.name}". ` +
                            `I've got the data in context now. Ask me about anything that stood out, ` +
                            `challenge the analysis, or tell me what decision you're trying to make.`;
                    }

                    setMessages([
                        {
                            sender:
                                "metria",

                            text:
                                welcomeText
                        }
                    ]);
                },
                350
            );

        return () => {
            clearTimeout(
                timer
            );
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        datasetContextKey
    ]);

    // ============================================================
    // COMPONENT CLEANUP
    // ============================================================

    useEffect(() => {
        return () => {
            if (
                audioRef.current
            ) {
                audioRef.current.pause();

                audioRef.current =
                    null;
            }

            if (
                recognitionRef.current
            ) {
                try {
                    recognitionRef.current.stop();
                } catch {
                    // Ignore speech recognition cleanup failure.
                }
            }
        };
    }, []);

    // ============================================================
    // CHAT HISTORY
    // ============================================================

    useEffect(() => {
        const fetchHistory =
            async () => {
                try {
                    const res =
                        await axios.get(
                            `${API_BASE_URL}/ai/sessions`,
                            {
                                headers:
                                    {
                                        Authorization:
                                            `Bearer ${authToken}`
                                    }
                            }
                        );

                    setPastSessions(
                        res.data
                            .sessions ||
                            []
                    );
                } catch (
                    err
                ) {
                    console.error(
                        "Failed to load past chat sessions",
                        err
                    );

                    setPastSessions(
                        []
                    );
                }
            };

        if (
            authToken
        ) {
            fetchHistory();
        }
    }, [
        authToken
    ]);

    const loadSession =
        async (
            sessionId
        ) => {
            stopVoice();

            try {
                const res =
                    await axios.get(
                        `${API_BASE_URL}/ai/sessions/${sessionId}`,
                        {
                            headers:
                                {
                                    Authorization:
                                        `Bearer ${authToken}`
                                }
                        }
                    );

                setMessages(
                    res.data
                        .messages ||
                        []
                );

                setShowHistoryDropdown(
                    false
                );
            } catch (
                err
            ) {
                console.error(
                    "Failed to load session messages",
                    err
                );
            }
        };

    // ============================================================
    // SPEECH TO TEXT
    // ============================================================

    const toggleVoiceListener =
        () => {
            const SpeechRecognition =
                window.SpeechRecognition ||
                window.webkitSpeechRecognition;

            if (
                !SpeechRecognition
            ) {
                alert(
                    "Speech recognition is not supported in this browser. Please use Chrome or Safari."
                );

                return;
            }

            if (
                isListening
            ) {
                if (
                    recognitionRef.current
                ) {
                    recognitionRef.current.stop();
                }

                setIsListening(
                    false
                );

                return;
            }

            stopVoice();

            const recognition =
                new SpeechRecognition();

            recognitionRef.current =
                recognition;

            recognition.lang =
                "en-US";

            recognition.interimResults =
                false;

            recognition.maxAlternatives =
                1;

            recognition.onstart =
                () => {
                    setIsListening(
                        true
                    );
                };

            recognition.onresult =
                (
                    event
                ) => {
                    const speechText =
                        event
                            .results[0][0]
                            .transcript;

                    setInputQuery(
                        speechText
                    );

                    setIsListening(
                        false
                    );

                    handleSend(
                        speechText
                    );
                };

            recognition.onerror =
                () => {
                    setIsListening(
                        false
                    );
                };

            recognition.onend =
                () => {
                    setIsListening(
                        false
                    );

                    recognitionRef.current =
                        null;
                };

            recognition.start();
        };

    // ============================================================
    // SEND QUERY
    // ============================================================

    const handleSend =
        async (
            queryText
        ) => {
            const textToSend =
                String(
                    queryText ||
                        inputQuery ||
                        ""
                ).trim();

            if (
                !textToSend ||
                datasetsInContext.length ===
                    0 ||
                isAnalyzing
            ) {
                return;
            }

            setHasUserInteracted(
                true
            );

            stopVoice();

            setPendingAudioBase64(
                null
            );

            setVoiceNeedsInteraction(
                false
            );

            const newMessages =
                [
                    ...messages,

                    {
                        sender:
                            "user",

                        text:
                            textToSend
                    }
                ];

            setMessages(
                newMessages
            );

            setInputQuery(
                ""
            );

            setIsAnalyzing(
                true
            );

            try {
                const datasetsPayload =
                    datasetsInContext.map(
                        (
                            dataset
                        ) => ({
                            id:
                                dataset?.id,

                            name:
                                dataset?.name ||
                                "Unnamed Dataset",

                            metrics:
                                dataset?.metrics ||
                                {},

                            data_sample:
                                dataset?.data ||
                                dataset?.rows ||
                                []
                        })
                    );

                const res =
                    await axios.post(
                        `${API_BASE_URL}/ai/query`,

                        {
                            query:
                                textToSend,

                            datasets:
                                datasetsPayload,

                            // Legacy compatibility
                            dataset_name:
                                primaryDataset
                                    ?.name ||
                                "Dataset",

                            metrics:
                                primaryDataset
                                    ?.metrics ||
                                {},

                            data_sample:
                                primaryDataset
                                    ?.data ||
                                primaryDataset
                                    ?.rows ||
                                [],

                            messages:
                                newMessages
                        },

                        {
                            headers:
                                {
                                    Authorization:
                                        `Bearer ${authToken}`
                                }
                        }
                    );

                const answerText =
                    res.data
                        .answer ||
                    "I wasn't able to generate an analysis.";

                const audioBase64 =
                    res.data
                        .audio_base64;

                const finalMessages =
                    res.data
                        .messages ||
                    [
                        ...newMessages,

                        {
                            sender:
                                "metria",

                            text:
                                answerText
                        }
                    ];

                setMessages(
                    finalMessages
                );

                setIsAnalyzing(
                    false
                );

                /*
                 * Voice is ON by default.
                 *
                 * If ElevenLabs returned audio, Metria immediately
                 * attempts to speak the result.
                 */
                if (
                    voiceEnabled &&
                    audioBase64
                ) {
                    await playAudioBase64(
                        audioBase64
                    );
                }
            } catch (
                err
            ) {
                console.error(
                    "Metria query failed:",
                    err.response
                        ?.data ||
                        err.message
                );

                setIsAnalyzing(
                    false
                );

                const errorText =
                    "I lost the connection for a moment. Send that again and I'll pick it straight back up.";

                setMessages(
                    (
                        prev
                    ) => [
                        ...prev,

                        {
                            sender:
                                "metria",

                            text:
                                errorText
                        }
                    ]
                );
            }
        };

    // ============================================================
    // MESSAGE FORMATTING
    // ============================================================

    const formatMessageText =
        (
            text,
            sender
        ) => {
            const safeText =
                String(
                    text ||
                        ""
                );

            if (
                sender ===
                "user"
            ) {
                return (
                    <p className="leading-relaxed text-sm md:text-base">
                        {
                            safeText
                        }
                    </p>
                );
            }

            return (
                <div className="space-y-4 text-sm md:text-base leading-relaxed text-slate-100 font-normal">

                    {safeText
                        .split(
                            "\n\n"
                        )
                        .map(
                            (
                                paragraph,
                                pIdx
                            ) => (
                                <p
                                    key={
                                        pIdx
                                    }
                                    className="tracking-wide"
                                >
                                    {
                                        paragraph
                                    }
                                </p>
                            )
                        )}

                </div>
            );
        };

    // ============================================================
    // NO DATASET
    // ============================================================

    if (
        datasetsInContext.length ===
        0
    ) {
        return null;
    }

    // ============================================================
    // SUGGESTED PROMPTS
    // ============================================================

    const suggestedPrompts =
        isMultiDataset
            ? [
                "How do these datasets relate?",
                "What's the biggest risk here?",
                "What would you do next?"
            ]
            : [
                "What's really driving performance?",
                "What should I fix first?",
                "What am I missing?"
            ];

    // ============================================================
    // PRESENCE VISUAL HELPERS
    // ============================================================

    const presenceColorClass =
        isListening
            ? "text-red-400"
            : isSpeaking
                ? "text-emerald-400"
                : isAnalyzing
                    ? "text-purple-400"
                    : "text-indigo-300";

    const presenceGlowClass =
        isListening
            ? "shadow-[0_0_55px_rgba(239,68,68,0.30)]"
            : isSpeaking
                ? "shadow-[0_0_65px_rgba(16,185,129,0.28)]"
                : isAnalyzing
                    ? "shadow-[0_0_65px_rgba(168,85,247,0.32)]"
                    : "shadow-[0_0_45px_rgba(99,102,241,0.18)]";

    // ============================================================
    // UI
    // ============================================================

    return (
        <div
            className={`transition-all duration-500 ${
                isExpanded
                    ? "fixed top-0 right-0 bottom-0 left-64 z-50 bg-[#05030b] p-6 flex flex-col"
                    : "w-full max-w-[1500px] mx-auto my-6 px-0 md:px-4 flex flex-col"
            }`}
        >

            <div
                className={`transition-all duration-700 transform ${
                    isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-5 pointer-events-none"
                } w-full flex-1 flex flex-col`}
            >

                {/* ================================================= */}
                {/* MAIN METRIA ENVIRONMENT                           */}
                {/* ================================================= */}

                <div
                    className={`relative overflow-hidden w-full flex-1 flex flex-col ${
                        isExpanded
                            ? "bg-[#05030b]"
                            : "bg-gradient-to-br from-[#130720] via-[#080610] to-[#050914] border border-purple-500/40 rounded-[3rem] p-5 md:p-8 shadow-[0_30px_100px_rgba(100,0,255,0.16)]"
                    }`}
                >

                    {/* Ambient living background */}

                    <div className="absolute inset-0 pointer-events-none overflow-hidden">

                        <div
                            className={`absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full blur-[140px] transition-all duration-1000 ${
                                isSpeaking
                                    ? "bg-emerald-500/10 scale-110"
                                    : isAnalyzing
                                        ? "bg-purple-500/15 scale-110"
                                        : "bg-purple-500/[0.07]"
                            }`}
                        />

                        <div
                            className={`absolute -bottom-52 right-0 w-[600px] h-[600px] rounded-full blur-[160px] transition-all duration-1000 ${
                                isListening
                                    ? "bg-red-500/10 scale-110"
                                    : "bg-indigo-500/[0.07]"
                            }`}
                        />

                        <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:60px_60px]" />

                    </div>

                    <div className="relative z-10 flex-1 flex flex-col">

                        {/* ========================================= */}
                        {/* HEADER / METRIA IDENTITY                  */}
                        {/* ========================================= */}

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-white/[0.08]">

                            <div className="flex items-center gap-4">

                                {/* Living Metria Core */}

                                <div className="relative">

                                    {(isSpeaking ||
                                        isAnalyzing ||
                                        isListening) && (
                                        <>
                                            <div
                                                className={`absolute -inset-3 rounded-[1.6rem] border animate-ping opacity-30 ${
                                                    isListening
                                                        ? "border-red-400"
                                                        : isSpeaking
                                                            ? "border-emerald-400"
                                                            : "border-purple-400"
                                                }`}
                                            />

                                            <div
                                                className={`absolute -inset-6 rounded-[2rem] blur-xl opacity-20 ${
                                                    isListening
                                                        ? "bg-red-500"
                                                        : isSpeaking
                                                            ? "bg-emerald-500"
                                                            : "bg-purple-500"
                                                }`}
                                            />
                                        </>
                                    )}

                                    <div
                                        className={`relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-[1.35rem] border border-white/15 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 text-white transition-all duration-500 ${presenceGlowClass}`}
                                    >

                                        {isAnalyzing ? (
                                            <FiCpu
                                                size={25}
                                                className="animate-spin"
                                            />
                                        ) : isListening ? (
                                            <FiMic
                                                size={25}
                                                className="animate-pulse"
                                            />
                                        ) : (
                                            <FiUserCheck
                                                size={26}
                                            />
                                        )}

                                    </div>

                                    <span
                                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-[#080610] ${
                                            isListening
                                                ? "bg-red-400"
                                                : isAnalyzing
                                                    ? "bg-purple-400 animate-pulse"
                                                    : "bg-emerald-400"
                                        }`}
                                    />

                                </div>

                                <div>

                                    <div className="flex flex-wrap items-center gap-3">

                                        <h3 className="text-white font-black tracking-tight text-lg md:text-xl">
                                            Metria
                                        </h3>

                                        <span
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] ${
                                                isListening
                                                    ? "bg-red-500/10 text-red-300 border-red-500/25"
                                                    : isSpeaking
                                                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                                                        : isAnalyzing
                                                            ? "bg-purple-500/10 text-purple-300 border-purple-500/25"
                                                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                                            }`}
                                        >

                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    isAnalyzing ||
                                                    isSpeaking ||
                                                    isListening
                                                        ? "animate-pulse"
                                                        : ""
                                                } ${
                                                    isListening
                                                        ? "bg-red-400"
                                                        : isSpeaking
                                                            ? "bg-emerald-400"
                                                            : isAnalyzing
                                                                ? "bg-purple-400"
                                                                : "bg-emerald-400"
                                                }`}
                                            />

                                            {
                                                presenceState.label
                                            }

                                        </span>

                                    </div>

                                    <div className="flex items-center gap-2 mt-1.5">

                                        <FiActivity
                                            size={11}
                                            className={
                                                presenceColorClass
                                            }
                                        />

                                        <p className="text-[11px] md:text-xs text-slate-400">
                                            {
                                                presenceState.subLabel
                                            }
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* ===================================== */}
                            {/* VOICE WAVE / CONTROLS                 */}
                            {/* ===================================== */}

                            <div className="flex flex-wrap items-center gap-2.5">

                                {/* Large speaking waveform */}

                                {isSpeaking && (
                                    <div className="hidden md:flex items-center gap-1 h-10 px-4 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/20">

                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300 mr-2">
                                            Speaking
                                        </span>

                                        {[
                                            8,
                                            16,
                                            24,
                                            13,
                                            28,
                                            18,
                                            9,
                                            22,
                                            14,
                                            26,
                                            11,
                                            19
                                        ].map(
                                            (
                                                height,
                                                index
                                            ) => (
                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className="w-[3px] rounded-full bg-emerald-400 animate-pulse"
                                                    style={{
                                                        height:
                                                            `${height}px`,

                                                        animationDelay:
                                                            `${
                                                                index *
                                                                70
                                                            }ms`
                                                    }}
                                                />
                                            )
                                        )}

                                    </div>
                                )}

                                {/* History */}

                                <div className="relative">

                                    <button
                                        onClick={() =>
                                            setShowHistoryDropdown(
                                                !showHistoryDropdown
                                            )
                                        }
                                        className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-purple-600/15 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs"
                                    >
                                        <FiClock
                                            size={14}
                                        />

                                        <span className="hidden sm:inline">
                                            History
                                        </span>
                                    </button>

                                    {showHistoryDropdown && (
                                        <div className="absolute right-0 top-full mt-3 w-80 bg-[#090712]/95 border border-purple-500/30 rounded-3xl p-4 shadow-2xl z-50 backdrop-blur-2xl">

                                            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">

                                                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">

                                                    <FiClock className="text-purple-400" />

                                                    Past Sessions

                                                </div>

                                                <button
                                                    onClick={() =>
                                                        setShowHistoryDropdown(
                                                            false
                                                        )
                                                    }
                                                    className="text-slate-500 hover:text-white"
                                                >
                                                    <FiX
                                                        size={15}
                                                    />
                                                </button>

                                            </div>

                                            <div className="space-y-1.5 max-h-60 overflow-y-auto">

                                                {pastSessions.length >
                                                0 ? (
                                                    pastSessions.map(
                                                        (
                                                            session
                                                        ) => (
                                                            <button
                                                                key={
                                                                    session.id
                                                                }
                                                                onClick={() =>
                                                                    loadSession(
                                                                        session.id
                                                                    )
                                                                }
                                                                className="w-full text-left p-3 rounded-xl hover:bg-purple-600/15 border border-transparent hover:border-purple-500/20 transition-all flex items-center gap-3"
                                                            >

                                                                <FiMessageSquare
                                                                    className="text-purple-400 shrink-0"
                                                                    size={
                                                                        14
                                                                    }
                                                                />

                                                                <div className="truncate">

                                                                    <p className="text-white text-xs font-bold truncate">
                                                                        {
                                                                            session.title
                                                                        }
                                                                    </p>

                                                                    <p className="text-slate-600 text-[10px] mt-0.5">
                                                                        {
                                                                            session.date
                                                                        }
                                                                    </p>

                                                                </div>

                                                            </button>
                                                        )
                                                    )
                                                ) : (
                                                    <div className="text-slate-600 text-xs italic text-center py-5">
                                                        No conversations yet
                                                    </div>
                                                )}

                                            </div>

                                        </div>
                                    )}

                                </div>

                                {/* Voice Toggle */}

                                <button
                                    onClick={() => {
                                        const nextState =
                                            !voiceEnabled;

                                        setVoiceEnabled(
                                            nextState
                                        );

                                        if (
                                            !nextState
                                        ) {
                                            stopVoice();

                                            setPendingAudioBase64(
                                                null
                                            );

                                            setVoiceNeedsInteraction(
                                                false
                                            );
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                                        voiceEnabled
                                            ? "bg-purple-500/10 border-purple-400/30 text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.08)]"
                                            : "bg-white/[0.04] border-white/10 text-slate-500"
                                    }`}
                                >

                                    {voiceEnabled ? (
                                        <FiVolume2
                                            size={
                                                14
                                            }
                                            className="text-purple-300"
                                        />
                                    ) : (
                                        <FiVolumeX
                                            size={
                                                14
                                            }
                                        />
                                    )}

                                    {voiceEnabled
                                        ? "Voice On"
                                        : "Voice Off"
                                    }

                                </button>

                                {/* Expand */}

                                <button
                                    onClick={() =>
                                        setIsExpanded(
                                            !isExpanded
                                        )
                                    }
                                    className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all"
                                >

                                    {isExpanded ? (
                                        <FiMinimize2
                                            size={
                                                15
                                            }
                                        />
                                    ) : (
                                        <FiMaximize2
                                            size={
                                                15
                                            }
                                        />
                                    )}

                                </button>

                            </div>

                        </div>

                        {/* ========================================= */}
                        {/* BROWSER AUTOPLAY FALLBACK                 */}
                        {/* ========================================= */}

                        {voiceEnabled &&
                            voiceNeedsInteraction &&
                            pendingAudioBase64 && (
                            <button
                                type="button"
                                onClick={
                                    handleManualVoiceStart
                                }
                                className="mt-5 w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[10px] font-black uppercase tracking-[0.22em] hover:bg-emerald-500/15 transition-all"
                            >

                                <FiPlay
                                    size={
                                        14
                                    }
                                />

                                Tap to hear Metria

                            </button>
                        )}

                        {/* ========================================= */}
                        {/* CONVERSATION                              */}
                        {/* ========================================= */}

                        <div
                            className={`relative mt-6 space-y-5 overflow-y-auto pr-1 md:pr-2 flex-1 scrollbar-thin scrollbar-thumb-purple-500/20 ${
                                isExpanded
                                    ? "max-h-[calc(100vh-265px)]"
                                    : "max-h-[620px]"
                            }`}
                        >

                            {messages.map(
                                (
                                    msg,
                                    idx
                                ) => {
                                    const isUser =
                                        msg.sender ===
                                        "user";

                                    return (
                                        <div
                                            key={
                                                idx
                                            }
                                            className={`flex ${
                                                isUser
                                                    ? "justify-end"
                                                    : "justify-start"
                                            }`}
                                        >

                                            <div
                                                className={`relative max-w-[94%] md:max-w-[82%] ${
                                                    isUser
                                                        ? ""
                                                        : "pl-0"
                                                }`}
                                            >

                                                {!isUser && (
                                                    <div className="flex items-center gap-2 mb-2 ml-1">

                                                        <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.8)]" />

                                                        <span className="text-[9px] uppercase font-black tracking-[0.22em] text-purple-300">
                                                            Metria
                                                        </span>

                                                    </div>
                                                )}

                                                <div
                                                    className={`p-5 md:p-6 rounded-[1.7rem] transition-all ${
                                                        isUser
                                                            ? "bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white rounded-br-md shadow-[0_12px_40px_rgba(147,51,234,0.18)]"
                                                            : "bg-white/[0.035] border border-white/[0.09] text-slate-100 rounded-bl-md backdrop-blur-xl shadow-[0_12px_50px_rgba(0,0,0,0.18)]"
                                                    }`}
                                                >

                                                    {formatMessageText(
                                                        msg.text,
                                                        msg.sender
                                                    )}

                                                </div>

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                            {/* ===================================== */}
                            {/* METRIA THINKING                       */}
                            {/* ===================================== */}

                            {isAnalyzing && (
                                <div className="flex justify-start">

                                    <div className="relative max-w-lg">

                                        <div className="flex items-center gap-2 mb-2 ml-1">

                                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_12px_rgba(192,132,252,0.8)]" />

                                            <span className="text-[9px] uppercase font-black tracking-[0.22em] text-purple-300">
                                                Metria
                                            </span>

                                        </div>

                                        <div className="relative overflow-hidden bg-purple-500/[0.055] border border-purple-400/15 rounded-[1.7rem] rounded-bl-md px-5 py-4">

                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/[0.08] to-transparent animate-pulse" />

                                            <div className="relative flex items-center gap-4">

                                                <div className="relative">

                                                    <div className="absolute inset-0 bg-purple-500/30 blur-lg rounded-full animate-pulse" />

                                                    <FiCpu
                                                        size={
                                                            20
                                                        }
                                                        className="relative text-purple-300 animate-spin"
                                                    />

                                                </div>

                                                <div>

                                                    <p className="text-sm font-semibold text-white">
                                                        I'm working through it.
                                                    </p>

                                                    <p className="text-[10px] text-white/35 mt-1">
                                                        {
                                                            isMultiDataset
                                                                ? `Connecting signals across ${datasetsInContext.length} sources...`
                                                                : "Testing the data against your question..."
                                                        }
                                                    </p>

                                                </div>

                                                <div className="flex gap-1 ml-2">

                                                    {[0, 1, 2].map(
                                                        (
                                                            dot
                                                        ) => (
                                                            <span
                                                                key={
                                                                    dot
                                                                }
                                                                className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-bounce"
                                                                style={{
                                                                    animationDelay:
                                                                        `${
                                                                            dot *
                                                                            150
                                                                        }ms`
                                                                }}
                                                            />
                                                        )
                                                    )}

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>
                            )}

                            <div
                                ref={
                                    conversationEndRef
                                }
                            />

                        </div>

                        {/* ========================================= */}
                        {/* PROMPT STARTERS                           */}
                        {/* ========================================= */}

                        <div className="pt-5 mt-auto border-t border-white/[0.06]">

                            <div className="flex items-center gap-2 mb-3">

                                <FiZap
                                    size={
                                        11
                                    }
                                    className="text-purple-400"
                                />

                                <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/30">
                                    Ask Metria
                                </span>

                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">

                                {suggestedPrompts.map(
                                    (
                                        promptText,
                                        pIdx
                                    ) => (
                                        <button
                                            key={
                                                pIdx
                                            }
                                            type="button"
                                            disabled={
                                                isAnalyzing
                                            }
                                            onClick={() =>
                                                handleSend(
                                                    promptText
                                                )
                                            }
                                            className="bg-white/[0.035] hover:bg-purple-600/15 border border-white/[0.08] hover:border-purple-400/25 text-slate-400 hover:text-white px-3.5 py-2 rounded-xl text-[10px] md:text-xs font-medium transition-all disabled:opacity-40"
                                        >
                                            {
                                                promptText
                                            }
                                        </button>
                                    )
                                )}

                            </div>

                            {/* ===================================== */}
                            {/* MAIN COMMAND BAR                     */}
                            {/* ===================================== */}

                            <form
                                onSubmit={(
                                    e
                                ) => {
                                    e.preventDefault();

                                    handleSend();
                                }}
                                className="relative"
                            >

                                <div
                                    className={`relative flex items-center rounded-[1.4rem] border transition-all duration-300 ${
                                        isListening
                                            ? "border-red-400/60 shadow-[0_0_35px_rgba(239,68,68,0.12)] bg-red-500/[0.025]"
                                            : "border-white/[0.12] focus-within:border-purple-400/40 focus-within:shadow-[0_0_35px_rgba(168,85,247,0.10)] bg-black/55"
                                    }`}
                                >

                                    <div className="hidden md:flex items-center pl-5 text-purple-400">

                                        <FiActivity
                                            size={
                                                16
                                            }
                                        />

                                    </div>

                                    <input
                                        type="text"
                                        value={
                                            inputQuery
                                        }
                                        disabled={
                                            isAnalyzing
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setInputQuery(
                                                e.target.value
                                            )
                                        }
                                        placeholder={
                                            isListening
                                                ? "I'm listening..."
                                                : isAnalyzing
                                                    ? "Metria is thinking..."
                                                    : isMultiDataset
                                                        ? `Ask anything across your ${datasetsInContext.length} data sources...`
                                                        : `Ask Metria anything about ${primaryDataset?.name || "your data"}...`
                                        }
                                        className="w-full bg-transparent px-4 md:px-5 py-4 md:py-5 pr-28 text-sm text-white focus:outline-none placeholder:text-slate-600 disabled:opacity-60"
                                    />

                                    <div className="absolute right-2 flex items-center gap-2">

                                        <button
                                            type="button"
                                            onClick={
                                                toggleVoiceListener
                                            }
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                isListening
                                                    ? "bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.3)]"
                                                    : "bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.09]"
                                            }`}
                                            title="Speak to Metria"
                                        >

                                            {isListening ? (
                                                <FiMicOff
                                                    size={
                                                        16
                                                    }
                                                />
                                            ) : (
                                                <FiMic
                                                    size={
                                                        16
                                                    }
                                                />
                                            )}

                                        </button>

                                        <button
                                            type="submit"
                                            disabled={
                                                isAnalyzing ||
                                                !inputQuery.trim()
                                            }
                                            className={`w-11 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                isAnalyzing ||
                                                !inputQuery.trim()
                                                    ? "bg-purple-600/25 text-purple-300/40 cursor-not-allowed"
                                                    : "bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-[0_8px_25px_rgba(168,85,247,0.28)] hover:scale-[1.04] active:scale-95"
                                            }`}
                                        >

                                            <FiSend
                                                size={
                                                    16
                                                }
                                            />

                                        </button>

                                    </div>

                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 px-2 mt-2.5">

                                    <p className="text-[9px] text-white/20">
                                        Metria has access to the active analysis context.
                                    </p>

                                    {voiceEnabled && (
                                        <div className="flex items-center gap-1.5 text-[9px] text-purple-300/50">

                                            <FiVolume2
                                                size={
                                                    10
                                                }
                                            />

                                            Voice responses enabled

                                        </div>
                                    )}

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};