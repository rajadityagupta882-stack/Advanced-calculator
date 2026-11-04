import React, { useState } from 'react';
import { soundManager } from '../utils/soundEffects';
import { Binary, Layers, RefreshCw, Cpu, Code2 } from 'lucide-react';

type WordSize = 'QWORD' | 'DWORD' | 'WORD' | 'BYTE';
type BaseMode = 'HEX' | 'DEC' | 'OCT' | 'BIN';

interface ProgrammerEngineProps {
  onAddHistory: (item: { expression: string; result: string; mode: string }) => void;
}

export const ProgrammerEngine: React.FC<ProgrammerEngineProps> = ({ onAddHistory }) => {
  const [wordSize, setWordSize] = useState<WordSize>('DWORD');
  const [activeBase, setActiveBase] = useState<BaseMode>('DEC');
  const [currentValue, setCurrentValue] = useState<bigint>(1024n);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [operand, setOperand] = useState<bigint | null>(null);
  const [isSigned, setIsSigned] = useState<boolean>(true);

  // Bit masks according to word size
  const getMask = (ws: WordSize): bigint => {
    switch (ws) {
      case 'QWORD':
        return 0xffffffffffffffffn;
      case 'DWORD':
        return 0xffffffffn;
      case 'WORD':
        return 0xffffn;
      case 'BYTE':
        return 0xffn;
    }
  };

  const getBits = (ws: WordSize): number => {
    switch (ws) {
      case 'QWORD':
        return 64;
      case 'DWORD':
        return 32;
      case 'WORD':
        return 16;
      case 'BYTE':
        return 8;
    }
  };

  const mask = getMask(wordSize);
  const numBits = getBits(wordSize);

  // Normalize value within current bitmask
  const normalize = (val: bigint, ws: WordSize = wordSize): bigint => {
    const m = getMask(ws);
    return ((val % (m + 1n)) + (m + 1n)) % (m + 1n);
  };

  const activeVal = normalize(currentValue);

  // Formatted representations
  const hexString = activeVal.toString(16).toUpperCase().padStart(numBits / 4, '0');
  const octString = activeVal.toString(8);
  const binString = activeVal.toString(2).padStart(numBits, '0');

  // Signed decimal conversion (Two's complement)
  const getSignedDec = (val: bigint, ws: WordSize): bigint => {
    const bits = BigInt(getBits(ws));
    const signBit = 1n << (bits - 1n);
    if ((val & signBit) !== 0n) {
      return val - (1n << bits);
    }
    return val;
  };

  const decString = isSigned
    ? getSignedDec(activeVal, wordSize).toString(10)
    : activeVal.toString(10);

  // ASCII byte representation
  const asciiChar = () => {
    const byte = Number(activeVal & 0xffn);
    if (byte >= 32 && byte <= 126) {
      return `'${String.fromCharCode(byte)}' (0x${byte.toString(16).toUpperCase()})`;
    }
    return `Non-printable (0x${byte.toString(16).toUpperCase()})`;
  };

  // Bitboard toggle individual bit
  const toggleBit = (bitIndex: number) => {
    soundManager.playKeyClick(850, 0.02);
    const bitMask = 1n << BigInt(bitIndex);
    const nextVal = normalize(activeVal ^ bitMask);
    setCurrentValue(nextVal);
  };

  // Base digit input
  const handleDigit = (digit: string) => {
    soundManager.playKeyClick();
    const radix = activeBase === 'HEX' ? 16 : activeBase === 'DEC' ? 10 : activeBase === 'OCT' ? 8 : 2;
    try {
      const parsed = BigInt(parseInt(digit, radix));
      const next = normalize(activeVal * BigInt(radix) + parsed);
      setCurrentValue(next);
    } catch {
      // Invalid digit for current base
    }
  };

  const handleBackspace = () => {
    soundManager.playKeyClick(600, 0.02);
    const radix = activeBase === 'HEX' ? 16 : activeBase === 'DEC' ? 10 : activeBase === 'OCT' ? 8 : 2;
    setCurrentValue(normalize(activeVal / BigInt(radix)));
  };

  const handleClear = () => {
    soundManager.playClearSound();
    setCurrentValue(0n);
    setOperand(null);
    setPendingOp(null);
  };

  // Bitwise operations
  const handleOp = (op: string) => {
    soundManager.playActionSound();
    if (op === 'NOT') {
      const res = normalize(~activeVal);
      setCurrentValue(res);
      onAddHistory({
        expression: `NOT ${activeVal}`,
        result: res.toString(16).toUpperCase(),
        mode: 'Programmer',
      });
      return;
    }
    if (op === 'ROL') {
      const bits = BigInt(numBits);
      const topBit = (activeVal >> (bits - 1n)) & 1n;
      const res = normalize((activeVal << 1n) | topBit);
      setCurrentValue(res);
      return;
    }
    if (op === 'ROR') {
      const bits = BigInt(numBits);
      const lowBit = activeVal & 1n;
      const res = normalize((activeVal >> 1n) | (lowBit << (bits - 1n)));
      setCurrentValue(res);
      return;
    }

    setOperand(activeVal);
    setPendingOp(op);
    setCurrentValue(0n);
  };

  const handleEquals = () => {
    if (operand === null || !pendingOp) return;
    soundManager.playEqualSound();

    let res = 0n;
    switch (pendingOp) {
      case 'AND':
        res = operand & activeVal;
        break;
      case 'OR':
        res = operand | activeVal;
        break;
      case 'XOR':
        res = operand ^ activeVal;
        break;
      case 'NAND':
        res = ~(operand & activeVal);
        break;
      case 'NOR':
        res = ~(operand | activeVal);
        break;
      case 'XNOR':
        res = ~(operand ^ activeVal);
        break;
      case 'LSH':
        res = operand << activeVal;
        break;
      case 'RSH':
        res = operand >> activeVal;
        break;
      case '+':
        res = operand + activeVal;
        break;
      case '-':
        res = operand - activeVal;
        break;
      case '*':
        res = operand * activeVal;
        break;
      case '/':
        res = activeVal === 0n ? 0n : operand / activeVal;
        break;
      case '%':
        res = activeVal === 0n ? 0n : operand % activeVal;
        break;
    }

    const normalized = normalize(res);
    onAddHistory({
      expression: `${operand} ${pendingOp} ${activeVal}`,
      result: `0x${normalized.toString(16).toUpperCase()}`,
      mode: 'Programmer',
    });

    setCurrentValue(normalized);
    setOperand(null);
    setPendingOp(null);
  };

  // Enabled digits depending on active base
  const isDigitEnabled = (d: string): boolean => {
    const val = parseInt(d, 16);
    if (activeBase === 'BIN') return val === 0 || val === 1;
    if (activeBase === 'OCT') return val >= 0 && val <= 7;
    if (activeBase === 'DEC') return val >= 0 && val <= 9;
    return true; // HEX allows 0-F
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5">
      {/* Programmer Main Screen & Base Indicators */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-semibold uppercase tracking-wider">
              Word Size:
            </span>
            {(['QWORD', 'DWORD', 'WORD', 'BYTE'] as WordSize[]).map((ws) => (
              <button
                key={ws}
                onClick={() => {
                  soundManager.playActionSound();
                  setWordSize(ws);
                  setCurrentValue(normalize(currentValue, ws));
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  wordSize === ws
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {ws}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSigned(!isSigned)}
              className={`px-2.5 py-1 rounded transition-colors text-xs ${
                isSigned
                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isSigned ? 'Signed (2s Comp)' : 'Unsigned'}
            </button>
            <span className="text-slate-500">
              ASCII: <span className="text-cyan-300 font-mono">{asciiChar()}</span>
            </span>
          </div>
        </div>

        {/* Multi-Base Synchronized Rows */}
        <div className="space-y-2 font-mono text-sm">
          {[
            { base: 'HEX' as BaseMode, label: 'HEX', val: hexString, prefix: '0x' },
            { base: 'DEC' as BaseMode, label: 'DEC', val: decString, prefix: '' },
            { base: 'OCT' as BaseMode, label: 'OCT', val: octString, prefix: '0o' },
            { base: 'BIN' as BaseMode, label: 'BIN', val: binString, prefix: '' },
          ].map(({ base, label, val, prefix }) => (
            <button
              key={base}
              onClick={() => {
                soundManager.playKeyClick(900);
                setActiveBase(base);
              }}
              className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                activeBase === base
                  ? 'bg-slate-800/90 border-cyan-500 shadow-md text-cyan-300 ring-1 ring-cyan-500/30'
                  : 'bg-slate-850/50 hover:bg-slate-800/50 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-10 text-xs font-bold ${
                    activeBase === base ? 'text-cyan-400' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>
                <span className="text-slate-500 text-xs">{prefix}</span>
                <span className="text-base lg:text-lg font-bold tracking-wider tabular-nums break-all">
                  {base === 'BIN'
                    ? val.match(/.{1,4}/g)?.join(' ') || val
                    : val}
                </span>
              </div>

              {pendingOp && operand !== null && activeBase === base && (
                <span className="text-xs text-amber-400">
                  {operand.toString(16).toUpperCase()} {pendingOp} ...
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Clickable Bitboard (64-bit matrix) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-200 font-semibold uppercase tracking-wider">
              Interactive 64-Bit Binary Bitboard
            </span>
          </div>
          <span className="text-slate-500">Click any bit to flip 0 ↔ 1</span>
        </div>

        {/* Bitboard Grid */}
        <div className="grid grid-cols-8 md:grid-cols-16 gap-1.5 font-mono text-center">
          {Array.from({ length: 64 })
            .map((_, i) => 63 - i)
            .map((bitIndex) => {
              const isAvailable = bitIndex < numBits;
              const bitVal = isAvailable ? ((activeVal >> BigInt(bitIndex)) & 1n) === 1n : false;

              return (
                <button
                  key={bitIndex}
                  disabled={!isAvailable}
                  onClick={() => toggleBit(bitIndex)}
                  className={`py-1.5 px-1 rounded flex flex-col items-center justify-center transition-all ${
                    !isAvailable
                      ? 'bg-slate-950/40 text-slate-700 border border-slate-900 cursor-not-allowed opacity-30'
                      : bitVal
                      ? 'bg-cyan-500 text-slate-950 font-bold border border-cyan-400 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                  }`}
                  title={`Bit ${bitIndex}`}
                >
                  <span className="text-[9px] opacity-60 leading-tight">{bitIndex}</span>
                  <span className="text-xs font-bold">{bitVal ? '1' : '0'}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Keypad & Logic Operations */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bitwise & Shift Operations */}
        <div className="md:col-span-5 grid grid-cols-3 gap-2 font-mono text-xs">
          {['AND', 'OR', 'XOR', 'NOT', 'NAND', 'NOR', 'XNOR', 'LSH', 'RSH', 'ROL', 'ROR'].map(
            (op) => (
              <button
                key={op}
                onClick={() => handleOp(op)}
                className="py-3 rounded-lg bg-slate-850 hover:bg-slate-800 text-cyan-300 border border-slate-750 transition-colors font-bold shadow-sm"
              >
                {op}
              </button>
            )
          )}
          <button
            onClick={handleClear}
            className="py-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-colors font-bold"
          >
            CLEAR
          </button>
        </div>

        {/* Hex / Decimal Keypad */}
        <div className="md:col-span-7 grid grid-cols-4 gap-2 font-mono">
          {['D', 'E', 'F', '+'].map((char) => (
            <button
              key={char}
              disabled={char !== '+' && !isDigitEnabled(char)}
              onClick={() => (char === '+' ? handleOp('+') : handleDigit(char))}
              className={`py-3 rounded-lg text-base font-bold transition-colors border ${
                char === '+'
                  ? 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-750'
                  : isDigitEnabled(char)
                  ? 'bg-slate-850 hover:bg-slate-800 text-slate-100 border-slate-750'
                  : 'bg-slate-900/40 text-slate-700 border-slate-900/60 cursor-not-allowed'
              }`}
            >
              {char}
            </button>
          ))}

          {['A', 'B', 'C', '-'].map((char) => (
            <button
              key={char}
              disabled={char !== '-' && !isDigitEnabled(char)}
              onClick={() => (char === '-' ? handleOp('-') : handleDigit(char))}
              className={`py-3 rounded-lg text-base font-bold transition-colors border ${
                char === '-'
                  ? 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-750'
                  : isDigitEnabled(char)
                  ? 'bg-slate-850 hover:bg-slate-800 text-slate-100 border-slate-750'
                  : 'bg-slate-900/40 text-slate-700 border-slate-900/60 cursor-not-allowed'
              }`}
            >
              {char}
            </button>
          ))}

          {['7', '8', '9', '*'].map((char) => (
            <button
              key={char}
              disabled={char !== '*' && !isDigitEnabled(char)}
              onClick={() => (char === '*' ? handleOp('*') : handleDigit(char))}
              className={`py-3 rounded-lg text-base font-bold transition-colors border ${
                char === '*'
                  ? 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-750'
                  : isDigitEnabled(char)
                  ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 border-slate-700/60'
                  : 'bg-slate-900/40 text-slate-700 border-slate-900/60 cursor-not-allowed'
              }`}
            >
              {char === '*' ? '×' : char}
            </button>
          ))}

          {['4', '5', '6', '/'].map((char) => (
            <button
              key={char}
              disabled={char !== '/' && !isDigitEnabled(char)}
              onClick={() => (char === '/' ? handleOp('/') : handleDigit(char))}
              className={`py-3 rounded-lg text-base font-bold transition-colors border ${
                char === '/'
                  ? 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-750'
                  : isDigitEnabled(char)
                  ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 border-slate-700/60'
                  : 'bg-slate-900/40 text-slate-700 border-slate-900/60 cursor-not-allowed'
              }`}
            >
              {char === '/' ? '÷' : char}
            </button>
          ))}

          {['1', '2', '3', '%'].map((char) => (
            <button
              key={char}
              disabled={char !== '%' && !isDigitEnabled(char)}
              onClick={() => (char === '%' ? handleOp('%') : handleDigit(char))}
              className={`py-3 rounded-lg text-base font-bold transition-colors border ${
                char === '%'
                  ? 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-750'
                  : isDigitEnabled(char)
                  ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 border-slate-700/60'
                  : 'bg-slate-900/40 text-slate-700 border-slate-900/60 cursor-not-allowed'
              }`}
            >
              {char}
            </button>
          ))}

          <button
            disabled={!isDigitEnabled('0')}
            onClick={() => handleDigit('0')}
            className={`py-3 col-span-2 rounded-lg text-base font-bold transition-colors border ${
              isDigitEnabled('0')
                ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 border-slate-700/60'
                : 'bg-slate-900/40 text-slate-700 border-slate-900/60 cursor-not-allowed'
            }`}
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="py-3 rounded-lg text-sm font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
          >
            DEL
          </button>
          <button
            onClick={handleEquals}
            className="py-3 rounded-lg text-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-lg shadow-cyan-500/20"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
};
