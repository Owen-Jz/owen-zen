import { SoundEvent, soundEventMap } from './soundEvents';

const audioCache = new Map<string, HTMLAudioElement>();

let aiResponseIndex = 1;

function getAudio(src: string): HTMLAudioElement {
  if (audioCache.has(src)) {
    return audioCache.get(src)!;
  }
  const audio = new Audio(src);
  audio.preload = 'none';
  audioCache.set(src, audio);
  return audio;
}

export function playSound(event: SoundEvent): void {
  let src = soundEventMap[event];

  // Rotate AI response sounds for variety
  if (event === 'AI_RESPONSE_RECEIVED') {
    src = `/sounds/responseReceived${aiResponseIndex}.mp3`;
    aiResponseIndex = aiResponseIndex >= 4 ? 1 : aiResponseIndex + 1;
  }

  const audio = getAudio(src);
  audio.currentTime = 0;
  audio.play().catch(() => {
    // Silently fail if audio can't play (e.g., browser policy)
  });
}

export function preloadSound(event: SoundEvent): void {
  const src = soundEventMap[event];
  if (!audioCache.has(src)) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audioCache.set(src, audio);
  }
}
