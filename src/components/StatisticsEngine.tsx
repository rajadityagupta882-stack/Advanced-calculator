import React, { useState } from 'react';
import { soundManager } from '../utils/soundEffects';
import { formatNumber } from '../utils/mathEngine';
import { BarChart3, Binary, RefreshCw } from 'lucide-react';

export const StatisticsEngine: React.FC = () => {
  const [dataInput, setDataInput] = useState<string>(
    '12, 15, 18, 22, 25, 27, 28, 30, 31, 35, 38, 42, 45, 48, 52'
  );

  // Normal distribution solver inputs
  const [zValueInput, setZValueInput] = useState<number>(30);

  // Parse raw dataset
  const parsedData = React.useMemo(() => {
    const rawTokens = dataInput.split(/[\s,;\n]+/);
    const nums: number[] = [];
    for (const t of rawTokens) {
      if (!t.trim()) continue;
      const n = parseFloat(t);
      if (!isNaN(n)) nums.push(n);
    }
    nums.sort((a, b) => a - b);
    return nums;
  }, [dataInput]);

  // Statistical Metrics
  const stats = React.useMemo(() => {
    const n = parsedData.length;
    if (n === 0) return null;

    const sum = parsedData.reduce((acc, val) => acc + val, 0);
    const sumSquares = parsedData.reduce((acc, val) => acc + val * val, 0);
    const mean = sum / n;

    // Median
    const mid = Math.floor(n / 2);
    const median = n % 2 !== 0 ? parsedData[mid] : (parsedData[mid - 1] + parsedData[mid]) / 2;

    // Quartiles
    const q1 =
      n >= 4
        ? parsedData[Math.floor(n * 0.25)]
        : parsedData[0];
    const q3 =
      n >= 4
        ? parsedData[Math.floor(n * 0.75)]
        : parsedData[n - 1];
    const iqr = q3 - q1;

    // Min, Max, Range
    const min = parsedData[0];
    const max = parsedData[n - 1];
    const range = max - min;

    // Variance & Standard Deviation
    const variancePop = parsedData.reduce((acc, val) => acc + (val - mean) ** 2, 0) / n;
    const stdPop = Math.sqrt(variancePop);

    const varianceSample = n > 1 ? parsedData.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (n - 1) : 0;
    const stdSample = Math.sqrt(varianceSample);

    const sem = stdSample / Math.sqrt(n);

    // Mode
    const freqMap = new Map<number, number>();
    parsedData.forEach((v) => freqMap.set(v, (freqMap.get(v) || 0) + 1));
    let maxFreq = 0;
    let mode: number[] = [];
    freqMap.forEach((count, val) => {
      if (count > maxFreq) {
        maxFreq = count;
        mode = [val];
      } else if (count === maxFreq && count > 1) {
        mode.push(val);
      }
    });

    // Histogram bins
    const numBins = Math.min(8, Math.max(4, Math.floor(Math.sqrt(n))));
    const binWidth = range > 0 ? range / numBins : 1;
    const bins: { label: string; count: number; start: number; end: number }[] = [];

    for (let b = 0; b < numBins; b++) {
      const bStart = min + b * binWidth;
      const bEnd = bStart + binWidth;
      const count = parsedData.filter((v) =>
        b === numBins - 1 ? v >= bStart && v <= bEnd : v >= bStart && v < bEnd
      ).length;
      bins.push({
        label: `${bStart.toFixed(1)} - ${bEnd.toFixed(1)}`,
        count,
        start: bStart,
        end: bEnd,
      });
    }

    return {
      n,
      sum,
      sumSquares,
      mean,
      median,
      q1,
      q3,
      iqr,
      min,
      max,
      range,
      variancePop,
      stdPop,
      varianceSample,
      stdSample,
      sem,
      mode: maxFreq > 1 ? mode : ['No unique mode'],
      bins,
    };
  }, [parsedData]);

  // Error function for normal cumulative probability
  const erf = (x: number): number => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);

    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);

    return sign * y;
  };

  const normalCDF = (z: number): number => {
    return 0.5 * (1 + erf(z / Math.SQRT2));
  };

  const zScore = stats && stats.stdSample > 0 ? (zValueInput - stats.mean) / stats.stdSample : 0;
  const pLess = normalCDF(zScore);
  const pGreater = 1 - pLess;

  const loadPreset = (type: 'physics' | 'grades' | 'uniform') => {
    soundManager.playActionSound();
    if (type === 'physics') {
      setDataInput('9.81, 9.79, 9.84, 9.82, 9.80, 9.83, 9.78, 9.85, 9.81, 9.82');
    } else if (type === 'grades') {
      setDataInput('78, 85, 92, 65, 88, 94, 72, 81, 90, 84, 76, 95, 68, 89, 91');
    } else {
      setDataInput('10, 20, 30, 40, 50, 60, 70, 80, 90, 100');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Dataset Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Sample Dataset Input
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({parsedData.length} valid numbers)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Presets:</span>
            <button
              onClick={() => loadPreset('physics')}
              className="hover:text-cyan-400 underline"
            >
              Gravity (g)
            </button>
            <span>·</span>
            <button
              onClick={() => loadPreset('grades')}
              className="hover:text-cyan-400 underline"
            >
              Test Scores
            </button>
            <span>·</span>
            <button
              onClick={() => loadPreset('uniform')}
              className="hover:text-cyan-400 underline"
            >
              10-100
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={dataInput}
          onChange={(e) => setDataInput(e.target.value)}
          placeholder="Paste or enter numbers separated by commas, spaces, or lines..."
          className="w-full bg-slate-800 border border-slate-700/80 rounded-lg p-3 font-mono text-xs text-slate-100 focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
        />
      </div>

      {stats ? (
        <>
          {/* Descriptive Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Mean (x̄)
              </span>
              <span className="text-lg font-bold text-cyan-400 tabular-nums">
                {stats.mean.toFixed(3)}
              </span>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Median
              </span>
              <span className="text-lg font-bold text-slate-100 tabular-nums">
                {stats.median.toFixed(3)}
              </span>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Std Dev (s)
              </span>
              <span className="text-lg font-bold text-amber-400 tabular-nums">
                {stats.stdSample.toFixed(3)}
              </span>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Variance (s²)
              </span>
              <span className="text-lg font-bold text-slate-200 tabular-nums">
                {stats.varianceSample.toFixed(3)}
              </span>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Range (Max - Min)
              </span>
              <span className="text-lg font-bold text-slate-200 tabular-nums">
                {stats.range.toFixed(3)}
              </span>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Sample Size (n)
              </span>
              <span className="text-lg font-bold text-purple-400 tabular-nums">
                {stats.n}
              </span>
            </div>
          </div>

          {/* Histogram & Box Plot Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Frequency Histogram */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block pb-2 border-b border-slate-800">
                Frequency Histogram
              </span>

              <div className="space-y-2 pt-2">
                {stats.bins.map((bin, i) => {
                  const maxCount = Math.max(...stats.bins.map((b) => b.count), 1);
                  const pct = (bin.count / maxCount) * 100;
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs font-mono">
                      <span className="w-24 text-right text-slate-400 truncate">
                        {bin.label}
                      </span>
                      <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden flex items-center">
                        <div
                          className="h-full bg-cyan-500/80 hover:bg-cyan-400 transition-all rounded-r flex items-center justify-end px-2"
                          style={{ width: `${Math.max(pct, 6)}%` }}
                        >
                          <span className="text-[11px] font-bold text-slate-950">
                            {bin.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Five-Number Summary & Quartiles */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-800 mb-3">
                  Five-Number Summary (Boxplot Data)
                </span>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between p-2 rounded bg-slate-850">
                    <span className="text-slate-400">Minimum (Min):</span>
                    <span className="font-bold text-slate-100">{stats.min.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-850">
                    <span className="text-slate-400">First Quartile (Q₁):</span>
                    <span className="font-bold text-cyan-400">{stats.q1.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-850">
                    <span className="text-slate-400">Median (Q₂):</span>
                    <span className="font-bold text-amber-400">{stats.median.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-850">
                    <span className="text-slate-400">Third Quartile (Q₃):</span>
                    <span className="font-bold text-cyan-400">{stats.q3.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-850">
                    <span className="text-slate-400">Maximum (Max):</span>
                    <span className="font-bold text-slate-100">{stats.max.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-850">
                    <span className="text-slate-400">Interquartile Range (IQR):</span>
                    <span className="font-bold text-emerald-400">{stats.iqr.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Normal Distribution Z-score Calculator */}
              <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Normal Distribution Probability
                </span>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Value x =</span>
                  <input
                    type="number"
                    step="any"
                    value={zValueInput}
                    onChange={(e) => setZValueInput(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />
                  <span className="text-cyan-400 font-bold">
                    Z = {zScore.toFixed(3)}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-300">
                  P(X ≤ {zValueInput}) = {(pLess * 100).toFixed(2)}% · P(X &gt; {zValueInput}) = {(pGreater * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-slate-500 font-mono text-xs">
          Enter at least one numeric value in the box above to generate statistics.
        </div>
      )}
    </div>
  );
};
