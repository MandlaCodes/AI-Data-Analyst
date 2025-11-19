// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGoogle, FaExchangeAlt, FaUserCircle, FaBell, FaMoon, FaSun } from "react-icons/fa";
import axios from "axios";

export default function Profile() {
  const userId = "123"; // replace with real auth ID

  const [user, setUser] = useState({ name: "Mandla Ndhlovu", email: "mandlandhlovu264@gmail.com" });
  const [connectedApps, setConnectedApps] = useState([]);
  const [theme, setTheme] = useState("light");

  // fetch connected apps
  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/connected-apps?user_id=${userId}`)
      .then((res) => {
        const data = res.data || {};
        if (Array.isArray(data.apps)) {
          setConnectedApps(data.apps.map((a) => ({ ...a })));
        } else {
          const apps = Object.entries(data).map(([k, v]) => ({ key: k, status: v ? "connected" : "not_connected" }));
          setConnectedApps(apps);
        }
      })
      .catch(() => setConnectedApps([]));
  }, []);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const handleReconnect = (appKey) => {
    alert(`Reconnect flow for ${appKey} (placeholder)`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 text-white p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <FaUserCircle className="w-16 h-16 text-gray-200" />
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-gray-300">{user.email}</p>
          </div>
        </div>

        {/* Theme & Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-indigo-700 to-purple-700 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {theme === "light" ? <FaSun /> : <FaMoon />}
              <span>Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
            </div>
            <button onClick={toggleTheme} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition">
              Toggle
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-green-700 to-teal-600 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FaBell />
              <span>Notifications</span>
            </div>
            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition">Manage</button>
          </motion.div>
        </div>

        {/* Connected Apps */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Connected Apps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {connectedApps.length === 0 && (
              <p className="text-gray-300 col-span-full">No apps connected yet.</p>
            )}
            {connectedApps.map((app) => (
              <motion.div
                key={app.key}
                whileHover={{ scale: 1.03 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg flex flex-col items-center justify-center gap-3 text-center"
              >
                <FaGoogle className="w-10 h-10 text-white" />
                <h3 className="text-lg font-semibold capitalize">{app.key.replace("_", " ")}</h3>
                <p className={`text-sm ${app.status === "connected" ? "text-green-400" : "text-red-400"}`}>
                  {app.status}
                </p>
                {app.status !== "connected" && (
                  <button
                    onClick={() => handleReconnect(app.key)}
                    className="px-3 py-1 mt-2 bg-white/20 hover:bg-white/30 rounded-xl transition text-white text-sm"
                  >
                    Reconnect
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-2xl bg-red-700/70 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
          <p className="mb-4 text-gray-200">You can delete your account and all associated data here. This action cannot be undone.</p>
          <button className="px-6 py-2 bg-red-500 hover:bg-red-400 rounded-xl transition font-bold">Delete Account</button>
        </div>
      </motion.div>
    </div>
  );
}
