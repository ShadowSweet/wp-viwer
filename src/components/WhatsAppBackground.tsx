import React from 'react';

export const WhatsAppBackground: React.FC = () => {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.06] select-none"
      style={{
        backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #0b141a 1px)`,
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 20px 20px',
      }}
    >
      {/* Svg decorative icons */}
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="wa-pattern" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
            {/* Chat bubble icon */}
            <path
              d="M20 20 h24 a4 4 0 0 1 4 4 v14 a4 4 0 0 1 -4 4 h-16 l-6 6 v-6 a4 4 0 0 1 -2 -4 v-14 a4 4 0 0 1 4 -4 z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Heart */}
            <path
              d="M90 30 a6 6 0 0 1 8 0 a6 6 0 0 1 8 0 q0 8 -8 14 q-8 -6 -8 -14 z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Coffee cup */}
            <path
              d="M130 90 h16 v12 a6 6 0 0 1 -6 6 h-4 a6 6 0 0 1 -6 -6 z M146 94 h4 a3 3 0 0 1 3 3 v2 a3 3 0 0 1 -3 3 h-4"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Camera */}
            <rect x="30" y="100" width="24" height="18" rx="3" fill="none" stroke="#ffffff" strokeWidth="2" />
            <circle cx="42" cy="109" r="4" fill="none" stroke="#ffffff" strokeWidth="2" />
            <rect x="34" y="96" width="6" height="4" rx="1" fill="#ffffff" />
            {/* Star */}
            <polygon
              points="100,120 103,128 112,128 105,133 108,141 100,136 92,141 95,133 88,128 97,128"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wa-pattern)" />
      </svg>
    </div>
  );
};
