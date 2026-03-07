"use client";

import { useCallback, useRef } from "react";

type SoundType = "complete" | "tick" | "alarm" | "success";

const SOUNDS = {
  complete: { frequency: 587.33, duration: 0.15, type: "sine" as OscillatorType },
  tick: { frequency: 220, duration: 0.05, type: "square" as OscillatorType },
  alarm: { frequency: 440, duration: 0.3, type: "square" as OscillatorType },
  success: { frequency: 783.99, duration: 0.2, type: "sine" as OscillatorType },
};

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playSound = (type: SoundType = "complete", volume: number = 0.3) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const sound = SOUNDS[type];
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = sound.frequency;
  oscillator.type = sound.type;

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + sound.duration);
};

export const useSound = () => {
  const playComplete = useCallback(() => playSound("complete", 0.2), []);
  const playSuccess = useCallback(() => playSound("success", 0.2), []);
  const playAlarm = useCallback(() => playSound("alarm", 0.15), []);
  const playTick = useCallback(() => playSound("tick", 0.05), []);

  return { playComplete, playSuccess, playAlarm, playTick };
};
