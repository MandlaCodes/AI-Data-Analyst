/**
 * components/AIAnalysisPanel.js
 * METRIA INTELLIGENCE
 */

import React, {
    useState,
    useEffect,
    useMemo,
    useRef
} from "react";

import axios from "axios";

import {
    motion,
    AnimatePresence
} from "framer-motion";

import {
    FaRedo,
    FaSearch,
    FaRobot,
    FaCreditCard,
    FaVolumeUp,
    FaCopy
} from "react-icons/fa";

import {
    FiShield,
    FiZap,
    FiCpu,
    FiX,
    FiTarget,
    FiCheckCircle,
    FiFileText
} from "react-icons/fi";


const API_BASE_URL =
    "https://ai-data-analyst-backend-1nuw.onrender.com";

const PADDLE_PRICE_ID =
    "pri_01kz4eavw3bf6rddns5qn88w5y";


/* =========================================================
   AUDIO WAVEFORM
========================================================= */

const AudioWaveform = ({ color = "#6D3DF5" }) => (
    <div className="flex items-center gap-1 h-4">
        {[...Array(4)].map((_, i) => (
            <motion.div
                key={i}
                animate={{
                    height: [4, 16, 8, 14, 4]
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                }}
                className="w-1 rounded-full"
                style={{
                    backgroundColor: color
                }}
            />
        ))}
    </div>
);


/* =========================================================
   INSIGHT CARD
========================================================= */

const InsightCard = ({
    title,
    content,
    icon: Icon,
    type = "purple",
    onClick
}) => {

    const styles = {
        purple: {
            iconBg: "bg-[#F1ECFF]",
            iconBorder: "border-[#E2D8FF]",
            iconText: "text-[#6D3DF5]",
            dot: "bg-[#6D3DF5]"
        },

        blue: {
            iconBg: "bg-[#EEF1FF]",
            iconBorder: "border-[#DCE2FF]",
            iconText: "text-[#5865E8]",
            dot: "bg-[#5865E8]"
        },

        green: {
            iconBg: "bg-[#EAF8F2]",
            iconBorder: "border-[#D3EFE3]",
            iconText: "text-[#15966B]",
            dot: "bg-[#15966B]"
        }
    };

    const theme = styles[type] || styles.purple;

    return (
        <button
            type="button"
            onClick={onClick}
            className="
                group
                w-full
                min-h-[250px]
                text-left
                bg-white
                border border-[#E7E7E2]
                rounded-[20px]
                p-6
                flex flex-col
                transition-all duration-200
                hover:-translate-y-[2px]
                hover:border-[#DAD4F7]
                hover:shadow-[0_14px_34px_rgba(31,24,68,0.08)]
            "
        >
            <div className="flex items-start justify-between gap-4 mb-6">

                <div
                    className={`
                        w-10 h-10
                        rounded-[12px]
                        border
                        flex items-center justify-center
                        ${theme.iconBg}
                        ${theme.iconBorder}
                        ${theme.iconText}
                    `}
                >
                    <Icon size={18} />
                </div>

                <div
                    className="
                        inline-flex
                        items-center
                        gap-1.5
                        px-2.5
                        py-1.5
                        rounded-full
                        bg-[#F7F7F5]
                        border border-[#ECECE7]
                    "
                >
                    <span
                        className={`
                            w-1.5 h-1.5
                            rounded-full
                            ${theme.dot}
                        `}
                    />

                    <span
                        className="
                            text-[9px]
                            font-semibold
                            text-[#777771]
                        "
                    >
                        Live insight
                    </span>
                </div>

            </div>


            <h4
                className="
                    text-[17px]
                    font-semibold
                    tracking-[-0.025em]
                    text-[#171717]
                    mb-2.5
                "
            >
                {title}
            </h4>


            <p
                className="
                    text-[13px]
                    leading-6
                    text-[#62625D]
                    line-clamp-4
                    mb-6
                "
            >
                {content || "Analyzing dataset metrics..."}
            </p>


            <div
                className="
                    mt-auto
                    pt-4
                    border-t border-[#EFEFEA]
                    flex items-center
                    justify-between
                    gap-3
                "
            >
                <div
                    className="
                        flex items-center
                        gap-2
                        text-[10px]
                        font-semibold
                        text-[#777771]
                    "
                >
                    <FiCheckCircle
                        className={theme.iconText}
                    />

                    Verified insight
                </div>

                <span
                    className="
                        text-[10px]
                        font-semibold
                        text-[#6D3DF5]
                        group-hover:translate-x-0.5
                        transition-transform
                    "
                >
                    View brief →
                </span>
            </div>

        </button>
    );
};


/* =========================================================
   TYPEWRITER
========================================================= */

const TypewriterText = ({
    text,
    delay = 5
}) => {

    const [displayedText, setDisplayedText] =
        useState("");

    useEffect(() => {

        setDisplayedText("");

        if (!text) return;

        let currentIndex = 0;

        const timer = setInterval(() => {

            if (currentIndex < text.length) {

                setDisplayedText(
                    text.substring(
                        0,
                        currentIndex + 1
                    )
                );

                currentIndex++;

            } else {

                clearInterval(timer);

            }

        }, delay);


        return () =>
            clearInterval(timer);

    }, [text, delay]);


    return (
        <span>
            {displayedText}
        </span>
    );
};


/* =========================================================
   REPORT SECTION
========================================================= */

const ReportSection = ({
    label,
    content,
    tone = "purple"
}) => {

    const labelColor = {
        purple: "text-[#6D3DF5]",
        green: "text-[#15966B]",
        blue: "text-[#5865E8]"
    };

    return (
        <section
            className="
                bg-white
                border border-[#E7E7E2]
                rounded-[18px]
                p-6
            "
        >
            <span
                className={`
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.14em]
                    ${labelColor[tone]}
                `}
            >
                {label}
            </span>

            <p
                className="
                    mt-3
                    text-[14px]
                    leading-6
                    text-[#5E5E59]
                "
            >
                {content ||
                    "No additional insight available."}
            </p>
        </section>
    );
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

const AIAnalysisPanel = ({

    datasets = [],

    onUpdateAI,

    analysisMode = "single",

    activeDatasetIndex = 0,

    crossAnalysis = null,

    onRunCrossAnalysis

}) => {


    /* =====================================================
       STATE
    ===================================================== */

    const [loading, setLoading] =
        useState(false);

    const [
        analysisPhase,
        setAnalysisPhase
    ] = useState(0);

    const [
        expandedCard,
        setExpandedCard
    ] = useState(null);

    const [
        isFullReportOpen,
        setIsFullReportOpen
    ] = useState(false);

    const [
        isSpeaking,
        setIsSpeaking
    ] = useState(false);

    const [
        copied,
        setCopied
    ] = useState(false);


    const panelRef = useRef(null);


    /* =====================================================
       USER
    ===================================================== */

    const userToken =
        localStorage.getItem("adt_token");


    const userProfile = useMemo(() => {

        try {

            const stored =
                localStorage.getItem(
                    "adt_profile"
                );

            return stored
                ? JSON.parse(stored)
                : {};

        } catch (e) {

            return {};

        }

    }, []);


    /* =====================================================
       ANALYSIS MODE
    ===================================================== */

    const isCrossAnalysis =
        analysisMode === "cross" ||
        datasets.length > 1;


    const activeDataset =
        datasets[activeDatasetIndex] ||
        datasets[0] ||
        null;


    const aiInsights =
        isCrossAnalysis
            ? (
                crossAnalysis ||
                activeDataset?.aiStorage ||
                null
            )
            : activeDataset?.aiStorage;


    /* =====================================================
       ANALYSIS PHASES
    ===================================================== */

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


    /* =====================================================
       SPEECH INIT
    ===================================================== */

    useEffect(() => {

        window.speechSynthesis.getVoices();

    }, []);


    /* =====================================================
       LOADING PHASE ROTATION
    ===================================================== */

    useEffect(() => {

        let interval;


        if (loading) {

            interval = setInterval(() => {

                setAnalysisPhase(prev =>

                    prev < phases.length - 1
                        ? prev + 1
                        : prev

                );

            }, 2000);

        } else {

            setAnalysisPhase(0);

        }


        return () =>
            clearInterval(interval);

    }, [
        loading,
        phases.length
    ]);


    /* =====================================================
       COPY
    ===================================================== */

    const handleCopy = async (text) => {

        try {

            await navigator.clipboard.writeText(
                text || ""
            );

            setCopied(true);

            setTimeout(
                () => setCopied(false),
                2000
            );

        } catch (err) {

            console.error(
                "Failed to copy",
                err
            );

        }

    };


    /* =====================================================
       SPEECH
    ===================================================== */

    const toggleSpeech = (
        textOverride
    ) => {

        if (isSpeaking) {

            window.speechSynthesis.cancel();

            setIsSpeaking(false);

            return;

        }


        let contentToRead =
            textOverride;


        if (
            isFullReportOpen &&
            aiInsights
        ) {

            if (isCrossAnalysis) {

                contentToRead = `
                    Cross-dataset strategy update.

                    Summary:
                    ${aiInsights.summary || ""}.

                    Dataset relationship:
                    ${
                        aiInsights.relationship ||
                        aiInsights.relationship_summary ||
                        aiInsights.dataset_relationship ||
                        ""
                    }.

                    Key driver:
                    ${
                        aiInsights.root_cause ||
                        aiInsights.cross_driver ||
                        ""
                    }.

                    Risks:
                    ${aiInsights.risk || ""}.

                    Opportunities:
                    ${aiInsights.opportunity || ""}.

                    Action items:
                    ${aiInsights.action || ""}.

                    Business impact:
                    ${aiInsights.roi_impact || ""}.
                `;

            } else {

                contentToRead = `
                    Executive strategy update.

                    Summary:
                    ${aiInsights.summary || ""}.

                    Primary bottleneck:
                    ${aiInsights.root_cause || ""}.

                    Identified risks:
                    ${aiInsights.risk || ""}.

                    Opportunity:
                    ${aiInsights.opportunity || ""}.

                    Action items:
                    ${aiInsights.action || ""}.
                `;

            }

        }


        if (!contentToRead) return;


        const utterance =
            new SpeechSynthesisUtterance(
                contentToRead
            );


        const voices =
            window.speechSynthesis.getVoices();


        const britishVoice =
            voices.find(
                v =>
                    v.lang.includes("en-GB") &&
                    (
                        v.name.includes("Female") ||
                        v.name.includes("UK") ||
                        v.name.includes("Google")
                    )
            );


        utterance.voice =
            britishVoice ||
            voices.find(
                v =>
                    v.lang.includes("en-GB")
            ) ||
            voices[0];


        utterance.rate = 0.85;

        utterance.pitch = 1.1;


        utterance.onstart =
            () => setIsSpeaking(true);

        utterance.onend =
            () => setIsSpeaking(false);

        utterance.onerror =
            () => setIsSpeaking(false);


        window.speechSynthesis.speak(
            utterance
        );

    };


    /* =====================================================
       EXECUTE ANALYSIS
    ===================================================== */

    const executeAnalysisCall =
        async () => {

            setLoading(true);


            try {

                /* =========================================
                   CROSS ANALYSIS
                ========================================= */

                if (isCrossAnalysis) {

                    if (
                        typeof onRunCrossAnalysis ===
                        "function"
                    ) {

                        await onRunCrossAnalysis(
                            datasets
                        );

                    } else {

                        console.warn(
                            "Cross analysis requested but onRunCrossAnalysis was not provided."
                        );

                    }


                    return;

                }


                /* =========================================
                   NORMAL ANALYSIS
                ========================================= */

                const dataset =
                    activeDataset;


                if (!dataset) {

                    console.warn(
                        "AI Analysis aborted: No active dataset."
                    );

                    return;

                }


                const rawRows =
                    dataset.rows ||
                    dataset.data ||
                    dataset.raw ||
                    dataset.records ||
                    [];


                const payloadContext =
                    rawRows.length > 0
                        ? rawRows
                        : dataset;


                const response =
                    await axios.post(

                        `${API_BASE_URL}/ai/analyze`,

                        {
                            context:
                                payloadContext
                        },

                        {
                            headers: {

                                Authorization:
                                    `Bearer ${userToken}`,

                                "Content-Type":
                                    "application/json"

                            }
                        }

                    );


                if (
                    response.data &&
                    typeof onUpdateAI ===
                        "function"
                ) {

                    onUpdateAI(
                        dataset.id,
                        response.data
                    );

                }

            } catch (error) {

                console.error(
                    "AI Analysis failed:",
                    error.response?.data ||
                    error.message
                );

            } finally {

                setLoading(false);

            }

        };


    /* =====================================================
       RUN ANALYSIS / SUBSCRIPTION
    ===================================================== */

    const runAnalysis =
        async () => {

            if (
                datasets.length === 0 ||
                !userToken
            ) {

                console.warn(
                    "Analysis aborted: No datasets or missing token."
                );

                return;

            }


            const isSubscribed =
                userProfile?.isPro ||
                userProfile?.is_pro ||
                userProfile?.isSubscribed;


            if (!isSubscribed) {

                const userId =
                    userProfile?.user_id ||
                    userProfile?.id ||
                    userProfile?.userId;


                if (!userId) {

                    alert(
                        "User session missing ID. Please log in again."
                    );

                    return;

                }


                if (window.Paddle) {

                    const checkoutOptions = {

                        items: [
                            {
                                priceId:
                                    PADDLE_PRICE_ID,

                                quantity: 1
                            }
                        ],

                        customData: {
                            user_id:
                                String(userId)
                        }

                    };


                    if (
                        userProfile?.email
                    ) {

                        checkoutOptions.customer =
                            {
                                email:
                                    userProfile.email
                            };

                    }


                    window.Paddle.Checkout.open(
                        checkoutOptions
                    );

                } else {

                    alert(
                        "Payment gateway is initializing, please try again in a moment."
                    );

                }


                return;

            }


            await executeAnalysisCall();

        };


    /* =====================================================
       PADDLE COMPLETION
    ===================================================== */

    useEffect(() => {

        if (window.Paddle) {

            window.Paddle.Update({

                eventCallback:
                    event => {

                        if (
                            event.name ===
                            "checkout.completed"
                        ) {

                            console.log(
                                "[Paddle] Payment completed successfully!"
                            );


                            if (
                                window.Paddle.Checkout
                            ) {

                                window.Paddle.Checkout.close();

                            }


                            const currentProfile =
                                JSON.parse(
                                    localStorage.getItem(
                                        "adt_profile"
                                    ) || "{}"
                                );


                            currentProfile.isPro =
                                true;

                            currentProfile.is_pro =
                                true;


                            localStorage.setItem(
                                "adt_profile",
                                JSON.stringify(
                                    currentProfile
                                )
                            );


                            setTimeout(() => {

                                executeAnalysisCall();

                            }, 500);

                        }

                    }

            });

        }

    }, [
        datasets,
        userToken
    ]);


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeModal = () => {

        setExpandedCard(null);

        setIsFullReportOpen(false);

        window.speechSynthesis.cancel();

        setIsSpeaking(false);

    };


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div
            ref={panelRef}
            className="
                relative
                w-full
                bg-[#F5F5F3]
                px-4
                sm:px-6
                lg:px-8
                py-6
                md:py-8
                transition-all
                duration-500
            "
        >

            <div
                className="
                    w-full
                    max-w-[1480px]
                    mx-auto
                "
            >

                {/* =================================================
                    INTELLIGENCE HEADER
                ================================================= */}

                <div
                    className="
                        flex
                        flex-col
                        lg:flex-row
                        lg:items-center
                        justify-between
                        gap-5
                        mb-6
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            gap-3.5
                            min-w-0
                        "
                    >

                        <div
                            className="
                                w-11 h-11
                                shrink-0
                                rounded-[13px]
                                bg-[#EEE9FF]
                                border border-[#DDD3FF]
                                flex
                                items-center
                                justify-center
                            "
                        >
                            <FiCpu
                                className="
                                    text-[#6D3DF5]
                                    w-5 h-5
                                "
                            />
                        </div>


                        <div className="min-w-0">

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    flex-wrap
                                "
                            >

                                <h2
                                    className="
                                        text-[18px]
                                        md:text-[20px]
                                        font-semibold
                                        tracking-[-0.03em]
                                        text-[#171717]
                                    "
                                >
                                    {userProfile?.organization ||
                                        "Metria"}{" "}
                                    Intelligence
                                </h2>


                                <span
                                    className="
                                        px-2
                                        py-1
                                        rounded-md
                                        bg-white
                                        border border-[#E7E7E2]
                                        text-[9px]
                                        font-semibold
                                        text-[#777771]
                                    "
                                >
                                    {isCrossAnalysis
                                        ? "Cross-data"
                                        : "Live analysis"}
                                </span>

                            </div>


                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    mt-1.5
                                    text-[11px]
                                    text-[#777771]
                                "
                            >

                                <span
                                    className={`
                                        w-1.5 h-1.5
                                        rounded-full
                                        ${
                                            loading
                                                ? "bg-[#6D3DF5] animate-pulse"
                                                : "bg-emerald-500"
                                        }
                                    `}
                                />


                                <span>
                                    {loading
                                        ? (
                                            isCrossAnalysis
                                                ? "Cross-analyzing business signals"
                                                : "Synthesizing data"
                                        )
                                        : "Decision engine active"}
                                </span>

                            </div>

                        </div>

                    </div>


                    {aiInsights &&
                        !loading && (

                        <div
                            className="
                                flex
                                items-center
                                gap-2
                            "
                        >

                            <button
                                type="button"
                                onClick={
                                    runAnalysis
                                }
                                className="
                                    h-10
                                    px-4
                                    rounded-[11px]
                                    bg-white
                                    border border-[#E3E3DE]
                                    text-[#4F4F4A]
                                    text-[11px]
                                    font-semibold
                                    flex
                                    items-center
                                    gap-2
                                    hover:bg-[#FAFAF8]
                                    transition-colors
                                "
                            >
                                <FaRedo
                                    size={10}
                                />

                                Refresh
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    setIsFullReportOpen(
                                        true
                                    )
                                }
                                className="
                                    h-10
                                    px-4
                                    rounded-[11px]
                                    bg-[#6D3DF5]
                                    text-white
                                    text-[11px]
                                    font-semibold
                                    flex
                                    items-center
                                    gap-2
                                    shadow-[0_5px_14px_rgba(109,61,245,0.18)]
                                    hover:bg-[#6032E7]
                                    transition-colors
                                "
                            >
                                <FiFileText
                                    size={13}
                                />

                                View full brief
                            </button>

                        </div>

                    )}

                </div>


                {/* =================================================
                    CONTENT
                ================================================= */}

                <AnimatePresence mode="wait">

                    {loading ? (

                        /* =========================================
                           LOADING
                        ========================================= */

                        <motion.div
                            key="loading"
                            initial={{
                                opacity: 0
                            }}
                            animate={{
                                opacity: 1
                            }}
                            exit={{
                                opacity: 0
                            }}
                            className="
                                bg-white
                                border border-[#E7E7E2]
                                rounded-[22px]
                                min-h-[360px]
                                flex
                                flex-col
                                items-center
                                justify-center
                                px-6
                                text-center
                                shadow-[0_8px_30px_rgba(20,20,20,0.035)]
                            "
                        >

                            <motion.div
                                animate={{
                                    rotate: 360
                                }}
                                transition={{
                                    duration: 4,
                                    repeat:
                                        Infinity,
                                    ease: "linear"
                                }}
                                className="
                                    w-14 h-14
                                    rounded-[16px]
                                    bg-[#EEE9FF]
                                    border border-[#DDD3FF]
                                    flex
                                    items-center
                                    justify-center
                                    mb-6
                                "
                            >
                                <FiCpu
                                    className="
                                        text-[#6D3DF5]
                                        w-6 h-6
                                    "
                                />
                            </motion.div>


                            <p
                                className="
                                    text-[10px]
                                    font-bold
                                    uppercase
                                    tracking-[0.14em]
                                    text-[#6D3DF5]
                                    mb-2
                                "
                            >
                                Metria intelligence
                            </p>


                            <h3
                                className="
                                    text-[22px]
                                    md:text-[24px]
                                    font-semibold
                                    tracking-[-0.035em]
                                    text-[#171717]
                                "
                            >
                                Analyzing your data
                            </h3>


                            <p
                                className="
                                    mt-2
                                    max-w-lg
                                    text-[13px]
                                    leading-6
                                    text-[#777771]
                                "
                            >
                                {
                                    phases[
                                        analysisPhase
                                    ]
                                }
                            </p>


                            <div
                                className="
                                    flex
                                    items-center
                                    gap-1.5
                                    mt-7
                                "
                            >
                                {phases.map(
                                    (
                                        _,
                                        index
                                    ) => (

                                        <span
                                            key={
                                                index
                                            }
                                            className={`
                                                h-1.5
                                                rounded-full
                                                transition-all
                                                duration-300

                                                ${
                                                    index <=
                                                    analysisPhase
                                                        ? "w-6 bg-[#6D3DF5]"
                                                        : "w-1.5 bg-[#DEDED9]"
                                                }
                                            `}
                                        />

                                    )
                                )}
                            </div>

                        </motion.div>

                    ) : aiInsights ? (

                        /* =========================================
                           RESULTS
                        ========================================= */

                        <motion.div
                            key="results"
                            initial={{
                                opacity: 0,
                                y: 12
                            }}
                            animate={{
                                opacity: 1,
                                y: 0
                            }}
                            className="
                                space-y-4
                            "
                        >

                            {/* =====================================
                                EXECUTIVE SUMMARY
                            ===================================== */}

                            <section
                                className="
                                    bg-white
                                    border border-[#E7E7E2]
                                    rounded-[22px]
                                    p-6
                                    md:p-8
                                    shadow-[0_8px_30px_rgba(20,20,20,0.035)]
                                "
                            >

                                <div
                                    className="
                                        flex
                                        flex-col
                                        sm:flex-row
                                        sm:items-center
                                        justify-between
                                        gap-4
                                        mb-6
                                    "
                                >

                                    <div
                                        className="
                                            flex
                                            items-center
                                            gap-3
                                        "
                                    >

                                        <div
                                            className="
                                                w-9 h-9
                                                rounded-[11px]
                                                bg-[#EEE9FF]
                                                border border-[#DDD3FF]
                                                flex
                                                items-center
                                                justify-center
                                            "
                                        >
                                            <FiFileText
                                                size={
                                                    15
                                                }
                                                className="
                                                    text-[#6D3DF5]
                                                "
                                            />
                                        </div>


                                        <div>

                                            <p
                                                className="
                                                    text-[9px]
                                                    font-bold
                                                    uppercase
                                                    tracking-[0.14em]
                                                    text-[#6D3DF5]
                                                "
                                            >
                                                {isCrossAnalysis
                                                    ? "Cross-data executive brief"
                                                    : "Executive summary"}
                                            </p>


                                            <p
                                                className="
                                                    mt-0.5
                                                    text-[11px]
                                                    text-[#8B8B86]
                                                "
                                            >
                                                Metria's
                                                highest-level
                                                interpretation
                                                of your data
                                            </p>

                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleCopy(
                                                aiInsights.summary
                                            )
                                        }
                                        className="
                                            h-9
                                            px-3
                                            rounded-[10px]
                                            bg-[#F7F7F5]
                                            border border-[#E7E7E2]
                                            text-[#62625D]
                                            text-[10px]
                                            font-semibold
                                            flex
                                            items-center
                                            justify-center
                                            gap-2
                                            hover:bg-[#F0F0ED]
                                            transition-colors
                                        "
                                    >
                                        <FaCopy
                                            size={11}
                                        />

                                        {copied
                                            ? "Copied"
                                            : "Copy brief"}
                                    </button>

                                </div>


                                <div
                                    className="
                                        max-w-[1100px]
                                        text-[20px]
                                        md:text-[24px]
                                        leading-[1.5]
                                        font-medium
                                        tracking-[-0.035em]
                                        text-[#1D1D1B]
                                    "
                                >
                                    <TypewriterText
                                        text={
                                            aiInsights.summary
                                        }
                                    />
                                </div>

                            </section>


                            {/* =====================================
                                PRIMARY FINDING + ROI
                            ===================================== */}

                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    lg:grid-cols-2
                                    gap-4
                                "
                            >

                                {/* PRIMARY FINDING */}

                                <section
                                    className="
                                        bg-white
                                        border border-[#E7E7E2]
                                        rounded-[20px]
                                        p-6
                                        md:p-7
                                        shadow-[0_6px_24px_rgba(20,20,20,0.03)]
                                    "
                                >

                                    <div
                                        className="
                                            w-10 h-10
                                            rounded-[12px]
                                            bg-[#EEF1FF]
                                            border border-[#DCE2FF]
                                            text-[#5865E8]
                                            flex
                                            items-center
                                            justify-center
                                            mb-5
                                        "
                                    >
                                        <FaSearch
                                            size={16}
                                        />
                                    </div>


                                    <p
                                        className="
                                            text-[9px]
                                            font-bold
                                            uppercase
                                            tracking-[0.14em]
                                            text-[#777771]
                                            mb-2
                                        "
                                    >
                                        {isCrossAnalysis
                                            ? "Key dataset relationship"
                                            : "Primary bottleneck"}
                                    </p>


                                    <h4
                                        className="
                                            text-[18px]
                                            font-semibold
                                            tracking-[-0.025em]
                                            text-[#171717]
                                            mb-2
                                        "
                                    >
                                        Core finding
                                    </h4>


                                    <p
                                        className="
                                            text-[14px]
                                            leading-6
                                            text-[#5E5E59]
                                        "
                                    >
                                        {isCrossAnalysis
                                            ? (
                                                aiInsights.relationship ||
                                                aiInsights.relationship_summary ||
                                                aiInsights.dataset_relationship ||
                                                aiInsights.root_cause ||
                                                "Evaluating relationship between datasets..."
                                            )
                                            : aiInsights.root_cause}
                                    </p>

                                </section>


                                {/* ROI */}

                                <section
                                    className="
                                        bg-white
                                        border border-[#E7E7E2]
                                        rounded-[20px]
                                        p-6
                                        md:p-7
                                        shadow-[0_6px_24px_rgba(20,20,20,0.03)]
                                    "
                                >

                                    <div
                                        className="
                                            w-10 h-10
                                            rounded-[12px]
                                            bg-[#EAF8F2]
                                            border border-[#D3EFE3]
                                            text-[#15966B]
                                            flex
                                            items-center
                                            justify-center
                                            mb-5
                                        "
                                    >
                                        <FaCreditCard
                                            size={16}
                                        />
                                    </div>


                                    <p
                                        className="
                                            text-[9px]
                                            font-bold
                                            uppercase
                                            tracking-[0.14em]
                                            text-[#777771]
                                            mb-2
                                        "
                                    >
                                        {isCrossAnalysis
                                            ? "Combined business impact"
                                            : "Projected financial & ROI impact"}
                                    </p>


                                    <h4
                                        className="
                                            text-[18px]
                                            font-semibold
                                            tracking-[-0.025em]
                                            text-[#171717]
                                            mb-2
                                        "
                                    >
                                        Value opportunity
                                    </h4>


                                    <p
                                        className="
                                            text-[14px]
                                            leading-6
                                            text-[#5E5E59]
                                        "
                                    >
                                        <span
                                            className="
                                                font-semibold
                                                text-[#15966B]
                                            "
                                        >
                                            {aiInsights.roi_impact ||
                                                "Recalculating yield..."}
                                        </span>
                                    </p>

                                </section>

                            </div>


                            {/* =====================================
                                INSIGHT CARDS
                            ===================================== */}

                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    md:grid-cols-3
                                    gap-4
                                "
                            >

                                <InsightCard
                                    title={
                                        isCrossAnalysis
                                            ? "Cross-Dataset Risks"
                                            : "Identified Risks"
                                    }
                                    content={
                                        aiInsights?.risk
                                    }
                                    icon={
                                        FiShield
                                    }
                                    type="purple"
                                    onClick={() =>
                                        setExpandedCard(
                                            {
                                                title:
                                                    isCrossAnalysis
                                                        ? "Cross-Dataset Risks"
                                                        : "Identified Risks",

                                                content:
                                                    aiInsights?.risk,

                                                icon:
                                                    FiShield,

                                                color:
                                                    "text-[#6D3DF5]"
                                            }
                                        )
                                    }
                                />


                                <InsightCard
                                    title={
                                        isCrossAnalysis
                                            ? "Cross-Dataset Opportunities"
                                            : "Strategic Opportunities"
                                    }
                                    content={
                                        aiInsights?.opportunity
                                    }
                                    icon={
                                        FiZap
                                    }
                                    type="blue"
                                    onClick={() =>
                                        setExpandedCard(
                                            {
                                                title:
                                                    isCrossAnalysis
                                                        ? "Cross-Dataset Opportunities"
                                                        : "Strategic Opportunities",

                                                content:
                                                    aiInsights?.opportunity,

                                                icon:
                                                    FiZap,

                                                color:
                                                    "text-[#5865E8]"
                                            }
                                        )
                                    }
                                />


                                <InsightCard
                                    title={
                                        isCrossAnalysis
                                            ? "Priority Cross-Dataset Action"
                                            : "Immediate Priority Action"
                                    }
                                    content={
                                        aiInsights?.action
                                    }
                                    icon={
                                        FiTarget
                                    }
                                    type="green"
                                    onClick={() =>
                                        setExpandedCard(
                                            {
                                                title:
                                                    isCrossAnalysis
                                                        ? "Priority Cross-Dataset Action"
                                                        : "Immediate Priority Action",

                                                content:
                                                    aiInsights?.action,

                                                icon:
                                                    FiTarget,

                                                color:
                                                    "text-[#15966B]"
                                            }
                                        )
                                    }
                                />

                            </div>

                        </motion.div>

                    ) : (

                        /* =========================================
                           EMPTY STATE
                        ========================================= */

                        <motion.div
                            key="empty"
                            initial={{
                                opacity: 0
                            }}
                            animate={{
                                opacity: 1
                            }}
                            className="
                                bg-white
                                border border-[#E7E7E2]
                                rounded-[22px]
                                min-h-[330px]
                                flex
                                flex-col
                                items-center
                                justify-center
                                px-6
                                text-center
                                shadow-[0_8px_30px_rgba(20,20,20,0.035)]
                            "
                        >

                            <div
                                className="
                                    w-14 h-14
                                    rounded-2xl
                                    bg-[#EEE9FF]
                                    border border-[#DDD3FF]
                                    flex
                                    items-center
                                    justify-center
                                    mb-5
                                "
                            >
                                <FaRobot
                                    className="
                                        text-[#6D3DF5]
                                        w-6 h-6
                                    "
                                />
                            </div>


                            <p
                                className="
                                    text-[10px]
                                    font-bold
                                    uppercase
                                    tracking-[0.14em]
                                    text-[#6D3DF5]
                                    mb-2
                                "
                            >
                                Decision intelligence
                            </p>


                            <h3
                                className="
                                    text-[22px]
                                    font-semibold
                                    tracking-[-0.035em]
                                    text-[#171717]
                                "
                            >
                                Turn your data into a
                                strategic brief
                            </h3>


                            <p
                                className="
                                    mt-2
                                    mb-6
                                    max-w-md
                                    text-[13px]
                                    leading-6
                                    text-[#777771]
                                "
                            >
                                Metria will identify
                                the strongest signals,
                                risks, opportunities
                                and next actions in
                                the selected data.
                            </p>


                            <button
                                type="button"
                                onClick={
                                    runAnalysis
                                }
                                className="
                                    h-11
                                    px-5
                                    rounded-[11px]
                                    bg-[#6D3DF5]
                                    text-white
                                    text-[11px]
                                    font-semibold
                                    shadow-[0_5px_14px_rgba(109,61,245,0.18)]
                                    hover:bg-[#6032E7]
                                    transition-colors
                                "
                            >
                                Generate strategic brief
                            </button>

                        </motion.div>

                    )}

                </AnimatePresence>

            </div>


            {/* =================================================
                MODAL
            ================================================= */}

            <AnimatePresence>

                {(expandedCard ||
                    isFullReportOpen) && (

                    <div
                        className="
                            fixed
                            inset-0
                            z-[200]
                            flex
                            items-center
                            justify-center
                            p-4
                            md:p-8
                        "
                    >

                        {/* BACKDROP */}

                        <motion.div
                            initial={{
                                opacity: 0
                            }}
                            animate={{
                                opacity: 1
                            }}
                            exit={{
                                opacity: 0
                            }}
                            onClick={
                                closeModal
                            }
                            className="
                                absolute
                                inset-0
                                bg-[#171717]/35
                                backdrop-blur-sm
                            "
                        />


                        {/* MODAL */}

                        <motion.div
                            initial={{
                                scale: 0.98,
                                opacity: 0,
                                y: 10
                            }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                                y: 0
                            }}
                            exit={{
                                scale: 0.98,
                                opacity: 0,
                                y: 10
                            }}
                            className="
                                relative
                                w-full
                                max-w-5xl
                                max-h-[88vh]
                                bg-[#F7F7F5]
                                border border-white
                                rounded-[24px]
                                flex
                                flex-col
                                overflow-hidden
                                shadow-[0_30px_90px_rgba(20,20,20,0.22)]
                            "
                        >

                            {/* HEADER */}

                            <div
                                className="
                                    p-5
                                    md:p-6
                                    flex
                                    items-center
                                    justify-between
                                    gap-4
                                    border-b
                                    border-[#E7E7E2]
                                    bg-white
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                        min-w-0
                                    "
                                >

                                    <div
                                        className="
                                            w-10 h-10
                                            shrink-0
                                            rounded-[12px]
                                            bg-[#EEE9FF]
                                            border border-[#DDD3FF]
                                            text-[#6D3DF5]
                                            flex
                                            items-center
                                            justify-center
                                        "
                                    >
                                        {isFullReportOpen
                                            ? (
                                                <FiFileText
                                                    size={
                                                        18
                                                    }
                                                />
                                            )
                                            : (
                                                expandedCard && (
                                                    <expandedCard.icon
                                                        size={
                                                            18
                                                        }
                                                    />
                                                )
                                            )}
                                    </div>


                                    <div
                                        className="
                                            min-w-0
                                        "
                                    >

                                        <p
                                            className="
                                                text-[9px]
                                                font-bold
                                                uppercase
                                                tracking-[0.14em]
                                                text-[#6D3DF5]
                                            "
                                        >
                                            Metria intelligence
                                        </p>


                                        <h3
                                            className="
                                                text-[18px]
                                                md:text-[20px]
                                                font-semibold
                                                tracking-[-0.03em]
                                                text-[#171717]
                                                truncate
                                            "
                                        >
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

                                </div>


                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >

                                    <button
                                        type="button"
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
                                        className={`
                                            h-9
                                            px-3
                                            rounded-[10px]
                                            text-[10px]
                                            font-semibold
                                            border
                                            flex
                                            items-center
                                            gap-2
                                            transition-colors

                                            ${
                                                isSpeaking
                                                    ? "bg-[#EEE9FF] text-[#6D3DF5] border-[#DDD3FF]"
                                                    : "bg-white text-[#555550] border-[#E5E5E0] hover:bg-[#F7F7F5]"
                                            }
                                        `}
                                    >

                                        {isSpeaking
                                            ? (
                                                <>
                                                    <AudioWaveform
                                                        color="#6D3DF5"
                                                    />

                                                    Mute
                                                </>
                                            )
                                            : (
                                                <>
                                                    <FaVolumeUp />

                                                    Listen
                                                </>
                                            )}

                                    </button>


                                    <button
                                        type="button"
                                        onClick={
                                            closeModal
                                        }
                                        className="
                                            w-9 h-9
                                            rounded-[10px]
                                            bg-white
                                            border border-[#E5E5E0]
                                            text-[#666660]
                                            flex
                                            items-center
                                            justify-center
                                            hover:bg-[#F3F3F1]
                                            transition-colors
                                        "
                                        aria-label="Close"
                                    >
                                        <FiX
                                            size={17}
                                        />
                                    </button>

                                </div>

                            </div>


                            {/* =====================================
                                MODAL BODY
                            ===================================== */}

                            <div
                                className="
                                    flex-1
                                    overflow-y-auto
                                    p-5
                                    md:p-8
                                "
                            >

                                {isFullReportOpen ? (

                                    <div
                                        className="
                                            space-y-4
                                            max-w-4xl
                                            mx-auto
                                        "
                                    >

                                        {/* SUMMARY */}

                                        <section
                                            className="
                                                bg-white
                                                border border-[#E7E7E2]
                                                rounded-[18px]
                                                p-6
                                            "
                                        >

                                            <div
                                                className="
                                                    flex
                                                    justify-between
                                                    items-center
                                                    gap-4
                                                    mb-3
                                                "
                                            >

                                                <span
                                                    className="
                                                        text-[9px]
                                                        font-bold
                                                        uppercase
                                                        tracking-[0.14em]
                                                        text-[#6D3DF5]
                                                    "
                                                >
                                                    01{" "}
                                                    {isCrossAnalysis
                                                        ? "Combined executive summary"
                                                        : "Executive summary"}
                                                </span>


                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCopy(
                                                            aiInsights?.summary
                                                        )
                                                    }
                                                    className="
                                                        text-[10px]
                                                        font-semibold
                                                        text-[#6D3DF5]
                                                        flex
                                                        items-center
                                                        gap-1.5
                                                    "
                                                >
                                                    <FaCopy />

                                                    Copy
                                                </button>

                                            </div>


                                            <p
                                                className="
                                                    text-[17px]
                                                    md:text-[19px]
                                                    leading-8
                                                    font-medium
                                                    tracking-[-0.02em]
                                                    text-[#242421]
                                                "
                                            >
                                                {
                                                    aiInsights?.summary
                                                }
                                            </p>

                                        </section>


                                        {/* REPORT GRID */}

                                        <div
                                            className="
                                                grid
                                                grid-cols-1
                                                md:grid-cols-2
                                                gap-4
                                            "
                                        >

                                            <ReportSection
                                                label={`02 ${
                                                    isCrossAnalysis
                                                        ? "Key dataset relationship"
                                                        : "Primary bottlenecks"
                                                }`}
                                                content={
                                                    isCrossAnalysis
                                                        ? (
                                                            aiInsights?.relationship ||
                                                            aiInsights?.relationship_summary ||
                                                            aiInsights?.dataset_relationship ||
                                                            aiInsights?.root_cause
                                                        )
                                                        : aiInsights?.root_cause
                                                }
                                                tone="blue"
                                            />


                                            <ReportSection
                                                label={`03 ${
                                                    isCrossAnalysis
                                                        ? "Cross-dataset risks"
                                                        : "Operational & data risks"
                                                }`}
                                                content={
                                                    aiInsights?.risk
                                                }
                                                tone="purple"
                                            />


                                            <ReportSection
                                                label={`04 ${
                                                    isCrossAnalysis
                                                        ? "Combined opportunities"
                                                        : "Growth opportunities"
                                                }`}
                                                content={
                                                    aiInsights?.opportunity
                                                }
                                                tone="green"
                                            />


                                            <ReportSection
                                                label={`05 ${
                                                    isCrossAnalysis
                                                        ? "Recommended cross-dataset action"
                                                        : "Strategic action items"
                                                }`}
                                                content={
                                                    aiInsights?.action
                                                }
                                                tone="purple"
                                            />

                                        </div>

                                    </div>

                                ) : (

                                    expandedCard && (

                                        <div
                                            className="
                                                max-w-3xl
                                                mx-auto
                                                bg-white
                                                border border-[#E7E7E2]
                                                rounded-[20px]
                                                p-7
                                                md:p-10
                                            "
                                        >

                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    gap-3
                                                    mb-6
                                                "
                                            >

                                                <div
                                                    className="
                                                        w-10 h-10
                                                        rounded-[12px]
                                                        bg-[#EEE9FF]
                                                        border border-[#DDD3FF]
                                                        text-[#6D3DF5]
                                                        flex
                                                        items-center
                                                        justify-center
                                                    "
                                                >
                                                    <expandedCard.icon
                                                        size={
                                                            18
                                                        }
                                                    />
                                                </div>


                                                <div>

                                                    <p
                                                        className="
                                                            text-[9px]
                                                            font-bold
                                                            uppercase
                                                            tracking-[0.14em]
                                                            text-[#6D3DF5]
                                                        "
                                                    >
                                                        Detailed insight
                                                    </p>


                                                    <h4
                                                        className="
                                                            text-[17px]
                                                            font-semibold
                                                            tracking-[-0.025em]
                                                            text-[#171717]
                                                        "
                                                    >
                                                        {
                                                            expandedCard.title
                                                        }
                                                    </h4>

                                                </div>

                                            </div>


                                            <p
                                                className="
                                                    text-[18px]
                                                    md:text-[22px]
                                                    leading-[1.65]
                                                    tracking-[-0.025em]
                                                    font-medium
                                                    text-[#242421]
                                                "
                                            >
                                                {
                                                    expandedCard.content
                                                }
                                            </p>

                                        </div>

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