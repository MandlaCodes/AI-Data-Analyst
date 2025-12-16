import React, { useState } from "react";
// Assuming you use React Router for navigation
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
    FiMail,
    FiTerminal 
} from "react-icons/fi"; 

// --- DESIGN CONSTANTS (Consistent with Landing.jsx) ---
const PRIMARY_NEON = "#a855f7";   // Neon Purple
const ACCENT_FUCHSIA = "#c026d3"; // Bright Magenta/Fuchsia
const DARK_BG = "#0a0118";       // Deep dark purple (Background)
const CARD_BG = "#1a0b2e";       // Dark purple (Card Background)
const INPUT_BG = "#2d1b4e";      // Slightly lighter purple for inputs

// Hardcoded API for a quick fix, pending environment variable setup
const API = "https://ai-data-analyst-backend-1nuw.onrender.com";

export default function Login({ onLoginSuccess }) {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false); // State for success screen
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
                setStatus({
                    message: data.error || "Authentication failed.",
                    type: "error",
                });
                return;
            }

            // Authentication success
            const profile = {
                id: data.user_id,
                email: data.email || email,
            };

            localStorage.setItem("adt_token", data.token);
            localStorage.setItem("adt_profile", JSON.stringify(profile));
            
            // Set success state to show the smooth Welcome screen
            setStatus(null);
            setIsLoggedIn(true);

            // Delay the redirect to show the smooth transition message
            setTimeout(() => {
                onLoginSuccess(profile.id, data.token);
            }, 1500); // Wait 1.5 seconds

        } catch (err) {
            console.error(err);
            setStatus({
                message: "Could not connect to server.",
                type: "error",
            });
        }
    };

    const getStatusIcon = (type) => {
        if (type === "error") return <FiAlertCircle size={20} className="text-red-500" />;
        if (type === "success") return <FiCheckCircle size={20} className="text-green-500" />;
        if (type === "info") return <FiLoader size={20} className="animate-spin text-gray-500" />;
        return null;
    };

    const isLoading = status?.type === "info";

    const switchForm = () => {
        setIsSignup(!isSignup);
        setStatus(null);
        setEmail("");
        setPassword("");
    };

    const customStyles = `
        /* KEYFRAME FOR ENTRY ANIMATION */
        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        /* KEYFRAME FOR WELCOME FADE IN */
        @keyframes welcomeFadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    
        .login-page-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: ${DARK_BG};
            position: relative;
            padding: 40px;
            box-sizing: border-box;
        }

        .login-card-container {
            width: 100%;
            max-width: 900px; 
            height: 600px;
            box-shadow: 0 10px 60px rgba(0, 0, 0, 0.6);
            border-radius: 20px;
            display: flex;
            overflow: hidden;
            background: ${CARD_BG};
            border: 1px solid rgba(168, 85, 247, 0.2); 
            
            animation: fadeInScale 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Styles for the Success Screen */
        .success-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: ${CARD_BG};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 50; 
            animation: welcomeFadeIn 0.5s ease-out forwards;
        }

        /* --- LEFT PANEL STYLES --- */
        .left-panel {
            position: relative;
            flex: 0 0 40%;
            background: linear-gradient(135deg, ${CARD_BG}, ${DARK_BG});
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            box-sizing: border-box;
            
            transition: background 0.5s ease-in-out; 
            
            clip-path: polygon(0 0, 100% 0, 75% 100%, 0% 100%);
            z-index: 2;
        }

        .left-panel-content {
            position: relative;
            z-index: 10;
            text-align: center;
        }

        /* --- Geometric Layering (Neon/Dark Theme) --- */
        .geometric-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            transition: opacity 0.5s ease-in-out; 
        }

        .layer-1 { clip-path: polygon(0 0, 80% 0, 60% 100%, 0% 100%); background: ${ACCENT_FUCHSIA}; }
        .layer-2 { clip-path: polygon(0 0, 65% 0, 45% 100%, 0% 100%); background: ${PRIMARY_NEON}; }
        .layer-3 { clip-path: polygon(0 0, 40% 0, 25% 100%, 0% 100%); background: ${INPUT_BG}; }

        /* FIX: Ensure button text is readable (Contrast Fix) */
        .neon-button {
            background: white;
            color: ${ACCENT_FUCHSIA}; /* Use bright fuchsia for contrast on white/glow */
            box-shadow: 0 0 15px ${PRIMARY_NEON};
            transition: all 0.3s ease;
        }
        .neon-button:hover {
            box-shadow: 0 0 25px ${ACCENT_FUCHSIA};
            transform: scale(1.05);
        }

        /* --- RIGHT PANEL STYLES --- */
        .right-panel {
            flex: 1;
            padding: 20px 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: ${CARD_BG};
            color: #e5e7eb; 
            transition: all 0.5s ease-in-out;
        }

        .auth-input {
            border: none;
            border-bottom: 2px solid ${INPUT_BG};
            background: ${CARD_BG};
            color: white;
            padding: 8px 8px 8px 30px; 
            outline: none;
            transition: border-bottom-color 0.3s;
        }
        .auth-input:focus {
            border-bottom-color: ${PRIMARY_NEON};
            box-shadow: 0 1px 5px rgba(168, 85, 247, 0.4);
        }

        .input-group {
            position: relative;
            margin-bottom: 25px;
            width: 100%;
        }

        .input-icon {
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            color: ${PRIMARY_NEON};
        }
    `;

    const renderSwitchPanel = () => {
        const buttonText = isSignup ? "LOG IN" : "SIGN UP";
        const currentFormText = isSignup ? "CREATE ACCOUNT" : "WELCOME BACK";

        return (
            <div className="left-panel-content">
                 {/* UPDATED: Change color to white for better contrast */}
                <div className="text-xl font-semibold mb-8 text-white" style={{ textShadow: `0 0 5px rgba(255, 255, 255, 0.3)` }}>
                    {currentFormText}
                </div>
                <button 
                    onClick={switchForm} 
                    className={`
                        w-40 py-3 rounded-full font-bold text-lg 
                        transition-all duration-300 neon-button
                    `}
                >
                    {buttonText} 
                </button>
            </div>
        );
    };

    const renderSuccessScreen = () => (
        <div className="success-overlay">
            <FiCheckCircle size={60} className="mb-4" style={{ color: PRIMARY_NEON }} />
            <h2 className="text-4xl font-bold tracking-wider mb-2" style={{ color: PRIMARY_NEON, textShadow: `0 0 10px ${PRIMARY_NEON}99` }}>
                WELCOME
            </h2>
            <p className="text-lg text-gray-400">
                Preparing your dashboard...
            </p>
        </div>
    );

    // Removed highlight logic
    const leftPanelHighlight = "";
    const rightPanelHighlight = "";

    return (
        <div className="login-page-container">
            <style>{customStyles}</style>

            {/* Back Button (Only visible before successful login) */}
            {!isLoggedIn && (
                <button 
                    onClick={() => navigate('/')} 
                    className="absolute top-8 left-8 p-3 rounded-full text-white z-20 transition-colors duration-300"
                    style={{ backgroundColor: CARD_BG, border: `1px solid ${PRIMARY_NEON}`, boxShadow: `0 0 5px ${PRIMARY_NEON}` }}
                    aria-label="Go back to landing page"
                >
                    <FaArrowLeft className="text-sm" style={{ color: PRIMARY_NEON }} />
                </button>
            )}
            
            {/* The main login card with the animation applied */}
            <div className="login-card-container">
                
                {/* CONDITIONAL RENDERING: Display success screen if logged in */}
                {isLoggedIn && renderSuccessScreen()}

                {/* --- Left Panel (Switch Panel) --- */}
                <div className={`left-panel ${leftPanelHighlight}`}>
                    {/* Geometric Layers (Transition effect is on opacity) */}
                    <div className="geometric-layer layer-3" style={{ opacity: isSignup ? 0.3 : 1 }}></div>
                    <div className="geometric-layer layer-2" style={{ opacity: isSignup ? 0.6 : 1 }}></div>
                    <div className="geometric-layer layer-1" style={{ opacity: isSignup ? 0.9 : 1 }}></div>

                    {renderSwitchPanel()}
                </div>

                {/* --- Right Panel (Form) --- */}
                <div className={`right-panel ${rightPanelHighlight}`}>
                    
                    {/* User Icon & Main Heading */}
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2" 
                        style={{ background: `linear-gradient(135deg, ${PRIMARY_NEON}, ${ACCENT_FUCHSIA})`, boxShadow: `0 0 10px ${PRIMARY_NEON}` }}>
                        <FaUser size={30} className="text-white" />
                    </div>

                    <div className="text-xl font-bold mb-8 uppercase tracking-widest" style={{ color: PRIMARY_NEON }}>
                        {isSignup ? "Sign Up" : "Log In"}
                    </div>

                    <form onSubmit={handleSubmit} className="w-full max-w-xs">
                        
                        {/* Email Input */}
                        <div className="input-group">
                            <FiMail className="input-icon" size={18} />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                disabled={isLoading}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="auth-input"
                            />
                        </div>
                        
                        {/* Password Input */}
                        <div className="input-group">
                            <FaLock className="input-icon" size={18} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                disabled={isLoading}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="auth-input"
                            />
                        </div>
                        
                        {/* Forgot Password Link (Only shown for Login form) */}
                        {!isSignup && (
                            <div className="w-full text-right mb-6">
                                <a href="#" className="text-sm font-semibold hover:underline" style={{ color: PRIMARY_NEON }}>
                                    Forgot Password?
                                </a>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button type="submit" disabled={isLoading}
                            className={`
                                w-full py-3 rounded-md font-bold text-white uppercase tracking-wider
                                transition-opacity duration-300 flex items-center justify-center gap-2
                            `}
                            style={{ 
                                background: `linear-gradient(90deg, ${ACCENT_FUCHSIA}, ${PRIMARY_NEON})`, 
                                opacity: isLoading ? 0.6 : 1,
                                boxShadow: `0 4px 15px rgba(192, 38, 211, 0.4)`
                            }}
                        >
                            {isSignup ? (
                                <>{isLoading ? <FiLoader className="animate-spin" /> : "Sign Up"}</>
                            ) : (
                                <>{isLoading ? <FiLoader className="animate-spin" /> : "Log In"}</>
                            )}
                        </button>
                    </form>

                    {/* Status Message */}
                    {status && (
                        <div className="mt-6 text-center text-sm font-semibold flex items-center justify-center gap-2"
                            style={{ color: status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#22c55e' : '#6b7280' }}>
                            {getStatusIcon(status.type)}
                            {status.message}
                        </div>
                    )}
                    
                    {/* OR Login With & Social Buttons */}
                    <div className="mt-8 pt-4 border-t border-gray-700 w-full max-w-xs text-center">
                        <div className="text-sm text-gray-400 mb-4">Or Login With</div>
                        <div className="flex justify-center gap-6">
                            <button className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition">
                                <FaGoogle size={20} className="text-red-500" />
                                Google
                            </button>
                            <button className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition">
                                <FaFacebookF size={20} className="text-blue-500" />
                                Facebook
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}