"use client";

import { useState, useEffect } from "react";
import { Quote, BookOpen, ExternalLink, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

// --- Data ---
// In a real app, these could be in a DB, but static arrays work great for speed & reliability
const VERSES = [
  { text: "For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future.", ref: "Jeremiah 29:11" },
  { text: "Commit your work to the Lord, and your plans will be established.", ref: "Proverbs 16:3" },
  { text: "I can do all things through him who strengthens me.", ref: "Philippians 4:13" },
  { text: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.", ref: "Isaiah 40:31" },
  { text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.", ref: "Joshua 1:9" },
  { text: "Whatever you do, work heartily, as for the Lord and not for men.", ref: "Colossians 3:23" },
  { text: "Trust in the Lord with all your heart, and do not lean on your own understanding.", ref: "Proverbs 3:5" },
  { text: "The soul of the sluggard craves and gets nothing, while the soul of the diligent is richly supplied.", ref: "Proverbs 13:4" },
  { text: "Do not despise these small beginnings,  for the Lord rejoices to see the work begin.", ref: "Zechariah 4:10" },
  { text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.", ref: "Galatians 6:9" },
  { text: "Iron sharpens iron, and one man sharpens another.", ref: "Proverbs 27:17" },
  { text: "Where there is no vision, the people perish.", ref: "Proverbs 29:18" }
];

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Discipline is doing what you hate to do, but doing it like you love it.", author: "Mike Tyson" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "A fit body, a calm mind, a house full of love. These things cannot be bought – they must be earned.", author: "Naval Ravikant" },
  { text: "It’s not about having time. It’s about making time.", author: "Unknown" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Success is the sum of small efforts, repeated day-in and day-out.", author: "Robert Collier" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Hard choices, easy life. Easy choices, hard life.", author: "Jerzy Gregorek" },
  { text: "Impatience with actions, patience with results.", author: "Naval Ravikant" }
];

const MOODBOARD = [
  "https://i.pinimg.com/736x/25/a7/5e/25a75e8a80ed8c28d853216a662cdda5.jpg", // Physique
  "https://i.pinimg.com/736x/2b/e4/23/2be423633a1409f8aa6fba8b697cdd13.jpg", // Lambo/Luxury
  "https://i.pinimg.com/736x/5c/65/5e/5c655ef1b1148df76467081a03acae6d.jpg", // Modern Apt
  "https://i.pinimg.com/736x/c1/7f/78/c17f78e50861e6aa534599dae0d767a3.jpg", // Team/Vision
  "https://i.pinimg.com/736x/66/59/28/665928e6978026106be714bffcc2ef53.jpg", // Guidance/Faith
  "https://i.pinimg.com/736x/cf/18/fd/cf18fd436e81347f4c8621f5932b6e8d.jpg",  // Buying Mom Car
  "https://i.pinimg.com/736x/10/14/8d/10148d703608eaaaee88e91ec9f28813.jpg", // Drive & Discipline
  "https://i.pinimg.com/736x/32/35/6a/32356a88b8ebd04f59c074a15fa0f38e.jpg", // Elite Professional
  "https://i.pinimg.com/736x/17/7e/72/177e7236ab5e181631fc49ab093fc154.jpg", // The Peak Athlete
];

export const VisionBoardView = () => {
  const [verse, setVerse] = useState(VERSES[0]);
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    // Deterministic Randomness based on Day of Year
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    setVerse(VERSES[dayOfYear % VERSES.length]);
    setQuote(QUOTES[dayOfYear % QUOTES.length]);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* --- Header --- */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-primary">Vision</span> & Word
        </h1>
        <p className="text-gray-500 hidden md:block font-light">Daily inspiration for the journey ahead</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* --- Daily Word (Bible) --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-2xl p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex items-center gap-3 mb-6 text-primary">
            <BookOpen size={24} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Daily Word</span>
          </div>

          <blockquote className="text-2xl md:text-3xl font-serif leading-tight mb-6">
            "{verse.text}"
          </blockquote>

          <div className="flex items-center gap-2 text-gray-400 font-medium">
            <div className="w-8 h-[1px] bg-primary" />
            {verse.ref}
          </div>
        </motion.div>

        {/* --- Daily Fuel (Quote) --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 p-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div>
            <div className="flex items-center gap-3 mb-6 text-blue-500">
              <Quote size={24} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Daily Fuel</span>
            </div>

            <p className="text-xl md:text-2xl text-gray-200 font-light leading-relaxed mb-6">
              {quote.text}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 text-gray-500 text-sm font-bold uppercase tracking-wider">
            — {quote.author}
          </div>
        </motion.div>
      </div>

      {/* --- Moodboard Grid --- */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-400">
          <ExternalLink size={20} /> The Blueprint
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOODBOARD.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="relative aspect-[4/5] rounded-xl overflow-hidden group border border-border bg-surface-hover"
            >
              {/* Using regular img for external URLs to avoid Next.js Config hassle for now */}
              <img
                src={src}
                alt="Vision"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
              />
              {/* Glass overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <p className="text-white text-sm font-medium tracking-wide transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {i === 0 ? "Physique Goal" :
                    i === 1 ? "The Reward" :
                      i === 2 ? "The Environment" :
                        i === 3 ? "The Team" :
                          i === 4 ? "The Foundation" :
                            i === 5 ? "The Giveback" :
                              i === 6 ? "Drive & Discipline" :
                                i === 7 ? "Elite Professional" :
                                  "The Peak Athlete"}
                </p>
              </div>
              {/* Subtle corner accent */}
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
};
