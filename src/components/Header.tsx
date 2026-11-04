import React from 'react';
import { CalculatorMode } from '../types/calculator';
import { soundManager } from '../utils/soundEffects';
import { Volume2, VolumeX, HelpCircle, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeMode: CalculatorMode;
  onSelectMode: (mode: CalculatorMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHelp: () => void;
}

const NAV_ITEMS: { id: CalculatorMode; label: string }[] = [
  { id: 'scientific', label: 'Scientific' },
  { id: 'graphing', label: 'Graphing' },
  { id: 'programmer', label: 'Programmer' },
  { id: 'matrix', label: 'Matrix' },
  { id: 'converter', label: 'Units' },
  { id: 'financial', label: 'Financial' },
  { id: 'statistics', label: 'Statistics' },
];

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onSelectMode,
  soundEnabled,
  onToggleSound,
  onOpenHelp,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap hover:text-cyan-400 transition-colors"
        >
          OmniCalc <span className="text-cyan-400 font-mono text-sm uppercase">Pro</span>
        </a>
      </div>

      {/* Zone 2: Single-line navigation links */}
      <nav className="hidden md:flex items-center gap-2 overflow-x-auto py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundManager.playKeyClick();
                onSelectMode(item.id);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Quick utilities & Primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-lg border transition-colors ${
            soundEnabled
              ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={soundEnabled ? 'Keypad Sound Enabled (Click to Mute)' : 'Keypad Sound Muted (Click to Enable)'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenHelp}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Keyboard shortcuts & functions guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
