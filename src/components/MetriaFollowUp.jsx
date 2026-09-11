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
    FiX,
    FiZap,
    FiActivity,
    FiMessageCircle,
    FiRadio,
    FiChevronRight
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

    /*
     * VOICE is the hero/default experience.
     *
     * Chat still exists, but becomes the secondary
     * detailed transcript / keyboard interface.
     */
    const [
        interfaceMode,
        setInterfaceMode
    ] = useState("voice");

    const [isListening, setIsListening] =
        useState(false);

    const [isSpeaking, setIsSpeaking] =
        useState(false);

    /*
     * Voice is ON by default.
     *
     * User choice persists between sessions.
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
        Array.isArray(activeDatasets) &&
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
                    `${dataset?.id ?? ""}:${dataset?.name ?? ""}`
            )
            .join("|");

    // ============================================================
    // VOICE PREFERENCE
    // ============================================================

    useEffect(() => {
        localStorage.setItem(
            "metria_voice_enabled",
            String(voiceEnabled)
        );
    }, [voiceEnabled]);

    // ============================================================
    // METRIA ACTIVE STATE
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
        listening: "Listening",
        thinking: "Thinking",
        speaking: "Speaking",
        ready: "Ready"
    }[metriaState];

    const stateSubtext = {
        listening:
            "Go ahead. I'm listening.",

        thinking:
            isMultiDataset
                ? `Reasoning across ${datasetsInContext.length} connected sources`
                : "Working through your data",

        speaking:
            "Delivering your analysis",

        ready:
            isMultiDataset
                ? `${datasetsInContext.length} business sources connected`
                : `Context loaded: ${primaryDataset?.name || "Dataset"}`
    }[metriaState];

    // ============================================================
    // LAST RESPONSE / LAST USER QUESTION
    // ============================================================

    const latestMetriaMessage =
        [...messages]
            .reverse()
            .find(
                (message) =>
                    message.sender ===
                    "metria"
            )?.text || "";

    const latestUserMessage =
        [...messages]
            .reverse()
            .find(
                (message) =>
                    message.sender ===
                    "user"
            )?.text || "";

    // ============================================================
    // AUTO SCROLL
    // ============================================================

    useEffect(() => {
        if (
            interfaceMode !== "chat"
        ) {
            return;
        }

        conversationEndRef.current
            ?.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
    }, [
        messages,
        isAnalyzing,
        isSpeaking,
        interfaceMode
    ]);

    // ============================================================
    // VOICE HELPERS
    // ============================================================

    const stopVoice = () => {
        if (audioRef.current) {
            audioRef.current.pause();

            audioRef.current.currentTime =
                0;

            audioRef.current = null;
        }

        setIsSpeaking(false);
    };

    const playResponseAudio =
        async (audioBase64) => {
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

                audio.onplay = () => {
                    setIsSpeaking(true);
                };

                audio.onended = () => {
                    setIsSpeaking(false);

                    audioRef.current =
                        null;
                };

                audio.onerror = () => {
                    setIsSpeaking(false);

                    audioRef.current =
                        null;
                };

                await audio.play();
            } catch (error) {
                console.warn(
                    "Browser prevented automatic Metria voice playback:",
                    error
                );

                setIsSpeaking(false);
            }
        };

    // ============================================================
    // WELCOME / CONTEXT RESET
    // ============================================================

    useEffect(() => {
        if (
            !aiAnalysisReady ||
            datasetsInContext.length === 0
        ) {
            setIsVisible(false);

            setMessages([]);

            stopVoice();

            return;
        }

        const timer =
            setTimeout(() => {
                setIsVisible(true);

                let welcomeText;

                if (
                    datasetsInContext.length >
                    1
                ) {
                    welcomeText =
                        `Analysis complete. I have ${datasetsInContext.length} active sources in context: ` +
                        `${datasetNames.join(", ")}. ` +
                        `I've got the strategic analysis, metrics and underlying records ready. ` +
                        `Ask me what's driving performance, where the biggest risk is, ` +
                        `how these sources connect, or what I'd recommend doing next.`;
                } else {
                    welcomeText =
                        `Analysis complete. I've got "${datasetsInContext[0]?.name}" in context. ` +
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

                /*
                 * Keep Voice mode as the hero when
                 * analysis context changes.
                 */
                setInterfaceMode(
                    "voice"
                );
            }, 350);

        return () => {
            clearTimeout(timer);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        datasetContextKey,
        aiAnalysisReady
    ]);

    // ============================================================
    // CLEANUP
    // ============================================================

    useEffect(() => {
        return () => {
            if (audioRef.current) {
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
                                headers: {
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
                } catch (err) {
                    console.error(
                        "Failed to load past chat sessions",
                        err
                    );

                    setPastSessions([]);
                }
            };

        if (authToken) {
            fetchHistory();
        }
    }, [authToken]);

    const loadSession =
        async (sessionId) => {
            try {
                stopVoice();

                const res =
                    await axios.get(
                        `${API_BASE_URL}/ai/sessions/${sessionId}`,
                        {
                            headers: {
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

                /*
                 * Historical sessions make more sense
                 * in transcript mode.
                 */
                setInterfaceMode(
                    "chat"
                );
            } catch (err) {
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

            if (!SpeechRecognition) {
                alert(
                    "Speech recognition isn't supported in this browser. Chrome provides the most reliable voice input."
                );

                return;
            }

            if (isAnalyzing) {
                return;
            }

            if (isListening) {
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
                (event) => {
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
                (event) => {
                    console.warn(
                        "Speech recognition error:",
                        event.error
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
        async (queryText) => {
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

            const newMessages = [
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

            setInputQuery("");

            setIsAnalyzing(true);

            try {
                const datasetsPayload =
                    datasetsInContext.map(
                        (dataset) => ({
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
                            headers: {
                                Authorization:
                                    `Bearer ${authToken}`
                            }
                        }
                    );

                const answerText =
                    res.data.answer ||
                    "I wasn't able to generate an analysis.";

                const audioBase64 =
                    res.data
                        .audio_base64;

                const finalMessages =
                    res.data.messages ||
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
                 * Default Metria behavior:
                 * successful answers speak automatically.
                 */
                if (
                    voiceEnabled &&
                    audioBase64
                ) {
                    await playResponseAudio(
                        audioBase64
                    );
                }
            } catch (err) {
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
                    (prev) => [
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
    // FORMAT MESSAGE
    // ============================================================

    const formatMessageText =
        (text, sender) => {
            const safeText =
                String(
                    text || ""
                );

            if (
                sender ===
                "user"
            ) {
                return (
                    <p className="leading-relaxed text-sm md:text-base">
                        {safeText}
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
                  "What would you fix first?"
              ]
            : [
                  "What's the most important thing I should know?",
                  "What's driving this result?",
                  "What would you do next?"
              ];

    // ============================================================
    // UI
    // ============================================================

    return (
        <div
            className={`transition-all duration-500 ${
                isExpanded
                    ? "fixed top-0 right-0 bottom-0 left-64 z-50 bg-[#030207] p-5 md:p-8 flex flex-col"
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
                {/* MAIN METRIA SHELL                                  */}
                {/* ================================================= */}

                <div
                    className={`relative overflow-hidden w-full flex-1 flex flex-col border transition-all duration-700 ${
                        isExpanded
                            ? "bg-[#06040c] border-purple-500/30 rounded-[3rem]"
                            : isSpeaking
                              ? "bg-[#090411] border-purple-400/60 rounded-[3rem] shadow-[0_0_120px_rgba(147,51,234,0.22)]"
                              : isAnalyzing
                                ? "bg-[#080610] border-indigo-400/40 rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.16)]"
                                : isListening
                                  ? "bg-[#050b0d] border-cyan-400/40 rounded-[3rem] shadow-[0_0_100px_rgba(34,211,238,0.12)]"
                                  : "bg-gradient-to-br from-[#0c0618] via-[#07050d] to-[#060914] border-purple-500/35 rounded-[3rem] shadow-[0_30px_120px_rgba(112,0,255,0.14)]"
                    }`}
                >
                    {/* ================================================= */}
                    {/* AMBIENT BACKGROUND                                */}
                    {/* ================================================= */}

                    <div
                        className={`absolute -top-64 left-[15%] w-[650px] h-[650px] rounded-full blur-[160px] transition-all duration-1000 pointer-events-none ${
                            isSpeaking
                                ? "bg-purple-500/20 scale-125"
                                : isAnalyzing
                                  ? "bg-indigo-500/15 scale-110"
                                  : isListening
                                    ? "bg-cyan-500/12 scale-110"
                                    : "bg-purple-500/[0.07]"
                        }`}
                    />

                    <div
                        className={`absolute -bottom-72 right-[5%] w-[700px] h-[700px] rounded-full blur-[170px] transition-all duration-1000 pointer-events-none ${
                            isSpeaking
                                ? "bg-fuchsia-500/14 scale-125"
                                : isListening
                                  ? "bg-blue-500/10"
                                  : "bg-indigo-500/[0.05]"
                        }`}
                    />

                    {/* stars / particles */}

                    <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
                        {Array.from({
                            length: 28
                        }).map(
                            (_, index) => (
                                <span
                                    key={
                                        index
                                    }
                                    className={`absolute rounded-full ${
                                        isListening
                                            ? "bg-cyan-300"
                                            : "bg-purple-400"
                                    }`}
                                    style={{
                                        width:
                                            `${2 + (index % 3)}px`,

                                        height:
                                            `${2 + (index % 3)}px`,

                                        left:
                                            `${(index * 37) % 100}%`,

                                        top:
                                            `${(index * 53) % 100}%`,

                                        opacity:
                                            0.2 +
                                            (index %
                                                5) *
                                                0.12,

                                        animation:
                                            `metriaParticle ${
                                                4 +
                                                (index %
                                                    7)
                                            }s ease-in-out infinite`,

                                        animationDelay:
                                            `${(index %
                                                9) *
                                            0.25}s`
                                    }}
                                />
                            )
                        )}
                    </div>

                    {/* top energy scan */}

                    <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
                        <div
                            className={`h-full w-1/3 bg-gradient-to-r from-transparent via-purple-300 to-transparent ${
                                isSpeaking ||
                                isAnalyzing ||
                                isListening
                                    ? "animate-[metriaScan_2s_linear_infinite]"
                                    : "opacity-40"
                            }`}
                        />
                    </div>

                    <div className="relative z-10 flex flex-col flex-1 p-5 md:p-8">
                        {/* ================================================= */}
                        {/* HEADER                                            */}
                        {/* ================================================= */}

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-white/[0.07]">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <span className="absolute inset-0 rounded-xl bg-purple-500/40 blur-xl" />

                                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 border border-purple-300/30 flex items-center justify-center shadow-[0_0_25px_rgba(147,51,234,0.25)]">
                                        <FiActivity
                                            size={
                                                18
                                            }
                                            className={`text-white ${
                                                isSpeaking ||
                                                isAnalyzing
                                                    ? "animate-pulse"
                                                    : ""
                                            }`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white text-lg font-black tracking-tight">
                                            Metria
                                        </h3>

                                        <span
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] uppercase tracking-[0.16em] font-black ${
                                                isSpeaking
                                                    ? "bg-purple-500/10 border-purple-400/30 text-purple-300"
                                                    : isAnalyzing
                                                      ? "bg-indigo-500/10 border-indigo-400/30 text-indigo-300"
                                                      : isListening
                                                        ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-300"
                                                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                            }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    metriaState ===
                                                    "ready"
                                                        ? "bg-emerald-400"
                                                        : "bg-current animate-pulse"
                                                }`}
                                            />

                                            {
                                                stateLabel
                                            }
                                        </span>
                                    </div>

                                    <p className="text-[10px] text-slate-500 mt-1">
                                        {
                                            stateSubtext
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* ================================================= */}
                            {/* MODE SWITCH                                       */}
                            {/* ================================================= */}

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex p-1 rounded-xl bg-black/40 border border-white/[0.08]">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setInterfaceMode(
                                                "voice"
                                            )
                                        }
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] uppercase tracking-[0.16em] font-black transition-all ${
                                            interfaceMode ===
                                            "voice"
                                                ? "bg-purple-500/20 border border-purple-400/30 text-white shadow-[0_0_20px_rgba(147,51,234,0.12)]"
                                                : "text-slate-600 hover:text-white"
                                        }`}
                                    >
                                        <FiRadio
                                            size={
                                                12
                                            }
                                        />

                                        Voice
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setInterfaceMode(
                                                "chat"
                                            )
                                        }
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] uppercase tracking-[0.16em] font-black transition-all ${
                                            interfaceMode ===
                                            "chat"
                                                ? "bg-purple-500/20 border border-purple-400/30 text-white shadow-[0_0_20px_rgba(147,51,234,0.12)]"
                                                : "text-slate-600 hover:text-white"
                                        }`}
                                    >
                                        <FiMessageCircle
                                            size={
                                                12
                                            }
                                        />

                                        Chat
                                    </button>
                                </div>

                                {/* HISTORY */}

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowHistoryDropdown(
                                                (prev) =>
                                                    !prev
                                            )
                                        }
                                        className="p-2.5 rounded-xl bg-white/[0.035] border border-white/10 hover:bg-white/[0.07] text-slate-400 hover:text-white transition-all"
                                        title="Conversation history"
                                    >
                                        <FiClock
                                            size={
                                                14
                                            }
                                        />
                                    </button>

                                    {showHistoryDropdown && (
                                        <div className="absolute right-0 top-full mt-3 w-80 bg-[#090812]/95 border border-purple-500/30 rounded-2xl p-4 shadow-[0_30px_80px_rgba(0,0,0,0.7)] z-50 backdrop-blur-2xl">
                                            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                                                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                                                    <FiClock className="text-purple-400" />

                                                    Previous Conversations
                                                </div>

                                                <button
                                                    type="button"
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

                                {/* VOICE ENABLED */}

                                <button
                                    type="button"
                                    onClick={() => {
                                        const next =
                                            !voiceEnabled;

                                        setVoiceEnabled(
                                            next
                                        );

                                        if (!next) {
                                            stopVoice();
                                        }
                                    }}
                                    className={`p-2.5 rounded-xl border transition-all ${
                                        voiceEnabled
                                            ? "bg-purple-500/10 border-purple-400/30 text-purple-200"
                                            : "bg-white/[0.035] border-white/10 text-slate-600"
                                    }`}
                                    title={
                                        voiceEnabled
                                            ? "Voice replies enabled"
                                            : "Voice replies disabled"
                                    }
                                >
                                    {voiceEnabled ? (
                                        <FiVolume2
                                            size={
                                                14
                                            }
                                        />
                                    ) : (
                                        <FiVolumeX
                                            size={
                                                14
                                            }
                                        />
                                    )}
                                </button>

                                {/* EXPAND */}

                                <button
                                    type="button"
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
                        {/* VOICE EXPERIENCE                                  */}
                        {/* ================================================= */}

                        {interfaceMode ===
                            "voice" && (
                            <div className="relative flex-1 flex flex-col items-center justify-center min-h-[520px] md:min-h-[600px] py-10 md:py-14">
                                {/* source context */}

                                <div className="absolute top-6 left-0 right-0 flex justify-center">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 border border-white/[0.06] backdrop-blur-xl">
                                        <FiZap
                                            size={
                                                11
                                            }
                                            className="text-purple-400"
                                        />

                                        <span className="text-[8px] md:text-[9px] uppercase tracking-[0.18em] font-black text-slate-500">
                                            {
                                                datasetsInContext.length
                                            }{" "}
                                            source
                                            {datasetsInContext.length ===
                                            1
                                                ? ""
                                                : "s"}{" "}
                                            in context
                                        </span>
                                    </div>
                                </div>

                                {/* ================================================= */}
                                {/* ORB                                                */}
                                {/* ================================================= */}

                                <button
                                    type="button"
                                    onClick={
                                        toggleVoiceListener
                                    }
                                    disabled={
                                        isAnalyzing
                                    }
                                    className="relative flex items-center justify-center outline-none disabled:cursor-wait"
                                    title={
                                        isListening
                                            ? "Stop listening"
                                            : "Talk to Metria"
                                    }
                                >
                                    {/* far aura */}

                                    <div
                                        className={`absolute w-[330px] h-[330px] md:w-[420px] md:h-[420px] rounded-full blur-[80px] transition-all duration-1000 ${
                                            isSpeaking
                                                ? "bg-purple-500/25 scale-125 animate-pulse"
                                                : isAnalyzing
                                                  ? "bg-indigo-500/20 scale-110 animate-pulse"
                                                  : isListening
                                                    ? "bg-cyan-500/20 scale-110 animate-pulse"
                                                    : "bg-purple-500/10 scale-95"
                                        }`}
                                    />

                                    {/* outer orbit 1 */}

                                    <div
                                        className={`absolute w-[290px] h-[290px] md:w-[370px] md:h-[370px] rounded-full border transition-all duration-700 ${
                                            isSpeaking
                                                ? "border-purple-400/35 animate-[metriaOrbit_5s_linear_infinite]"
                                                : isAnalyzing
                                                  ? "border-indigo-400/30 animate-[metriaOrbit_3s_linear_infinite]"
                                                  : isListening
                                                    ? "border-cyan-300/30 animate-[metriaOrbit_7s_linear_infinite]"
                                                    : "border-purple-500/12"
                                        }`}
                                    >
                                        <span className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-purple-300 shadow-[0_0_16px_rgba(216,180,254,1)]" />
                                    </div>

                                    {/* outer orbit 2 */}

                                    <div
                                        className={`absolute w-[250px] h-[250px] md:w-[320px] md:h-[320px] rounded-full border border-dashed transition-all ${
                                            isAnalyzing
                                                ? "border-indigo-400/25 animate-[metriaOrbitReverse_5s_linear_infinite]"
                                                : isSpeaking
                                                  ? "border-fuchsia-400/20 animate-[metriaOrbitReverse_7s_linear_infinite]"
                                                  : isListening
                                                    ? "border-cyan-400/20 animate-[metriaOrbitReverse_6s_linear_infinite]"
                                                    : "border-purple-400/[0.08] animate-[metriaOrbitReverse_14s_linear_infinite]"
                                        }`}
                                    />

                                    {/* listening ring */}

                                    {isListening && (
                                        <>
                                            <div className="absolute w-[220px] h-[220px] md:w-[280px] md:h-[280px] rounded-full border-2 border-cyan-300/30 animate-ping" />

                                            <div className="absolute w-[200px] h-[200px] md:w-[260px] md:h-[260px] rounded-full border border-cyan-300/40 animate-pulse" />
                                        </>
                                    )}

                                    {/* speaking rings */}

                                    {isSpeaking && (
                                        <>
                                            <div className="absolute w-[215px] h-[215px] md:w-[275px] md:h-[275px] rounded-full border border-purple-300/30 animate-[metriaSpeechRing_1.4s_ease-out_infinite]" />

                                            <div className="absolute w-[215px] h-[215px] md:w-[275px] md:h-[275px] rounded-full border border-fuchsia-300/20 animate-[metriaSpeechRing_1.4s_ease-out_infinite] [animation-delay:450ms]" />
                                        </>
                                    )}

                                    {/* actual orb */}

                                    <div
                                        className={`relative w-[180px] h-[180px] md:w-[230px] md:h-[230px] rounded-full overflow-hidden border transition-all duration-500 ${
                                            isSpeaking
                                                ? "border-purple-200/60 scale-[1.06] shadow-[0_0_80px_rgba(168,85,247,0.55),inset_0_0_70px_rgba(168,85,247,0.25)]"
                                                : isAnalyzing
                                                  ? "border-indigo-300/50 scale-[1.03] shadow-[0_0_70px_rgba(99,102,241,0.45),inset_0_0_60px_rgba(99,102,241,0.2)]"
                                                  : isListening
                                                    ? "border-cyan-300/60 scale-[1.05] shadow-[0_0_70px_rgba(34,211,238,0.4),inset_0_0_60px_rgba(34,211,238,0.18)]"
                                                    : "border-purple-300/30 shadow-[0_0_60px_rgba(126,34,206,0.35),inset_0_0_55px_rgba(126,34,206,0.18)] hover:scale-[1.03]"
                                        }`}
                                    >
                                        {/* orb body */}

                                        <div
                                            className={`absolute inset-0 transition-all duration-700 ${
                                                isListening
                                                    ? "bg-[radial-gradient(circle_at_50%_65%,#22d3ee_0%,#2563eb_18%,#6d28d9_46%,#14051f_77%,#030207_100%)]"
                                                    : isSpeaking
                                                      ? "bg-[radial-gradient(circle_at_50%_65%,#38bdf8_0%,#7c3aed_20%,#9333ea_44%,#250735_74%,#030207_100%)]"
                                                      : isAnalyzing
                                                        ? "bg-[radial-gradient(circle_at_50%_65%,#6366f1_0%,#4f46e5_22%,#6d28d9_50%,#16051f_78%,#030207_100%)]"
                                                        : "bg-[radial-gradient(circle_at_50%_68%,#0ea5e9_0%,#4f46e5_18%,#7e22ce_46%,#1e062d_76%,#030207_100%)]"
                                            }`}
                                        />

                                        {/* moving glow */}

                                        <div
                                            className={`absolute -inset-[30%] rounded-full bg-gradient-to-tr from-transparent via-white/[0.08] to-purple-300/20 blur-xl ${
                                                isAnalyzing ||
                                                isSpeaking ||
                                                isListening
                                                    ? "animate-[metriaCoreSpin_3s_linear_infinite]"
                                                    : "animate-[metriaCoreSpin_10s_linear_infinite]"
                                            }`}
                                        />

                                        {/* glass highlight */}

                                        <div className="absolute top-[13%] left-[18%] w-[55%] h-[30%] rounded-full bg-white/[0.09] blur-xl rotate-[-18deg]" />

                                        {/* face */}

                                        <div className="absolute inset-0 flex items-center justify-center gap-6 md:gap-7">
                                            <span
                                                className={`w-[11px] md:w-[14px] rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.95)] transition-all duration-300 ${
                                                    isSpeaking
                                                        ? "h-12 md:h-14 animate-[metriaEyeTalk_0.7s_ease-in-out_infinite_alternate]"
                                                        : isListening
                                                          ? "h-12 md:h-14"
                                                          : isAnalyzing
                                                            ? "h-8 md:h-10 animate-pulse"
                                                            : "h-11 md:h-13"
                                                }`}
                                            />

                                            <span
                                                className={`w-[11px] md:w-[14px] rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.95)] transition-all duration-300 ${
                                                    isSpeaking
                                                        ? "h-12 md:h-14 animate-[metriaEyeTalk_0.8s_ease-in-out_infinite_alternate] [animation-delay:100ms]"
                                                        : isListening
                                                          ? "h-12 md:h-14"
                                                          : isAnalyzing
                                                            ? "h-8 md:h-10 animate-pulse"
                                                            : "h-11 md:h-13"
                                                }`}
                                            />
                                        </div>

                                        {/* little energy particles inside */}

                                        {Array.from({
                                            length: 12
                                        }).map(
                                            (
                                                _,
                                                index
                                            ) => (
                                                <span
                                                    key={
                                                        index
                                                    }
                                                    className="absolute rounded-full bg-purple-200"
                                                    style={{
                                                        width:
                                                            `${2 + (index % 3)}px`,

                                                        height:
                                                            `${2 + (index % 3)}px`,

                                                        left:
                                                            `${15 + ((index * 19) % 70)}%`,

                                                        top:
                                                            `${18 + ((index * 23) % 65)}%`,

                                                        opacity:
                                                            0.25 +
                                                            (index %
                                                                4) *
                                                                0.15,

                                                        animation:
                                                            `metriaParticle ${
                                                                2.5 +
                                                                (index %
                                                                    5)
                                                            }s ease-in-out infinite`
                                                    }}
                                                />
                                            )
                                        )}
                                    </div>
                                </button>

                                {/* ================================================= */}
                                {/* STATE / VOICE TEXT                                  */}
                                {/* ================================================= */}

                                <div className="relative z-10 mt-10 text-center max-w-3xl px-4">
                                    <div className="flex items-center justify-center gap-3 mb-3">
                                        {metriaState ===
                                        "ready" ? (
                                            <span className="relative flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />

                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                                            </span>
                                        ) : (
                                            <FiActivity
                                                size={
                                                    13
                                                }
                                                className={`${
                                                    isListening
                                                        ? "text-cyan-300"
                                                        : isAnalyzing
                                                          ? "text-indigo-300"
                                                          : "text-purple-300"
                                                } animate-pulse`}
                                            />
                                        )}

                                        <span
                                            className={`text-[10px] md:text-xs uppercase tracking-[0.35em] font-black ${
                                                isListening
                                                    ? "text-cyan-300"
                                                    : isAnalyzing
                                                      ? "text-indigo-300"
                                                      : isSpeaking
                                                        ? "text-purple-300"
                                                        : "text-slate-500"
                                            }`}
                                        >
                                            {
                                                stateLabel
                                            }
                                        </span>
                                    </div>

                                    <h2 className="text-white text-2xl md:text-4xl font-black tracking-tight leading-tight">
                                        {isListening
                                            ? "I'm listening."
                                            : isAnalyzing
                                              ? "Give me a second."
                                              : isSpeaking
                                                ? "Here's what I'm seeing."
                                                : "Ask me anything about your business."}
                                    </h2>

                                    <p className="text-slate-500 text-xs md:text-sm mt-3">
                                        {isListening
                                            ? "Ask naturally. I'll send it as soon as you finish."
                                            : isAnalyzing
                                              ? stateSubtext
                                              : isSpeaking
                                                ? "You can interrupt me by tapping the orb."
                                                : "Tap the Metria core and speak, or type below."}
                                    </p>
                                </div>

                                {/* ================================================= */}
                                {/* LAST QUESTION                                     */}
                                {/* ================================================= */}

                                {latestUserMessage &&
                                    !isListening && (
                                        <div className="mt-7 max-w-2xl px-5">
                                            <div className="text-center text-[9px] uppercase tracking-[0.18em] text-slate-700 font-black mb-2">
                                                Your question
                                            </div>

                                            <p className="text-center text-xs md:text-sm text-slate-400 line-clamp-2">
                                                “
                                                {
                                                    latestUserMessage
                                                }
                                                ”
                                            </p>
                                        </div>
                                    )}

                                {/* ================================================= */}
                                {/* CURRENT METRIA ANSWER                              */}
                                {/* ================================================= */}

                                {latestMetriaMessage &&
                                    !isAnalyzing &&
                                    !isListening && (
                                        <div className="mt-8 w-full max-w-3xl px-4">
                                            <div
                                                className={`relative p-5 md:p-6 rounded-2xl border text-center backdrop-blur-xl transition-all ${
                                                    isSpeaking
                                                        ? "bg-purple-500/[0.07] border-purple-400/20 shadow-[0_0_35px_rgba(147,51,234,0.08)]"
                                                        : "bg-white/[0.025] border-white/[0.07]"
                                                }`}
                                            >
                                                {isSpeaking && (
                                                    <div className="flex items-end justify-center gap-[3px] h-5 mb-4">
                                                        {Array.from(
                                                            {
                                                                length: 28
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
                                                                    className="w-[3px] rounded-full bg-purple-400"
                                                                    style={{
                                                                        height:
                                                                            `${
                                                                                20 +
                                                                                ((index *
                                                                                    17) %
                                                                                    75)
                                                                            }%`,

                                                                        animation:
                                                                            `metriaWave ${
                                                                                0.5 +
                                                                                (index %
                                                                                    5) *
                                                                                    0.09
                                                                            }s ease-in-out infinite alternate`,

                                                                        animationDelay:
                                                                            `${(index %
                                                                                8) *
                                                                            0.05}s`
                                                                    }}
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                )}

                                                <p className="text-sm md:text-base text-slate-200 leading-relaxed line-clamp-4">
                                                    {
                                                        latestMetriaMessage
                                                    }
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setInterfaceMode(
                                                            "chat"
                                                        )
                                                    }
                                                    className="mt-4 inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] font-black text-purple-400 hover:text-purple-300 transition-colors"
                                                >
                                                    Open full response

                                                    <FiChevronRight
                                                        size={
                                                            12
                                                        }
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                {/* ================================================= */}
                                {/* VOICE SUGGESTIONS                                  */}
                                {/* ================================================= */}

                                {!isListening &&
                                    !isAnalyzing &&
                                    !isSpeaking && (
                                        <div className="mt-8 flex flex-wrap justify-center gap-2 px-4">
                                            {suggestedPrompts.map(
                                                (
                                                    promptText,
                                                    index
                                                ) => (
                                                    <button
                                                        type="button"
                                                        key={
                                                            index
                                                        }
                                                        onClick={() =>
                                                            handleSend(
                                                                promptText
                                                            )
                                                        }
                                                        className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.07] text-[9px] md:text-[10px] text-slate-500 hover:text-white hover:bg-purple-500/10 hover:border-purple-400/20 transition-all"
                                                    >
                                                        {
                                                            promptText
                                                        }
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}

                                {/* ================================================= */}
                                {/* QUICK TEXT INPUT                                   */}
                                {/* ================================================= */}

                                <form
                                    onSubmit={(
                                        e
                                    ) => {
                                        e.preventDefault();

                                        handleSend();
                                    }}
                                    className="w-full max-w-3xl mt-8 px-4"
                                >
                                    <div
                                        className={`flex items-center rounded-2xl border bg-black/45 backdrop-blur-xl transition-all ${
                                            isListening
                                                ? "border-cyan-400/40"
                                                : "border-white/[0.08] focus-within:border-purple-400/40"
                                        }`}
                                    >
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
                                                    ? "Listening..."
                                                    : "Or type a question..."
                                            }
                                            className="flex-1 min-w-0 bg-transparent px-5 py-4 text-sm text-white placeholder:text-slate-700 focus:outline-none disabled:cursor-wait"
                                        />

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
                                                    ? "bg-cyan-400 text-black shadow-[0_0_25px_rgba(34,211,238,0.35)]"
                                                    : "bg-purple-500/10 border border-purple-400/20 text-purple-300 hover:bg-purple-500/20"
                                            }`}
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

                                        <button
                                            type="submit"
                                            disabled={
                                                isAnalyzing ||
                                                !inputQuery.trim()
                                            }
                                            className={`m-2 ml-0 h-11 px-4 rounded-xl transition-all ${
                                                !isAnalyzing &&
                                                inputQuery.trim()
                                                    ? "bg-white text-black hover:bg-purple-100"
                                                    : "bg-white/[0.05] text-slate-700 cursor-not-allowed"
                                            }`}
                                        >
                                            <FiSend
                                                size={
                                                    15
                                                }
                                            />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ================================================= */}
                        {/* CHAT EXPERIENCE                                   */}
                        {/* ================================================= */}

                        {interfaceMode ===
                            "chat" && (
                            <div className="flex-1 flex flex-col pt-5">
                                {/* voice activity bar */}

                                {(isSpeaking ||
                                    isAnalyzing ||
                                    isListening) && (
                                    <div className="flex items-center gap-4 pb-4">
                                        <span className="text-[9px] uppercase tracking-[0.22em] font-black text-slate-600 shrink-0">
                                            {isSpeaking
                                                ? "Speaking"
                                                : isListening
                                                  ? "Listening"
                                                  : "Thinking"}
                                        </span>

                                        <div className="flex items-end gap-[3px] h-4 flex-1 overflow-hidden">
                                            {Array.from(
                                                {
                                                    length: 42
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
                                                                ? "bg-cyan-400"
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

                                {/* messages */}

                                <div
                                    className={`relative flex-1 overflow-y-auto pr-1 py-4 space-y-5 scrollbar-thin scrollbar-thumb-purple-500/20 ${
                                        isExpanded
                                            ? "min-h-[55vh] max-h-[calc(100vh-310px)]"
                                            : "min-h-[350px] max-h-[580px]"
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
                                                                className={`mt-1 shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border ${
                                                                    isLastMetria &&
                                                                    isSpeaking
                                                                        ? "bg-purple-500/20 border-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.25)]"
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

                                    {isAnalyzing && (
                                        <div className="flex justify-start">
                                            <div className="flex gap-3">
                                                <div className="mt-1 w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center">
                                                    <FiCpu
                                                        size={
                                                            14
                                                        }
                                                        className="text-indigo-400 animate-spin"
                                                    />
                                                </div>

                                                <div className="bg-white/[0.025] border border-white/[0.08] px-5 py-4 rounded-2xl rounded-bl-md">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />

                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:120ms]" />

                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:240ms]" />
                                                        </div>

                                                        <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em] font-bold">
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

                                {/* suggestions */}

                                <div className="pt-4 border-t border-white/[0.06]">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {suggestedPrompts.map(
                                            (
                                                promptText,
                                                index
                                            ) => (
                                                <button
                                                    type="button"
                                                    key={
                                                        index
                                                    }
                                                    disabled={
                                                        isAnalyzing
                                                    }
                                                    onClick={() =>
                                                        handleSend(
                                                            promptText
                                                        )
                                                    }
                                                    className="bg-white/[0.035] hover:bg-purple-500/10 border border-white/[0.08] hover:border-purple-400/30 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-[10px] transition-all disabled:opacity-40"
                                                >
                                                    {
                                                        promptText
                                                    }
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {/* input */}

                                    <form
                                        onSubmit={(
                                            e
                                        ) => {
                                            e.preventDefault();

                                            handleSend();
                                        }}
                                    >
                                        <div
                                            className={`relative flex items-center rounded-2xl border bg-black/50 transition-all ${
                                                isListening
                                                    ? "border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                                                    : "border-white/10 focus-within:border-purple-400/50"
                                            }`}
                                        >
                                            <div className="pl-5">
                                                <FiActivity
                                                    size={
                                                        14
                                                    }
                                                    className={
                                                        isListening
                                                            ? "text-cyan-400 animate-pulse"
                                                            : "text-purple-500"
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
                                                        : isMultiDataset
                                                          ? `Ask Metria anything about these ${datasetsInContext.length} sources...`
                                                          : `Ask Metria anything about ${primaryDataset?.name || "your data"}...`
                                                }
                                                className="flex-1 min-w-0 bg-transparent px-4 py-5 text-sm text-white focus:outline-none placeholder:text-slate-600 disabled:cursor-wait"
                                            />

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
                                                        ? "bg-cyan-400 text-black shadow-[0_0_25px_rgba(34,211,238,0.35)]"
                                                        : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                                                } disabled:opacity-30`}
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

                                            <button
                                                type="submit"
                                                disabled={
                                                    isAnalyzing ||
                                                    !inputQuery.trim()
                                                }
                                                className={`m-2 ml-0 h-12 px-5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                                                    !isAnalyzing &&
                                                    inputQuery.trim()
                                                        ? "bg-white text-black hover:bg-purple-100"
                                                        : "bg-white/[0.06] text-slate-700 cursor-not-allowed"
                                                }`}
                                            >
                                                <FiSend
                                                    size={
                                                        15
                                                    }
                                                />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
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
                            transform: scaleY(0.25);
                            opacity: 0.35;
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

                    @keyframes metriaOrbit {
                        from {
                            transform: rotate(0deg);
                        }

                        to {
                            transform: rotate(360deg);
                        }
                    }

                    @keyframes metriaOrbitReverse {
                        from {
                            transform: rotate(360deg);
                        }

                        to {
                            transform: rotate(0deg);
                        }
                    }

                    @keyframes metriaCoreSpin {
                        from {
                            transform: rotate(0deg);
                        }

                        to {
                            transform: rotate(360deg);
                        }
                    }

                    @keyframes metriaParticle {
                        0%,
                        100% {
                            transform: translateY(0px) scale(0.8);
                            opacity: 0.25;
                        }

                        50% {
                            transform: translateY(-14px) scale(1.2);
                            opacity: 0.8;
                        }
                    }

                    @keyframes metriaSpeechRing {
                        0% {
                            transform: scale(0.82);
                            opacity: 0.5;
                        }

                        100% {
                            transform: scale(1.45);
                            opacity: 0;
                        }
                    }

                    @keyframes metriaEyeTalk {
                        0% {
                            transform: scaleY(0.72);
                        }

                        100% {
                            transform: scaleY(1.14);
                        }
                    }
                `}
            </style>
        </div>
    );
};