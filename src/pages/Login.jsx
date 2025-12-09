import React, { useState } from "react";

// Use the correct Render URL for the backend connection
const API = "https://ai-data-analyst-backend-1nuw.onrender.com";

export default function Login({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Loading...");

    try {
      // Choose between /auth/signup or /auth/login
      const endpoint = isSignup ? "/auth/signup" : "/auth/login";

      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Display API error message
        setStatus(data.error || "Something went wrong");
        return;
      }

      // --- Success ---
      // Store JWT token and profile data
      localStorage.setItem("adt_token", data.token);
      localStorage.setItem(
        "adt_profile",
        JSON.stringify({ user_id: data.user_id, email })
      );

      setStatus("Success!");

      // Call parent handler to update application state (e.g., redirect to dashboard)
      onLoginSuccess(data.user_id);
    } catch (err) {
      console.error(err);
      setStatus("Could not connect to server.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {isSignup ? "Create Your Account" : "Welcome Back"}
        </h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
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

          <button type="submit" style={styles.button}>
            {isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        {status && <p style={styles.status}>{status}</p>}

        <p style={styles.switchText}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <span
            style={styles.switchLink}
            onClick={() => {
              setIsSignup(!isSignup);
              setStatus(""); // Clear status when switching
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
    background: "#f4f4f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: 349,
    padding: 30,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
  },
  title: {
    marginBottom: 20,
    fontSize: 22,
    textAlign: "center",
    fontWeight: "600",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    background: "#000", // Changed color for better contrast
    color: "#fff",
    cursor: "pointer",
    border: "none",
    marginTop: 10,
    transition: "background 0.3s",
  },
  status: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    color: "#d9534f", // Added color for error/status feedback
  },
  switchText: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 14,
  },
  switchLink: {
    color: "#007bff",
    cursor: "pointer",
    fontWeight: "700",
    marginLeft: 4,
  },
};