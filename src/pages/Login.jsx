import React, { useState } from "react";
import { FiLogIn, FiUserPlus, FiAlertCircle, FiCheckCircle, FiLoader } from "react-icons/fi";

// Use the correct Render URL for the backend connection
const API = "https://ai-data-analyst-backend-1nuw.onrender.com";

export default function Login({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null); // Use null initially, string for status

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
        // Display API error message with error type
        setStatus({ message: data.error || "An unknown error occurred.", type: "error" });
        return;
      }

      // --- Success ---
      localStorage.setItem("adt_token", data.token);
      localStorage.setItem(
        "adt_profile",
        JSON.stringify({ user_id: data.user_id, email })
      );

      setStatus({ message: "Success! Redirecting...", type: "success" });
      onLoginSuccess(data.user_id);
    } catch (err) {
      console.error(err);
      setStatus({ message: "Could not connect to server.", type: "error" });
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'error':
        return <FiAlertCircle style={{ marginRight: 8 }} />;
      case 'success':
        return <FiCheckCircle style={{ marginRight: 8 }} />;
      case 'info':
        return <FiLoader style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} className="animate-spin" />;
      default:
        return null;
    }
  };

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
      {/* CSS animation keyframe for the loader */}
      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        `}
      </style>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>
            <span style={{ color: '#a78bfa', marginRight: 8 }}>AI</span>
            <span style={{ color: '#e5e7eb' }}>Data Analyst</span>
          </h1>
        </div>

        <h2 style={styles.title}>
          {isSignup ? "Create Your Account" : "Sign In to Your Dashboard"}
        </h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email Address"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <div style={styles.passwordOptions}>
            {!isSignup && (
                <span style={styles.forgotPassword}>Forgot Password?</span>
            )}
          </div>

          <button type="submit" style={styles.button}>
            {isSignup ? <><FiUserPlus style={{ marginRight: 8 }} /> Sign Up</> : <><FiLogIn style={{ marginRight: 8 }} /> Log In</>}
          </button>
        </form>

        {status && <p style={statusStyle}>{getStatusIcon(status.type)}{status.message}</p>}

        <p style={styles.switchText}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <span
            style={styles.switchLink}
            onClick={() => {
              setIsSignup(!isSignup);
              setStatus(null); // Clear status when switching
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
    // Dark background matching the app's overall theme
    background: "linear-gradient(180deg, #0b0f1a, #12062d)", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, sans-serif",
    color: '#e5e7eb',
  },
  card: {
    width: 380,
    padding: 40,
    // Dark card background
    background: "#1f2937", 
    borderRadius: 16,
    // Subtle, glowing shadow
    boxShadow: "0 0 30px rgba(167, 139, 250, 0.1), 0 10px 25px rgba(0,0,0,0.4)", 
    border: "1px solid #374151",
  },
  header: {
    textAlign: 'center',
    marginBottom: 25,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#a78bfa', // Purple highlight
    margin: 0,
  },
  title: {
    marginBottom: 25,
    fontSize: 24,
    textAlign: "center",
    fontWeight: "700",
    color: '#e5e7eb',
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },
  input: {
    padding: 14,
    borderRadius: 8,
    // Dark input fields
    border: "1px solid #4b5563",
    background: "#374151",
    color: '#e5e7eb',
    fontSize: 16,
    transition: "border-color 0.2s",
    // Placeholder text color
    '::placeholder': {
      color: '#9ca3af',
    },
    // Focus effect
    ':focus': {
        borderColor: '#a78bfa',
        outline: 'none',
        boxShadow: '0 0 0 2px rgba(167, 139, 250, 0.5)',
    },
  },
  passwordOptions: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: 14,
  },
  forgotPassword: {
    color: '#9ca3af',
    cursor: 'pointer',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s',
    ':hover': {
        color: '#a78bfa',
    }
  },
  button: {
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    // Primary button color (Purple)
    background: "#8b5cf6", 
    color: "#fff",
    cursor: "pointer",
    border: "none",
    marginTop: 10,
    fontWeight: "600",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: "background 0.3s ease, transform 0.1s ease",
    // Hover/Active styles for button
    ':hover': {
        background: '#7c3aed',
    },
    ':active': {
        transform: 'scale(0.98)',
    }
  },
  status: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 14,
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchText: {
    textAlign: "center",
    marginTop: 25,
    fontSize: 14,
    color: '#9ca3af',
  },
  switchLink: {
    color: "#a78bfa", // Purple link color
    cursor: "pointer",
    fontWeight: "700",
    marginLeft: 4,
    textDecoration: 'none',
    transition: 'color 0.2s',
    ':hover': {
        color: '#c4b5fd',
    }
  },
};