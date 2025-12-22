import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { 
    FaUser, 
    FaLock, 
    FaGoogle, 
    FaFacebookF,
    FaArrowLeft
} from "react-icons/fa";
import { 
    FiLoader, 
    FiAlertCircle, 
    FiCheckCircle,
    FiMail
} from "react-icons/fi"; 

const PRIMARY_NEON = "#a855f7"; 
const ACCENT_FUCHSIA = "#c026d3"; 
const DARK_BG = "#0a0118"; 
const CARD_BG = "#1a0b2e"; 
const INPUT_BG = "#2d1b4e"; 

const API = "https://ai-data-analyst-backend-1nuw.onrender.com";

export default function Login({ onLoginSuccess }) {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false); 
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ message: "Loading...", type: "info" });
        try {
            const endpoint = isSignup ? "/auth/signup" : "/auth/login";
            const response = await fetch(`${API}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                setStatus({ message: data.error || "Authentication failed.", type: "error" });
                return;
            }
            const profile = { id: data.user_id, email: data.email || email };
            localStorage.setItem("adt_token", data.token);
            localStorage.setItem("adt_profile", JSON.stringify(profile));
            setStatus(null);
            setIsLoggedIn(true);
            setTimeout(() => { onLoginSuccess(profile.id, data.token); }, 1500);
        } catch (err) {
            setStatus({ message: "Could not connect to server.", type: "error" });
        }
    };

    const customStyles = `
        /* 1. Global Reset to kill white gaps */
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden;
            background-color: ${DARK_BG};
        }

        @keyframes fadeInScale {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes welcomeFadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    
        .login-page-container {
            position: fixed; /* Fixes it to the viewport edges */
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: ${DARK_BG};
            overflow: hidden;
            display: flex;
        }

        .login-card-container {
            width: 100%;
            height: 100%;
            display: flex;
            background: ${CARD_BG};
            animation: fadeInScale 0.7s ease-in-out forwards;
            margin: 0; /* Ensures no external spacing */
        }
        
        .success-overlay {
            position: absolute;
            inset: 0;
            background-color: ${DARK_BG};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 100; 
            animation: welcomeFadeIn 0.5s ease-out forwards;
        }

        .left-panel {
            position: relative;
            flex: 0 0 45%;
            background: linear-gradient(135deg, ${CARD_BG}, ${DARK_BG});
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0; /* Removed padding */
            clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
            z-index: 2;
        }

        .geometric-layer {
            position: absolute;
            inset: 0;
            transition: opacity 0.5s ease-in-out; 
        }

        .layer-1 { clip-path: polygon(0 0, 80% 0, 65% 100%, 0% 100%); background: ${ACCENT_FUCHSIA}; }
        .layer-2 { clip-path: polygon(0 0, 65% 0, 50% 100%, 0% 100%); background: ${PRIMARY_NEON}; }
        .layer-3 { clip-path: polygon(0 0, 40% 0, 25% 100%, 0% 100%); background: ${INPUT_BG}; }

        .right-panel {
            flex: 1;
            padding: 20px; /* Reduced padding from 40px */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: ${CARD_BG};
        }

        .auth-input {
            width: 100%;
            border: none;
            border-bottom: 2px solid ${INPUT_BG};
            background: transparent;
            color: white;
            padding: 12px 12px 12px 35px;
            outline: none;
            font-size: 1.1rem;
        }

        .input-group {
            position: relative;
            margin-bottom: 30px;
            width: 100%;
            max-width: 400px;
        }

        .input-icon {
            position: absolute;
            left: 5px;
            top: 50%;
            transform: translateY(-50%);
            color: ${PRIMARY_NEON};
        }

        .neon-button {
            background: white;
            color: ${DARK_BG};
            box-shadow: 0 0 15px ${PRIMARY_NEON};
            transition: all 0.3s ease;
        }
        .neon-button:hover {
            box-shadow: 0 0 25px ${ACCENT_FUCHSIA};
            transform: scale(1.05);
        }
    `;

    return (
        <div className="login-page-container">
            <style>{customStyles}</style>

            {!isLoggedIn && (
                <button 
                    onClick={() => navigate('/')} 
                    className="absolute top-6 left-6 p-4 rounded-full text-white z-50 transition-all"
                    style={{ backgroundColor: INPUT_BG, border: `1px solid ${PRIMARY_NEON}` }}
                >
                    <FaArrowLeft size={20} style={{ color: PRIMARY_NEON }} />
                </button>
            )}
            
            <div className="login-card-container">
                {isLoggedIn && (
                    <div className="success-overlay">
                        <FiCheckCircle size={80} className="mb-4" style={{ color: PRIMARY_NEON }} />
                        <h2 className="text-6xl font-bold tracking-widest mb-4" style={{ color: PRIMARY_NEON }}>WELCOME</h2>
                        <p className="text-xl text-gray-400">Preparing your dashboard</p>
                    </div>
                )}

                <div className="left-panel">
                    <div className="geometric-layer layer-3" style={{ opacity: isSignup ? 0.2 : 0.8 }}></div>
                    <div className="geometric-layer layer-2" style={{ opacity: isSignup ? 0.4 : 0.9 }}></div>
                    <div className="geometric-layer layer-1" style={{ opacity: isSignup ? 0.7 : 1 }}></div>

                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-bold text-white mb-10 tracking-wide">
                            {isSignup ? "MetriaAI" : "MetriaAI"}
                        </h2>
                        <button onClick={() => setIsSignup(!isSignup)} className="w-48 py-4 rounded-full font-bold text-xl neon-button">
                            {isSignup ? "LOG IN" : "SIGN UP"}
                        </button>
                    </div>
                </div>

                <div className="right-panel">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" 
                        style={{ background: `linear-gradient(135deg, ${PRIMARY_NEON}, ${ACCENT_FUCHSIA})`, boxShadow: `0 0 20px ${PRIMARY_NEON}` }}>
                        <FaUser size={30} className="text-white" />
                    </div>

                    <h1 className="text-3xl font-black mb-10 uppercase tracking-tighter" style={{ color: PRIMARY_NEON }}>
                        {isSignup ? "Create Identity" : "Access Dashboard"}
                    </h1>

                    <form onSubmit={handleSubmit} className="w-full max-w-sm">
                        <div className="input-group">
                            <FiMail className="input-icon" size={20} />
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
                        </div>
                        
                        <div className="input-group">
                            <FaLock className="input-icon" size={20} />
                            <input type="password" placeholder="Secure Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="auth-input" />
                        </div>

                        <button type="submit" className="w-full py-4 rounded-lg font-black text-white uppercase tracking-widest mt-4 transition-all hover:brightness-110"
                            style={{ background: `linear-gradient(90deg, ${ACCENT_FUCHSIA}, ${PRIMARY_NEON})`, boxShadow: `0 10px 20px rgba(192, 38, 211, 0.3)` }}>
                            {status?.type === "info" ? <FiLoader className="animate-spin mx-auto" size={24} /> : (isSignup ? "Initialize" : "Authenticate")}
                        </button>
                    </form>

                    {status && (
                        <div className="mt-8 flex items-center gap-2 font-bold" style={{ color: status.type === 'error' ? '#ff4d4d' : '#a855f7' }}>
                            {status.message}
                        </div>
                    )}

                    <div className="mt-8 pt-8 border-t border-white/10 w-full max-w-sm flex justify-around">
                        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition"><FaGoogle /> Google</button>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition"><FaFacebookF /> Facebook</button>
                    </div>
                </div>
            </div>
        </div>
    );
}