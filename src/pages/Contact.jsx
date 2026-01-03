import React, { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can integrate an API call or email service
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="py-28 px-6 md:px-32 bg-gray-900 text-white relative z-10">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400">
        Contact us
      </h2>
      
      <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-cyan-500/50 transition-all">
        {submitted ? (
          <div className="text-center py-12">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Thank you!</h3>
            <p className="text-gray-300">Your message has been sent successfully. I’ll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 transition"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 transition"
            />
            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 transition resize-none"
            />
            <button
              type="submit"
              className="px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-400 rounded-xl font-semibold text-white text-lg hover:from-purple-500 hover:to-cyan-300 transition shadow-xl hover:shadow-cyan-500/50 transform hover:scale-105"
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
