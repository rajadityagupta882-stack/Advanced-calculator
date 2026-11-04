import React from 'react';
import { StepTrace } from '../utils/mathEngine';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';

interface StepByStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  expression: string;
  result: string;
  steps: StepTrace[];
}

export const StepByStepModal: React.FC<StepByStepModalProps> = ({
  isOpen,
  onClose,
  expression,
  result,
  steps,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Evaluation Trace & Resolution Steps
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Expression Banner */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 font-mono text-xs">
          <div className="text-slate-500 mb-0.5">Input Expression:</div>
          <div className="text-slate-200 text-sm font-semibold truncate">{expression}</div>
        </div>

        {/* Step-by-step resolution list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 font-mono text-xs">
          {steps.length === 0 ? (
            <div className="text-slate-400 py-6 text-center">
              Direct constant or atomic value evaluated directly to <span className="text-cyan-400 font-bold">{result}</span>.
            </div>
          ) : (
            steps.map((st) => (
              <div
                key={st.step}
                className="p-3 rounded-lg bg-slate-850/80 border border-slate-800 flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  {st.step}
                </span>
                <div className="flex-1">
                  <div className="text-slate-300 font-medium">{st.description}</div>
                  {st.result && (
                    <div className="text-cyan-400 font-bold mt-1">
                      ➔ {st.result}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Final Result Card */}
          <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 font-semibold">Final Evaluated Result</span>
            </div>
            <span className="text-base font-bold text-cyan-300 tabular-nums">
              {result}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
