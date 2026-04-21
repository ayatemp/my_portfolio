"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/projects";
import type { Locale } from "@/lib/getDictionary";

type Props = {
  project: Project;
  index: number;
  locale?: Locale;
};

export default function ProjectCard({ project, index, locale = "ja" }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const maxTilt = 8;
    setTilt({
      x: (py - 0.5) * -maxTilt,
      y: (px - 0.5) * maxTilt,
    });
    setGlowPos({ x: px * 100, y: py * 100 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: hovered
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)",
        transition: hovered ? "transform 0.1s ease-out" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className="animate-on-load"
      data-delay={index}
    >
      <Link href={`/${locale}/projects/${project.slug}`} className="block h-full">
        <div className="relative h-80 border border-white/[0.08] rounded-xl overflow-hidden bg-bg-surface group">
          {/* Spotlight glow that follows cursor */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,213,128,0.12) 0%, transparent 60%)`,
            }}
          />

          {/* Top border glow on hover */}
          <div
            className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: "linear-gradient(90deg, transparent 0%, #FFD580 50%, transparent 100%)" }}
          />

          {/* Card number */}
          <div className="absolute top-6 right-6 font-mono text-[10px] text-white/10 group-hover:text-accent-amber/30 transition-colors">
            {String(index + 1).padStart(2, "0")}
          </div>

          {/* Content */}
          <div className="relative z-10 p-7 h-full flex flex-col">
            {/* Category */}
            <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-accent-amber/60 mb-4">
              {project.category}
            </div>

            {/* Title */}
            <h3 className="font-display text-2xl font-semibold text-text-primary group-hover:text-accent-amber transition-colors leading-tight mb-3">
              {project.title}
            </h3>

            {/* Description */}
            <p className="font-sans text-sm text-text-secondary leading-relaxed flex-1">
              {project.description}
            </p>

            {/* Footer */}
            <div className="flex items-end justify-between mt-6">
              <div className="flex flex-wrap gap-1.5">
                {project.stack.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-[8px] tracking-wider border border-white/[0.08] text-text-muted px-2 py-0.5 rounded-sm group-hover:border-accent-amber/20 group-hover:text-accent-amber/50 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <span className="text-text-muted group-hover:text-accent-amber group-hover:translate-x-1 transition-all text-sm shrink-0 ml-2">
                →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
