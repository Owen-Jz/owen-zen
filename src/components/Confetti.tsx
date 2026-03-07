"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  rotation: number;
  delay: number;
  duration: number;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

let confettiId = 0;
let audioContext: AudioContext | null = null;

const playSuccessSound = () => {
  if (typeof window === "undefined") return;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = 587.33;
  oscillator.type = "sine";
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
  
  setTimeout(() => {
    const osc2 = audioContext!.createOscillator();
    const gain2 = audioContext!.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext!.destination);
    osc2.frequency.value = 1174.66;
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0.2, audioContext!.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext!.currentTime + 0.4);
    osc2.start(audioContext!.currentTime);
    osc2.stop(audioContext!.currentTime + 0.4);
  }, 100);
};

export const Confetti = ({ trigger }: { trigger: number }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      playSuccessSound();
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: confettiId++,
          x: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
        });
      }
      setPieces(newPieces);
      
      setTimeout(() => setPieces([]), 4000);
    }
  }, [trigger]);

  if (pieces.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${piece.x}%`,
            top: "-20px",
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            animation: `confetti-fall ${piece.duration}s ${piece.delay}s ease-out forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export const useConfetti = () => {
  const [trigger, setTrigger] = useState(0);
  
  const fire = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  return { trigger, fire };
};
