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
    FiChevronRight,
    FiSkipForward
} from "react-icons/fi";

const API_BASE_URL =
    "https://ai-data-analyst-backend-1nuw.onrender.com";

const INTRO_STORAGE_KEY =
    "metria_intro_seen";

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
    // METRIA EXPERIENCE
    // ============================================================

    /*
     * Voice is now the primary interface.
     * Chat is a secondary transcript/keyboard experience.
     */
    const [
        interfaceMode,
        setInterfaceMode
    ] = useState("voice");

    /*
     * Metria starts dormant.
     *
     * The user must deliberately activate her.
     * That makes the product interaction obvious instead
     * of dropping them into an unexplained assistant.
     */
    const [
        isActivated,
        setIsActivated
    ] = useState(false);

    const [
        isPlayingIntro,
        setIsPlayingIntro
    ] = useState(false);

    const [
        hasPlayedIntro,
        setHasPlayedIntro
    ] = useState(() => {
        return (
            localStorage.getItem(
                INTRO_STORAGE_KEY
            ) === "true"
        );
    });

    const [
        isListening,
        setIsListening
    ] = useState(false);

    const [
        isSpeaking,
        setIsSpeaking
    ] = useState(false);

    /*
     * Voice remains ON by default.
     */
    const [
        voiceEnabled,
        setVoiceEnabled
    ] = useState(() => {
        const savedPreference =
            localStorage.getItem(
                "metria_voice_enabled"
            );

        return (
            savedPreference !==
            "false"
        );
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
              ? [activeDataset]
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
            String(
                voiceEnabled
            )
        );
    }, [
        voiceEnabled
    ]);

    // ============================================================
    // EXPANDED MODE — LOCK PAGE SCROLL
    // ============================================================

    /*
     * Prevent the main Analytics page scrollbar from showing
     * behind the expanded Metria interface.
     */
    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        const previousBodyOverflow =
            document.body.style
                .overflow;

        const previousHtmlOverflow =
            document.documentElement
                .style.overflow;

        document.body.style.overflow =
            "hidden";

        document.documentElement.style.overflow =
            "hidden";

        return () => {
            document.body.style.overflow =
                previousBodyOverflow;

            document.documentElement.style.overflow =
                previousHtmlOverflow;
        };
    }, [
        isExpanded
    ]);

    // ============================================================
    // METRIA STATE
    // ============================================================

    const metriaState =
        !isActivated
            ? "dormant"
            : isPlayingIntro
              ? "introducing"
              : isListening
                ? "listening"
                : isAnalyzing
                  ? "thinking"
                  : isSpeaking
                    ? "speaking"
                    : "ready";

    const stateLabel = {
        dormant:
            "Offline",

        introducing:
            "Introducing",

        listening:
            "Listening",

        thinking:
            "Thinking",

        speaking:
            "Speaking",

        ready:
            "Active"
    }[
        metriaState
    ];

    const stateSubtext = {
        dormant:
            "Tap Metria to activate",

        introducing:
            "Metria is coming online",

        listening:
            "I'm listening",

        thinking:
            isMultiDataset
                ? `Reasoning across ${datasetsInContext.length} connected sources`
                : "Working through the evidence",

        speaking:
            "Delivering analysis",

        ready:
            isMultiDataset
                ? `${datasetsInContext.length} sources are in context`
                : `${primaryDataset?.name || "Dataset"} is in context`
    }[
        metriaState
    ];

    // ============================================================
    // CURRENT RESPONSE
    // ============================================================

    const latestMetriaMessage =
        [...messages]
            .reverse()
            .find(
                (message) =>
                    message.sender ===
                    "metria"
            )?.text ||
        "";

    const latestUserMessage =
        [...messages]
            .reverse()
            .find(
                (message) =>
                    message.sender ===
                    "user"
            )?.text ||
        "";

    // ============================================================
    // AUTO SCROLL CHAT
    // ============================================================

    useEffect(() => {
        if (
            interfaceMode !==
            "chat"
        ) {
            return;
        }

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
        isSpeaking,
        interfaceMode
    ]);

    // ============================================================
    // AUDIO
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

        setIsPlayingIntro(
            false
        );
    };

    const playResponseAudio =
        async (
            audioBase64,
            {
                isIntro =
                    false,
                onFinished
            } = {}
        ) => {
            if (
                !voiceEnabled ||
                !audioBase64
            ) {
                if (
                    onFinished
                ) {
                    onFinished();
                }

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

                        if (
                            isIntro
                        ) {
                            setIsPlayingIntro(
                                true
                            );
                        }
                    };

                const finish =
                    () => {
                        setIsSpeaking(
                            false
                        );

                        setIsPlayingIntro(
                            false
                        );

                        audioRef.current =
                            null;

                        if (
                            onFinished
                        ) {
                            onFinished();
                        }
                    };

                audio.onended =
                    finish;

                audio.onerror =
                    finish;

                await audio.play();
            } catch (
                error
            ) {
                console.warn(
                    "Browser prevented automatic Metria voice playback:",
                    error
                );

                setIsSpeaking(
                    false
                );

                setIsPlayingIntro(
                    false
                );

                if (
                    onFinished
                ) {
                    onFinished();
                }
            }
        };

    // ============================================================
    // DATASET WELCOME
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

            setIsActivated(
                false
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

                    /*
                     * We preload a context message for Chat mode,
                     * but Metria remains dormant visually until tapped.
                     */

                    let welcomeText;

                    if (
                        isMultiDataset
                    ) {
                        welcomeText =
                            `I've got ${datasetsInContext.length} active sources in context: ` +
                            `${datasetNames.join(", ")}. ` +
                            `I can reason across the strategic analysis, metrics and underlying records.`;
                    } else {
                        welcomeText =
                            `I've got "${datasetsInContext[0]?.name}" in context. ` +
                            `I can investigate the strategic brief, metrics and underlying records with you.`;
                    }

                    setMessages([
                        {
                            sender:
                                "metria",

                            text:
                                welcomeText
                        }
                    ]);

                    setInterfaceMode(
                        "voice"
                    );

                    setIsActivated(
                        false
                    );
                },
                300
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
    // METRIA INTRODUCTION
    // ============================================================

    /*
     * Since /ai/speak was removed, this deliberately uses /ai/query.
     *
     * That means the intro comes back through the exact same
     * ElevenLabs voice pipeline as every other Metria response.
     */
    const playMetriaIntroduction =
        async () => {
            if (
                isPlayingIntro
            ) {
                return;
            }

            setIsPlayingIntro(
                true
            );

            const introScript =
                isMultiDataset
                    ? `Hello there. I'm Metria, your interactive business analyst. I've already reviewed the ${datasetsInContext.length} data sources connected to this analysis. You don't need to use special commands with me. Just tap my core, speak naturally, and ask me anything you would ask a real analyst — why something happened, where the risk is, how the data connects, or what I think you should do next. If you'd rather type, you can switch to Chat at any time.`
                    : `Hello there. I'm Metria, your interactive business analyst. I've already reviewed ${primaryDataset?.name || "your data"} and I have the analysis and underlying records in context. You don't need to use special commands with me. Just tap my core, speak naturally, and ask me anything you would ask a real analyst — why something happened, what stands out, where the risk is, or what I think you should do next. If you'd rather type, you can switch to Chat at any time.`;

            /*
             * Ask /ai/query to speak the controlled intro.
             *
             * We intentionally ignore the returned messages
             * so this hidden onboarding request does not replace
             * the visible analyst conversation.
             */
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
                                `Say exactly the following introduction and nothing else:\n\n${introScript}`,

                            // IMPORTANT:
                            // This is Metria's activation/onboarding request.
                            // The backend still generates the normal OpenAI
                            // response and ElevenLabs voice, but does not save
                            // this hidden intro as a chat session or append it
                            // to the user's conversation history.
                            intro_only:
                                true,

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
                                [],

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

                const audioBase64 =
                    res.data
                        ?.audio_base64;

                /*
                 * Even if voice has been manually switched off,
                 * activation still succeeds.
                 */
                if (
                    audioBase64 &&
                    voiceEnabled
                ) {
                    await playResponseAudio(
                        audioBase64,
                        {
                            isIntro:
                                true,

                            onFinished:
                                () => {
                                    setHasPlayedIntro(
                                        true
                                    );

                                    localStorage.setItem(
                                        INTRO_STORAGE_KEY,
                                        "true"
                                    );
                                }
                        }
                    );
                } else {
                    setIsPlayingIntro(
                        false
                    );

                    setHasPlayedIntro(
                        true
                    );

                    localStorage.setItem(
                        INTRO_STORAGE_KEY,
                        "true"
                    );
                }
            } catch (
                error
            ) {
                console.error(
                    "Metria introduction failed:",
                    error.response
                        ?.data ||
                        error.message
                );

                setIsPlayingIntro(
                    false
                );

                setHasPlayedIntro(
                    true
                );

                localStorage.setItem(
                    INTRO_STORAGE_KEY,
                    "true"
                );
            }
        };

    // ============================================================
    // ACTIVATE METRIA
    // ============================================================

    const activateMetria =
        async () => {
            if (
                isActivated
            ) {
                return;
            }

            setIsActivated(
                true
            );

            /*
             * First-time activation gets onboarding.
             *
             * After the user has heard/skipped onboarding once,
             * future activations go straight into tap-to-talk mode.
             */
            if (
                !hasPlayedIntro
            ) {
                await playMetriaIntroduction();
            }
        };

    const skipIntroduction =
        () => {
            stopVoice();

            setHasPlayedIntro(
                true
            );

            localStorage.setItem(
                INTRO_STORAGE_KEY,
                "true"
            );
        };

    // ============================================================
    // CLEANUP
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
    // HISTORY
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

                setIsActivated(
                    true
                );

                setInterfaceMode(
                    "chat"
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
    // SPEECH RECOGNITION
    // ============================================================

    const toggleVoiceListener =
        () => {
            /*
             * First tap wakes Metria.
             */
            if (
                !isActivated
            ) {
                activateMetria();

                return;
            }

            /*
             * Do not start recognition during onboarding.
             */
            if (
                isPlayingIntro
            ) {
                return;
            }

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
                isAnalyzing
            ) {
                return;
            }

            /*
             * Tapping while Metria is speaking interrupts her,
             * then immediately opens the mic.
             */
            if (
                isSpeaking
            ) {
                stopVoice();
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

            if (
                !isActivated
            ) {
                setIsActivated(
                    true
                );
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

                            // Normal analyst conversation.
                            intro_only:
                                false,

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

                            // Send the history BEFORE this new question.
                            // The backend appends the current user question
                            // and Metria response itself. This prevents the
                            // user's latest question from appearing twice.
                            messages:
                                messages,

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
    // MESSAGE FORMAT
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
    // PROMPTS
    // ============================================================

    const suggestedPrompts =
        isMultiDataset
            ? [
                  "What's the biggest thing I should know?",
                  "How do these sources affect each other?",
                  "What would you fix first?"
              ]
            : [
                  "What's the biggest thing I should know?",
                  "What's driving this result?",
                  "What would you do next?"
              ];

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div
            className={
                isExpanded
                    ? "fixed top-0 right-0 bottom-0 left-64 z-[999] bg-[#030207] flex flex-col overflow-hidden"
                    : "w-full mx-auto my-6 flex flex-col"
            }
        >
            <div
                className={`transition-all duration-700 transform ${
                    isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-5 pointer-events-none"
                } w-full flex-1 flex flex-col`}
            >

                {/* ================================================= */}
                {/* MAIN METRIA EXPERIENCE                            */}
                {/* ================================================= */}

                <div
                    className={`relative overflow-hidden w-full flex-1 flex flex-col transition-all duration-700 ${
                        isExpanded
                            ? "bg-[#030207] border-0 rounded-none shadow-none h-full"
                            : isSpeaking
                              ? "bg-[#090411] border border-purple-400/60 rounded-[3rem] shadow-[0_0_120px_rgba(147,51,234,0.22)]"
                              : isAnalyzing
                                ? "bg-[#080610] border border-indigo-400/40 rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.16)]"
                                : isListening
                                  ? "bg-[#03090d] border border-cyan-400/40 rounded-[3rem] shadow-[0_0_100px_rgba(34,211,238,0.12)]"
                                  : "bg-gradient-to-br from-[#0c0618] via-[#07050d] to-[#060914] border border-purple-500/35 rounded-[3rem] shadow-[0_30px_120px_rgba(112,0,255,0.14)]"
                    }`}
                >

                    {/* ================================================= */}
                    {/* BACKGROUND                                        */}
                    {/* ================================================= */}

                    <div
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[170px] pointer-events-none transition-all duration-1000 ${
                            !isActivated
                                ? "bg-purple-500/[0.06]"
                                : isSpeaking
                                  ? "bg-purple-500/20 scale-125"
                                  : isListening
                                    ? "bg-cyan-500/14 scale-110"
                                    : isAnalyzing
                                      ? "bg-indigo-500/15 scale-110"
                                      : "bg-purple-500/[0.08]"
                        }`}
                    />

                    {/* subtle energy field */}

                    <div className="absolute inset-0 pointer-events-none opacity-35">

                        {Array.from({
                            length:
                                34
                        }).map(
                            (
                                _,
                                index
                            ) => (
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
                                            `${1 + (index % 3)}px`,

                                        height:
                                            `${1 + (index % 3)}px`,

                                        left:
                                            `${(index * 41) % 100}%`,

                                        top:
                                            `${(index * 59) % 100}%`,

                                        animation:
                                            `metriaParticle ${
                                                4 +
                                                (index %
                                                    7)
                                            }s ease-in-out infinite`,

                                        animationDelay:
                                            `${(index %
                                                8) *
                                            0.18}s`
                                    }}
                                />
                            )
                        )}

                    </div>

                    <div
                        className={`relative z-10 flex flex-col flex-1 ${
                            isExpanded
                                ? "px-8 md:px-12 py-7"
                                : "p-5 md:p-8"
                        }`}
                    >

                        {/* ================================================= */}
                        {/* HEADER                                            */}
                        {/* ================================================= */}

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

                            <div className="flex items-center gap-3">

                                <div className="relative">

                                    <span className="absolute inset-0 bg-purple-500/35 rounded-xl blur-lg" />

                                    <div className="relative w-10 h-10 rounded-xl border border-purple-400/25 bg-purple-500/10 flex items-center justify-center">

                                        <FiActivity
                                            size={
                                                17
                                            }
                                            className={`${
                                                isActivated
                                                    ? "text-purple-300"
                                                    : "text-slate-600"
                                            } ${
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

                                        <h3 className="text-white font-black text-lg tracking-tight">
                                            Metria
                                        </h3>

                                        <span
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] uppercase tracking-[0.17em] font-black ${
                                                !isActivated
                                                    ? "border-white/10 bg-white/[0.03] text-slate-600"
                                                    : isListening
                                                      ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
                                                      : isAnalyzing
                                                        ? "border-indigo-400/30 bg-indigo-500/10 text-indigo-300"
                                                        : isSpeaking
                                                          ? "border-purple-400/30 bg-purple-500/10 text-purple-300"
                                                          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                            }`}
                                        >

                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    !isActivated
                                                        ? "bg-slate-700"
                                                        : metriaState ===
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
                            {/* PRIMARY MODE CONTROL                               */}
                            {/* ================================================= */}

                            <div className="flex flex-wrap items-center gap-3">

                                {/*
                                 * Deliberately larger than before.
                                 * Users should immediately understand
                                 * that Voice and Chat are separate modes.
                                 */}

                                <div className="flex p-1.5 rounded-2xl bg-black/60 border border-white/10 shadow-xl">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setInterfaceMode(
                                                "voice"
                                            )
                                        }
                                        className={`flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl min-w-[115px] text-[10px] uppercase tracking-[0.17em] font-black transition-all ${
                                            interfaceMode ===
                                            "voice"
                                                ? "bg-gradient-to-r from-purple-600/30 to-indigo-500/20 border border-purple-400/40 text-white shadow-[0_0_25px_rgba(147,51,234,0.12)]"
                                                : "border border-transparent text-slate-600 hover:text-white hover:bg-white/[0.04]"
                                        }`}
                                    >

                                        <FiRadio
                                            size={
                                                14
                                            }
                                        />

                                        Talk

                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setInterfaceMode(
                                                "chat"
                                            )
                                        }
                                        className={`flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl min-w-[115px] text-[10px] uppercase tracking-[0.17em] font-black transition-all ${
                                            interfaceMode ===
                                            "chat"
                                                ? "bg-gradient-to-r from-purple-600/30 to-indigo-500/20 border border-purple-400/40 text-white shadow-[0_0_25px_rgba(147,51,234,0.12)]"
                                                : "border border-transparent text-slate-600 hover:text-white hover:bg-white/[0.04]"
                                        }`}
                                    >

                                        <FiMessageCircle
                                            size={
                                                14
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
                                                (
                                                    prev
                                                ) =>
                                                    !prev
                                            )
                                        }
                                        className="p-3 rounded-xl bg-white/[0.035] border border-white/10 hover:bg-white/[0.07] text-slate-400 hover:text-white transition-all"
                                    >

                                        <FiClock
                                            size={
                                                15
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
                                                                key={
                                                                    session.id
                                                                }
                                                                type="button"
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
                                    type="button"
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
                                    className={`p-3 rounded-xl border transition-all ${
                                        voiceEnabled
                                            ? "bg-purple-500/10 border-purple-400/30 text-purple-200"
                                            : "bg-white/[0.035] border-white/10 text-slate-600"
                                    }`}
                                >

                                    {voiceEnabled ? (
                                        <FiVolume2
                                            size={
                                                15
                                            }
                                        />
                                    ) : (
                                        <FiVolumeX
                                            size={
                                                15
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
                                    className="p-3 rounded-xl bg-white/[0.035] border border-white/10 hover:bg-white/[0.07] text-slate-400 hover:text-white transition-all"
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
                        {/* VOICE MODE                                        */}
                        {/* ================================================= */}

                        {interfaceMode ===
                            "voice" && (

                            <div
                                className={`relative flex-1 flex flex-col items-center justify-center ${
                                    isExpanded
                                        ? "min-h-0 h-full"
                                        : "min-h-[600px]"
                                } py-10`}
                            >

                                {/* ========================================= */}
                                {/* INTRO SKIP                                */}
                                {/* ========================================= */}

                                {isPlayingIntro && (
                                    <button
                                        type="button"
                                        onClick={
                                            skipIntroduction
                                        }
                                        className="absolute top-6 right-0 md:right-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all text-[9px] uppercase tracking-[0.17em] font-black"
                                    >

                                        Skip intro

                                        <FiSkipForward
                                            size={
                                                12
                                            }
                                        />

                                    </button>
                                )}

                                {/* ========================================= */}
                                {/* CUSTOM METRIA CORE                         */}
                                {/* ========================================= */}

                                <button
                                    type="button"
                                    disabled={
                                        isAnalyzing ||
                                        isPlayingIntro
                                    }
                                    onClick={
                                        toggleVoiceListener
                                    }
                                    className="relative group flex items-center justify-center outline-none disabled:cursor-default"
                                    aria-label={
                                        !isActivated
                                            ? "Activate Metria"
                                            : "Talk to Metria"
                                    }
                                >

                                    {/* huge ambient activation glow */}

                                    <div
                                        className={`absolute w-[420px] h-[420px] md:w-[540px] md:h-[540px] rounded-full blur-[100px] transition-all duration-1000 ${
                                            !isActivated
                                                ? "bg-purple-600/10 group-hover:bg-purple-500/16 group-hover:scale-110"
                                                : isListening
                                                  ? "bg-cyan-500/18 scale-110 animate-pulse"
                                                  : isSpeaking
                                                    ? "bg-purple-500/24 scale-125 animate-pulse"
                                                    : isAnalyzing
                                                      ? "bg-indigo-500/20 scale-110 animate-pulse"
                                                      : "bg-purple-600/13"
                                        }`}
                                    />

                                    {/* orbital architecture */}

                                    <div
                                        className={`absolute w-[330px] h-[330px] md:w-[420px] md:h-[420px] transition-all ${
                                            isActivated
                                                ? "opacity-100"
                                                : "opacity-40"
                                        }`}
                                    >

                                        {/* RING A */}

                                        <div
                                            className={`absolute inset-0 rounded-full border ${
                                                isListening
                                                    ? "border-cyan-300/45"
                                                    : "border-purple-400/25"
                                            } ${
                                                isActivated
                                                    ? "animate-[metriaOrbit_12s_linear_infinite]"
                                                    : ""
                                            }`}
                                        >

                                            <span className="absolute left-1/2 -top-2 -translate-x-1/2 w-4 h-4 rotate-45 bg-purple-400 border border-purple-200/60 shadow-[0_0_20px_rgba(192,132,252,0.8)]" />

                                        </div>

                                        {/* RING B */}

                                        <div
                                            className={`absolute inset-[9%] rounded-full border border-dashed ${
                                                isListening
                                                    ? "border-cyan-400/30"
                                                    : "border-indigo-400/20"
                                            } ${
                                                isActivated
                                                    ? "animate-[metriaOrbitReverse_8s_linear_infinite]"
                                                    : ""
                                            }`}
                                        >

                                            <span className="absolute bottom-[14%] -right-1 w-3 h-3 rotate-45 bg-indigo-400 shadow-[0_0_18px_rgba(129,140,248,0.8)]" />

                                        </div>

                                        {/* RING C — asymmetric */}

                                        <div
                                            className={`absolute inset-[20%] border-x border-purple-400/30 rounded-[42%_58%_54%_46%/55%_41%_59%_45%] ${
                                                isActivated
                                                    ? "animate-[metriaOrbit_6s_linear_infinite]"
                                                    : ""
                                            }`}
                                        />

                                    </div>

                                    {/* speaking pulse */}

                                    {isSpeaking && (
                                        <>
                                            <span className="absolute w-[250px] h-[250px] md:w-[315px] md:h-[315px] rounded-full border border-purple-300/25 animate-[metriaSpeechRing_1.4s_ease-out_infinite]" />

                                            <span className="absolute w-[250px] h-[250px] md:w-[315px] md:h-[315px] rounded-full border border-fuchsia-300/20 animate-[metriaSpeechRing_1.4s_ease-out_infinite] [animation-delay:450ms]" />
                                        </>
                                    )}

                                    {/* listening pulse */}

                                    {isListening && (
                                        <>
                                            <span className="absolute w-[260px] h-[260px] md:w-[325px] md:h-[325px] rounded-full border border-cyan-300/30 animate-ping" />

                                            <span className="absolute w-[225px] h-[225px] md:w-[285px] md:h-[285px] rounded-full border border-cyan-300/50 animate-pulse" />
                                        </>
                                    )}

                                    {/* ===================================== */}
                                    {/* METRIA ROBOT AVATAR                    */}
                                    {/* ===================================== */}

                                    <div
                                        className={`relative w-[210px] h-[220px] md:w-[270px] md:h-[285px] transition-all duration-700 ${
                                            !isActivated
                                                ? "group-hover:scale-[1.045] group-hover:-translate-y-1"
                                                : isSpeaking
                                                  ? "scale-[1.055] -translate-y-1"
                                                  : isListening
                                                    ? "scale-[1.045]"
                                                    : isAnalyzing
                                                      ? "scale-[1.025]"
                                                      : ""
                                        }`}
                                    >
                                        <div
                                            className={`absolute left-1/2 bottom-[2%] -translate-x-1/2 w-[54%] h-[9%] rounded-full blur-xl transition-all duration-700 ${
                                                !isActivated
                                                    ? "bg-purple-500/10 opacity-40"
                                                    : isListening
                                                      ? "bg-cyan-400/25 opacity-80 scale-110"
                                                      : isSpeaking
                                                        ? "bg-purple-400/30 opacity-100 scale-125"
                                                        : isAnalyzing
                                                          ? "bg-indigo-400/25 opacity-90 scale-110"
                                                          : "bg-purple-500/20 opacity-70"
                                            }`}
                                        />

                                        <div
                                            className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
                                                isSpeaking
                                                    ? "animate-[metriaRobotSpeak_1.2s_ease-in-out_infinite]"
                                                    : isListening
                                                      ? "animate-[metriaRobotListen_1.7s_ease-in-out_infinite]"
                                                      : isAnalyzing
                                                        ? "animate-[metriaRobotThink_2s_ease-in-out_infinite]"
                                                        : isActivated
                                                          ? "animate-[metriaRobotIdle_3.6s_ease-in-out_infinite]"
                                                          : ""
                                            }`}
                                        >
                                            <div className="relative z-30 mb-[-5px] flex flex-col items-center">
                                                <span
                                                    className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border transition-all duration-500 ${
                                                        !isActivated
                                                            ? "bg-slate-800 border-slate-700"
                                                            : isListening
                                                              ? "bg-cyan-200 border-cyan-100 shadow-[0_0_22px_rgba(103,232,249,1)]"
                                                              : isSpeaking
                                                                ? "bg-purple-200 border-purple-100 shadow-[0_0_24px_rgba(216,180,254,1)]"
                                                                : isAnalyzing
                                                                  ? "bg-indigo-200 border-indigo-100 shadow-[0_0_22px_rgba(165,180,252,1)]"
                                                                  : "bg-purple-300 border-purple-200 shadow-[0_0_16px_rgba(192,132,252,0.9)]"
                                                    }`}
                                                />
                                                <span
                                                    className={`w-[2px] h-4 md:h-5 transition-colors ${
                                                        !isActivated
                                                            ? "bg-slate-800"
                                                            : "bg-gradient-to-b from-purple-300/80 to-purple-500/20"
                                                    }`}
                                                />
                                            </div>

                                            <div className="relative z-20 w-[76%] h-[43%]">
                                                <div
                                                    className={`absolute -left-[8%] top-[28%] w-[17%] h-[42%] rounded-[45%] border flex items-center justify-center transition-all duration-500 ${
                                                        !isActivated
                                                            ? "border-slate-700 bg-[#0d0d12]"
                                                            : isListening
                                                              ? "border-cyan-300/60 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.24)]"
                                                              : "border-purple-300/45 bg-purple-500/10 shadow-[0_0_22px_rgba(147,51,234,0.22)]"
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-[42%] h-[56%] rounded-full border ${
                                                            !isActivated
                                                                ? "border-slate-700"
                                                                : isListening
                                                                  ? "border-cyan-200/70 shadow-[inset_0_0_10px_rgba(34,211,238,0.35)]"
                                                                  : "border-purple-200/60 shadow-[inset_0_0_10px_rgba(192,132,252,0.35)]"
                                                        }`}
                                                    />
                                                </div>

                                                <div
                                                    className={`absolute -right-[8%] top-[28%] w-[17%] h-[42%] rounded-[45%] border flex items-center justify-center transition-all duration-500 ${
                                                        !isActivated
                                                            ? "border-slate-700 bg-[#0d0d12]"
                                                            : isListening
                                                              ? "border-cyan-300/60 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.24)]"
                                                              : "border-purple-300/45 bg-purple-500/10 shadow-[0_0_22px_rgba(147,51,234,0.22)]"
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-[42%] h-[56%] rounded-full border ${
                                                            !isActivated
                                                                ? "border-slate-700"
                                                                : isListening
                                                                  ? "border-cyan-200/70 shadow-[inset_0_0_10px_rgba(34,211,238,0.35)]"
                                                                  : "border-purple-200/60 shadow-[inset_0_0_10px_rgba(192,132,252,0.35)]"
                                                        }`}
                                                    />
                                                </div>

                                                <div
                                                    className={`absolute inset-0 rounded-[42%_42%_36%_36%/45%_45%_34%_34%] border overflow-hidden transition-all duration-500 ${
                                                        !isActivated
                                                            ? "border-slate-700 bg-gradient-to-br from-[#181820] via-[#0f0f15] to-[#08080c]"
                                                            : isListening
                                                              ? "border-cyan-200/65 bg-gradient-to-br from-[#293047] via-[#15192a] to-[#080b12] shadow-[0_0_46px_rgba(34,211,238,0.20)]"
                                                              : isSpeaking
                                                                ? "border-purple-200/70 bg-gradient-to-br from-[#352b48] via-[#171225] to-[#09070f] shadow-[0_0_54px_rgba(168,85,247,0.26)]"
                                                                : "border-purple-300/45 bg-gradient-to-br from-[#302945] via-[#171321] to-[#09080e] shadow-[0_0_40px_rgba(126,34,206,0.20)]"
                                                    }`}
                                                >
                                                    <div className="absolute inset-x-[8%] top-[6%] h-[19%] rounded-full bg-gradient-to-b from-white/20 via-white/[0.04] to-transparent blur-[1px]" />
                                                    <div
                                                        className={`absolute left-1/2 top-[9%] -translate-x-1/2 w-[21%] h-[4px] rounded-full transition-all ${
                                                            !isActivated
                                                                ? "bg-slate-700"
                                                                : isListening
                                                                  ? "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]"
                                                                  : "bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.9)]"
                                                        }`}
                                                    />

                                                    <div
                                                        className={`absolute left-[10%] right-[10%] top-[22%] bottom-[14%] rounded-[38%_38%_34%_34%/48%_48%_38%_38%] border overflow-hidden transition-all duration-500 ${
                                                            !isActivated
                                                                ? "border-slate-700 bg-[#050507]"
                                                                : isListening
                                                                  ? "border-cyan-300/55 bg-[#02070a] shadow-[inset_0_0_38px_rgba(34,211,238,0.08)]"
                                                                  : isSpeaking
                                                                    ? "border-purple-300/60 bg-[#050208] shadow-[inset_0_0_42px_rgba(147,51,234,0.10)]"
                                                                    : "border-purple-400/35 bg-[#030206] shadow-[inset_0_0_35px_rgba(126,34,206,0.08)]"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`absolute -inset-y-1/2 -left-1/2 w-[55%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent ${
                                                                isActivated
                                                                    ? "animate-[metriaFaceSweep_4.5s_ease-in-out_infinite]"
                                                                    : ""
                                                            }`}
                                                        />

                                                        <div className="absolute inset-0 flex items-center justify-center gap-[22%]">
                                                            {[0, 1].map((eye) => (
                                                                <span
                                                                    key={eye}
                                                                    className={`block w-[8%] h-[35%] rounded-full transition-all duration-300 ${
                                                                        !isActivated
                                                                            ? "bg-slate-700"
                                                                            : isListening
                                                                              ? "bg-cyan-100 shadow-[0_0_18px_rgba(103,232,249,1)] animate-[metriaEyeListen_0.75s_ease-in-out_infinite_alternate]"
                                                                              : isSpeaking
                                                                                ? "bg-purple-100 shadow-[0_0_18px_rgba(216,180,254,1)] animate-[metriaEyeSpeak_0.65s_ease-in-out_infinite_alternate]"
                                                                                : isAnalyzing
                                                                                  ? `bg-indigo-100 shadow-[0_0_17px_rgba(199,210,254,1)] animate-[metriaEyeThink_1.1s_ease-in-out_infinite] ${eye === 1 ? "[animation-delay:180ms]" : ""}`
                                                                                  : "bg-purple-100 shadow-[0_0_16px_rgba(216,180,254,0.95)]"
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className={`relative z-10 w-[20%] h-[8%] -mt-[1%] rounded-b-xl border-x transition-all ${
                                                    !isActivated
                                                        ? "border-slate-700 bg-[#111116]"
                                                        : "border-purple-400/30 bg-gradient-to-b from-[#181320] to-[#0c0a10]"
                                                }`}
                                            />

                                            <div className="relative z-20 w-[54%] h-[34%] -mt-[1%]">
                                                <div
                                                    className={`absolute -left-[13%] top-[12%] w-[28%] h-[48%] rounded-full border transition-all ${
                                                        !isActivated
                                                            ? "border-slate-700 bg-[#111116]"
                                                            : isListening
                                                              ? "border-cyan-300/35 bg-[#151a24]"
                                                              : "border-purple-300/35 bg-[#17131f]"
                                                    }`}
                                                />
                                                <div
                                                    className={`absolute -right-[13%] top-[12%] w-[28%] h-[48%] rounded-full border transition-all ${
                                                        !isActivated
                                                            ? "border-slate-700 bg-[#111116]"
                                                            : isListening
                                                              ? "border-cyan-300/35 bg-[#151a24]"
                                                              : "border-purple-300/35 bg-[#17131f]"
                                                    }`}
                                                />

                                                <div
                                                    className={`absolute inset-0 rounded-[36%_36%_46%_46%/24%_24%_62%_62%] border overflow-hidden transition-all duration-500 ${
                                                        !isActivated
                                                            ? "border-slate-700 bg-gradient-to-b from-[#17171d] to-[#0a0a0e]"
                                                            : isListening
                                                              ? "border-cyan-300/45 bg-gradient-to-b from-[#232a3a] via-[#121721] to-[#080b10]"
                                                              : isSpeaking
                                                                ? "border-purple-300/50 bg-gradient-to-b from-[#2a2238] via-[#15111d] to-[#09080c]"
                                                                : "border-purple-300/35 bg-gradient-to-b from-[#282237] via-[#15121c] to-[#09080d]"
                                                    }`}
                                                >
                                                    <div className="absolute inset-x-[12%] top-[8%] h-[18%] rounded-full bg-gradient-to-b from-white/[0.14] to-transparent" />
                                                    <div
                                                        className={`absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[31%] aspect-square rotate-45 rounded-[28%] border transition-all duration-500 ${
                                                            !isActivated
                                                                ? "border-slate-700 bg-slate-900"
                                                                : isListening
                                                                  ? "border-cyan-200/75 bg-cyan-400/10 shadow-[0_0_22px_rgba(34,211,238,0.4)]"
                                                                  : isSpeaking
                                                                    ? "border-purple-200/80 bg-purple-400/15 shadow-[0_0_24px_rgba(192,132,252,0.5)]"
                                                                    : "border-purple-300/60 bg-purple-500/10 shadow-[0_0_18px_rgba(147,51,234,0.35)]"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`absolute inset-[29%] rounded-full transition-all ${
                                                                !isActivated
                                                                    ? "bg-slate-700"
                                                                    : isListening
                                                                      ? "bg-cyan-200 shadow-[0_0_14px_rgba(103,232,249,1)]"
                                                                      : "bg-purple-200 shadow-[0_0_14px_rgba(216,180,254,1)]"
                                                            }`}
                                                        />
                                                    </div>
                                                    <div className="absolute left-[27%] right-[27%] bottom-[15%] flex gap-1.5 justify-center">
                                                        {[0, 1, 2].map((node) => (
                                                            <span
                                                                key={node}
                                                                className={`w-1.5 h-1.5 rounded-full ${
                                                                    !isActivated
                                                                        ? "bg-slate-800"
                                                                        : node === 1
                                                                          ? isListening
                                                                              ? "bg-cyan-300"
                                                                              : "bg-purple-300"
                                                                          : "bg-white/20"
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </button>

                                {/* ========================================= */}
                                {/* ACTIVATION MESSAGE                         */}
                                {/* ========================================= */}

                                <div className="relative z-20 text-center max-w-3xl mt-10 px-5">

                                    {!isActivated ? (
                                        <>
                                            <p className="text-[10px] uppercase tracking-[0.38em] font-black text-purple-400 mb-4">
                                                Interactive analyst ready
                                            </p>

                                            <h2 className="text-white text-3xl md:text-5xl font-black tracking-tight">
                                                Tap to activate Metria
                                            </h2>

                                            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm leading-relaxed mt-4">
                                                Your analysis is complete. Wake Metria to talk through the findings like you would with a real analyst.
                                            </p>

                                            <div className="mt-6 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.2em] font-black text-purple-300/70">

                                                <FiMic
                                                    size={
                                                        12
                                                    }
                                                />

                                                Tap Metria to activate

                                            </div>
                                        </>
                                    ) : isPlayingIntro ? (
                                        <>
                                            <p className="text-[10px] uppercase tracking-[0.35em] font-black text-purple-300 mb-3">
                                                Metria online
                                            </p>

                                            <h2 className="text-white text-2xl md:text-4xl font-black">
                                                Hello there.
                                            </h2>

                                            <p className="text-slate-500 text-xs md:text-sm mt-3">
                                                A quick introduction, then she's yours.
                                            </p>
                                        </>
                                    ) : isListening ? (
                                        <>
                                            <p className="text-[10px] uppercase tracking-[0.35em] font-black text-cyan-300 mb-3">
                                                Voice channel open
                                            </p>

                                            <h2 className="text-white text-3xl md:text-5xl font-black">
                                                I'm listening.
                                            </h2>

                                            <p className="text-slate-500 text-xs md:text-sm mt-3">
                                                Speak naturally. You don't need to phrase it like a prompt.
                                            </p>
                                        </>
                                    ) : isAnalyzing ? (
                                        <>
                                            <p className="text-[10px] uppercase tracking-[0.35em] font-black text-indigo-300 mb-3">
                                                Reasoning
                                            </p>

                                            <h2 className="text-white text-3xl md:text-5xl font-black">
                                                Let me look at that.
                                            </h2>

                                            <p className="text-slate-500 text-xs md:text-sm mt-3">
                                                {
                                                    stateSubtext
                                                }
                                            </p>
                                        </>
                                    ) : isSpeaking ? (
                                        <>
                                            <p className="text-[10px] uppercase tracking-[0.35em] font-black text-purple-300 mb-3">
                                                Metria speaking
                                            </p>

                                            <h2 className="text-white text-3xl md:text-5xl font-black">
                                                Here's what I'm seeing.
                                            </h2>

                                            <p className="text-slate-500 text-xs md:text-sm mt-3">
                                                Tap Metria if you want to interrupt and ask something else.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-[10px] uppercase tracking-[0.35em] font-black text-emerald-400 mb-3">
                                                Metria active
                                            </p>

                                            <h2 className="text-white text-3xl md:text-5xl font-black">
                                                Tap to talk.
                                            </h2>

                                            <p className="text-slate-500 text-xs md:text-sm mt-3">
                                                Ask why. Challenge a finding. Trace a number. Ask what happens next.
                                            </p>
                                        </>
                                    )}

                                </div>

                                {/* ========================================= */}
                                {/* VOICE WAVE                                */}
                                {/* ========================================= */}

                                {(isSpeaking ||
                                    isListening ||
                                    isAnalyzing) && (

                                    <div className="w-full max-w-2xl mt-8 px-8">

                                        <div className="flex items-end justify-center gap-[4px] h-8">

                                            {Array.from({
                                                length:
                                                    38
                                            }).map(
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
                                                                    18 +
                                                                    ((index *
                                                                        19) %
                                                                        82)
                                                                }%`,

                                                            opacity:
                                                                0.25 +
                                                                (index %
                                                                    6) /
                                                                    10,

                                                            animation:
                                                                `metriaWave ${
                                                                    0.55 +
                                                                    (index %
                                                                        6) *
                                                                        0.07
                                                                }s ease-in-out infinite alternate`,

                                                            animationDelay:
                                                                `${(index %
                                                                    10) *
                                                                0.04}s`
                                                        }}
                                                    />
                                                )
                                            )}

                                        </div>

                                    </div>
                                )}

                                {/* ========================================= */}
                                {/* LAST ANSWER                                */}
                                {/* ========================================= */}

                                {isActivated &&
                                    latestMetriaMessage &&
                                    !isPlayingIntro &&
                                    !isListening &&
                                    !isAnalyzing && (

                                        <div className="w-full max-w-3xl mt-8 px-5">

                                            <div
                                                className={`p-5 md:p-6 rounded-2xl text-center border backdrop-blur-xl ${
                                                    isSpeaking
                                                        ? "border-purple-400/20 bg-purple-500/[0.05]"
                                                        : "border-white/[0.07] bg-white/[0.025]"
                                                }`}
                                            >

                                                <p className="text-sm md:text-base text-slate-300 leading-relaxed line-clamp-3">
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
                                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-400/20 text-[9px] uppercase tracking-[0.17em] font-black text-purple-300 hover:bg-purple-500/20 transition-all"
                                                >

                                                    Open full conversation

                                                    <FiChevronRight
                                                        size={
                                                            12
                                                        }
                                                    />

                                                </button>

                                            </div>

                                        </div>
                                    )}

                                {/* ========================================= */}
                                {/* VOICE-ONLY SUGGESTIONS                     */}
                                {/* ========================================= */}

                                {isActivated &&
                                    !isPlayingIntro &&
                                    !isListening &&
                                    !isAnalyzing &&
                                    !isSpeaking && (

                                        <div className="mt-8">

                                            <p className="text-center text-[8px] uppercase tracking-[0.24em] font-black text-slate-700 mb-3">
                                                Try asking
                                            </p>

                                            <div className="flex flex-wrap justify-center gap-3 px-4">

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
                                                            className="px-5 py-3 rounded-full bg-white/[0.035] border border-white/[0.09] text-[10px] text-slate-400 hover:text-white hover:bg-purple-500/10 hover:border-purple-400/30 transition-all"
                                                        >
                                                            {
                                                                promptText
                                                            }
                                                        </button>
                                                    )
                                                )}

                                            </div>

                                        </div>
                                    )}

                            </div>
                        )}

                        {/* ================================================= */}
                        {/* CHAT MODE                                         */}
                        {/* ================================================= */}

                        {interfaceMode ===
                            "chat" && (

                            <div className="flex-1 flex flex-col pt-7">

                                <div className="flex items-center justify-between gap-4 mb-5">

                                    <div>

                                        <p className="text-[9px] uppercase tracking-[0.22em] text-purple-400 font-black">
                                            Conversation
                                        </p>

                                        <h2 className="text-white text-xl md:text-2xl font-black mt-1">
                                            Ask Metria
                                        </h2>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setInterfaceMode(
                                                "voice"
                                            )
                                        }
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-400/25 text-purple-300 text-[9px] uppercase tracking-[0.15em] font-black hover:bg-purple-500/20 transition-all"
                                    >

                                        <FiRadio
                                            size={
                                                12
                                            }
                                        />

                                        Return to Talk

                                    </button>

                                </div>

                                <div
                                    className={`relative flex-1 overflow-y-auto pr-2 py-4 space-y-5 scrollbar-thin scrollbar-thumb-purple-500/20 ${
                                        isExpanded
                                            ? "min-h-0 max-h-[calc(100vh-270px)]"
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
                                                        className={`max-w-[92%] md:max-w-[82%] p-5 md:p-6 rounded-2xl ${
                                                            isUser
                                                                ? "bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white rounded-br-md"
                                                                : "bg-white/[0.035] border border-white/[0.09] text-slate-100 rounded-bl-md"
                                                        }`}
                                                    >

                                                        <span
                                                            className={`block text-[9px] uppercase font-black tracking-[0.18em] mb-2 ${
                                                                isUser
                                                                    ? "text-purple-100/70"
                                                                    : "text-purple-400"
                                                            }`}
                                                        >
                                                            {isUser
                                                                ? "You"
                                                                : "Metria • Analyst"
                                                            }
                                                        </span>

                                                        {formatMessageText(
                                                            msg.text,
                                                            msg.sender
                                                        )}

                                                    </div>

                                                </div>
                                            );
                                        }
                                    )}

                                    {isAnalyzing && (
                                        <div className="flex justify-start">

                                            <div className="flex items-center gap-3 bg-white/[0.025] border border-white/[0.08] px-5 py-4 rounded-2xl">

                                                <FiCpu
                                                    className="text-indigo-400 animate-spin"
                                                    size={
                                                        14
                                                    }
                                                />

                                                <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">
                                                    Working through the evidence
                                                </span>

                                            </div>

                                        </div>
                                    )}

                                    <div
                                        ref={
                                            conversationEndRef
                                        }
                                    />

                                </div>

                                {/* CHAT INPUT */}

                                <div className="pt-4 border-t border-white/[0.07]">

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

                                    <form
                                        onSubmit={(
                                            e
                                        ) => {
                                            e.preventDefault();

                                            handleSend();
                                        }}
                                    >

                                        <div className="relative flex items-center rounded-2xl border border-white/10 bg-black/50 focus-within:border-purple-400/50 transition-all">

                                            <FiActivity
                                                size={
                                                    14
                                                }
                                                className="ml-5 text-purple-500"
                                            />

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
                                                    isMultiDataset
                                                        ? `Ask about these ${datasetsInContext.length} sources...`
                                                        : `Ask about ${primaryDataset?.name || "your data"}...`
                                                }
                                                className="flex-1 min-w-0 bg-transparent px-4 py-5 text-sm text-white focus:outline-none placeholder:text-slate-600"
                                            />

                                            <button
                                                type="button"
                                                onClick={
                                                    toggleVoiceListener
                                                }
                                                disabled={
                                                    isAnalyzing
                                                }
                                                className={`m-2 p-3 rounded-xl ${
                                                    isListening
                                                        ? "bg-cyan-400 text-black"
                                                        : "bg-white/[0.04] text-slate-400 hover:text-white"
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
                                                className={`m-2 ml-0 h-12 px-5 rounded-xl ${
                                                    !isAnalyzing &&
                                                    inputQuery.trim()
                                                        ? "bg-white text-black"
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
            {/* ANIMATIONS                                           */}
            {/* ==================================================== */}

            <style>
                {`
                    @keyframes metriaWave {
                        0% {
                            transform: scaleY(0.22);
                            opacity: 0.3;
                        }

                        100% {
                            transform: scaleY(1);
                            opacity: 1;
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

                    @keyframes metriaSpeechRing {
                        0% {
                            transform: scale(0.72);
                            opacity: 0.55;
                        }

                        100% {
                            transform: scale(1.5);
                            opacity: 0;
                        }
                    }

                    @keyframes metriaParticle {
                        0%,
                        100% {
                            transform: translateY(0px) scale(0.75);
                            opacity: 0.18;
                        }

                        50% {
                            transform: translateY(-16px) scale(1.3);
                            opacity: 0.8;
                        }
                    }

                    @keyframes metriaRobotIdle {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-7px) rotate(0.4deg); }
                    }

                    @keyframes metriaRobotListen {
                        0%, 100% { transform: translateY(-2px) scale(1); }
                        50% { transform: translateY(-8px) scale(1.018); }
                    }

                    @keyframes metriaRobotSpeak {
                        0%, 100% { transform: translateY(-3px) rotate(-0.5deg); }
                        50% { transform: translateY(-8px) rotate(0.5deg); }
                    }

                    @keyframes metriaRobotThink {
                        0%, 100% { transform: translateY(-2px) rotate(-0.8deg); }
                        50% { transform: translateY(-6px) rotate(0.8deg); }
                    }

                    @keyframes metriaFaceSweep {
                        0%, 20% { transform: translateX(-50%) rotate(18deg); opacity: 0; }
                        45% { opacity: 1; }
                        70%, 100% { transform: translateX(320%) rotate(18deg); opacity: 0; }
                    }

                    @keyframes metriaEyeListen {
                        from { transform: scaleY(0.82); opacity: 0.72; }
                        to { transform: scaleY(1.15); opacity: 1; }
                    }

                    @keyframes metriaEyeSpeak {
                        from { transform: scaleY(0.75); filter: brightness(0.9); }
                        to { transform: scaleY(1.2); filter: brightness(1.35); }
                    }

                    @keyframes metriaEyeThink {
                        0%, 100% { transform: translateY(0); opacity: 0.7; }
                        50% { transform: translateY(-3px); opacity: 1; }
                    }

                    @keyframes metriaCoreSweep {
                        0% {
                            transform: translateX(-120%) rotate(25deg);
                        }

                        100% {
                            transform: translateX(120%) rotate(25deg);
                        }
                    }
                `}
            </style>

        </div>
    );
};