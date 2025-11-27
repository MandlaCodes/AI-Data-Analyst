import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    businessName: "",
    industry: "",
    logo: null,
    primaryMetric: "Revenue",
    timeZone: "Africa/Johannesburg",
    reportFrequency: "Weekly",
    dataSources: { googleSheets: false, csv: false, stripe: false },
    teamEmails: "",
  });

  const industries = ["Restaurant", "Gym", "Retail", "Marketing", "Security", "Other"];
  const metrics = ["Revenue", "Orders", "Customers"];
  const timeZones = ["Africa/Johannesburg", "UTC", "America/New_York", "Europe/London"];
  const frequencies = ["Daily", "Weekly", "Monthly"];

  const steps = [
    {
      title: "Business Info",
      content: (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Business Name"
            value={profile.businessName}
            onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
          />
          <select
            value={profile.industry}
            onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            <option value="">Select Industry</option>
            {industries.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
          <input
            type="file"
            onChange={(e) => setProfile({ ...profile, logo: e.target.files?.[0] || null })}
            className="text-sm text-gray-300"
          />
        </div>
      ),
    },
    {
      title: "Metrics & Reporting",
      content: (
        <div className="space-y-4">
          <select
            value={profile.primaryMetric}
            onChange={(e) => setProfile({ ...profile, primaryMetric: e.target.value })}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            {metrics.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <select
            value={profile.timeZone}
            onChange={(e) => setProfile({ ...profile, timeZone: e.target.value })}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            {timeZones.map((tz) => (
              <option key={tz}>{tz}</option>
            ))}
          </select>
          <select
            value={profile.reportFrequency}
            onChange={(e) => setProfile({ ...profile, reportFrequency: e.target.value })}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            {frequencies.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Team Emails (comma-separated)"
            value={profile.teamEmails}
            onChange={(e) => setProfile({ ...profile, teamEmails: e.target.value })}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
          />
        </div>
      ),
    },
    {
      title: "Data Sources",
      content: (
        <div className="space-y-3">
          {Object.keys(profile.dataSources).map((source) => (
            <label key={source} className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={profile.dataSources[source]}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    dataSources: { ...profile.dataSources, [source]: e.target.checked },
                  })
                }
                className="accent-purple-500"
              />
              {source === "googleSheets" ? "Google Sheets" : source.toUpperCase()}
            </label>
          ))}
        </div>
      ),
    },
    {
      title: "Finalize",
      content: (
        <div className="text-gray-300 space-y-2">
          <p>
            You are about to create a personalized AI Analyst for <strong>{profile.businessName}</strong>.
          </p>
          <p>Primary Metric: {profile.primaryMetric}</p>
          <p>Report Frequency: {profile.reportFrequency}</p>
          <p>Timezone: {profile.timeZone}</p>
          <p>Team Members: {profile.teamEmails || "None"}</p>
          <p>
            Connected Data Sources:{" "}
            {Object.keys(profile.dataSources)
              .filter((k) => profile.dataSources[k])
              .join(", ") || "None"}
          </p>
        </div>
      ),
    },
  ];

  function next() {
    if (step < steps.length - 1) return setStep(step + 1);
    localStorage.setItem("adt_profile", JSON.stringify(profile));
    setTimeout(() => onComplete(profile), 900);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-gray-900 p-6">
      <motion.div
        className="w-full max-w-2xl p-8 rounded-3xl bg-black/50 backdrop-blur-md border border-gray-700 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-2xl font-bold mb-6 text-purple-300">Setup Your AI Analyst</h3>

        {/* Step Indicators */}
        <div className="flex justify-between mb-6">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className={`w-8 h-2 rounded-full ${step >= i ? "bg-purple-500" : "bg-gray-700"}`}
              animate={{ scale: step === i ? 1.3 : 1 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 min-h-[220px] mb-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h4 className="text-lg font-semibold text-purple-200 mb-3">{steps[step].title}</h4>
              {steps[step].content}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={next}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 transition-transform"
          >
            {step === steps.length - 1 ? "Develop AI" : "Next"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
