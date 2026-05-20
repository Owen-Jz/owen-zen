"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AFFIRMATIONS = {
  identity: [
    "I am highly efficient and talented designer",
    "I am a highly productive person",
    "I am an ambassador of Christ",
    "I am a successful business man",
    "I am a wealthy investor",
    "I am a close child of God",
    "I am a well connected tech bro",
    "I am a dancer",
    "I am an influencer/creator",
    "I am a top-notch developer",
    "I am an athlete",
    "I am financially stable",
    "I am well organized",
    "I am a wealthy, young, calm and coordinated man",
    "I find wholeness in God and in myself, I am never lonely",
    "I am confident in all I do",
  ],
  declarations: [
    "And I am manifesting all these day by day",
    "EVERYTHING WORKS FOR ME!",
    "I DECLARE THIS LIFE SHALL BE MY PERFECT VICTORY!",
    "I HAVE ALREADY WON THE BATTLES OF LIFE!",
    "I have achieved more than what most people will achieve in 10 lifetimes!",
    "I am the light of the world for God!",
    "MONEY, FAVOUR AND OPPORTUNITIES SEEK ME EARNESTLY!",
    "I am prepared for all the opportunities that are coming my way.. Amen",
    "My Gods desire is for me to be the greatest and I am the greatest",
    "I cannot be weak. I have been given too much to be weak - I carry Gods expectations and I will not fail",
  ],
  values: [
    { name: "Integrity", desc: "Being truthful in every situation and having strong moral principles" },
    { name: "Resilience", desc: "Adapting and bouncing back from set backs and challenges" },
    { name: "Vision", desc: "You have a clear picture of the future which you must have" },
    { name: "Discipline", desc: "You must practice self-control, orderliness and adherence to your values" },
    { name: "Generosity", desc: "You must give to those that are in need if you have any available" },
    { name: "Continuous Learning", desc: "You must have a mind which is open to all learning and must never be filled with too much" },
    { name: "Humility", desc: "Wherever you find yourself, whatever the rank of individuals you are among, you must be humble" },
    { name: "Responsibility", desc: "Take responsibility for your actions and words and see all of them to the very end" },
  ],
  secondLine: [
    "I am a good listener",
    "I am hardworking",
    "I am way too smart",
    "I follow laws and the laws work for me, I don't stress for anything I want",
    "I am coordinated",
    "I am in control of situations",
    "I am rich and I am wealthy",
    "You are a deep and wise person",
  ],
  scriptures: [
    { ref: "1 John 5:14-15", text: "\"This is the confidence we have in approaching God: that if we ask anything according to his will, he hears us.\"" },
    { ref: "Mark 11:24", text: "\"Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours.\"" },
    { ref: "Romans 8:28", text: "\"And we know that in all things God works for the good of those who love him, who have been called according to his purpose.\"" },
    { ref: "Proverbs 16:9", text: "\"In their hearts humans plan their course, but the Lord establishes their steps.\"" },
    { ref: "Proverbs 3:5-6", text: "\"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.\"" },
    { ref: "Philippians 4:13", text: "\"I can do all things through Christ who strengthens me.\"" },
    { ref: "Isaiah 58:11", text: "\"The Lord will guide me always; he will satisfy my needs in a sun-scorched land and will strengthen my frame. I will be like a well-watered garden, like a spring whose waters never fail.\"" },
  ],
  goals2026: [
    "I am now getting a $2000 return monthly",
    "3.5 million naira will always be entering my bank account monthly",
    "I now work with 5 of the biggest startups in Nigeria and the US",
    "I have 150k followers on my instagram and TikTok Accounts",
    "I have a deeper connection and stronger understanding of God my creator and his purpose for my life",
    "I have strong connections with 3 industry leaders in tech, design and content creation",
  ],
};

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function AffirmationsView() {
  const [dailyIndex, setDailyIndex] = useState(0);
  const [shuffledIdentity, setShuffledIdentity] = useState<string[]>([]);
  const [shuffledDeclarations, setShuffledDeclarations] = useState<string[]>([]);

  useEffect(() => {
    const dayIndex = getDayOfYear();
    setDailyIndex(dayIndex);

    const shuffle = <T,>(arr: T[]): T[] => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    setShuffledIdentity(shuffle(AFFIRMATIONS.identity));
    setShuffledDeclarations(shuffle(AFFIRMATIONS.declarations));
  }, []);

  const dailyScripture = AFFIRMATIONS.scriptures[dailyIndex % AFFIRMATIONS.scriptures.length];
  const dailyDeclaration = shuffledDeclarations[0] || AFFIRMATIONS.declarations[0];
  const dailyIdentity = shuffledIdentity[0] || AFFIRMATIONS.identity[0];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Sparkles className="text-primary" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Affirmations</h1>
          <p className="text-gray-500 text-sm">Remember who you are and whose you are</p>
        </div>
      </motion.div>

      {/* Daily Focus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-white/10 rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Today's Declaration</span>
          </div>
          <p className="text-2xl font-bold text-white mb-2 leading-tight">
            {dailyDeclaration}
          </p>
          <p className="text-gray-400 text-sm italic">
            There are no expiration dates on the declarations that you are making and shooting your eyes on the current situation
          </p>
        </div>
      </motion.div>

      {/* Identity Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-[2px] bg-primary" />
          Reminding Yourself of Who You Are
        </h2>
        <p className="text-gray-400 mb-6 italic">
          I am highly efficient and talented designer, I am a highly productive person, I am an ambassador of Christ, I am a successful business man...
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AFFIRMATIONS.identity.slice(0, 8).map((aff, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex items-start gap-3 p-3 bg-white/5 rounded-xl"
            >
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
              <span className="text-gray-200 text-sm">{aff}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-white font-medium">And I am manifesting all these day by day</p>
        </div>
      </motion.div>

      {/* Values Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-[2px] bg-primary" />
          Never Forget Your Values!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AFFIRMATIONS.values.map((value, i) => (
            <motion.div
              key={value.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="p-4 bg-white/5 rounded-xl"
            >
              <h3 className="text-primary font-bold mb-1">{value.name}</h3>
              <p className="text-gray-400 text-sm">{value.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Second Line Affirmations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-surface border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-[2px] bg-primary" />
          You Are...
        </h2>
        <div className="space-y-3">
          {AFFIRMATIONS.secondLine.map((aff, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="flex items-start gap-3"
            >
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
              <span className="text-gray-200">{aff}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Daily Scripture */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-surface border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-[2px] bg-primary" />
          Daily Scripture
        </h2>
        <blockquote className="text-gray-300 italic mb-3 leading-relaxed">
          "{dailyScripture.text}"
        </blockquote>
        <div className="flex items-center gap-2">
          <div className="w-6 h-[1px] bg-primary" />
          <span className="text-primary font-medium text-sm">{dailyScripture.ref}</span>
        </div>
      </motion.div>

      {/* Remember Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6"
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-sm italic">
            Remember life always goes well for easy going people - George Izunwa
          </p>
          <p className="text-gray-300 text-sm italic">
            Remember- Promotion and blessing come from the lord, you are nothing but a channel and a vessel
          </p>
          <p className="text-white font-bold text-lg">
            ALWAYS REMEMBER THAT YOU ARE A PRODUCT OF GOD, AND GOD WILL DO ANYTHING TO MAINTAIN THE INTEGRITY OF HIS NAME..
          </p>
        </div>
      </motion.div>

      {/* Goals Reminder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-surface border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-8 h-[2px] bg-primary" />
            Goals
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">2026</span>
        </div>

        <div className="space-y-2">
          {AFFIRMATIONS.goals2026.map((goal, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
              <span className="text-gray-200 text-sm">{goal}</span>
            </div>
          ))}
        </div>

        {/* Previous Goals - Collapsible */}
        <details className="mt-6 group">
          <summary className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-300 transition-colors">
            <span className="w-4 h-[1px] bg-gray-600 group-hover:bg-gray-400 transition-colors" />
            <span className="text-xs font-medium uppercase tracking-wider">Goals 2024</span>
            <span className="text-[10px] text-gray-600 group-hover:text-gray-500 ml-1">(previous)</span>
          </summary>
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2 opacity-70">
            {[
              "I am now getting a $2000 return monthly as from September 2024",
              "3.5 million naira will always be entering my bank account monthly",
              "I now work with 5 of the biggest startups in Nigeria and the US",
              "I have 150k followers on my instagram and TikTok Accounts",
              "I have a deeper connection and stronger understanding of God my creator and his purpose for my life and the life of others and I am closer to God in every aspect",
              "I have strong connections with 3 industry leaders in tech, design and content creation",
            ].map((goal, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mt-2 shrink-0" />
                <span className="text-gray-400 text-sm">{goal}</span>
              </div>
            ))}
          </div>
        </details>
      </motion.div>
    </div>
  );
}