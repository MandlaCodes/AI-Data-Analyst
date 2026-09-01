import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiSend, FiCpu, FiMic, FiMicOff, FiClock, FiMessageSquare, FiVolume2, FiVolumeX, FiMaximize2, FiMinimize2, FiUserCheck, FiX } from "react-icons/fi";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

export const MetriaFollowUp = ({ activeDataset, authToken }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputQuery, setInputQuery] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Feature States
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false); 
    const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
    const [pastSessions, setPastSessions] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    // Ref to handle playing/stopping ElevenLabs audio cleanly
    const audioRef = useRef(null);

    useEffect(() => {
        if (!activeDataset) {
            setIsVisible(false);
            setMessages([]);
            return;
        }

        const timer = setTimeout(() => {
            setIsVisible(true);
            const welcomeText = `Hey there. I've just taken a look through "${activeDataset.name}". Honestly, there are some really interesting patterns in here. Take your time looking things over, and whenever you're ready, let me know what we should dig into first.`;
            setMessages([
                { sender: "metria", text: welcomeText }
            ]);
            if (voiceEnabled) playHumanVoice(welcomeText);
        }, 400);

        return () => clearTimeout(timer);
    }, [activeDataset]);

    // Fetch past sessions dynamically from backend
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/ai/sessions`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                setPastSessions(res.data.sessions || []);
            } catch (err) {
                console.error("Failed to load past chat sessions", err);
                setPastSessions([]);
            }
        };
        if (authToken) fetchHistory();
    }, [authToken]);

    const loadSession = async (sessionId) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/ai/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setMessages(res.data.messages || []);
            setShowHistoryDropdown(false);
        } catch (err) {
            console.error("Failed to load session messages", err);
        }
    };

    // ElevenLabs Text-to-Speech Integration
    const playHumanVoice = async (text) => {
        if (!voiceEnabled) return;

        try {
            // Stop any ongoing speech
            stopVoice();

            const cleanText = text.replace(/[*#_`]/g, '');
            setIsSpeaking(true);

            const res = await axios.post(`${API_BASE_URL}/ai/speak`, {
                text: cleanText
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const audioBase64 = res.data.audio_base64;
            const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
            audioRef.current = audio;

            audio.onended = () => setIsSpeaking(false);
            audio.onerror = () => setIsSpeaking(false);

            await audio.play();
        } catch (err) {
            console.error("Failed to play ElevenLabs audio:", err);
            setIsSpeaking(false);
        }
    };

    const stopVoice = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsSpeaking(false);
    };

    // Speech-to-Text Voice Listener
    const toggleVoiceListener = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        
        recognition.onresult = (event) => {
            const speechText = event.results[0][0].transcript;
            setInputQuery(speechText);
            setIsListening(false);
            handleSend(speechText);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const handleSend = async (queryText) => {
        const textToSend = queryText || inputQuery;
        if (!textToSend.trim() || !activeDataset) return;

        stopVoice();

        const newMessages = [...messages, { sender: "user", text: textToSend }];
        setMessages(newMessages);
        setInputQuery("");
        setIsAnalyzing(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/ai/query`, {
                query: textToSend,
                dataset_name: activeDataset.name,
                metrics: activeDataset.metrics,
                data_sample: activeDataset.data,
                messages: newMessages 
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const answerText = res.data.answer;
            const audioBase64 = res.data.audio_base64;
            const finalMessages = res.data.messages || [...newMessages, { sender: "metria", text: answerText }];
            
            // Reveal text message and update state immediately
            setMessages(finalMessages);
            setIsAnalyzing(false);

            // Play audio simultaneously if voice is enabled and audio payload exists
            if (voiceEnabled && audioBase64) {
                const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
                audioRef.current = audio;

                audio.onended = () => setIsSpeaking(false);
                audio.onerror = () => setIsSpeaking(false);

                setIsSpeaking(true);
                await audio.play();
            }
        } catch (err) {
            setIsAnalyzing(false);
            const errorText = "Ah, my connection just dropped for a split second. Let's try sending that query again.";
            setMessages(prev => [...prev, { sender: "metria", text: errorText }]);
            if (voiceEnabled) playHumanVoice(errorText);
        }
    };

    const formatMessageText = (text, sender) => {
        if (sender === 'user') return <p className="leading-relaxed text-sm md:text-base">{text}</p>;

        return (
            <div className="space-y-4 text-sm md:text-base leading-relaxed text-slate-100 font-normal">
                {text.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx} className="tracking-wide">
                        {paragraph}
                    </p>
                ))}
            </div>
        );
    };

    if (!activeDataset) return null;

    const suggestedPrompts = [
        "What are the primary bottlenecks we should fix?",
        "Can you walk me through the top revenue drivers?",
        "Are there any high-risk data points worth reviewing?"
    ];

    return (
        <div className={`transition-all duration-300 ${
            isExpanded 
                ? 'fixed top-0 right-0 bottom-0 left-64 z-50 bg-[#07050f] p-6 flex flex-col' 
                : 'w-full max-w-[1500px] mx-auto my-6 px-4 flex flex-col'
        }`}>
            <div className={`transition-all duration-500 transform ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            } w-full flex-1 flex flex-col`}>
                
                {/* Main Interactive Consultant Panel */}
                <div className={`relative group w-full flex-1 flex flex-col ${
                    isExpanded ? 'bg-[#07050f]' : 'bg-gradient-to-b from-[#120B22] to-[#080B14] border border-purple-500/50 rounded-[3rem] p-6 md:p-8 shadow-[0_0_50px_rgba(188,19,254,0.1)]'
                }`}>
                    {!isExpanded && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 rounded-[3rem] blur-xl opacity-20 pointer-events-none" />
                    )}

                    <div className="relative w-full flex-1 flex flex-col justify-between">
                        
                        {/* Top Header & Controls */}
                        <div className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl text-white shadow-lg">
                                    <FiUserCheck size={22} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold tracking-wide text-sm md:text-base">Metria</h3>
                                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Consultant
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-xs">Here to help you break down data safely and clearly.</p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2.5">
                                {/* History Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                                        className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-purple-600/20 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-medium"
                                        title="Past Chat Sessions"
                                    >
                                        <FiClock size={15} className="text-purple-400" />
                                        <span>History</span>
                                    </button>

                                    {showHistoryDropdown && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-[#0A0E1A] border border-purple-500/40 rounded-3xl p-4 shadow-2xl z-50 backdrop-blur-xl">
                                            <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5">
                                                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                                                    <FiClock className="text-purple-400" /> Past Sessions
                                                </div>
                                                <button onClick={() => setShowHistoryDropdown(false)} className="text-slate-400 hover:text-white cursor-pointer">
                                                    <FiX size={15} />
                                                </button>
                                            </div>
                                            <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                                {pastSessions.length > 0 ? (
                                                    pastSessions.map(session => (
                                                        <div 
                                                            key={session.id}
                                                            onClick={() => loadSession(session.id)}
                                                            className="p-2.5 rounded-xl cursor-pointer hover:bg-purple-600/20 border border-transparent hover:border-purple-500/30 transition-all flex items-center gap-2.5"
                                                        >
                                                            <FiMessageSquare className="text-purple-400 shrink-0" size={14} />
                                                            <div className="truncate">
                                                                <p className="text-white text-xs font-bold truncate">{session.title}</p>
                                                                <p className="text-slate-500 text-[10px]">{session.date}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-slate-500 text-xs italic text-center py-4">
                                                        No past sessions recorded
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        const nextState = !voiceEnabled;
                                        setVoiceEnabled(nextState);
                                        if (!nextState) stopVoice();
                                    }}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-medium transition-all cursor-pointer ${
                                        voiceEnabled 
                                            ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]' 
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {voiceEnabled ? <FiVolume2 size={14} className="text-purple-400" /> : <FiVolumeX size={14} />}
                                    {voiceEnabled ? "Voice On" : "Voice Off"}
                                </button>

                                {isSpeaking && (
                                    <div className="flex items-center gap-1 bg-purple-600/20 border border-purple-500/40 px-2.5 py-2 rounded-2xl">
                                        <span className="text-purple-300 text-xs">Speaking</span>
                                        <div className="flex items-center gap-0.5 h-2.5 ml-1">
                                            <div className="w-1 bg-purple-400 animate-bounce h-full rounded-full" />
                                            <div className="w-1 bg-fuchsia-400 animate-bounce h-2 rounded-full delay-100" />
                                            <div className="w-1 bg-purple-400 animate-bounce h-2.5 rounded-full delay-200" />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
                                    title={isExpanded ? "Minimize" : "Expand to Right Pane View"}
                                >
                                    {isExpanded ? <FiMinimize2 size={15} /> : <FiMaximize2 size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Middle Conversation Area */}
                        <div className="relative z-10 space-y-4 overflow-y-auto pr-2 my-auto flex-1 max-h-[calc(100vh-260px)] scrollbar-thin scrollbar-thumb-purple-500/30">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] md:max-w-[80%] p-5 md:p-6 rounded-2xl shadow-lg ${
                                        msg.sender === 'user' 
                                            ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-br-sm font-medium' 
                                            : 'bg-white/[0.03] border border-white/10 text-slate-100 rounded-bl-sm backdrop-blur-md'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                                                {msg.sender === 'user' ? 'You' : 'Metria • Consultant'}
                                            </span>
                                        </div>
                                        {formatMessageText(msg.text, msg.sender)}
                                    </div>
                                </div>
                            ))}
                            {isAnalyzing && (
                                <div className="flex justify-start">
                                    <div className="bg-white/[0.04] border border-white/10 text-purple-300 p-4 rounded-2xl text-xs md:text-sm backdrop-blur-md animate-pulse flex items-center gap-2.5">
                                        <FiCpu className="animate-spin text-purple-400" size={16} /> Metria is scanning the numbers...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Suggestions & Form */}
                        <div className="relative z-10 pt-3 mt-auto">
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="text-xs font-semibold text-slate-400 self-center mr-1">Suggested:</span>
                                {suggestedPrompts.map((promptText, pIdx) => (
                                    <button
                                        key={pIdx}
                                        type="button"
                                        onClick={() => handleSend(promptText)}
                                        className="bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shadow-sm cursor-pointer"
                                    >
                                        {promptText}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2.5">
                                <div className="relative flex-1 flex items-center">
                                    <input 
                                        type="text"
                                        value={inputQuery}
                                        onChange={(e) => setInputQuery(e.target.value)}
                                        placeholder={isListening ? "Listening closely..." : `Ask Metria a question about ${activeDataset.name}...`}
                                        className={`w-full bg-black/70 border rounded-2xl px-6 py-3.5 text-xs md:text-sm text-white focus:outline-none shadow-inner transition-all placeholder:text-slate-500 ${
                                            isListening ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' : 'border-white/15 focus:border-purple-500'
                                        }`}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={toggleVoiceListener}
                                        className={`absolute right-3.5 p-2.5 rounded-xl transition-all cursor-pointer ${
                                            isListening ? 'bg-red-500 text-white animate-bounce' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                        }`}
                                        title="Speak your question"
                                    >
                                        {isListening ? <FiMicOff size={16} /> : <FiMic size={16} />}
                                    </button>
                                </div>
                                <button 
                                    type="submit" 
                                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-6 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-600/30 flex items-center justify-center shrink-0 hover:scale-[1.02] active:scale-95 cursor-pointer"
                                >
                                    <FiSend size={16} />
                                </button>
                            </form>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};