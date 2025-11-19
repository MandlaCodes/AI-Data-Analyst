import React, { useState } from "react";

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [primaryMetric, setPrimaryMetric] = useState("Revenue");
  const [timeZone, setTimeZone] = useState("Africa/Johannesburg");
  const [logo, setLogo] = useState(null);

  const steps = [
    {
      title: "Business Details",
      content: (
        <div className="space-y-3">
          <label className="text-sm text-gray-300">Business Name</label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700"
          />

          <label className="text-sm text-gray-300">Industry</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700"
          >
            <option value="">Select industry</option>
            <option>Restaurant</option>
            <option>Gym</option>
            <option>Retail</option>
            <option>Marketing</option>
            <option>Security</option>
            <option>Other</option>
          </select>

          <label className="text-sm text-gray-300">Logo</label>
          <input 
            type="file"
            onChange={(e) => setLogo(e.target.files?.[0] || null)}
            className="text-sm"
          />
        </div>
      ),
    },
    {
      title: "Goals & Metrics",
      content: (
        <div className="space-y-3">
          <label className="text-sm text-gray-300">Primary Metric</label>
          <select
            value={primaryMetric}
            onChange={(e) => setPrimaryMetric(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700"
          >
            <option>Revenue</option>
            <option>Orders</option>
            <option>Customers</option>
          </select>

          <label className="text-sm text-gray-300">Time Zone</label>
          <input
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700"
          />
        </div>
      ),
    },
    {
      title: "Finalize",
      content: (
        <p className="text-gray-300">
          Creating personalized AI analyst for <strong>{businessName}</strong>.
        </p>
      ),
    },
  ];

  function next() {
    if (step < steps.length - 1) return setStep(step + 1);

    const profile = {
      businessName,
      industry,
      primaryMetric,
      timeZone,
      logoName: logo?.name,
    };

    localStorage.setItem("adt_profile", JSON.stringify(profile));
    setTimeout(() => onComplete(profile), 900);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900 text-white p-6 overflow-hidden">
      <div className="w-full max-w-2xl p-8 rounded-3xl bg-black/50 backdrop-blur-md border border-gray-700 shadow-2xl">
        <h3 className="text-2xl font-bold mb-2">Setup your AI Analyst</h3>

        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 mb-4">
          <h4 className="text-lg text-purple-200 font-semibold">{steps[step].title}</h4>
          <div className="mt-3">{steps[step].content}</div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="px-4 py-2 rounded-md border border-gray-700 text-gray-300 disabled:opacity-40"
          >
            Back
          </button>

          <button
            onClick={next}
            className="px-5 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            {step === steps.length - 1 ? "Develop AI" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
