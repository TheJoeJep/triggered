import React from "react";
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("h-10 w-10", className)}
      fill="none"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9900" />
          <stop offset="100%" stopColor="#FF5500" />
        </linearGradient>
      </defs>
      {/* Outer Circle Ring */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="url(#logo-gradient)"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Lightning Bolt */}
      <path
        d="M55 15 L35 55 L50 55 L45 85 L65 45 L50 45 L55 15 Z"
        fill="url(#logo-gradient)"
        stroke="white"
        strokeWidth="1"
      />
    </svg>
  );
};
