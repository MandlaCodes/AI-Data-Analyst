
import React, { useState } from "react"; // <-- CORRECTED: Added { useState }
import { FiLogIn, FiUserPlus, FiAlertCircle, FiCheckCircle, FiLoader, FiMail, FiLock, FiTerminal } from "react-icons/fi"; // All icons are correctly imported

// CORRECTED: Moved the API constant outside the component function for scope
const API = "https://ai-data-analyst-backend-1nuw.onrender.com";

export default function Login({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);

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
        setStatus({ message: data.error || "An unknown error occurred.", type: "error" });
        return;
      }

      // --- Success ---
      localStorage.setItem("adt_token", data.token);
      localStorage.setItem(
        "adt_profile",
        JSON.stringify({ user_id: data.user_id, email })
      );

      setStatus({ message: "Success! Redirecting to dashboard...", type: "success" });
      onLoginSuccess(data.user_id);
    } catch (err) {
      console.error(err);
      setStatus({ message: "Could not connect to server.", type: "error" });
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'error':
        return <FiAlertCircle style={{ marginRight: 8 }} />; // Defined
      case 'success':
        return <FiCheckCircle style={{ marginRight: 8 }} />; // Defined
      case 'info':
        return <FiLoader style={{ marginRight: 8 }} className="animate-spin" />; // Defined
      default:
        return null;
    }
  };

  // Status Style Calculation
  const statusStyle = status
    ? {
        ...styles.status,
        color: status.type === "error" ? "#f87171" : status.type === "success" ? "#34d399" : "#a78bfa",
        backgroundColor: status.type === "error" ? "rgba(248,113,113,0.1)" : status.type === "success" ? "rgba(52,211,153,0.1)" : "rgba(167,139,250,0.1)",
        border: status.type === "error" ? "1px solid #f87171" : status.type === "success" ? "1px solid #34d399" : "1px solid #a78bfa",
      }
    : {};

  return (
    <div style={styles.container}>
      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        .input-focus:focus {
          border-color: #a78bfa !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.4) !important;
        }

        .input-placeholder::placeholder {
          color: #9ca3af !important;
        }

        .button-primary {
            background: linear-gradient(90deg, #9333ea, #e91e63) !important;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(147, 51, 234, 0.3);
        }
        .button-primary:hover {
            background: linear-gradient(90deg, #a78bfa, #fbcfe8) !important;
            box-shadow: 0 6px 20px rgba(147, 51, 234, 0.5) !important; 
            transform: translateY(-1px) !important;
        }
        .button-primary:active {
          transform: scale(0.98) !important;
        }

        .link-hover:hover {
          color: #c4b5fd !important;
        }
        
        .vibe-background {
            background-image: linear-gradient(to right, rgba(147,51,234,0.06) 1px, transparent 1px), 
                              linear-gradient(to bottom, rgba(233,30,99,0.04) 1px, transparent 1px);
            background-size: 30px 30px; 
            opacity: 0.1;
            position: absolute;
            inset: 0;
            z-index: 1;
        }
        `}
      </style>
      
      <div className="vibe-background"></div>

      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>
            <FiTerminal style={{ color: '#a78bfa', marginRight: 8, fontSize: 32 }} /> {/* Defined */}
            <span style={{ color: '#e5e7eb' }}>Neura</span>
            <span style={{ color: '#a78bfa' }}>Twin</span>
          </h1>
        </div>

        <h2 style={styles.title}>
          {isSignup ? "Create Your AI Analyst Account" : "Access Your Data Dashboard"}
        </h2>
        <p style={styles.subtitle}>
          {isSignup ? "Unlock predictive modeling and automated reports." : "Log in securely to continue your analysis."}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <FiMail style={styles.inputIcon} /> {/* Defined */}
            <input
              type="email"
              placeholder="Email Address"
              style={styles.input}
              className="input-focus input-placeholder"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <FiLock style={styles.inputIcon} /> {/* Defined */}
            <input
              type="password"
              placeholder="Password"
              style={styles.input}
              className="input-focus input-placeholder"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div style={styles.passwordOptions}>
            {!isSignup && (
                <span style={styles.forgotPassword} className="link-hover">Forgot Password?</span>
            )}
          </div>

          <button type="submit" style={styles.button} className="button-primary">
            {isSignup ? <><FiUserPlus style={{ marginRight: 8 }} /> Sign Up</> : <><FiLogIn style={{ marginRight: 8 }} /> Log In</>} {/* Defined */}
          </button>
        </form>

        {status && <p style={statusStyle}>{getStatusIcon(status.type)}{status.message}</p>}

        <p style={styles.switchText}>
          {isSignup ? "Already have an account?" : "New to NeuraTwin?"}
          <span
            style={styles.switchLink}
            className="link-hover"
            onClick={() => {
              setIsSignup(!isSignup);
              setStatus(null);
              setEmail("");
              setPassword("");
            }}
          >
            {isSignup ? " Log in" : " Create an account"}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    background: "linear-gradient(135deg, #0f0a1c, #050210)", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, sans-serif",
    color: '#e5e7eb',
    position: 'relative',
    overflow: 'hidden',
    padding: 20,
  },
  card: {
    width: 400,
    padding: 40,
    background: "#120D1A99",
    backdropFilter: 'blur(10px)',
    borderRadius: 20, 
    boxShadow: "0 10px 60px rgba(0, 0, 0, 0.6), 0 0 80px rgba(147, 51, 234, 0.25)", 
    border: "1px solid #374151",
    transform: 'none', 
    position: 'relative',
    zIndex: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 30, 
    fontWeight: '900', 
    color: '#a78bfa', 
    margin: 0,
    letterSpacing: -1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 8, 
    fontSize: 32,
    textAlign: "center",
    fontWeight: "800",
    color: '#e5e7eb',
  },
  subtitle: {
    marginBottom: 35, 
    fontSize: 16,
    textAlign: "center",
    fontWeight: "400",
    color: '#9ca3af',
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20, 
  },
  inputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    color: '#a78bfa',
    fontSize: 20,
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '16px 16px 16px 50px',
    borderRadius: 12,
    border: "1px solid #4b5563",
    background: "#2a3440",
    color: '#e5e7eb',
    fontSize: 16,
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  passwordOptions: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: 14,
    marginBottom: 5,
  },
  forgotPassword: {
    color: '#9ca3af',
    cursor: 'pointer',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  button: {
    padding: 16, 
    borderRadius: 12,
    fontSize: 18, 
    color: "#fff",
    cursor: "pointer",
    border: "none",
    marginTop: 15, 
    fontWeight: "700",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: "background 0.3s ease, transform 0.1s ease",
    letterSpacing: 0.8,
  },
  status: {
    marginTop: 25,
    padding: 14, 
    borderRadius: 12,
    textAlign: "center",
    fontSize: 15,
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  switchText: {
    textAlign: "center",
    marginTop: 35,
    fontSize: 15,
    color: '#9ca3af',
  },
  switchLink: {
    color: "#a78bfa",
    cursor: "pointer",
    fontWeight: "700",
    marginLeft: 4,
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
};
