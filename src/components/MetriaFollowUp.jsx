import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiSend, FiCpu, FiStar, FiMic, FiMicOff, FiClock, FiMessageSquare, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

export const MetriaFollowUp = ({ activeDataset, authToken }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputQuery, setInputQuery] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // New Feature States
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(true);
    const [pastSessions, setPastSessions] = useState([
        { id: 1, title: "Sales Excel Analysis", date: "Today" },
        { id: 2, title: "Q3 Revenue Metrics", date: "Yesterday" }
    ]);

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
            speakResponse(welcomeText);
        }, 1200);

        return () => clearTimeout(timer);
    }, [activeDataset]);

    // Siri-Style Voice Synthesizer Reader
    const speakResponse = (text) => {
        if (!speechSynthRef.current) return;
        speechSynthRef.current.cancel(); // Stop any ongoing speech
        
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

        setMessages(prev => [...prev, { sender: "user", text: textToSend }]);
        setInputQuery("");
        setIsAnalyzing(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/ai/query`, {
                query: textToSend,
                dataset_name: activeDataset.name,
                metrics: activeDataset.metrics,
                data_sample: activeDataset.data
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const answerText = res.data.answer;
            setMessages(prev => [...prev, { sender: "metria", text: answerText }]);
            speakResponse(answerText);
        } catch (err) {
            const errorText = "Neural synthesis encountered an error. Please try again.";
            setMessages(prev => [...prev, { sender: "metria", text: errorText }]);
            speakResponse(errorText);
        } finally {
            setIsAnalyzing(false);
        }
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
            <div className={`transition-all duration-300 bg-[#0A0E1A] border border-purple-500/30 rounded-[2.5p] rounded-[2.5rem] flex flex-col overflow-hidden ${
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

                <div className="space-y-2 overflow-y-auto flex-1">
                    {pastSessions.map(session => (
                        <div 
                            key={session.id}
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
                    ))}
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

                        {/* Siri-Style Speaking / Listening Indicator Waveform */}
                        <div className="flex items-center gap-3">
                            {isSpeaking && (
                                <div className="flex items-center gap-1 bg-purple-600/20 border border-purple-500/40 px-4 py-2 rounded-2xl">
                                    <span className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">Speaking</span>
                                    <div className="flex items-center gap-0.5 h-3 ml-1">
                                        <div className="w-1 bg-purple-400 animate-bounce h-full rounded-full" />
                                        <div className="w-1 bg-fuchsia-400 animate-bounce h-2 rounded-full delay-100" />
                                        <div className="w-1 bg-purple-400 animate-bounce h-3 rounded-full delay-200" />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-purple-400 text-[10px] font-bold uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-2xl w-fit">
                                <FiStar size={14} /> Ready for query
                            </div>
                        </div>
                    </div>

                    {/* Conversation Window */}
                    <div className="relative z-10 space-y-6 max-h-[420px] overflow-y-auto pr-2 mb-8">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-6 rounded-3xl text-xs md:text-sm leading-relaxed shadow-lg ${
                                    msg.sender === 'user' 
                                        ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-br-sm font-semibold' 
                                        : 'bg-white/[0.04] border border-white/10 text-slate-200 rounded-bl-sm font-normal backdrop-blur-md'
                                }`}>
                                    {msg.text}
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