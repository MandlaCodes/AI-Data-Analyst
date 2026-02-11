import React from "react";

const InsightCard = ({ title, content, icon: Icon, isPurple = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-6 md:p-8 rounded-2xl border border-white/10 shadow-lg cursor-pointer flex flex-col gap-4 transition-all hover:scale-105 ${
        isPurple ? "bg-purple-600/10" : "bg-white/5"
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-indigo-400" />}
        <h4 className="text-white font-bold text-sm md:text-base">{title}</h4>
      </div>
      <p className="text-white/80 text-sm md:text-[14px] leading-relaxed">
        {content || "N/A"}
      </p>
    </div>
  );
};

export default InsightCard;
