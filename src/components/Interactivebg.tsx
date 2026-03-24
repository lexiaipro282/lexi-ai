"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

interface BlobConfig {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  speed: number;
}

export function InteractiveBackground({ theme = "default" }: { theme?: "default" | "blue-phoenix" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [particles, setParticles] = useState<Particle[]>([]);

  const blobs: BlobConfig[] =
    theme === "blue-phoenix"
      ? [
          { id: 1, x: 15, y: 25, size: 700, color: "rgba(30, 100, 200, 0.35)", delay: 0, speed: 0.04 },
          { id: 2, x: 85, y: 15, size: 600, color: "rgba(60, 150, 255, 0.3)", delay: 1, speed: 0.035 },
          { id: 3, x: 50, y: 75, size: 800, color: "rgba(40, 120, 220, 0.25)", delay: 2, speed: 0.045 },
          { id: 4, x: 25, y: 85, size: 500, color: "rgba(80, 180, 255, 0.2)", delay: 0.5, speed: 0.03 },
          { id: 5, x: 75, y: 55, size: 650, color: "rgba(100, 160, 255, 0.28)", delay: 1.5, speed: 0.038 },
          { id: 6, x: 10, y: 60, size: 550, color: "rgba(50, 140, 220, 0.22)", delay: 2.5, speed: 0.032 },
          { id: 7, x: 90, y: 80, size: 480, color: "rgba(100, 180, 255, 0.18)", delay: 3, speed: 0.025 },
          { id: 8, x: 35, y: 40, size: 620, color: "rgba(70, 160, 240, 0.15)", delay: 0.8, speed: 0.042 },
          { id: 9, x: 65, y: 20, size: 580, color: "rgba(50, 140, 255, 0.32)", delay: 1.2, speed: 0.036 },
        ]
      : [
          { id: 1, x: 15, y: 25, size: 700, color: "rgba(255, 60, 30, 0.35)", delay: 0, speed: 0.04 },
          { id: 2, x: 85, y: 15, size: 600, color: "rgba(255, 100, 40, 0.3)", delay: 1, speed: 0.035 },
          { id: 3, x: 50, y: 75, size: 800, color: "rgba(255, 40, 80, 0.25)", delay: 2, speed: 0.045 },
          { id: 4, x: 25, y: 85, size: 500, color: "rgba(180, 30, 120, 0.2)", delay: 0.5, speed: 0.03 },
          { id: 5, x: 75, y: 55, size: 650, color: "rgba(255, 140, 30, 0.28)", delay: 1.5, speed: 0.038 },
          { id: 6, x: 10, y: 60, size: 550, color: "rgba(255, 80, 150, 0.22)", delay: 2.5, speed: 0.032 },
          { id: 7, x: 90, y: 80, size: 480, color: "rgba(120, 40, 200, 0.18)", delay: 3, speed: 0.025 },
          { id: 8, x: 35, y: 40, size: 620, color: "rgba(255, 200, 60, 0.15)", delay: 0.8, speed: 0.042 },
          { id: 9, x: 65, y: 20, size: 580, color: "rgba(255, 30, 60, 0.32)", delay: 1.2, speed: 0.036 },
        ];

  // Initialize particles
  useEffect(() => {
    const initialParticles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.02,
      speedY: (Math.random() - 0.5) * 0.02,
      opacity: Math.random() * 0.4 + 0.1,
    }));
    setParticles(initialParticles);
  }, []);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: (p.x + p.speedX + 100) % 100,
          y: (p.y + p.speedY + 100) % 100,
        }))
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {/* Deep phoenix flame base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            theme === "blue-phoenix"
              ? `
            radial-gradient(ellipse 120% 80% at ${mousePos.x}% ${mousePos.y}%, rgba(40, 80, 180, 0.8) 0%, rgba(60, 120, 200, 0.6) 20%, rgba(30, 60, 150, 0.4) 50%, transparent 70%),
            radial-gradient(ellipse at 20% 80%, rgba(50, 100, 180, 0.5) 0%, rgba(35, 70, 150, 0.3) 40%, transparent 70%),
            radial-gradient(ellipse at 80% 20%, rgba(70, 140, 220, 0.4) 0%, rgba(40, 100, 180, 0.2) 50%, transparent 80%),
            linear-gradient(135deg, rgba(15, 30, 80, 0.9) 0%, rgba(30, 60, 140, 0.7) 30%, rgba(10, 25, 70, 0.8) 70%, rgba(20, 50, 120, 0.9) 100%)
          `
              : `
            radial-gradient(ellipse 120% 80% at ${mousePos.x}% ${mousePos.y}%, rgba(80, 20, 40, 0.8) 0%, rgba(120, 30, 60, 0.6) 20%, rgba(40, 10, 30, 0.4) 50%, transparent 70%),
            radial-gradient(ellipse at 20% 80%, rgba(100, 25, 50, 0.5) 0%, rgba(60, 15, 35, 0.3) 40%, transparent 70%),
            radial-gradient(ellipse at 80% 20%, rgba(140, 40, 70, 0.4) 0%, rgba(80, 20, 45, 0.2) 50%, transparent 80%),
            linear-gradient(135deg, rgba(20, 5, 15, 0.9) 0%, rgba(40, 10, 25, 0.7) 30%, rgba(15, 5, 10, 0.8) 70%, rgba(25, 8, 20, 0.9) 100%)
          `,
          transition: "background 0.3s ease-out",
        }}
      />

      {/* Animated blobs */}
      {blobs.map((blob) => (
        <div
          key={blob.id}
          className="absolute animate-blob"
          style={{
            left: `calc(${blob.x}% + ${(mousePos.x - 50) * blob.speed * 80}px)`,
            top: `calc(${blob.y}% + ${(mousePos.y - 50) * blob.speed * 80}px)`,
            width: blob.size,
            height: blob.size,
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 65%)`,
            filter: "blur(80px)",
            animationDelay: `${blob.delay}s`,
            animationDuration: `${8 + blob.delay}s`,
            transition: "left 0.4s ease-out, top 0.4s ease-out",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Primary mouse follower - intense phoenix flame glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          width: 600,
          height: 600,
          background:
            theme === "blue-phoenix"
              ? "radial-gradient(circle, rgba(80, 140, 255, 0.3) 0%, rgba(120, 180, 255, 0.2) 25%, rgba(60, 140, 255, 0.15) 50%, transparent 75%)"
              : "radial-gradient(circle, rgba(255, 80, 40, 0.3) 0%, rgba(255, 120, 60, 0.2) 25%, rgba(255, 60, 100, 0.15) 50%, transparent 75%)",
          filter: "blur(60px)",
          transform: "translate(-50%, -50%)",
          transition: "left 0.15s ease-out, top 0.15s ease-out",
        }}
      />

      {/* Secondary mouse follower - warm ember glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          width: 300,
          height: 300,
          background:
            theme === "blue-phoenix"
              ? "radial-gradient(circle, rgba(100, 160, 255, 0.25) 0%, rgba(100, 160, 255, 0.15) 40%, transparent 80%)"
              : "radial-gradient(circle, rgba(255, 160, 80, 0.25) 0%, rgba(255, 100, 120, 0.15) 40%, transparent 80%)",
          filter: "blur(30px)",
          transform: "translate(-50%, -50%)",
          transition: "left 0.08s ease-out, top 0.08s ease-out",
        }}
      />

      {/* Tertiary mouse follower - subtle flame trail */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          width: 150,
          height: 150,
          background:
            theme === "blue-phoenix"
              ? "radial-gradient(circle, rgba(150, 200, 255, 0.2) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(255, 200, 100, 0.2) 0%, transparent 70%)",
          filter: "blur(15px)",
          transform: "translate(-50%, -50%)",
          transition: "left 0.05s ease-out, top 0.05s ease-out",
        }}
      />

      {/* Floating flame particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background:
              theme === "blue-phoenix"
                ? `rgba(${80 + Math.random() * 80}, ${140 + Math.random() * 80}, 255, ${particle.opacity})`
                : `rgba(255, ${120 + Math.random() * 80}, ${40 + Math.random() * 60}, ${particle.opacity})`,
            boxShadow:
              theme === "blue-phoenix"
                ? `0 0 ${particle.size * 3}px rgba(100, 160, 255, ${particle.opacity * 0.8})`
                : `0 0 ${particle.size * 3}px rgba(255, 140, 60, ${particle.opacity * 0.8})`,
          }}
        />
      ))}

      {/* Phoenix flame vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            theme === "blue-phoenix"
              ? "radial-gradient(ellipse at center, transparent 30%, rgba(10, 15, 40, 0.6) 80%, rgba(15, 25, 60, 0.8) 100%)"
              : "radial-gradient(ellipse at center, transparent 30%, rgba(10, 5, 15, 0.6) 80%, rgba(20, 8, 25, 0.8) 100%)",
        }}
      />

      {/* Subtle ember grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.008]"
        style={{
          backgroundImage:
            theme === "blue-phoenix"
              ? `
            linear-gradient(rgba(100, 160, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(80, 140, 255, 0.2) 1px, transparent 1px)
          `
              : `
            linear-gradient(rgba(255, 120, 60, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 80, 100, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Animated flame pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background:
            theme === "blue-phoenix"
              ? `
            radial-gradient(circle at 20% 80%, rgba(100, 160, 255, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(80, 140, 255, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 180, 255, 0.2) 0%, transparent 50%)
          `
              : `
            radial-gradient(circle at 20% 80%, rgba(255, 100, 50, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 60, 120, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 150, 80, 0.2) 0%, transparent 50%)
          `,
          animation: "pulse-glow 12s ease-in-out infinite",
        }}
      />

      {/* Dynamic flame streaks */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          background:
            theme === "blue-phoenix"
              ? `
            linear-gradient(45deg, transparent 30%, rgba(100, 160, 255, 0.3) 50%, transparent 70%),
            linear-gradient(-45deg, transparent 20%, rgba(80, 140, 255, 0.2) 60%, transparent 80%)
          `
              : `
            linear-gradient(45deg, transparent 30%, rgba(255, 120, 60, 0.3) 50%, transparent 70%),
            linear-gradient(-45deg, transparent 20%, rgba(255, 80, 100, 0.2) 60%, transparent 80%)
          `,
          animation: "gradient-shift 15s ease infinite",
        }}
      />
    </div>
  );
}
