import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardGuideModal: React.FC<KeyboardGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '0 - 9', desc: 'Input digits' },
    { key: '+ , - , * , /', desc: 'Standard arithmetic operators' },
    { key: '^', desc: 'Power / Exponentiation (e.g. 2^8)' },
    { key: 'Enter or =', desc: 'Evaluate expression' },
    { key: 'Backspace', desc: 'Delete last character' },
    { key: 'Escape', desc: 'Clear active expression' },
    { key: '( and )', desc: 'Parentheses for nesting operations' },
    { key: 'pi or e', desc: 'Archimedes π (3.14159) or Euler e (2.71828)' },
    { key: 'sin(x), cos(x)', desc: 'Trigonometric functions (respects DEG/RAD mode)' },
    { key: 'sqrt(x), cbrt(x)', desc: 'Square root or cube root' },
    { key: 'ln(x), log(x)', desc: 'Natural logarithm or base-10 logarithm' },
    { key: '5!', desc: 'Factorial (5! = 120)' },
    { key: 'nCr(n, r), nPr(n, r)', desc: 'Combinations and Permutations' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Keyboard Shortcuts & Functions Reference
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-850/60 border border-slate-800 text-xs font-mono"
            >
              <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
                {sc.key}
              </kbd>
              <span className="text-slate-300 font-sans">{sc.desc}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
