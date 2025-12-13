'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Gamepad2, Clock, Navigation } from 'lucide-react';

interface GameModeDropdownProps {
  onStart: (mode: 'classic'|'no-move'|'time-attack', durationSec?: number) => void;
}

export default function GameModeDropdown({ onStart }: GameModeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const modes = [
    { key: 'classic' as const, label: 'Classic', icon: Gamepad2, desc: '5 rounds, free exploration' },
    { key: 'no-move' as const, label: 'No-Move', icon: Navigation, desc: 'Look around only' },
  ];

  const timeAttackModes = [
    { duration: 30, label: '30s' },
    { duration: 60, label: '60s' },
    { duration: 90, label: '90s' },
  ];

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 rounded-lg mx-panel backdrop-filter backdrop-blur-lg border mx-border hover:bg-[rgba(0,255,65,0.1)] transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Gamepad2 className="w-5 h-5 text-[var(--accent)]" />
        <span className="font-semibold text-[var(--text)]">Game Mode</span>
        <ChevronDown 
          className={`w-4 h-4 text-[var(--accent)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 w-64 rounded-lg mx-panel backdrop-filter backdrop-blur-lg border mx-border overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {modes.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => {
                    onStart(mode.key);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-3 rounded-md hover:bg-[rgba(0,255,65,0.1)] transition-colors flex items-start gap-3 group"
                >
                  <mode.icon className="w-5 h-5 text-[var(--accent)] mt-0.5" />
                  <div>
                    <div className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                      {mode.label}
                    </div>
                    <div className="text-xs text-[color:rgba(151,255,151,0.7)]">
                      {mode.desc}
                    </div>
                  </div>
                </button>
              ))}

              {/* Time Attack submenu */}
              <div className="border-t mx-border pt-2 mt-2">
                <div className="px-3 py-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-sm font-semibold text-[var(--text)]">Time Attack</span>
                </div>
                <div className="space-y-1">
                  {timeAttackModes.map((ta) => (
                    <button
                      key={ta.duration}
                      onClick={() => {
                        onStart('time-attack', ta.duration);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-[rgba(0,255,65,0.1)] transition-colors text-[var(--text)] hover:text-[var(--accent)] text-sm pl-9"
                    >
                      {ta.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
