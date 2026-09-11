import React, {
    useState,
    useEffect,
    useRef
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
    FiActivity
} from "react-icons/fi";

const API_BASE_URL =
    "https://ai-data-analyst-backend-1nuw.onrender.com";

export const MetriaFollowUp = ({
    activeDataset,
    activeDatasets = [],
    authToken,
    analysisMode,
    crossAnalysis,
    aiAnalysisReady = true
}) => {

    // ============================================================
    // CORE STATE
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
    // EXPERIENCE STATE
    // ============================================================

    const [isListening, setIsListening] =
        useState(false);

    const [isSpeaking, setIsSpeaking] =
        useState(false);

    /*
     * Voice is ON by default.
     *
     * If the user manually turns it off, we remember that choice.
     */
    const [
        voiceEnabled,
        setVoiceEnabled
    ] = useState(() => {
        const savedPreference =
            localStorage.getItem(
                "metria_voice_enabled"
            );

        return savedPreference !== "false";
    });

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

    const recognitionRef =
        useRef(null);

    const conversationEndRef =
        useRef(null);

    // ============================================================
    // DATASET CONTEXT
    // ============================================================

    const datasetsInContext =
        Array.isArray(
            activeDatasets
        ) &&
        activeDatasets.length >
            0
            ? activeDatasets
            : activeDataset
              ? [
                    activeDataset
                ]
              : [];

    const primaryDataset =
        datasetsInContext.length >
        0
            ? datasetsInContext[
                  datasetsInContext.length -
                      1
              ]
            : null;

    const isMultiDataset =
        datasetsInContext.length >
        1;

    const datasetNames =
        datasetsInContext.map(
            (
                dataset
            ) =>
                dataset?.name ||
                "Unnamed Dataset"
        );

    const datasetContextKey =
        datasetsInContext
            .map(
                (
                    dataset
                ) =>
                    `${dataset?.id ?? ""}:${dataset?.name ?? ""}`
            )
            .join("|");

    // ============================================================
    // VOICE PREFERENCE
    // ============================================================

    useEffect(() => {
        localStorage.setItem(
            "metria_voice_enabled",
            String(
                voiceEnabled
            )
        );
    }, [
        voiceEnabled
    ]);

    // ============================================================
    // CURRENT METRIA STATE
    // ============================================================

    const metriaState =
        isListening
            ? "listening"
            : isAnalyzing
              ? "thinking"
              : isSpeaking
                ? "speaking"
                : "ready";

    const stateLabel = {
        listening:
            "Listening",
        thinking:
            "Analyzing",
        speaking:
            "Speaking",
        ready:
            "Ready"
    }[
        metriaState
    ];

    const stateSubtext = {
        listening:
            "Voice channel open",
        thinking:
            "Reasoning across your data",
        speaking:
            "Delivering analysis",
        ready:
            isMultiDataset
                ? `${datasetsInContext.length} data sources in context`
                : "Standing by for your question"
    }[
        metriaState
    ];

    // ============================================================
    // AUTO SCROLL CHAT
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

    const playResponseAudio =
        async (
            audioBase64
        ) => {
            if (
                !voiceEnabled ||
                !audioBase64
            ) {
                return;
            }

            try {
                stopVoice();

                const audio =
                    new Audio(
                        `data:audio/mpeg;base64,${audioBase64}`
                    );

                audioRef.current =
                    audio;

                audio.onplay =
                    () => {
                        setIsSpeaking(
                            true
                        );
                    };

                audio.onended =
                    () => {
                        setIsSpeaking(
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

                await audio.play();
            } catch (
                error
            ) {
                /*
                 * Browsers can block audio until the page
                 * receives a user gesture.
                 *
                 * We don't treat this as a failed AI response.
                 */
                console.warn(
                    "Browser prevented automatic voice playback:",
                    error
                );

                setIsSpeaking(
                    false
                );
            }
        };

    // ============================================================
    // WELCOME / CONTEXT RESET
    // ============================================================

    useEffect(() => {
        if (
            !aiAnalysisReady ||
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
                            `Analysis complete. I have ${datasetsInContext.length} active sources in context: ` +
                            `${datasetNames.join(", ")}. ` +
                            `I've got the underlying records, metrics and analysis available. ` +
                            `Ask me what's driving performance, where the biggest risk is, ` +
                            `how these sources connect, or what I'd recommend doing next.`;
                    } else {
                        welcomeText =
                            `Analysis complete. I've got "${datasetsInContext[0]?.name}" in context now. ` +
                            `You can challenge the brief, ask me why something is happening, ` +
                            `investigate a specific number, or ask what I think you should do next.`;
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
        datasetContextKey,
        aiAnalysisReady
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
                    // no-op
                }

                recognitionRef.current =
                    null;
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
            try {
                stopVoice();

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
                    "Speech recognition isn't supported in this browser. Chrome provides the most reliable voice input."
                );

                return;
            }

            if (
                isListening
            ) {
                try {
                    recognitionRef.current
                        ?.stop();
                } catch {
                    // no-op
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

            recognition.continuous =
                false;

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
                            .results[
                            0
                        ][0]
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
                (
                    event
                ) => {
                    console.warn(
                        "Speech recognition error:",
                        event
                            .error
                    );

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

            stopVoice();

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

                            // MULTI DATASET
                            datasets:
                                datasetsPayload,

                            // LEGACY SINGLE DATASET FALLBACK
                            dataset_name:
                                primaryDataset?.name ||
                                "Dataset",

                            metrics:
                                primaryDataset?.metrics ||
                                {},

                            data_sample:
                                primaryDataset?.data ||
                                primaryDataset?.rows ||
                                [],

                            messages:
                                newMessages,

                            analysis_mode:
                                analysisMode,

                            cross_analysis:
                                crossAnalysis
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
                 * Every successful Metria response automatically
                 * plays the ElevenLabs audio supplied by /ai/query.
                 */
                if (
                    voiceEnabled &&
                    audioBase64
                ) {
                    await playResponseAudio(
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
                    "I lost the connection for a moment. Send that again and I'll pick it up.";

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
    // NOTHING TO SHOW
    // ============================================================

    if (
        !aiAnalysisReady ||
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
                  "What's the most important thing I should know?",
                  "How do these datasets influence each other?",
                  "If you were running this business, what would you fix first?"
              ]
            : [
                  "What's the most important thing I should know?",
                  "What's driving the result we're seeing?",
                  "If you were running this business, what would you do next?"
              ];

    // ============================================================
    // UI
    // ============================================================

    return (
        <div
            className={`transition-all duration-500 ${
                isExpanded
                    ? "fixed top-0 right-0 bottom-0 left-64 z-50 bg-[#050409] p-5 md:p-8 flex flex-col"
                    : "w-full mx-auto my-6 flex flex-col"
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
                {/* METRIA CORE PANEL                                 */}
                {/* ================================================= */}

                <div
                    className={`relative overflow-hidden w-full flex-1 flex flex-col border transition-all duration-700 ${
                        isExpanded
                            ? "bg-[#07060c] border-purple-500/25 rounded-[2.5rem]"
                            : isSpeaking
                              ? "bg-[#0c0715] border-purple-400/60 rounded-[3rem] shadow-[0_0_100px_rgba(168,85,247,0.18)]"
                              : isAnalyzing
                                ? "bg-[#0b0812] border-indigo-400/40 rounded-[3rem] shadow-[0_0_80px_rgba(99,102,241,0.12)]"
                                : "bg-gradient-to-br from-[#10081c] via-[#090711] to-[#080b16] border-purple-500/35 rounded-[3rem] shadow-[0_30px_100px_rgba(112,0,255,0.12)]"
                    }`}
                >

                    {/* Ambient background */}

                    <div
                        className={`absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-1000 pointer-events-none ${
                            isSpeaking
                                ? "bg-purple-500/20 scale-125"
                                : isAnalyzing
                                  ? "bg-indigo-500/15 scale-110"
                                  : "bg-purple-500/[0.08]"
                        }`}
                    />

                    <div
                        className={`absolute -bottom-48 right-0 w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-1000 pointer-events-none ${
                            isSpeaking
                                ? "bg-fuchsia-500/15 scale-125"
                                : "bg-indigo-500/[0.06]"
                        }`}
                    />

                    {/* Moving top energy line */}

                    <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">

                        <div
                            className={`h-full w-1/3 bg-gradient-to-r from-transparent via-purple-400 to-transparent ${
                                isSpeaking ||
                                isAnalyzing
                                    ? "animate-[metriaScan_2s_linear_infinite]"
                                    : "opacity-40"
                            }`}
                        />

                    </div>

                    <div className="relative z-10 flex flex-col flex-1 p-5 md:p-8">

                        {/* ================================================= */}
                        {/* HEADER                                            */}
                        {/* ================================================= */}

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-white/[0.08]">

                            {/* METRIA IDENTITY */}

                            <div className="flex items-center gap-4">

                                {/* ALIVE CORE */}

                                <div className="relative shrink-0">

                                    {/* Outer pulse */}

                                    <div
                                        className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 ${
                                            isSpeaking
                                                ? "bg-purple-500/70 animate-pulse scale-150"
                                                : isAnalyzing
                                                  ? "bg-indigo-500/50 animate-pulse scale-125"
                                                  : isListening
                                                    ? "bg-emerald-500/50 animate-pulse scale-125"
                                                    : "bg-purple-500/20"
                                        }`}
                                    />

                                    {/* Core */}

                                    <div
                                        className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                                            isSpeaking
                                                ? "bg-gradient-to-br from-purple-500 to-fuchsia-700 border-purple-300 shadow-[0_0_35px_rgba(168,85,247,0.55)]"
                                                : isAnalyzing
                                                  ? "bg-gradient-to-br from-indigo-500 to-purple-800 border-indigo-300"
                                                  : isListening
                                                    ? "bg-gradient-to-br from-emerald-500 to-cyan-800 border-emerald-300"
                                                    : "bg-gradient-to-br from-purple-600 to-indigo-800 border-purple-400/50"
                                        }`}
                                    >

                                        {isAnalyzing ? (
                                            <FiCpu
                                                size={
                                                    26
                                                }
                                                className="text-white animate-spin"
                                            />
                                        ) : isListening ? (
                                            <FiMic
                                                size={
                                                    25
                                                }
                                                className="text-white animate-pulse"
                                            />
                                        ) : (
                                            <FiUserCheck
                                                size={
                                                    27
                                                }
                                                className={`text-white ${
                                                    isSpeaking
                                                        ? "animate-pulse"
                                                        : ""
                                                }`}
                                            />
                                        )}

                                    </div>

                                    {/* Online dot */}

                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-[3px] border-[#090711] shadow-[0_0_15px_rgba(52,211,153,0.8)]" />

                                </div>

                                <div>

                                    <div className="flex flex-wrap items-center gap-2.5">

                                        <h3 className="text-xl md:text-2xl text-white font-black tracking-tight">
                                            Metria
                                        </h3>

                                        <span
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.16em] transition-all ${
                                                isSpeaking
                                                    ? "bg-purple-500/15 border-purple-400/40 text-purple-200"
                                                    : isAnalyzing
                                                      ? "bg-indigo-500/15 border-indigo-400/30 text-indigo-300"
                                                      : isListening
                                                        ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                                                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                            }`}
                                        >

                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    isSpeaking
                                                        ? "bg-purple-300 animate-pulse"
                                                        : isAnalyzing
                                                          ? "bg-indigo-300 animate-pulse"
                                                          : isListening
                                                            ? "bg-emerald-300 animate-pulse"
                                                            : "bg-emerald-400"
                                                }`}
                                            />

                                            {
                                                stateLabel
                                            }

                                        </span>

                                    </div>

                                    <div className="flex items-center gap-2 mt-1.5">

                                        <FiActivity
                                            size={
                                                11
                                            }
                                            className={
                                                isSpeaking ||
                                                isAnalyzing
                                                    ? "text-purple-400 animate-pulse"
                                                    : "text-slate-600"
                                            }
                                        />

                                        <p className="text-[11px] md:text-xs text-slate-400">
                                            {
                                                stateSubtext
                                            }
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* CONTROLS */}

                            <div className="flex flex-wrap items-center gap-2">

                                {/* DATA CONTEXT */}

                                <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.07]">

                                    <FiZap
                                        size={
                                            12
                                        }
                                        className="text-purple-400"
                                    />

                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.14em]">
                                        {
                                            datasetsInContext.length
                                        }{" "}
                                        Source
                                        {datasetsInContext.length ===
                                        1
                                            ? ""
                                            : "s"}{" "}
                                        Connected
                                    </span>

                                </div>

                                {/* HISTORY */}

                                <div className="relative">

                                    <button
                                        onClick={() =>
                                            setShowHistoryDropdown(
                                                (
                                                    prev
                                                ) =>
                                                    !prev
                                            )
                                        }
                                        className="p-2.5 rounded-xl bg-white/[0.035] border border-white/10 hover:bg-white/[0.07] text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs"
                                    >

                                        <FiClock
                                            size={
                                                14
                                            }
                                        />

                                        <span className="hidden sm:inline">
                                            History
                                        </span>

                                    </button>

                                    {showHistoryDropdown && (
                                        <div className="absolute right-0 top-full mt-3 w-80 bg-[#090812]/95 border border-purple-500/30 rounded-2xl p-4 shadow-[0_30px_80px_rgba(0,0,0,0.7)] z-50 backdrop-blur-2xl">

                                            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">

                                                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">

                                                    <FiClock className="text-purple-400" />

                                                    Previous Conversations

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
                                                        size={
                                                            15
                                                        }
                                                    />

                                                </button>

                                            </div>

                                            <div className="space-y-1.5 max-h-64 overflow-y-auto">

                                                {pastSessions.length >
                                                0 ? (
                                                    pastSessions.map(
                                                        (
                                                            session
                                                        ) => (
                                                            <button
                                                                type="button"
                                                                key={
                                                                    session.id
                                                                }
                                                                onClick={() =>
                                                                    loadSession(
                                                                        session.id
                                                                    )
                                                                }
                                                                className="w-full text-left p-3 rounded-xl hover:bg-purple-600/10 border border-transparent hover:border-purple-500/20 transition-all flex items-center gap-3"
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

                                                                    <p className="text-slate-600 text-[9px] mt-0.5">
                                                                        {
                                                                            session.date
                                                                        }
                                                                    </p>

                                                                </div>

                                                            </button>
                                                        )
                                                    )
                                                ) : (
                                                    <div className="text-slate-600 text-xs text-center py-6">
                                                        No previous conversations
                                                    </div>
                                                )}

                                            </div>

                                        </div>
                                    )}

                                </div>

                                {/* VOICE */}

                                <button
                                    onClick={() => {
                                        const next =
                                            !voiceEnabled;

                                        setVoiceEnabled(
                                            next
                                        );

                                        if (
                                            !next
                                        ) {
                                            stopVoice();
                                        }
                                    }}
                                    className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs ${
                                        voiceEnabled
                                            ? "bg-purple-500/10 border-purple-400/30 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.08)]"
                                            : "bg-white/[0.035] border-white/10 text-slate-500"
                                    }`}
                                    title={
                                        voiceEnabled
                                            ? "Metria voice enabled"
                                            : "Enable Metria voice"
                                    }
                                >

                                    {voiceEnabled ? (
                                        <FiVolume2
                                            size={
                                                14
                                            }
                                            className={
                                                isSpeaking
                                                    ? "animate-pulse"
                                                    : ""
                                            }
                                        />
                                    ) : (
                                        <FiVolumeX
                                            size={
                                                14
                                            }
                                        />
                                    )}

                                    <span className="hidden sm:inline">
                                        {voiceEnabled
                                            ? "Voice Active"
                                            : "Voice Off"}
                                    </span>

                                </button>

                                {/* EXPAND */}

                                <button
                                    onClick={() =>
                                        setIsExpanded(
                                            (
                                                prev
                                            ) =>
                                                !prev
                                        )
                                    }
                                    className="p-2.5 rounded-xl bg-white/[0.035] border border-white/10 hover:bg-white/[0.07] text-slate-400 hover:text-white transition-all"
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

                        {/* ================================================= */}
                        {/* SPEAKING VISUALIZER                               */}
                        {/* ================================================= */}

                        {(isSpeaking ||
                            isAnalyzing ||
                            isListening) && (
                            <div className="flex items-center gap-4 py-4 px-1">

                                <span className="text-[9px] uppercase tracking-[0.25em] font-black text-slate-600 shrink-0">
                                    {isSpeaking
                                        ? "Voice Output"
                                        : isListening
                                          ? "Voice Input"
                                          : "Neural Processing"}
                                </span>

                                <div className="flex items-end gap-[3px] h-5 flex-1 overflow-hidden">

                                    {Array.from(
                                        {
                                            length:
                                                42
                                        }
                                    ).map(
                                        (
                                            _,
                                            index
                                        ) => (
                                            <span
                                                key={
                                                    index
                                                }
                                                className={`w-[3px] rounded-full ${
                                                    isListening
                                                        ? "bg-emerald-400"
                                                        : isSpeaking
                                                          ? "bg-purple-400"
                                                          : "bg-indigo-400"
                                                }`}
                                                style={{
                                                    height:
                                                        `${
                                                            20 +
                                                            ((index *
                                                                17) %
                                                                75)
                                                        }%`,

                                                    opacity:
                                                        0.3 +
                                                        ((index %
                                                            6) /
                                                            10),

                                                    animation:
                                                        `metriaWave ${
                                                            0.65 +
                                                            (index %
                                                                5) *
                                                                0.08
                                                        }s ease-in-out infinite alternate`,

                                                    animationDelay:
                                                        `${(index %
                                                            9) *
                                                            0.04}s`
                                                }}
                                            />
                                        )
                                    )}

                                </div>

                            </div>
                        )}

                        {/* ================================================= */}
                        {/* CONVERSATION                                      */}
                        {/* ================================================= */}

                        <div
                            className={`relative flex-1 overflow-y-auto pr-1 py-5 space-y-5 scrollbar-thin scrollbar-thumb-purple-500/20 ${
                                isExpanded
                                    ? "min-h-[50vh] max-h-[calc(100vh-285px)]"
                                    : "min-h-[220px] max-h-[520px]"
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

                                    const isLastMetria =
                                        !isUser &&
                                        idx ===
                                            messages.length -
                                                1;

                                    return (
                                        <div
                                            key={
                                                idx
                                            }
                                            className={`flex ${
                                                isUser
                                                    ? "justify-end"
                                                    : "justify-start"
                                            } animate-in fade-in slide-in-from-bottom-2 duration-500`}
                                        >

                                            <div
                                                className={`relative max-w-[92%] md:max-w-[82%] ${
                                                    isUser
                                                        ? ""
                                                        : "flex gap-3"
                                                }`}
                                            >

                                                {!isUser && (
                                                    <div
                                                        className={`mt-1 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                                                            isLastMetria &&
                                                            isSpeaking
                                                                ? "bg-purple-500/20 border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                                                                : "bg-purple-500/[0.07] border-purple-500/20"
                                                        }`}
                                                    >

                                                        <FiCpu
                                                            size={
                                                                14
                                                            }
                                                            className={`text-purple-400 ${
                                                                isLastMetria &&
                                                                isSpeaking
                                                                    ? "animate-pulse"
                                                                    : ""
                                                            }`}
                                                        />

                                                    </div>
                                                )}

                                                <div
                                                    className={`p-5 md:p-6 rounded-2xl ${
                                                        isUser
                                                            ? "bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white rounded-br-md shadow-[0_15px_40px_rgba(126,34,206,0.2)]"
                                                            : "bg-white/[0.035] border border-white/[0.09] text-slate-100 rounded-bl-md backdrop-blur-xl"
                                                    }`}
                                                >

                                                    <div className="flex items-center gap-2 mb-2">

                                                        <span
                                                            className={`text-[9px] uppercase font-black tracking-[0.18em] ${
                                                                isUser
                                                                    ? "text-purple-100/70"
                                                                    : "text-purple-400"
                                                            }`}
                                                        >
                                                            {isUser
                                                                ? "You"
                                                                : isLastMetria &&
                                                                    isSpeaking
                                                                  ? "Metria • Speaking"
                                                                  : "Metria • Analyst"}
                                                        </span>

                                                        {!isUser &&
                                                            isLastMetria &&
                                                            isSpeaking && (
                                                                <span className="flex items-end gap-[2px] h-3">

                                                                    <span className="w-[2px] h-1 bg-purple-400 animate-bounce" />

                                                                    <span className="w-[2px] h-3 bg-fuchsia-400 animate-bounce [animation-delay:100ms]" />

                                                                    <span className="w-[2px] h-2 bg-purple-400 animate-bounce [animation-delay:200ms]" />

                                                                </span>
                                                            )}

                                                    </div>

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

                            {/* THINKING STATE */}

                            {isAnalyzing && (
                                <div className="flex justify-start animate-in fade-in duration-300">

                                    <div className="flex gap-3">

                                        <div className="mt-1 w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center">

                                            <FiCpu
                                                size={
                                                    14
                                                }
                                                className="text-indigo-400 animate-spin"
                                            />

                                        </div>

                                        <div className="bg-white/[0.025] border border-white/[0.08] px-5 py-4 rounded-2xl rounded-bl-md">

                                            <div className="flex items-center gap-3">

                                                <div className="flex items-center gap-1">

                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />

                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:120ms]" />

                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:240ms]" />

                                                </div>

                                                <span className="text-[10px] text-slate-400 uppercase tracking-[0.16em] font-bold">
                                                    Working through the evidence
                                                </span>

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

                        {/* ================================================= */}
                        {/* SUGGESTED QUESTIONS                               */}
                        {/* ================================================= */}

                        <div className="pt-4 border-t border-white/[0.06]">

                            <div className="flex items-center gap-2 mb-3">

                                <FiZap
                                    size={
                                        11
                                    }
                                    className="text-purple-400"
                                />

                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    Ask a follow-up
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
                                            className="bg-white/[0.035] hover:bg-purple-500/10 border border-white/[0.08] hover:border-purple-400/30 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-medium transition-all disabled:opacity-40"
                                        >
                                            {
                                                promptText
                                            }
                                        </button>
                                    )
                                )}

                            </div>

                            {/* ================================================= */}
                            {/* COMMAND BAR                                       */}
                            {/* ================================================= */}

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
                                    className={`relative flex items-center rounded-2xl border bg-black/50 transition-all duration-500 ${
                                        isListening
                                            ? "border-emerald-400/60 shadow-[0_0_30px_rgba(52,211,153,0.12)]"
                                            : isAnalyzing
                                              ? "border-indigo-400/30"
                                              : "border-white/10 focus-within:border-purple-400/50 focus-within:shadow-[0_0_30px_rgba(168,85,247,0.08)]"
                                    }`}
                                >

                                    {/* INPUT STATE */}

                                    <div className="pl-5 shrink-0">

                                        {isListening ? (
                                            <span className="relative flex h-2.5 w-2.5">

                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />

                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />

                                            </span>
                                        ) : (
                                            <FiActivity
                                                size={
                                                    14
                                                }
                                                className={`${
                                                    isAnalyzing
                                                        ? "text-indigo-400 animate-pulse"
                                                        : "text-purple-500"
                                                }`}
                                            />
                                        )}

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
                                                  ? "Metria is working on your question..."
                                                  : isMultiDataset
                                                    ? `Ask Metria anything about these ${datasetsInContext.length} sources...`
                                                    : `Ask Metria anything about ${primaryDataset?.name || "your data"}...`
                                        }
                                        className="flex-1 min-w-0 bg-transparent px-4 py-5 text-sm text-white focus:outline-none placeholder:text-slate-600 disabled:cursor-wait"
                                    />

                                    {/* MIC */}

                                    <button
                                        type="button"
                                        onClick={
                                            toggleVoiceListener
                                        }
                                        disabled={
                                            isAnalyzing
                                        }
                                        className={`m-2 p-3 rounded-xl transition-all ${
                                            isListening
                                                ? "bg-emerald-500 text-black shadow-[0_0_25px_rgba(52,211,153,0.35)]"
                                                : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                                        } disabled:opacity-30`}
                                        title={
                                            isListening
                                                ? "Stop listening"
                                                : "Talk to Metria"
                                        }
                                    >

                                        {isListening ? (
                                            <FiMicOff
                                                size={
                                                    17
                                                }
                                            />
                                        ) : (
                                            <FiMic
                                                size={
                                                    17
                                                }
                                            />
                                        )}

                                    </button>

                                    {/* SEND */}

                                    <button
                                        type="submit"
                                        disabled={
                                            isAnalyzing ||
                                            !inputQuery.trim()
                                        }
                                        className={`m-2 ml-0 h-12 px-5 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.16em] transition-all ${
                                            !isAnalyzing &&
                                            inputQuery.trim()
                                                ? "bg-white text-black hover:bg-purple-100 hover:scale-[1.02] shadow-[0_10px_30px_rgba(255,255,255,0.08)]"
                                                : "bg-white/[0.06] text-slate-700 cursor-not-allowed"
                                        }`}
                                    >

                                        <span className="hidden sm:inline">
                                            Ask
                                        </span>

                                        <FiSend
                                            size={
                                                15
                                            }
                                        />

                                    </button>

                                </div>

                                {/* VOICE DEFAULT NOTICE */}

                                <div className="flex items-center justify-between gap-3 mt-2 px-2">

                                    <span className="text-[9px] text-slate-700">
                                        Metria can reason across the analysis and underlying source data.
                                    </span>

                                    {voiceEnabled && (
                                        <span className="flex items-center gap-1.5 text-[9px] text-purple-400/60 uppercase tracking-wider font-bold shrink-0">

                                            <FiVolume2
                                                size={
                                                    10
                                                }
                                            />

                                            Voice responses enabled

                                        </span>
                                    )}

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            </div>

            {/* ==================================================== */}
            {/* LOCAL ANIMATIONS                                     */}
            {/* ==================================================== */}

            <style>
                {`
                    @keyframes metriaWave {
                        0% {
                            transform: scaleY(0.35);
                            opacity: 0.3;
                        }

                        100% {
                            transform: scaleY(1);
                            opacity: 1;
                        }
                    }

                    @keyframes metriaScan {
                        0% {
                            transform: translateX(-150%);
                        }

                        100% {
                            transform: translateX(450%);
                        }
                    }
                `}
            </style>

        </div>
    );
};