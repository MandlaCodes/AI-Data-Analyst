// src/pages/Security.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Security({ profile }) {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [recentLogins, setRecentLogins] = useState([]);

  useEffect(() => {
    // Simulate fetching recent login activity
    const fetchLogins = () => {
      setRecentLogins([
        { device: "Chrome on Windows 11", location: "Johannesburg, ZA", time: "Today, 10:23 AM" },
        { device: "Safari on iPhone", location: "Cape Town, ZA", time: "Yesterday, 8:45 PM" },
        { device: "Firefox on MacOS", location: "London, UK", time: "2 days ago, 3:10 PM" },
      ]);
    };
    fetchLogins();
  }, []);

  const toggle2FA = () => {
    setTwoFAEnabled((prev) => !prev);
    alert(`Two-Factor Authentication ${!twoFAEnabled ? "Enabled" : "Disabled"}`);
  };

  const handlePasswordChange = () => {
    const newPass = prompt("Enter your new password:");
    if (newPass) alert("Password changed successfully!");
  };

  return (
    <div className="w-full h-full flex flex-col gap-12 overflow-hidden">
      <h1 className="text-4xl font-bold text-purple-300 mb-6">Security Settings</h1>

      {/* Password Change */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-black/30 to-black/60 border border-gray-700 shadow-lg"
      >
        <h2 className="text-2xl font-semibold text-white mb-2">Change Password</h2>
        <p className="text-gray-300 mb-4">Update your account password regularly to stay secure.</p>
        <button
          onClick={handlePasswordChange}
          className="py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
        >
          Change Password
        </button>
      </motion.div>

      {/* Two-Factor Authentication */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-black/30 to-black/60 border border-gray-700 shadow-lg"
      >
        <h2 className="text-2xl font-semibold text-white mb-2">Two-Factor Authentication (2FA)</h2>
        <p className="text-gray-300 mb-4">
          Add an extra layer of security to your account by enabling 2FA.
        </p>
        <button
          onClick={toggle2FA}
          className={`py-3 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 ${
            twoFAEnabled
              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          }`}
        >
          {twoFAEnabled ? "Disable 2FA" : "Enable 2FA"}
        </button>
      </motion.div>

      {/* Recent Logins */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-black/30 to-black/60 border border-gray-700 shadow-lg"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">Recent Login Activity</h2>
        <div className="flex flex-col gap-3">
          {recentLogins.map((login, i) => (
            <div
              key={i}
              className="p-4 bg-gray-900/50 rounded-xl flex justify-between items-center text-gray-300"
            >
              <div>
                <p className="font-medium">{login.device}</p>
                <p className="text-sm">{login.location}</p>
              </div>
              <p className="text-sm text-gray-400">{login.time}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
