"use client";

import React, { useEffect, useRef } from "react";
import { AgentProfile } from "@/lib/types";

interface ReactBitsBackgroundProps {
  activeAgent: AgentProfile;
  accentColor: string;
  particleDensity?: "HIGH" | "MEDIUM" | "OFF";
  glowIntensity?: number;
}

export const ReactBitsBackground: React.FC<ReactBitsBackgroundProps> = ({
  activeAgent,
  accentColor,
  particleDensity = "MEDIUM",
  glowIntensity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Initial mouse pos
    mouseRef.current.x = width / 2;
    mouseRef.current.y = height / 2;
    mouseRef.current.targetX = width / 2;
    mouseRef.current.targetY = height / 2;

    // Particles setup
    const particleCount = particleDensity === "HIGH" ? 60 : particleDensity === "MEDIUM" ? 35 : 0;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.8,
      speedY: Math.random() * 0.4 + 0.15,
      speedX: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.6 + 0.2,
      maxAlpha: Math.random() * 0.7 + 0.3,
    }));

    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, width, height);

      // 1. BASE DEEP VOID
      ctx.fillStyle = "#040508";
      ctx.fillRect(0, 0, width, height);

      // 2. REACT.BITS AURORA FLUID BEAMS (Top & Mid)
      const auroraColors = [activeAgent.color, accentColor, "#3b82f6"];
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.beginPath();
        const baseOffset = (i * Math.PI) / 3;
        const waveY = height * 0.25 + Math.sin(time * 0.8 + baseOffset) * 60;

        ctx.moveTo(0, waveY);
        for (let x = 0; x <= width; x += 40) {
          const y =
            waveY +
            Math.sin(x * 0.003 + time + baseOffset) * 70 +
            Math.cos(x * 0.001 - time * 0.5) * 40;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, width, height * 0.6);
        const col = auroraColors[i % auroraColors.length];
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.4, `${col}18`);
        grad.addColorStop(0.8, `${col}08`);
        grad.addColorStop(1, "transparent");

        ctx.fillStyle = grad;
        ctx.filter = `blur(${35 * glowIntensity}px)`;
        ctx.fill();
        ctx.restore();
      }

      // 3. REACT.BITS CYBER PERSPECTIVE GRID (Bottom half)
      ctx.save();
      const horizon = height * 0.55;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;

      // Perspective horizontal lines
      for (let i = 1; i <= 12; i++) {
        const py = horizon + Math.pow(i / 12, 2.2) * (height - horizon);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
      }

      // Vanishing vertical lines towards horizon center
      const vanishingX = width * 0.5 + (mx - width * 0.5) * 0.1;
      const numVLines = 24;
      for (let i = -numVLines; i <= numVLines; i++) {
        const bottomX = width * 0.5 + i * (width / 16);
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizon);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }
      ctx.restore();

      // 4. SPOTLIGHT GLOW (Follows cursor)
      ctx.save();
      const spotGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 400 * glowIntensity);
      spotGrad.addColorStop(0, `${accentColor}1c`);
      spotGrad.addColorStop(0.4, `${activeAgent.color}0a`);
      spotGrad.addColorStop(1, "transparent");
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // 5. RADIANITE PARTICLES
      if (particleCount > 0) {
        ctx.save();
        particles.forEach((p) => {
          p.y -= p.speedY;
          p.x += p.speedX;

          // Mouse gentle repulsion
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const angle = Math.atan2(dy, dx);
            p.x += Math.cos(angle) * 1.5;
            p.y += Math.sin(angle) * 1.5;
          }

          // Wrap boundaries
          if (p.y < 0) {
            p.y = height;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;

          // Render glowing particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = activeAgent.color;
          ctx.globalAlpha = p.alpha * glowIntensity;
          ctx.fill();
        });
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [activeAgent, accentColor, particleDensity, glowIntensity]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* REACT.BITS CANVAS (AURORA + GRID + PARTICLES) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* DYNAMIC HOVERED AGENT PORTRAIT HOLOGRAM */}
      <div
        className="absolute -right-12 top-6 w-[720px] h-[980px] bg-no-repeat bg-contain opacity-25 filter drop-shadow-[0_0_60px_rgba(0,0,0,0.8)] transition-all duration-700 ease-out transform"
        style={{
          backgroundImage: `url(${activeAgent.portrait})`,
        }}
      />

      {/* GIANT JAPANESE KANJI WATERMARK */}
      <div
        className="absolute left-6 bottom-6 text-[22vw] font-black pointer-events-none opacity-5 leading-none transition-all duration-700 font-sans"
        style={{ color: activeAgent.color }}
      >
        {activeAgent.bgKanji}
      </div>

      {/* TOP & BOTTOM CONTRAST VIGNETTES */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#040508]/85 via-transparent to-[#040508]/95" />
    </div>
  );
};
