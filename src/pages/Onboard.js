import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiCpu, FiTerminal, FiActivity, FiZap, FiLock } from "react-icons/fi";

const Onboard = ({ profile, weatherData, onAction }) => {
    const [hasInitialized, setHasInitialized] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [isTypingDone, setIsTypingDone] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Jarvis-style greeting
    const greetingText = `System online. ${weatherData.greeting}, ${profile?.first_name || "Agent"}. I am Metria, your personal AI data analyst. My neural protocols are synchronized. Shall we initialize your first data transmission?`;

    const handleInitialize = () => {
        setHasInitialized(true);
        
        const utterance = new SpeechSynthesisUtterance(greetingText);
        const voices = window.speechSynthesis.getVoices();
        
        // Match the British Executive Voice
        const britishVoice = voices.find(v => 
            (v.lang === 'en-GB' || v.lang.startsWith('en-GB')) && 
            (v.name.includes('Female') || v.name.includes('UK') || v.name.includes('Hazel') || v.name.includes('Serena'))
        );

        utterance.voice = britishVoice || voices[0];
        utterance.rate = 0.91; 
        utterance.pitch = 1.05;

        // CRITICAL: Synchronize typewriter with word boundaries
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                // Slice the text up to the end of the current word being spoken
                const spokenSoFar = greetingText.slice(0, event.charIndex + event.charLength);
                setDisplayedText(spokenSoFar);
            }
        };

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            setDisplayedText(greetingText); // Ensure full text is shown
            setIsTypingDone(true);
        };

        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="w-full min-h-[550px] flex items-center justify-center">
            <AnimatePresence mode="wait">
                {!hasInitialized ? (
                    <motion.button
                        key="splash"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        onClick={handleInitialize}
                        className="group relative flex flex-col items-center gap-6"
                    >
                        <div className="h-24 w-24 rounded-full border border-purple-500/30 flex items-center justify-center relative shadow-[0_0_50px_rgba(188,19,254,0.2)] bg-black">
                            <FiLock className="text-purple-500 group-hover:scale-110 transition-transform" size={30} />
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-4 border border-dashed border-purple-500/20 rounded-full"
                            />
                        </div>
                        <div className="text-center">
                            <h2 className="text-white font-black text-[10px] uppercase tracking-[0.8em]">Authorize Metria</h2>
                            <p className="text-purple-500/50 text-[9px] mt-3 font-mono uppercase tracking-[0.3em] animate-pulse">Establish Neural Handshake</p>
                        </div>
                    </motion.button>
                ) : (
                    <motion.div 
                        key="onboard"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full flex flex-col items-center justify-center py-16 md:py-24 px-6 border border-purple-500/10 rounded-[4rem] bg-[#050505] relative overflow-hidden"
                    >
                        {/* Audio Pulse Rings */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full flex justify-center pt-10">
                            <div className="flex items-end gap-1.5 h-12">
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={isSpeaking ? { height: [4, Math.random() * 40 + 10, 4] } : { height: 4 }}
                                        transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.05 }}
                                        className="w-1 bg-purple-600 rounded-full"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="relative mb-14 mt-12">
                            <div className="h-36 w-36 rounded-full bg-black border border-purple-500/40 flex items-center justify-center relative shadow-[0_0_80px_rgba(188,19,254,0.2)]">
                                <FiCpu className={`${isSpeaking ? 'text-purple-400' : 'text-purple-900'} transition-all duration-700`} size={50} />
                                <AnimatePresence>
                                    {isSpeaking && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1.2 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping"
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="max-w-4xl w-full text-center z-10">
                            <div className="flex items-center justify-center gap-3 mb-12 opacity-40">
                                <div className="h-[1px] w-8 bg-purple-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Neural Voice Synthesis</span>
                                <div className="h-[1px] w-8 bg-purple-500" />
                            </div>

                            <div className="min-h-[180px] flex items-center justify-center">
                                <h2 className="text-3xl md:text-5xl font-light text-white leading-[1.4] tracking-tight italic">
                                    {displayedText}
                                    {isSpeaking && (
                                        <motion.span 
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.5 }}
                                            className="inline-block w-1.5 h-10 bg-purple-500 ml-2 translate-y-2"
                                        />
                                    )}
                                </h2>
                            </div>

                            <AnimatePresence>
                                {isTypingDone && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-16 flex flex-col items-center"
                                    >
                                        <button 
                                            onClick={onAction}
                                            className="group relative px-20 py-7 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.6em] hover:bg-purple-600 hover:text-white transition-all shadow-2xl overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center gap-4">
                                                Engage System <FiArrowRight size={20} />
                                            </span>
                                        </button>
                                        
                                        <div className="mt-10 flex gap-8 text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">
                                            <span className="flex items-center gap-2 italic underline decoration-purple-500/50">Biometric Sync: 100%</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Onboard;