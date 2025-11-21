import { cn } from "@/lib/utils";
import React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
    >
      <defs>
        <radialGradient
          id="logo-gradient-radial"
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" style={{ stopColor: "#A0FD32" }} />
          <stop offset="100%" style={{ stopColor: "#29C7FB" }} />
        </radialGradient>
        <linearGradient id="logo-gradient-linear" x1="0%" y1="0%" x2="100%" y2="100%">
           <stop offset="0%" style={{ stopColor: "#A0FD32" }} />
           <stop offset="100%" style={{ stopColor: "#29C7FB" }} />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="url(#logo-gradient-linear)"
        strokeWidth="4"
      />
      {Array.from({ length: 20 }).map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2="50"
          y2="10"
          stroke="currentColor"
          strokeWidth="2.5"
          transform={`rotate(${(i * 360) / 20}, 50, 50)`}
          className="text-primary"
        />
      ))}
       <circle cx="50" cy="50" r="15" fill="url(#logo-gradient-radial)" />
       <circle cx="50" cy="50" r="15" fill="transparent" stroke="hsl(var(--primary))" strokeWidth="2" />
    </svg>
  );
}
