import React from 'react';

export function SpikeMascot({ className = "", variant = "default" }: { className?: string, variant?: "default" | "happy" | "sad" | "cool" | "charging" }) {
  // A friendly, confident bull SVG character
  
  const getEyes = () => {
    switch (variant) {
      case "happy":
        return <path d="M70 65 Q75 60 80 65 M120 65 Q125 60 130 65" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />;
      case "sad":
        return <path d="M70 60 Q75 65 80 60 M120 60 Q125 65 130 60" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />;
      case "cool":
        return (
          <g>
            <rect x="65" y="60" width="70" height="15" rx="5" fill="#1e293b" />
            <path d="M60 65 L65 60 M135 60 L140 65" stroke="#1e293b" strokeWidth="3" />
          </g>
        );
      default:
        return (
          <g>
            <circle cx="75" cy="65" r="5" fill="white" />
            <circle cx="125" cy="65" r="5" fill="white" />
          </g>
        );
    }
  };

  const getMouth = () => {
    switch (variant) {
      case "happy":
      case "cool":
        return <path d="M85 115 Q100 130 115 115" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />;
      case "sad":
        return <path d="M85 120 Q100 110 115 120" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />;
      case "charging":
        return <path d="M90 115 L110 115" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />;
      default:
        return <path d="M90 115 Q100 125 110 115" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />;
    }
  };

  const getBrows = () => {
    if (variant === "sad") return <path d="M65 50 L80 55 M135 50 L120 55" stroke="white" strokeWidth="3" strokeLinecap="round" />;
    if (variant === "charging") return <path d="M65 55 L80 50 M135 55 L120 50" stroke="white" strokeWidth="4" strokeLinecap="round" />;
    return <path d="M65 50 L80 50 M135 50 L120 50" stroke="white" strokeWidth="3" strokeLinecap="round" />;
  };

  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full ${className}`}>
      {/* Background shadow/glow */}
      <circle cx="100" cy="100" r="90" fill="currentColor" fillOpacity="0.1" />
      
      {/* Horns */}
      <path d="M50 70 C30 70 20 50 30 30 C50 20 70 40 70 40" fill="#fde047" stroke="#ca8a04" strokeWidth="4" strokeLinejoin="round" />
      <path d="M150 70 C170 70 180 50 170 30 C150 20 130 40 130 40" fill="#fde047" stroke="#ca8a04" strokeWidth="4" strokeLinejoin="round" />
      
      {/* Ears */}
      <path d="M50 90 C30 90 20 100 30 110 C40 115 50 110 60 100" fill="#4f46e5" />
      <path d="M150 90 C170 90 180 100 170 110 C160 115 150 110 140 100" fill="#4f46e5" />

      {/* Head */}
      <path d="M55 60 C55 30 145 30 145 60 C155 100 130 150 100 150 C70 150 45 100 55 60 Z" fill="#6366f1" stroke="#4338ca" strokeWidth="4" />
      
      {/* Snout */}
      <ellipse cx="100" cy="115" rx="35" ry="25" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="2" />
      
      {/* Nostrils */}
      <ellipse cx="85" cy="105" rx="4" ry="6" fill="#1e293b" />
      <ellipse cx="115" cy="105" rx="4" ry="6" fill="#1e293b" />
      
      {/* Facial Features */}
      {getBrows()}
      {getEyes()}
      {getMouth()}
      
      {/* Hair tuft */}
      <path d="M90 35 C95 25 105 25 110 35 C115 25 105 15 100 15 C95 15 85 25 90 35 Z" fill="#4f46e5" />
    </svg>
  );
}
