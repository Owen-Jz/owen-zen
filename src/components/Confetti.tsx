"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSound } from "@/components/SoundEffects";

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

export const Confetti = ({ trigger }: { trigger: number }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const { playSuccess } = useSound();

  useEffect(() => {
    if (trigger > 0) {
      playSuccess();
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
