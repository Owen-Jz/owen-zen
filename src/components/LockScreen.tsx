"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

const CORRECT_PASSWORD = "123454";

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem("auth-unlocked", "true");
      localStorage.setItem("auth-unlocked-at", Date.now().toString());
      onUnlock();
    } else {
      setError(true);
      setPassword("");
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Owen Zen</h1>
          <p className="text-gray-400">Enter your password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={`w-full bg-surface border ${
                error ? "border-red-500" : "border-border"
              } rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">Incorrect password</p>
          )}

          <button
            type="submit"
            className="w-full bg-primary hover:brightness-110 text-white font-medium py-3 rounded-xl transition-all"
          >
            Unlock
          </button>
        </form>

        <p className="text-gray-600 text-xs text-center mt-6">
          Session expires after 30 minutes of inactivity
        </p>
      </div>
    </div>
  );
};
