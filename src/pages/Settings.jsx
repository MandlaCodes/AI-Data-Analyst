import React, { useState } from "react";
import { SunIcon, MoonIcon, LockClosedIcon, BellIcon } from "@heroicons/react/24/outline";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500">
        Settings
      </h1>

      {/* Theme Settings */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700 shadow-xl backdrop-blur-lg hover:scale-105 transform transition">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {darkMode ? <MoonIcon className="w-6 h-6 text-indigo-400" /> : <SunIcon className="w-6 h-6 text-yellow-400" />}
            <h3 className="text-xl font-semibold text-white">Theme</h3>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              darkMode ? "bg-indigo-600 hover:bg-indigo-500" : "bg-yellow-500 hover:bg-yellow-400"
            }`}
          >
            {darkMode ? "Dark Mode" : "Light Mode"}
          </button>
        </div>
        <p className="text-gray-300 text-sm">
          Toggle between light and dark mode to customize your dashboard appearance.
        </p>
      </div>

      {/* Notifications */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700 shadow-xl backdrop-blur-lg hover:scale-105 transform transition">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <BellIcon className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Notifications</h3>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              notifications ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {notifications ? "Enabled" : "Disabled"}
          </button>
        </div>
        <p className="text-gray-300 text-sm">
          Control your alerts and notifications for AI insights, analytics updates, and integrations.
        </p>
      </div>

      {/* Security */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700 shadow-xl backdrop-blur-lg hover:scale-105 transform transition">
        <div className="flex items-center gap-3 mb-3">
          <LockClosedIcon className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-semibold text-white">Security</h3>
        </div>
        <p className="text-gray-300 text-sm">
          Manage password, two-factor authentication, and other account security settings.
        </p>
      </div>

      {/* Account */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700 shadow-xl backdrop-blur-lg hover:scale-105 transform transition">
        <h3 className="text-xl font-semibold mb-3 text-white">Account</h3>
        <p className="text-gray-300 text-sm">
          View account details, business info, and subscription settings.
        </p>
      </div>
    </div>
  );
}
