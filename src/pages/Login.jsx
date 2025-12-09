import React, { useState } from "react";

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

  const statusStyle = status
    ? {
        ...styles.status,
        color: status.type === "error" ? "#e74c3c" : status.type === "success" ? "#27ae60" : "#3498db",
        backgroundColor: status.type === "error" ? "#fbe4e4" : status.type === "success" ? "#e5f7ed" : "#f0f8ff",
      }
    : {};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>📊 DataViz</h1>
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
            {isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        {status && <p style={statusStyle}>{status.message}</p>}

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
            {isSignup ? " Log in" : " Sign up"}
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
    // Subtle background color
    background: "#f7f9fc", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, sans-serif", // Modern font
  },
  card: {
    width: 360,
    padding: 40,
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
    border: "1px solid #e0e0e0",
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#34495e',
    margin: 0,
  },
  title: {
    marginBottom: 25,
    fontSize: 24,
    textAlign: "center",
    fontWeight: "700",
    color: '#34495e',
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },
  input: {
    padding: 14,
    borderRadius: 8,
    border: "1px solid #dcdcdc",
    fontSize: 16,
    transition: "border-color 0.2s",
  },
  passwordOptions: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: 14,
  },
  forgotPassword: {
    color: '#3498db',
    cursor: 'pointer',
    textDecoration: 'none',
    fontWeight: '500',
  },
  button: {
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    background: "#34495e", // Primary action color
    color: "#fff",
    cursor: "pointer",
    border: "none",
    marginTop: 10,
    fontWeight: "600",
    transition: "background 0.3s ease",
  },
  status: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 14,
    fontWeight: '500',
    border: '1px solid transparent',
  },
  switchText: {
    textAlign: "center",
    marginTop: 25,
    fontSize: 14,
    color: '#7f8c8d',
  },
  switchLink: {
    color: "#3498db",
    cursor: "pointer",
    fontWeight: "700",
    marginLeft: 4,
    textDecoration: 'none',
  },
};