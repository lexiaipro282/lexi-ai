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

export function MobileInteractiveBackground({ theme = "default" }: { theme?: "default" | "blue-phoenix" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [particles, setParticles] = useState<Particle[]>([]);

  // Smaller blobs for mobile
  const blobs: BlobConfig[] =
    theme === "blue-phoenix"
      ? [
          { id: 1, x: 15, y: 25, size: 400, color: "rgba(30, 100, 200, 0.35)", delay: 0, speed: 0.04 },
          { id: 2, x: 85, y: 15, size: 350, color: "rgba(60, 150, 255, 0.3)", delay: 1, speed: 0.035 },
          { id: 3, x: 50, y: 75, size: 450, color: "rgba(40, 120, 220, 0.25)", delay: 2, speed: 0.045 },
          { id: 4, x: 25, y: 85, size: 300, color: "rgba(80, 180, 255, 0.2)", delay: 0.5, speed: 0.03 },
          { id: 5, x: 75, y: 55, size: 380, color: "rgba(100, 160, 255, 0.28)", delay: 1.5, speed: 0.038 },
        ]
      : [
          { id: 1, x: 15, y: 25, size: 400, color: "rgba(255, 60, 30, 0.35)", delay: 0, speed: 0.04 },
          { id: 2, x: 85, y: 15, size: 350, color: "rgba(255, 100, 40, 0.3)", delay: 1, speed: 0.035 },
          { id: 3, x: 50, y: 75, size: 450, color: "rgba(255, 40, 80, 0.25)", delay: 2, speed: 0.045 },
          { id: 4, x: 25, y: 85, size: 300, color: "rgba(180, 30, 120, 0.2)", delay: 0.5, speed: 0.03 },
          { id: 5, x: 75, y: 55, size: 380, color: "rgba(255, 140, 30, 0.28)", delay: 1.5, speed: 0.038 },
        ];

  // Initialize particles with fewer for mobile performance
  useEffect(() => {
    const initialParticles: Particle[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
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
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      let clientX, clientY;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0]?.clientX || 0;
        clientY = e.touches[0]?.clientY || 0;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {/* Animated blobs */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="blur-mobile" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
          </filter>
        </defs>

        {blobs.map((blob) => (
          <g key={blob.id}>
            <circle
              cx={`${blob.x}%`}
              cy={`${blob.y}%`}
              r={blob.size}
              fill={blob.color}
              filter="url(#blur-mobile)"
              style={{
                animation: `float-mobile ${8 + blob.id}s ease-in-out ${blob.delay}s infinite`,
              }}
            />
          </g>
        ))}

        {/* Particles */}
        {particles.map((particle) => (
          <circle
            key={particle.id}
            cx={`${particle.x}%`}
            cy={`${particle.y}%`}
            r={particle.size}
            fill="white"
            opacity={particle.opacity}
          />
        ))}
      </svg>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(600px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0, 0, 0, 0.15), transparent 80%)",
          "--mouse-x": `${mousePos.x}%`,
          "--mouse-y": `${mousePos.y}%`,
        } as React.CSSProperties}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 opacity-50 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />

      <style jsx>{`
        @keyframes float-mobile {
          0%, 100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(30px, -50px);
          }
          66% {
            transform: translate(-20px, 50px);
          }
        }
      `}</style>
    </div>
  );
}
