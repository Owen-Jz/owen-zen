"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { playSound as playSoundFile } from "@/lib/soundService";
import type { SoundEvent } from "@/lib/soundEvents";

// SoundContext for global mute state
interface SoundContextValue {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  playSound: (event: SoundEvent) => void;
}

const SoundContext = createContext<SoundContextValue>({
  isMuted: false,
  setMuted: () => {},
  playSound: () => {},
});

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sound-muted");
    if (stored !== null) {
      setIsMuted(stored === "true");
    }
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    localStorage.setItem("sound-muted", String(muted));
  }, []);

  const playSound = useCallback(
    (event: SoundEvent) => {
      if (!isMuted) {
        playSoundFile(event);
      }
    },
    [isMuted]
  );

  return (
    <SoundContext.Provider value={{ isMuted, setMuted, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext() {
  return useContext(SoundContext);
}

// Backward-compatible sound triggers using MP3 files
const SOUND_EVENTS = {
  complete: "TASK_COMPLETED" as SoundEvent,
  tick: "POMODORO_STARTED" as SoundEvent,
  alarm: "BREAK_ENDED" as SoundEvent,
  success: "GOAL_ACHIEVED" as SoundEvent,
};

export const useSound = () => {
  const { playSound: contextPlaySound, isMuted, setMuted } = useSoundContext();

  const playComplete = useCallback(() => {
    if (!isMuted) playSoundFile(SOUND_EVENTS.complete);
  }, [isMuted]);

  const playSuccess = useCallback(() => {
    if (!isMuted) playSoundFile(SOUND_EVENTS.success);
  }, [isMuted]);

  const playAlarm = useCallback(() => {
    if (!isMuted) playSoundFile(SOUND_EVENTS.alarm);
  }, [isMuted]);

  const playTick = useCallback(() => {
    if (!isMuted) playSoundFile(SOUND_EVENTS.tick);
  }, [isMuted]);

  return { playComplete, playSuccess, playAlarm, playTick, isMuted, setMuted };
};

// Standalone playSound for new code
export { playSoundFile };
