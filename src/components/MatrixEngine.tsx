import React, { useState } from 'react';
import { soundManager } from '../utils/soundEffects';
import { formatNumber } from '../utils/mathEngine';
import { Grid3X3, ArrowRightLeft, Sparkles, RefreshCw } from 'lucide-react';

type Matrix = number[][];

export const MatrixEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'vector'>('matrix');

  // Matrix A and B dimensions & data
  const [rowsA, setRowsA] = useState<number>(3);
  const [colsA, setColsA] = useState<number>(3);
  const [matrixA, setMatrixA] = useState<Matrix>([
    [1, 2, 3],
    [0, 1, 4],
    [5, 6, 0],
  ]);

  const [rowsB, setRowsB] = useState<number>(3);
  const [colsB, setColsB] = useState<number>(3);
  const [matrixB, setMatrixB] = useState<Matrix>([
    [2, 0, -1],
    [1, 3, 2],
    [0, -2, 1],
  ]);

  const [scalarK, setScalarK] = useState<number>(2);
  const [resultMatrix, setResultMatrix] = useState<Matrix | null>(null);
  const [scalarResult, setScalarResult] = useState<{ label: string; value: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Vector workbench
  const [vecU, setVecU] = useState<number[]>([1, 2, 3]);
  const [vecV, setVecV] = useState<number[]>([4, -5, 6]);
  const [vectorResult, setVectorResult] = useState<{
    dotProduct?: number;
    crossProduct?: number[];
    magU?: number;
    magV?: number;
    angleDeg?: number;
  } | null>(null);

  // Resize Matrix helper
  const resizeMatrix = (
    current: Matrix,
    newRows: number,
    newCols: number,
    setter: React.Dispatch<React.SetStateAction<Matrix>>
  ) => {
    soundManager.playKeyClick();
    const next: Matrix = [];
    for (let r = 0; r < newRows; r++) {
      const row: number[] = [];
      for (let c = 0; c < newCols; c++) {
        row.push(current[r]?.[c] ?? (r === c ? 1 : 0));
      }
      next.push(row);
    }
    setter(next);
  };

  const updateCell = (
    setter: React.Dispatch<React.SetStateAction<Matrix>>,
    r: number,
    c: number,
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    setter((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[r][c] = num;
      return copy;
    });
  };

  const setPreset = (
    type: 'identity' | 'zeros' | 'random',
    target: 'A' | 'B'
  ) => {
    soundManager.playActionSound();
    const rows = target === 'A' ? rowsA : rowsB;
    const cols = target === 'A' ? colsA : colsB;
    const setter = target === 'A' ? setMatrixA : setMatrixB;

    const next: Matrix = [];
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        if (type === 'identity') row.push(r === c ? 1 : 0);
        else if (type === 'zeros') row.push(0);
        else row.push(Math.floor(Math.random() * 19) - 9);
      }
      next.push(row);
    }
    setter(next);
  };

  // Matrix math implementations
  const addMatrices = () => {
    soundManager.playEqualSound();
    setErrorMessage(null);
    setScalarResult(null);
    if (rowsA !== rowsB || colsA !== colsB) {
      setErrorMessage('Dimension mismatch: Addition requires identical dimensions');
      setResultMatrix(null);
      return;
    }
    const res: Matrix = matrixA.map((row, r) =>
      row.map((val, c) => val + matrixB[r][c])
    );
    setResultMatrix(res);
  };

  const subtractMatrices = () => {
    soundManager.playEqualSound();
    setErrorMessage(null);
    setScalarResult(null);
    if (rowsA !== rowsB || colsA !== colsB) {
      setErrorMessage('Dimension mismatch: Subtraction requires identical dimensions');
      setResultMatrix(null);
      return;
    }
    const res: Matrix = matrixA.map((row, r) =>
      row.map((val, c) => val - matrixB[r][c])
    );
    setResultMatrix(res);
  };

  const multiplyMatrices = () => {
    soundManager.playEqualSound();
    setErrorMessage(null);
    setScalarResult(null);
    if (colsA !== rowsB) {
      setErrorMessage(`Cannot multiply: Columns of A (${colsA}) must equal Rows of B (${rowsB})`);
      setResultMatrix(null);
      return;
    }
    const res: Matrix = [];
    for (let r = 0; r < rowsA; r++) {
      const row: number[] = [];
      for (let c = 0; c < colsB; c++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += matrixA[r][k] * matrixB[k][c];
        }
        row.push(sum);
      }
      res.push(row);
    }
    setResultMatrix(res);
  };

  // Determinant calculation (Gaussian elimination with row swaps)
  const computeDeterminant = (mat: Matrix): number => {
    const n = mat.length;
    if (n !== mat[0].length) return NaN;
    if (n === 1) return mat[0][0];
    if (n === 2) return mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];

    // Clone matrix
    const a = mat.map((row) => [...row]);
    let det = 1;

    for (let i = 0; i < n; i++) {
      let pivot = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(a[j][i]) > Math.abs(a[pivot][i])) {
          pivot = j;
        }
      }

      if (Math.abs(a[pivot][i]) < 1e-12) return 0;

      if (pivot !== i) {
        [a[i], a[pivot]] = [a[pivot], a[i]];
        det *= -1;
      }

      det *= a[i][i];

      for (let j = i + 1; j < n; j++) {
        const factor = a[j][i] / a[i][i];
        for (let k = i + 1; k < n; k++) {
          a[j][k] -= factor * a[i][k];
        }
      }
    }
    return Math.round(det * 1e10) / 1e10;
  };

  const handleDetA = () => {
    soundManager.playActionSound();
    setErrorMessage(null);
    if (rowsA !== colsA) {
      setErrorMessage('Determinant requires a square matrix');
      return;
    }
    const d = computeDeterminant(matrixA);
    setScalarResult({ label: 'det(A)', value: d });
    setResultMatrix(null);
  };

  // Inverse matrix via Gauss-Jordan elimination
  const computeInverse = (mat: Matrix): Matrix | null => {
    const n = mat.length;
    if (n !== mat[0].length) return null;

    // Augmented matrix [A | I]
    const aug = mat.map((row, r) => [
      ...row,
      ...Array.from({ length: n }, (_, c) => (r === c ? 1 : 0)),
    ]);

    for (let i = 0; i < n; i++) {
      let pivot = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(aug[j][i]) > Math.abs(aug[pivot][i])) {
          pivot = j;
        }
      }

      if (Math.abs(aug[pivot][i]) < 1e-12) return null; // Singular matrix

      if (pivot !== i) {
        [aug[i], aug[pivot]] = [aug[pivot], aug[i]];
      }

      const div = aug[i][i];
      for (let k = 0; k < 2 * n; k++) {
        aug[i][k] /= div;
      }

      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const factor = aug[j][i];
          for (let k = 0; k < 2 * n; k++) {
            aug[j][k] -= factor * aug[i][k];
          }
        }
      }
    }

    const inv: Matrix = aug.map((row) =>
      row.slice(n).map((v) => Math.round(v * 1e8) / 1e8)
    );
    return inv;
  };

  const handleInverseA = () => {
    soundManager.playActionSound();
    setErrorMessage(null);
    setScalarResult(null);
    if (rowsA !== colsA) {
      setErrorMessage('Inverse requires a square matrix');
      return;
    }
    const inv = computeInverse(matrixA);
    if (!inv) {
      setErrorMessage('Matrix A is singular (det = 0) and cannot be inverted');
      setResultMatrix(null);
    } else {
      setResultMatrix(inv);
    }
  };

  const handleTransposeA = () => {
    soundManager.playActionSound();
    setErrorMessage(null);
    setScalarResult(null);
    const trans: Matrix = [];
    for (let c = 0; c < colsA; c++) {
      const row: number[] = [];
      for (let r = 0; r < rowsA; r++) {
        row.push(matrixA[r][c]);
      }
      trans.push(row);
    }
    setResultMatrix(trans);
  };

  const handleTraceA = () => {
    soundManager.playActionSound();
    setErrorMessage(null);
    if (rowsA !== colsA) {
      setErrorMessage('Trace requires a square matrix');
      return;
    }
    let sum = 0;
    for (let i = 0; i < rowsA; i++) sum += matrixA[i][i];
    setScalarResult({ label: 'tr(A)', value: sum });
    setResultMatrix(null);
  };

  const handleScalarMultA = () => {
    soundManager.playActionSound();
    setErrorMessage(null);
    setScalarResult(null);
    const res: Matrix = matrixA.map((row) => row.map((v) => v * scalarK));
    setResultMatrix(res);
  };

  // Vector computations
  const calculateVectors = () => {
    soundManager.playEqualSound();
    const dot = vecU[0] * vecV[0] + vecU[1] * vecV[1] + vecU[2] * vecV[2];
    const magU = Math.sqrt(vecU[0] ** 2 + vecU[1] ** 2 + vecU[2] ** 2);
    const magV = Math.sqrt(vecV[0] ** 2 + vecV[1] ** 2 + vecV[2] ** 2);

    // Cross product
    const cross = [
      vecU[1] * vecV[2] - vecU[2] * vecV[1],
      vecU[2] * vecV[0] - vecU[0] * vecV[2],
      vecU[0] * vecV[1] - vecU[1] * vecV[0],
    ];

    // Angle
    const cosTheta = magU > 0 && magV > 0 ? dot / (magU * magV) : 0;
    const clampedCos = Math.max(-1, Math.min(1, cosTheta));
    const angleRad = Math.acos(clampedCos);
    const angleDeg = (angleRad * 180) / Math.PI;

    setVectorResult({
      dotProduct: dot,
      crossProduct: cross,
      magU,
      magV,
      angleDeg,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Sub-mode selector */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
        <button
          onClick={() => {
            soundManager.playKeyClick();
            setActiveTab('matrix');
          }}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'matrix'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Matrix Algebra (A & B)
        </button>
        <button
          onClick={() => {
            soundManager.playKeyClick();
            setActiveTab('vector');
          }}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'vector'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          3D Vector Workbench
        </button>
      </div>

      {activeTab === 'matrix' ? (
        <>
          {/* Matrices A and B Editors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matrix A Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-cyan-400">
                      Matrix A
                    </span>
                    <span className="text-xs text-slate-500">
                      ({rowsA} × {colsA})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Dim:</span>
                    <select
                      value={`${rowsA}x${colsA}`}
                      onChange={(e) => {
                        const [r, c] = e.target.value.split('x').map(Number);
                        setRowsA(r);
                        setColsA(c);
                        resizeMatrix(matrixA, r, c, setMatrixA);
                      }}
                      className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1"
                    >
                      <option value="2x2">2 × 2</option>
                      <option value="3x3">3 × 3</option>
                      <option value="4x4">4 × 4</option>
                      <option value="2x3">2 × 3</option>
                      <option value="3x2">3 × 2</option>
                    </select>
                  </div>
                </div>

                {/* Matrix A Cells Grid */}
                <div
                  className="grid gap-2 my-4"
                  style={{
                    gridTemplateColumns: `repeat(${colsA}, minmax(0, 1fr))`,
                  }}
                >
                  {matrixA.map((row, r) =>
                    row.map((val, c) => (
                      <input
                        key={`${r}-${c}`}
                        type="number"
                        step="any"
                        value={val}
                        onChange={(e) => updateCell(setMatrixA, r, c, e.target.value)}
                        className="bg-slate-800 border border-slate-700/80 rounded-lg p-2.5 text-center font-mono text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Presets and Single-Matrix Operations */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>Preset:</span>
                  <button
                    onClick={() => setPreset('identity', 'A')}
                    className="hover:text-cyan-400 underline"
                  >
                    I
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => setPreset('zeros', 'A')}
                    className="hover:text-cyan-400 underline"
                  >
                    0
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => setPreset('random', 'A')}
                    className="hover:text-cyan-400 underline"
                  >
                    Random
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDetA}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-700 font-mono"
                  >
                    det(A)
                  </button>
                  <button
                    onClick={handleInverseA}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-700 font-mono"
                  >
                    A⁻¹
                  </button>
                  <button
                    onClick={handleTransposeA}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-700 font-mono"
                  >
                    Aᵀ
                  </button>
                  <button
                    onClick={handleTraceA}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-700 font-mono"
                  >
                    tr(A)
                  </button>
                </div>
              </div>
            </div>

            {/* Matrix B Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-amber-400">
                      Matrix B
                    </span>
                    <span className="text-xs text-slate-500">
                      ({rowsB} × {colsB})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Dim:</span>
                    <select
                      value={`${rowsB}x${colsB}`}
                      onChange={(e) => {
                        const [r, c] = e.target.value.split('x').map(Number);
                        setRowsB(r);
                        setColsB(c);
                        resizeMatrix(matrixB, r, c, setMatrixB);
                      }}
                      className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1"
                    >
                      <option value="2x2">2 × 2</option>
                      <option value="3x3">3 × 3</option>
                      <option value="4x4">4 × 4</option>
                      <option value="2x3">2 × 3</option>
                      <option value="3x2">3 × 2</option>
                    </select>
                  </div>
                </div>

                {/* Matrix B Cells Grid */}
                <div
                  className="grid gap-2 my-4"
                  style={{
                    gridTemplateColumns: `repeat(${colsB}, minmax(0, 1fr))`,
                  }}
                >
                  {matrixB.map((row, r) =>
                    row.map((val, c) => (
                      <input
                        key={`${r}-${c}`}
                        type="number"
                        step="any"
                        value={val}
                        onChange={(e) => updateCell(setMatrixB, r, c, e.target.value)}
                        className="bg-slate-800 border border-slate-700/80 rounded-lg p-2.5 text-center font-mono text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Presets */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>Preset:</span>
                  <button
                    onClick={() => setPreset('identity', 'B')}
                    className="hover:text-amber-400 underline"
                  >
                    I
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => setPreset('zeros', 'B')}
                    className="hover:text-amber-400 underline"
                  >
                    0
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => setPreset('random', 'B')}
                    className="hover:text-amber-400 underline"
                  >
                    Random
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Operations Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={addMatrices}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm transition-colors shadow-md"
              >
                A + B
              </button>
              <button
                onClick={subtractMatrices}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm transition-colors shadow-md"
              >
                A − B
              </button>
              <button
                onClick={multiplyMatrices}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm transition-colors shadow-md"
              >
                A × B
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Scalar k =</span>
              <input
                type="number"
                value={scalarK}
                onChange={(e) => setScalarK(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-center text-slate-100"
              />
              <button
                onClick={handleScalarMultA}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                k · A
              </button>
            </div>
          </div>

          {/* Matrix Results Display */}
          {(resultMatrix || scalarResult || errorMessage) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block mb-3">
                Computation Result
              </span>

              {errorMessage && (
                <div className="text-sm font-mono text-rose-400 bg-rose-950/30 border border-rose-800/50 p-3 rounded-lg">
                  ✖ {errorMessage}
                </div>
              )}

              {scalarResult && (
                <div className="p-4 bg-slate-850 rounded-lg border border-slate-800 flex items-center gap-4">
                  <span className="font-mono text-sm text-slate-400">
                    {scalarResult.label} =
                  </span>
                  <span className="font-mono text-2xl font-bold text-cyan-400">
                    {formatNumber(scalarResult.value, 'standard', 6)}
                  </span>
                </div>
              )}

              {resultMatrix && (
                <div className="overflow-x-auto">
                  <div
                    className="inline-grid gap-2 p-3 bg-slate-850 rounded-lg border border-slate-800"
                    style={{
                      gridTemplateColumns: `repeat(${resultMatrix[0].length}, minmax(64px, 1fr))`,
                    }}
                  >
                    {resultMatrix.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`${r}-${c}`}
                          className="p-2.5 rounded bg-slate-900 border border-slate-750 font-mono text-sm font-bold text-cyan-300 text-center tabular-nums"
                        >
                          {formatNumber(val, 'standard', 4)}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Vector Workbench Mode */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vector u */}
            <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                Vector u [ux, uy, uz]
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['ux', 'uy', 'uz'].map((axis, i) => (
                  <div key={axis} className="flex flex-col gap-1">
                    <span className="text-[11px] font-mono text-slate-500 uppercase">
                      {axis}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={vecU[i]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setVecU((prev) => {
                          const c = [...prev];
                          c[i] = val;
                          return c;
                        });
                      }}
                      className="bg-slate-800 border border-slate-700 rounded p-2 text-center font-mono text-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Vector v */}
            <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                Vector v [vx, vy, vz]
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['vx', 'vy', 'vz'].map((axis, i) => (
                  <div key={axis} className="flex flex-col gap-1">
                    <span className="text-[11px] font-mono text-slate-500 uppercase">
                      {axis}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={vecV[i]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setVecV((prev) => {
                          const c = [...prev];
                          c[i] = val;
                          return c;
                        });
                      }}
                      className="bg-slate-800 border border-slate-700 rounded p-2 text-center font-mono text-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={calculateVectors}
            className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-cyan-500/20"
          >
            Compute Vector Analysis (Dot, Cross, Magnitudes & Angle)
          </button>

          {vectorResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800 font-mono">
              <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Dot Product (u · v)</span>
                <span className="text-xl font-bold text-cyan-400 tabular-nums">
                  {vectorResult.dotProduct?.toFixed(4)}
                </span>
              </div>

              <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Cross Product (u × v)</span>
                <span className="text-sm font-bold text-amber-400 tabular-nums">
                  [{vectorResult.crossProduct?.join(', ')}]
                </span>
              </div>

              <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Magnitudes ||u||, ||v||</span>
                <span className="text-xs font-semibold text-slate-200 tabular-nums">
                  {vectorResult.magU?.toFixed(3)} · {vectorResult.magV?.toFixed(3)}
                </span>
              </div>

              <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Angle θ</span>
                <span className="text-xl font-bold text-emerald-400 tabular-nums">
                  {vectorResult.angleDeg?.toFixed(2)}°
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
