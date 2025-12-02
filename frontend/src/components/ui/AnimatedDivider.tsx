"use client";

import React from "react";

const AnimatedDivider = () => {
  return (
    <div className="relative w-full h-16 overflow-hidden my-8">
      {/* خلفية متدرجة متحركة */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 via-purple-500/20 via-red-500/20 to-transparent animate-pulse"></div>

      {/* الخط الرئيسي المتحرك */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 via-purple-500 via-red-500 to-transparent transform -translate-y-1/2"></div>

      {/* تأثير التوهج المتحرك */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white via-transparent transform -translate-y-1/2 animate-shimmer"></div>

      {/* نقاط متحركة */}
      <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-1 h-1 bg-purple-500 rounded-full animate-ping" style={{animationDelay: "0.5s"}}></div>
      </div>
      <div className="absolute top-1/2 left-3/4 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-1 h-1 bg-red-500 rounded-full animate-ping" style={{animationDelay: "1s"}}></div>
      </div>

      {/* أنماط CSS للرسوم المتحركة */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-50%); }
          100% { transform: translateX(100%) translateY(-50%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default AnimatedDivider;
