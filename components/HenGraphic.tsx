
import React from 'react';

interface HenGraphicProps {
  color?: string;
  size?: number;
}

const HenGraphic: React.FC<HenGraphicProps> = ({ color = '#E5D3C5', size = 200 }) => {
  return (
    <div style={{ width: size, height: size * 0.85 }} className="relative flex items-center justify-center">
      <svg
        viewBox="0 0 200 170"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_10px_25px_rgba(45,45,45,0.04)]"
      >
        {/* Tail Feathers */}
        <g fill={color} opacity="0.85">
          <circle cx="35" cy="85" r="22" />
          <circle cx="45" cy="65" r="18" />
          <circle cx="55" cy="100" r="20" />
        </g>
        
        {/* Main Body */}
        <path
          d="M25 140 C 25 50, 175 50, 175 140 L 25 140 Z"
          fill={color}
        />

        {/* Floor Shadow */}
        <ellipse cx="100" cy="142" rx="75" ry="5" fill="rgba(45,45,45,0.03)" />

        {/* Head */}
        <circle cx="155" cy="75" r="32" fill={color} />
        
        {/* Comb - Terracotta shade */}
        <path
          d="M135 55 Q 145 35 155 45 Q 165 35 175 45 Q 185 35 190 55"
          fill="#B66649"
        />

        {/* Wattle */}
        <path
          d="M178 88 C 178 100, 192 100, 192 88 L 185 85 Z"
          fill="#B66649"
        />

        {/* Beak - Caramel shade */}
        <path 
          d="M185 75 L 202 82 L 185 89 Z" 
          fill="#D48C45" 
          stroke="#C2974D" 
          strokeWidth="0.5" 
          strokeLinejoin="round"
        />

        {/* Eye */}
        <circle cx="168" cy="70" r="3.5" fill="#2D2D2D" />
        <circle cx="169" cy="69" r="1" fill="white" />

        {/* Wing Highlight */}
        <path
          d="M70 105 Q 100 85 130 105"
          stroke="rgba(45,45,45,0.06)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        
        {/* Subtle Textures */}
        <circle cx="85" cy="120" r="1.5" fill="rgba(45,45,45,0.05)" />
        <circle cx="100" cy="115" r="1.5" fill="rgba(45,45,45,0.05)" />
      </svg>
    </div>
  );
};

export default HenGraphic;
