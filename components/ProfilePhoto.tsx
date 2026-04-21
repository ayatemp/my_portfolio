"use client";

import { useState } from "react";

export function ProfilePhoto() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <div
          className="w-20 h-20 rounded-full border border-white/[0.08] flex items-center justify-center"
          style={{ background: "rgba(110,255,212,0.04)" }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="12" r="5" stroke="rgba(110,255,212,0.3)" strokeWidth="1.5" />
            <path d="M5 28c0-6.075 4.925-11 11-11s11 4.925 11 11" stroke="rgba(110,255,212,0.3)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <span className="font-mono text-[9px] tracking-widest text-text-muted uppercase">
          public/img/profile.jpg
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/img/profile.jpg"
      alt="Profile"
      className="w-full h-full object-cover"
      style={{ objectPosition: "50% 12%" }}
      onError={() => setHasError(true)}
    />
  );
}
