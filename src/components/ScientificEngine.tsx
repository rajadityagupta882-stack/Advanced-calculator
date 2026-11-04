import React, { useState, useEffect, useRef } from 'react';
import {
  evaluateExpression,
  formatNumber,
  CONSTANTS,
  AngleMode,
  StepTrace,
} from '../utils/mathEngine';
import { HistoryItem, MemoryStore } from '../types/calculator';
import { soundManager } from '../utils/soundEffects';
import {
  History,
  RotateCcw,
  Sparkles,
  Delete,
  Copy,
  Check,
  HelpCircle,
  Settings2,
  ChevronRight,
} from 'lucide-react';

interface ScientificEngineProps {
  history: HistoryItem[];
  onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  onClearHistory: () => void;
  memory: MemoryStore;
  onUpdateMemory: (updater: (prev: MemoryStore) => MemoryStore) => void;
  onOpenStepModal: (steps: StepTrace[], expr: string, result: string) => void;
  onOpenHelp: () => void;
}

export const ScientificEngine: React.FC<ScientificEngineProps> = ({
  history,
  onAddHistory,
  onClearHistory,
  memory,
  onUpdateMemory,
  onOpenStepModal,
  onOpenHelp,
}) => {
  const [expression, setExpression] = useState<string>('');
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const [numberFormat, setNumberFormat] = useState<'standard' | 'scientific' | 'engineering' | 'fixed'>('standard');
  const [isSecond, setIsSecond] = useState<boolean>(false);
  const [isHyp, setIsHyp] = useState<boolean>(false);
  const [showHistoryPane, setShowHistoryPane] = useState<boolean>(false);
  const [showConstantsPane, setShowConstantsPane] = useState<boolean>(false);
  const [showVariablesPane, setShowVariablesPane] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastAnswer, setLastAnswer] = useState<number>(0);
  const [cursorPos, setCursorPos] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Live evaluation preview
  const liveResult = React.useMemo(() => {
    if (!expression.trim()) return null;
    const res = evaluateExpression(expression, {
      angleMode,
      variables: { ...memory.vars, ans: lastAnswer },
    });
    return res;
  }, [expression, angleMode, memory.vars, lastAnswer]);

  const handleKeyPress = (val: string) => {
    soundManager.playKeyClick();
    setExpression((prev) => {
      const next = prev + val;
      setCursorPos(next.length);
      return next;
    });
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    soundManager.playKeyClick(600, 0.02);
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    soundManager.playClearSound();
    setExpression('');
  };

  const handleEquals = () => {
    if (!expression.trim()) return;
    soundManager.playEqualSound();

    const result = evaluateExpression(expression, {
      angleMode,
      variables: { ...memory.vars, ans: lastAnswer },
      recordSteps: true,
    });

    if (result.error) {
      return;
    }

    const formatted = formatNumber(result.value, numberFormat);
    setLastAnswer(result.value);

    onAddHistory({
      expression,
      result: formatted,
      numericResult: result.value,
      mode: 'Scientific',
    });

    setExpression(formatted);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a separate text input or modal
      const activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'INPUT' && activeEl !== inputRef.current) {
        return;
      }

      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        // Backspace handled naturally if focused on input, or manually if focused on container
        if (activeEl !== inputRef.current) {
          e.preventDefault();
          handleBackspace();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (['+', '-', '*', '/', '^', '%', '(', ')'].includes(e.key)) {
        if (activeEl !== inputRef.current) {
          e.preventDefault();
          handleKeyPress(e.key);
        }
      } else if (/^[0-9.]$/.test(e.key)) {
        if (activeEl !== inputRef.current) {
          e.preventDefault();
          handleKeyPress(e.key);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expression, angleMode, memory.vars, lastAnswer, numberFormat]);

  // Memory functions
  const memoryClear = () => {
    soundManager.playClearSound();
    onUpdateMemory((m) => ({ ...m, M: 0 }));
  };

  const memoryRecall = () => {
    soundManager.playKeyClick();
    handleKeyPress(memory.M.toString());
  };

  const memoryAdd = () => {
    soundManager.playActionSound();
    if (liveResult && !liveResult.error) {
      onUpdateMemory((m) => ({ ...m, M: m.M + liveResult.value }));
    }
  };

  const memorySubtract = () => {
    soundManager.playActionSound();
    if (liveResult && !liveResult.error) {
      onUpdateMemory((m) => ({ ...m, M: m.M - liveResult.value }));
    }
  };

  const memoryStore = () => {
    soundManager.playActionSound();
    if (liveResult && !liveResult.error) {
      onUpdateMemory((m) => ({ ...m, M: liveResult.value }));
    }
  };

  const handleInspectSteps = () => {
    soundManager.playActionSound();
    if (!expression.trim()) return;
    const res = evaluateExpression(expression, {
      angleMode,
      variables: { ...memory.vars, ans: lastAnswer },
      recordSteps: true,
    });
    const formatted = res.error ? 'Error' : formatNumber(res.value, numberFormat);
    onOpenStepModal(res.steps, expression, formatted);
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Primary Calculator Console */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {/* Technical Display Screen */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[170px]">
          {/* Subtle subtle background calibration grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

          {/* Top Status Bar */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 z-10">
            <div className="flex items-center gap-3">
              {/* Angle mode toggle */}
              <button
                onClick={() => {
                  soundManager.playKeyClick(1000);
                  setAngleMode((m) => (m === 'DEG' ? 'RAD' : m === 'RAD' ? 'GRAD' : 'DEG'));
                }}
                className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-semibold hover:bg-slate-700 transition-colors"
                title="Click to toggle DEG / RAD / GRAD"
              >
                {angleMode}
              </button>

              {/* Number Format Selector */}
              <button
                onClick={() => {
                  soundManager.playKeyClick(1000);
                  const modes: ('standard' | 'scientific' | 'engineering' | 'fixed')[] = [
                    'standard',
                    'scientific',
                    'engineering',
                    'fixed',
                  ];
                  const nextIdx = (modes.indexOf(numberFormat) + 1) % modes.length;
                  setNumberFormat(modes[nextIdx]);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 transition-colors uppercase text-[11px]"
                title="Click to cycle Number Format"
              >
                FORMAT: {numberFormat}
              </button>

              {/* Active Memory Indicator */}
              {memory.M !== 0 && (
                <span className="text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">
                  M ({formatNumber(memory.M, 'standard', 3)})
                </span>
              )}

              {isSecond && (
                <span className="text-cyan-400 font-bold bg-cyan-400/10 px-1.5 py-0.5 rounded">
                  2ND
                </span>
              )}
              {isHyp && (
                <span className="text-purple-400 font-bold bg-purple-400/10 px-1.5 py-0.5 rounded">
                  HYP
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleInspectSteps}
                disabled={!expression.trim()}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 transition-colors disabled:opacity-30 disabled:pointer-events-none text-xs"
                title="Show step-by-step resolution breakdown"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Steps</span>
              </button>

              <button
                onClick={() => setShowHistoryPane(!showHistoryPane)}
                className={`p-1.5 rounded transition-colors ${
                  showHistoryPane
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Toggle Calculation History"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Calculation Expression Input */}
          <div className="my-2 z-10">
            <input
              ref={inputRef}
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-right font-mono text-2xl lg:text-3xl text-slate-100 placeholder-slate-600 focus:outline-none tracking-wider tabular-nums"
              spellCheck={false}
              autoFocus
            />
          </div>

          {/* Live Preview / Diagnostic line */}
          <div className="flex items-center justify-between z-10 pt-2 border-t border-slate-800/80">
            <div className="text-xs font-mono text-slate-500 truncate max-w-[280px]">
              {liveResult?.error ? (
                <span className="text-rose-400">✖ {liveResult.error}</span>
              ) : (
                <span>Ans = {formatNumber(lastAnswer, numberFormat)}</span>
              )}
            </div>
            <div className="text-right">
              {liveResult && !liveResult.error && (
                <span className="font-mono text-lg font-bold text-cyan-400 tabular-nums">
                  = {formatNumber(liveResult.value, numberFormat)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Memory Toolbar & Key Modifiers */}
        <div className="grid grid-cols-6 gap-2 text-xs font-mono">
          <button
            onClick={memoryClear}
            className="py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
          >
            MC
          </button>
          <button
            onClick={memoryRecall}
            className="py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
          >
            MR
          </button>
          <button
            onClick={memoryAdd}
            className="py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
          >
            M+
          </button>
          <button
            onClick={memorySubtract}
            className="py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
          >
            M-
          </button>
          <button
            onClick={memoryStore}
            className="py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
          >
            MS
          </button>
          <button
            onClick={() => setShowVariablesPane(!showVariablesPane)}
            className={`py-2 rounded-lg transition-colors border border-slate-700/50 ${
              showVariablesPane ? 'bg-cyan-600 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-cyan-300'
            }`}
          >
            VAR
          </button>
        </div>

        {/* Scientific Keypad Grid */}
        <div className="grid grid-cols-5 gap-2 select-none">
          {/* Row 1: Function Modifiers & Constants */}
          <button
            onClick={() => {
              soundManager.playActionSound();
              setIsSecond(!isSecond);
            }}
            className={`py-3 rounded-lg font-semibold text-sm transition-colors border ${
              isSecond
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-slate-800 hover:bg-slate-750 text-cyan-300 border-slate-700/60'
            }`}
          >
            2nd
          </button>
          <button
            onClick={() => {
              soundManager.playActionSound();
              setIsHyp(!isHyp);
            }}
            className={`py-3 rounded-lg font-semibold text-sm transition-colors border ${
              isHyp
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700/60'
            }`}
          >
            hyp
          </button>
          <button
            onClick={() => setShowConstantsPane(!showConstantsPane)}
            className={`py-3 rounded-lg font-semibold text-sm transition-colors border ${
              showConstantsPane
                ? 'bg-amber-600 text-white border-amber-400'
                : 'bg-slate-800 hover:bg-slate-750 text-amber-300 border-slate-700/60'
            }`}
          >
            Const
          </button>
          <button
            onClick={handleClear}
            className="py-3 rounded-lg font-semibold text-sm bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-colors"
          >
            AC
          </button>
          <button
            onClick={handleBackspace}
            className="py-3 rounded-lg flex items-center justify-center font-semibold text-sm bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 transition-colors"
          >
            <Delete className="w-5 h-5" />
          </button>

          {/* Row 2: Trig Functions & Powers */}
          <button
            onClick={() =>
              handleKeyPress(
                isHyp ? (isSecond ? 'asinh(' : 'sinh(') : isSecond ? 'asin(' : 'sin('
              )
            }
            className="py-3 rounded-lg font-mono text-sm bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            {isHyp ? (isSecond ? 'sinh⁻¹' : 'sinh') : isSecond ? 'sin⁻¹' : 'sin'}
          </button>
          <button
            onClick={() =>
              handleKeyPress(
                isHyp ? (isSecond ? 'acosh(' : 'cosh(') : isSecond ? 'acos(' : 'cos('
              )
            }
            className="py-3 rounded-lg font-mono text-sm bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            {isHyp ? (isSecond ? 'cosh⁻¹' : 'cosh') : isSecond ? 'cos⁻¹' : 'cos'}
          </button>
          <button
            onClick={() =>
              handleKeyPress(
                isHyp ? (isSecond ? 'atanh(' : 'tanh(') : isSecond ? 'atan(' : 'tan('
              )
            }
            className="py-3 rounded-lg font-mono text-sm bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            {isHyp ? (isSecond ? 'tanh⁻¹' : 'tanh') : isSecond ? 'tan⁻¹' : 'tan'}
          </button>
          <button
            onClick={() => handleKeyPress('(')}
            className="py-3 rounded-lg font-mono text-base bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 transition-colors"
          >
            (
          </button>
          <button
            onClick={() => handleKeyPress(')')}
            className="py-3 rounded-lg font-mono text-base bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 transition-colors"
          >
            )
          </button>

          {/* Row 3: Log, Exp, Roots, Division */}
          <button
            onClick={() => handleKeyPress(isSecond ? 'exp(' : 'ln(')}
            className="py-3 rounded-lg font-mono text-sm bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            {isSecond ? 'eˣ' : 'ln'}
          </button>
          <button
            onClick={() => handleKeyPress(isSecond ? '10^(' : 'log(')}
            className="py-3 rounded-lg font-mono text-sm bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            {isSecond ? '10ˣ' : 'log₁₀'}
          </button>
          <button
            onClick={() => handleKeyPress(isSecond ? 'cbrt(' : 'sqrt(')}
            className="py-3 rounded-lg font-mono text-sm bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            {isSecond ? '∛x' : '√x'}
          </button>
          <button
            onClick={() => handleKeyPress('^')}
            className="py-3 rounded-lg font-mono text-sm bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            xʸ
          </button>
          <button
            onClick={() => handleKeyPress('/')}
            className="py-3 rounded-lg font-mono text-lg font-semibold bg-slate-800 hover:bg-slate-750 text-cyan-400 border border-slate-700/80 transition-colors"
          >
            ÷
          </button>

          {/* Row 4: 7 8 9 and Multiplier */}
          <button
            onClick={() => handleKeyPress(isSecond ? 'nCr(' : '!')}
            className="py-3 rounded-lg font-mono text-sm bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            {isSecond ? 'nCr' : 'n!'}
          </button>
          <button
            onClick={() => handleKeyPress('7')}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/60 transition-colors shadow-sm"
          >
            7
          </button>
          <button
            onClick={() => handleKeyPress('8')}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/60 transition-colors shadow-sm"
          >
            8
          </button>
          <button
            onClick={() => handleKeyPress('9')}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/60 transition-colors shadow-sm"
          >
            9
          </button>
          <button
            onClick={() => handleKeyPress('*')}
            className="py-3 rounded-lg font-mono text-lg font-semibold bg-slate-800 hover:bg-slate-750 text-cyan-400 border border-slate-700/80 transition-colors"
          >
            ×
          </button>

          {/* Row 5: 4 5 6 and Subtraction */}
          <button
            onClick={() => handleKeyPress(isSecond ? 'nPr(' : '1/(')}
            className="py-3 rounded-lg font-mono text-sm bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            {isSecond ? 'nPr' : '1/x'}
          </button>
          <button
            onClick={() => handleKeyPress('4')}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/60 transition-colors shadow-sm"
          >
            4
          </button>
          <button
            onClick={() => handleKeyPress('5')}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/60 transition-colors shadow-sm"
          >
            5
          </button>
          <button
            onClick={() => handleKeyPress('6')}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/60 transition-colors shadow-sm"
          >
            6
          </button>
          <button
            onClick={() => handleKeyPress('-')}
            className="py-3 rounded-lg font-mono text-lg font-semibold bg-slate-800 hover:bg-slate-750 text-cyan-400 border border-slate-700/80 transition-colors"
          >
            −
          </button>

          {/* Row 6: 1 2 3 and Addition */}
          <button
            onClick={() => handleKeyPress('pi')}
            className="py-3 rounded-lg font-mono text-sm bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            π
          </button>
          <button
            onClick={() => handleKeyPress('1')}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/60 transition-colors shadow-sm"
          >
            1
          </button>
          <button
            onClick={() => handleKeyPress('2')}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/60 transition-colors shadow-sm"
          >
            2
          </button>
          <button
            onClick={() => handleKeyPress('3')}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/60 transition-colors shadow-sm"
          >
            3
          </button>
          <button
            onClick={() => handleKeyPress('+')}
            className="py-3 rounded-lg font-mono text-lg font-semibold bg-slate-800 hover:bg-slate-750 text-cyan-400 border border-slate-700/80 transition-colors"
          >
            +
          </button>

          {/* Row 7: 0 . % and Equals */}
          <button
            onClick={() => handleKeyPress('e')}
            className="py-3 rounded-lg font-mono text-sm bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            e
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/60 transition-colors shadow-sm"
          >
            0
          </button>
          <button
            onClick={() => handleKeyPress('.')}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/60 transition-colors shadow-sm"
          >
            .
          </button>
          <button
            onClick={() => handleKeyPress('%')}
            className="py-3 rounded-lg font-mono text-base bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
          >
            %
          </button>
          <button
            onClick={handleEquals}
            className="py-3.5 rounded-lg font-mono text-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            =
          </button>
        </div>
      </div>

      {/* Auxiliary Sidebar (Constants, Variables, or History) */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Constants Drawer */}
        {showConstantsPane && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Physical & Math Constants
              </span>
              <button
                onClick={() => setShowConstantsPane(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {Object.entries(CONSTANTS).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => {
                    handleKeyPress(key);
                    setShowConstantsPane(false);
                  }}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 hover:border-amber-500/40 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-300 text-sm">
                        {item.symbol}
                      </span>
                      <span className="text-xs text-slate-200 font-medium">({key})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {item.description}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 group-hover:text-amber-300 tabular-nums">
                    {formatNumber(item.value, 'scientific', 3)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Variables Drawer */}
        {showVariablesPane && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                User Variables Store
              </span>
              <button
                onClick={() => setShowVariablesPane(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="space-y-2">
              {['x', 'y', 'z', 'a', 'b'].map((vName) => {
                const currentVal = memory.vars[vName] ?? 0;
                return (
                  <div
                    key={vName}
                    className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleKeyPress(vName)}
                        className="w-7 h-7 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-sm hover:bg-cyan-900 flex items-center justify-center"
                        title={`Insert ${vName} into expression`}
                      >
                        {vName}
                      </button>
                      <span className="font-mono text-xs text-slate-300 tabular-nums">
                        = {formatNumber(currentVal, 'standard', 4)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        soundManager.playActionSound();
                        if (liveResult && !liveResult.error) {
                          onUpdateMemory((m) => ({
                            ...m,
                            vars: { ...m.vars, [vName]: liveResult.value },
                          }));
                        }
                      }}
                      className="px-2 py-1 text-[11px] rounded bg-slate-700 hover:bg-cyan-600 hover:text-white text-slate-300 transition-colors"
                      title={`Assign current result to ${vName}`}
                    >
                      Store Ans
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calculation History Tape */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex-1 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Calculation Tape
              </span>
            </div>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <RotateCcw className="w-8 h-8 stroke-1 mb-2 opacity-50" />
              <p className="text-xs">No previous calculations recorded</p>
              <p className="text-[11px] text-slate-600 mt-1">Calculations will appear here</p>
            </div>
          ) : (
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
              {history.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 transition-colors group relative"
                >
                  <div className="text-xs font-mono text-slate-400 truncate mb-1">
                    {item.expression}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-cyan-400 tabular-nums">
                      = {item.result}
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => copyToClipboard(item.result, idx)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Copy result"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          handleKeyPress(item.result);
                        }}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors text-xs font-mono"
                        title="Insert result into expression"
                      >
                        Insert
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
