import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiSend, FiCpu, FiStar, FiMic, FiMicOff, FiClock, FiMessageSquare, FiChevronLeft, FiChevronRight, FiVolume2, FiVolumeX } from "react-icons/fi";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

export const MetriaFollowUp = ({ activeDataset, authToken }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputQuery, setInputQuery] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Feature States
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false); // Optional voice reading toggle
    const [historyOpen, setHistoryOpen] = useState(true);
    const [pastSessions, setPastSessions] = useState([]);

    const speechSynthRef = useRef(window.speechSynthesis);

    useEffect(() => {
        if (!activeDataset) {
            setIsVisible(false);
            setMessages([]);
            return;
        }

        const timer = setTimeout(() => {
            setIsVisible(true);
            const welcomeText = `I've finished synthesizing "${activeDataset.name}". What insights or anomalies would you like to unpack together?`;
            setMessages([
                { sender: "metria", text: welcomeText }
            ]);
            if (voiceEnabled) speakResponse(welcomeText);
        }, 1200);

        return () => clearTimeout(timer);
    }, [activeDataset]);

    // Fetch past sessions dynamically from main.py and db.py
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

    // Load a specific past session when clicked in the sidebar
    const loadSession = async (sessionId) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/ai/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setMessages(res.data.messages || []);
        } catch (err) {
            console.error("Failed to load session messages", err);
        }
    };

    // Siri-Style Voice Synthesizer Reader
    const speakResponse = (text) => {
        if (!speechSynthRef.current || !voiceEnabled) return;
        speechSynthRef.current.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        speechSynthRef.current.speak(utterance);
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

        if (speechSynthRef.current) speechSynthRef.current.cancel();

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
                messages: newMessages // Pass current state array so the backend can save it
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const answerText = res.data.answer;
            const finalMessages = res.data.messages || [...newMessages, { sender: "metria", text: answerText }];
            setMessages(finalMessages);
            if (voiceEnabled) speakResponse(answerText);
        } catch (err) {
            const errorText = "Neural synthesis encountered an error. Please try again.";
            setMessages(prev => [...prev, { sender: "metria", text: errorText }]);
            if (voiceEnabled) speakResponse(errorText);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Helper to format AI response text into ChatGPT-style clean blocks
    const formatMessageText = (text, sender) => {
        if (sender === 'user') return <p className="leading-relaxed">{text}</p>;

        // Split chunk patterns like "1. **Title**: description"
        const segments = text.split(/(?=\d+\.\s+\*\*)/);

        return (
            <div className="space-y-3 leading-relaxed">
                {segments.map((chunk, cIdx) => {
                    if (cIdx === 0 && !chunk.match(/^\d+\./)) {
                        return <p key={cIdx} className="text-slate-200 mb-2">{chunk}</p>;
                    }
                    const parts = chunk.replace(/^\d+\.\s+/, "").split("**: ");
                    const title = parts[0]?.replace(/\*\*/g, "");
                    const body = parts[1] || "";

                    return (
                        <div key={cIdx} className="bg-black/30 border border-white/10 p-3.5 rounded-2xl flex gap-3">
                            <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-lg bg-purple-500/20 text-purple-400 font-bold text-[10px]">
                                {cIdx}
                            </span>
                            <div>
                                {title && <h6 className="text-white font-bold text-xs uppercase tracking-wider mb-1">{title}</h6>}
                                <p className="text-slate-300 text-xs">{body}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!activeDataset) return null;

    const suggestedPrompts = [
        "What are the primary bottlenecks?",
        "Summarize top revenue drivers",
        "Identify high-risk deals"
    ];

    return (
        <div className={`transition-all duration-1000 transform ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
        } mt-20 mb-24 px-6 lg:px-10 w-full flex gap-6`}>
            
            {/* Past History Sidebar */}
            <div className={`transition-all duration-300 bg-[#0A0E1A] border border-purple-500/30 rounded-[2.5rem] flex flex-col overflow-hidden ${
                historyOpen ? 'w-80 p-6' : 'w-20 p-4 items-center'
            }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                    {historyOpen && (
                        <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-wider">
                            <FiClock className="text-purple-400" /> Past Sessions
                        </div>
                    )}
                    <button 
                        onClick={() => setHistoryOpen(!historyOpen)} 
                        className="p-2 rounded-xl bg-white/5 hover:bg-purple-600/20 text-slate-400 hover:text-white transition-all"
                    >
                        {historyOpen ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
                    </button>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 flex flex-col">
                    {pastSessions.length > 0 ? (
                        pastSessions.map(session => (
                            <div 
                                key={session.id}
                                onClick={() => loadSession(session.id)}
                                className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${
                                    historyOpen ? 'hover:bg-purple-600/20 border border-transparent hover:border-purple-500/30' : 'justify-center'
                                }`}
                            >
                                <FiMessageSquare className="text-purple-400 shrink-0" size={16} />
                                {historyOpen && (
                                    <div className="truncate">
                                        <p className="text-white text-xs font-bold truncate">{session.title}</p>
                                        <p className="text-slate-500 text-[10px]">{session.date}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        historyOpen && (
                            <div className="text-slate-500 text-xs italic text-center py-6">
                                No past sessions
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Main Interactive Neural Analyst Panel */}
            <div className="w-full relative group flex-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 rounded-[3.5rem] blur-xl opacity-40 group-hover:opacity-75 transition duration-1000 pointer-events-none" />

                <div className="relative bg-gradient-to-b from-[#120B22] to-[#080B14] border border-purple-500/60 rounded-[3.5rem] p-8 md:p-12 shadow-[0_0_60px_rgba(188,19,254,0.15)] overflow-hidden">
                    
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(188,19,254,0.15),rgba(255,255,255,0))] pointer-events-none" />

                    {/* Header Banner */}
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/10 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-md animate-pulse" />
                                <div className="relative p-4 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl text-white shadow-lg">
                                    <FiCpu size={26} className="animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-black uppercase tracking-wider text-sm">Metria Neural Analyst</h3>
                                    <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">Active Core</span>
                                </div>
                                <p className="text-slate-400 text-[11px] font-medium tracking-wide mt-0.5">Ask questions, request deep-dives, or query variables in real-time</p>
                            </div>
                        </div>

                        {/* Voice Controls & Status Indicators */}
                        <div className="flex items-center gap-3">
                            {/* Toggle Voice Speech Output Button */}
                            <button
                                onClick={() => {
                                    setVoiceEnabled(!voiceEnabled);
                                    if (isSpeaking && speechSynthRef.current) {
                                        speechSynthRef.current.cancel();
                                        setIsSpeaking(false);
                                    }
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    voiceEnabled 
                                        ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                }`}
                                title="Toggle Voice Reader"
                            >
                                {voiceEnabled ? <FiVolume2 size={14} className="text-purple-400" /> : <FiVolumeX size={14} />}
                                {voiceEnabled ? "Voice Enabled" : "Voice Muted"}
                            </button>

                            {/* Speaking Indicator Waveform */}
                            {isSpeaking && (
                                <div className="flex items-center gap-1 bg-purple-600/20 border border-purple-500/40 px-3 py-2 rounded-2xl">
                                    <span className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">Speaking</span>
                                    <div className="flex items-center gap-0.5 h-3 ml-1">
                                        <div className="w-1 bg-purple-400 animate-bounce h-full rounded-full" />
                                        <div className="w-1 bg-fuchsia-400 animate-bounce h-2 rounded-full delay-100" />
                                        <div className="w-1 bg-purple-400 animate-bounce h-3 rounded-full delay-200" />
                                    </div>
                                </div>
                            )}

                            <div className="hidden sm:flex items-center gap-2 text-purple-400 text-[10px] font-bold uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-2xl">
                                <FiStar size={14} /> Ready
                            </div>
                        </div>
                    </div>

                    {/* Conversation Window */}
                    <div className="relative z-10 space-y-6 max-h-[420px] overflow-y-auto pr-2 mb-8">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-6 rounded-3xl text-xs md:text-sm shadow-lg ${
                                    msg.sender === 'user' 
                                        ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-br-sm font-semibold' 
                                        : 'bg-white/[0.04] border border-white/10 text-slate-200 rounded-bl-sm font-normal backdrop-blur-md'
                                }`}>
                                    {formatMessageText(msg.text, msg.sender)}
                                </div>
                            </div>
                        ))}
                        {isAnalyzing && (
                            <div className="flex justify-start">
                                <div className="bg-white/[0.04] border border-white/10 text-purple-300 p-5 rounded-3xl text-xs backdrop-blur-md animate-pulse flex items-center gap-3">
                                    <FiCpu className="animate-spin text-purple-400" size={16} /> Metria is scanning parameters & computing data vectors...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Suggestion Pills */}
                    <div className="relative z-10 flex flex-wrap gap-2 mb-6">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest self-center mr-2">Suggested:</span>
                        {suggestedPrompts.map((promptText, pIdx) => (
                            <button
                                key={pIdx}
                                onClick={() => handleSend(promptText)}
                                className="bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm"
                            >
                                {promptText}
                            </button>
                        ))}
                    </div>

                    {/* Input Form Bar with Voice Listener Button */}
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative z-10 flex gap-3">
                        <div className="relative flex-1 flex items-center">
                            <input 
                                type="text"
                                value={inputQuery}
                                onChange={(e) => setInputQuery(e.target.value)}
                                placeholder={isListening ? "Listening... Speak now..." : `Ask Metria anything about ${activeDataset.name}...`}
                                className={`w-full bg-black/60 border rounded-3xl px-7 py-5 text-xs md:text-sm text-white focus:outline-none shadow-inner transition-all placeholder:text-slate-500 ${
                                    isListening ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' : 'border-white/15 focus:border-purple-500'
                                }`}
                            />
                            {/* Voice Listener Mic Toggle */}
                            <button 
                                type="button" 
                                onClick={toggleVoiceListener}
                                className={`absolute right-4 p-2.5 rounded-2xl transition-all ${
                                    isListening ? 'bg-red-500 text-white animate-bounce' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                }`}
                                title="Talk to Metria"
                            >
                                {isListening ? <FiMicOff size={18} /> : <FiMic size={18} />}
                            </button>
                        </div>
                        <button 
                            type="submit" 
                            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-8 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center shrink-0 hover:scale-[1.02] active:scale-95"
                        >
                            <FiSend size={18} />
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};