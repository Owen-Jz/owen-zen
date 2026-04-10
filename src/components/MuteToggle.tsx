"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSoundContext } from "@/components/SoundEffects";
import { motion } from "framer-motion";

export function MuteToggle() {
  const { isMuted, setMuted } = useSoundContext();

  return (
    <button
      onClick={() => setMuted(!isMuted)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full"
      title={isMuted ? "Unmute sounds" : "Mute sounds"}
    >
      <motion.div
        initial={false}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </motion.div>
      <span className="text-sm font-medium">
        {isMuted ? "Unmute" : "Sound FX"}
      </span>
    </button>
  );
}
