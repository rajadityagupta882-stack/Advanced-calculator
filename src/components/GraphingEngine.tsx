import React, { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateExpression, formatNumber } from '../utils/mathEngine';
import { soundManager } from '../utils/soundEffects';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Crosshair,
  Table,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface FunctionCurve {
  id: string;
  name: string;
  expr: string;
  color: string;
  visible: boolean;
}

const DEFAULT_PRESETS = [
  { name: 'Damped Oscillation', expr: 'exp(-0.15*x)*sin(2.5*x)' },
  { name: 'Cubic Polynomial', expr: '0.2*(x^3 - 4*x)' },
  { name: 'Gaussian Bell', expr: 'exp(-0.5*x^2)' },
  { name: 'Sigmoid Curve', expr: '2/(1 + exp(-x)) - 1' },
  { name: 'Harmonic Wave', expr: 'sin(x) + 0.5*sin(3*x)' },
];

const CURVE_COLORS = ['#06b6d4', '#f59e0b', '#ec4899', '#10b981'];

export const GraphingEngine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [curves, setCurves] = useState<FunctionCurve[]>([
    { id: '1', name: 'f₁(x)', expr: 'sin(x)', color: '#06b6d4', visible: true },
    { id: '2', name: 'f₂(x)', expr: '0.1*x^2 - 2', color: '#f59e0b', visible: true },
  ]);

  // Viewport boundaries
  const [view, setView] = useState({
    xMin: -10,
    xMax: 10,
    yMin: -6,
    yMax: 6,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<{ type: string; points: { x: number; y: number }[] } | null>(null);

  // Coordinate transforms
  const toScreenX = (x: number, width: number) => {
    return ((x - view.xMin) / (view.xMax - view.xMin)) * width;
  };

  const toScreenY = (y: number, height: number) => {
    return height - ((y - view.yMin) / (view.yMax - view.yMin)) * height;
  };

  const toMathX = (px: number, width: number) => {
    return view.xMin + (px / width) * (view.xMax - view.xMin);
  };

  const toMathY = (py: number, height: number) => {
    return view.yMin + ((height - py) / height) * (view.yMax - view.yMin);
  };

  // Render Canvas
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Grid spacing calculation
    const xSpan = view.xMax - view.xMin;
    const ySpan = view.yMax - view.yMin;

    const rawStepX = Math.pow(10, Math.floor(Math.log10(xSpan / 6)));
    const stepX = xSpan / rawStepX > 15 ? rawStepX * 2 : rawStepX;

    const rawStepY = Math.pow(10, Math.floor(Math.log10(ySpan / 6)));
    const stepY = ySpan / rawStepY > 15 ? rawStepY * 2 : rawStepY;

    // Draw Sub-grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const startX = Math.floor(view.xMin / stepX) * stepX;
    for (let x = startX; x <= view.xMax; x += stepX) {
      const sx = toScreenX(x, width);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }

    const startY = Math.floor(view.yMin / stepY) * stepY;
    for (let y = startY; y <= view.yMax; y += stepY) {
      const sy = toScreenY(y, height);
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();

    // Draw Axes (x=0, y=0)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const axisX = toScreenX(0, width);
    if (axisX >= 0 && axisX <= width) {
      ctx.moveTo(axisX, 0);
      ctx.lineTo(axisX, height);
    }

    const axisY = toScreenY(0, height);
    if (axisY >= 0 && axisY <= height) {
      ctx.moveTo(0, axisY);
      ctx.lineTo(width, axisY);
    }
    ctx.stroke();

    // Axis Labels & Numbers
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let x = startX; x <= view.xMax; x += stepX) {
      if (Math.abs(x) < 1e-9) continue;
      const sx = toScreenX(x, width);
      const labelY = Math.min(Math.max(axisY + 4, 15), height - 20);
      ctx.fillText(Number(x.toFixed(4)).toString(), sx, labelY);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = startY; y <= view.yMax; y += stepY) {
      if (Math.abs(y) < 1e-9) continue;
      const sy = toScreenY(y, height);
      const labelX = Math.min(Math.max(axisX - 6, 35), width - 10);
      ctx.fillText(Number(y.toFixed(4)).toString(), labelX, sy);
    }

    // Plot Curves
    const numPoints = width;
    curves.forEach((curve) => {
      if (!curve.visible || !curve.expr.trim()) return;

      ctx.strokeStyle = curve.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      let isDrawing = false;
      let prevY = 0;

      for (let px = 0; px < numPoints; px += 1) {
        const x = toMathX(px, width);
        const evalRes = evaluateExpression(curve.expr, {
          angleMode: 'RAD',
          variables: { x },
        });

        if (evalRes.error || isNaN(evalRes.value) || !isFinite(evalRes.value)) {
          isDrawing = false;
          continue;
        }

        const y = evalRes.value;
        const py = toScreenY(y, height);

        // Detect vertical asymptote jump
        if (isDrawing && Math.abs(py - prevY) > height * 0.7) {
          isDrawing = false;
        }

        if (!isDrawing) {
          ctx.moveTo(px, py);
          isDrawing = true;
        } else {
          ctx.lineTo(px, py);
        }
        prevY = py;
      }

      ctx.stroke();
    });

    // Draw Analysis Points (Roots or Extrema)
    if (analysisResults && analysisResults.points.length > 0) {
      analysisResults.points.forEach((pt) => {
        const sx = toScreenX(pt.x, width);
        const sy = toScreenY(pt.y, height);
        if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(sx, sy, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Text label
          ctx.fillStyle = '#f8fafc';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`, sx + 8, sy - 8);
        }
      });
    }

    // Hover Crosshairs
    if (hoverCoord) {
      const sx = toScreenX(hoverCoord.x, width);
      const sy = toScreenY(hoverCoord.y, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [curves, view, hoverCoord, analysisResults]);

  // Synchronize canvas size on mount / resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      }
      drawGraph();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [drawGraph]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Canvas Mouse Interactivity (Pan & Hover)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const mathX = toMathX(mouseX, rect.width);
    const mathY = toMathY(mouseY, rect.height);

    setHoverCoord({ x: mathX, y: mathY });

    if (isDragging) {
      const dxPx = e.clientX - dragStart.x;
      const dyPx = e.clientY - dragStart.y;

      const spanX = view.xMax - view.xMin;
      const spanY = view.yMax - view.yMin;

      const dxMath = (dxPx / rect.width) * spanX;
      const dyMath = (dyPx / rect.height) * spanY;

      setView((prev) => ({
        xMin: prev.xMin - dxMath,
        xMax: prev.xMax - dxMath,
        yMin: prev.yMin + dyMath,
        yMax: prev.yMax + dyMath,
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.85;
    applyZoom(factor);
  };

  const applyZoom = (factor: number) => {
    soundManager.playKeyClick(700, 0.015);
    setView((prev) => {
      const centerX = (prev.xMin + prev.xMax) / 2;
      const centerY = (prev.yMin + prev.yMax) / 2;
      const halfWidth = ((prev.xMax - prev.xMin) * factor) / 2;
      const halfHeight = ((prev.yMax - prev.yMin) * factor) / 2;
      return {
        xMin: centerX - halfWidth,
        xMax: centerX + halfWidth,
        yMin: centerY - halfHeight,
        yMax: centerY + halfHeight,
      };
    });
  };

  const resetView = () => {
    soundManager.playActionSound();
    setView({ xMin: -10, xMax: 10, yMin: -6, yMax: 6 });
    setAnalysisResults(null);
  };

  // Numerical Root Finder
  const findRoots = () => {
    soundManager.playActionSound();
    const activeCurve = curves.find((c) => c.visible && c.expr.trim());
    if (!activeCurve) return;

    const roots: { x: number; y: number }[] = [];
    const steps = 400;
    const dx = (view.xMax - view.xMin) / steps;

    let prevX = view.xMin;
    let prevY = evaluateExpression(activeCurve.expr, { variables: { x: prevX } }).value;

    for (let i = 1; i <= steps; i++) {
      const currX = view.xMin + i * dx;
      const currY = evaluateExpression(activeCurve.expr, { variables: { x: currX } }).value;

      if (!isNaN(prevY) && !isNaN(currY)) {
        // Sign change detected
        if (prevY * currY <= 0) {
          // Bisection approximation
          let low = prevX;
          let high = currX;
          for (let iter = 0; iter < 12; iter++) {
            const mid = (low + high) / 2;
            const midY = evaluateExpression(activeCurve.expr, { variables: { x: mid } }).value;
            if (prevY * midY <= 0) {
              high = mid;
            } else {
              low = mid;
            }
          }
          const rootX = (low + high) / 2;
          roots.push({ x: rootX, y: 0 });
        }
      }
      prevX = currX;
      prevY = currY;
    }

    setAnalysisResults({ type: 'Roots (zeros)', points: roots });
  };

  const addCurve = () => {
    soundManager.playActionSound();
    if (curves.length >= 4) return;
    const nextIdx = curves.length + 1;
    const color = CURVE_COLORS[curves.length % CURVE_COLORS.length];
    setCurves((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: `f${nextIdx}(x)`,
        expr: 'cos(x)',
        color,
        visible: true,
      },
    ]);
  };

  const removeCurve = (id: string) => {
    soundManager.playClearSound();
    setCurves((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleVisibility = (id: string) => {
    setCurves((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
  };

  const updateExpr = (id: string, expr: string) => {
    setCurves((prev) => prev.map((c) => (c.id === id ? { ...c, expr } : c)));
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5">
      {/* Function Control Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Active Equations
            </span>
            <span className="text-xs text-slate-500">
              ({curves.filter((c) => c.visible).length} displayed)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Presets dropdown */}
            <select
              onChange={(e) => {
                if (!e.target.value) return;
                const preset = DEFAULT_PRESETS.find((p) => p.name === e.target.value);
                if (preset && curves.length > 0) {
                  updateExpr(curves[0].id, preset.expr);
                }
              }}
              defaultValue=""
              className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="" disabled>
                Load Preset Function...
              </option>
              {DEFAULT_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.expr})
                </option>
              ))}
            </select>

            <button
              onClick={addCurve}
              disabled={curves.length >= 4}
              className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs transition-colors disabled:opacity-30 border border-slate-700/60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Function</span>
            </button>
          </div>
        </div>

        {/* Function inputs list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {curves.map((curve) => (
            <div
              key={curve.id}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-850 border border-slate-800 focus-within:border-slate-700"
            >
              <button
                onClick={() => toggleVisibility(curve.id)}
                className="p-1 rounded text-slate-400 hover:text-white"
                title={curve.visible ? 'Hide curve' : 'Show curve'}
              >
                {curve.visible ? (
                  <Eye className="w-4 h-4" style={{ color: curve.color }} />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-600" />
                )}
              </button>

              <span
                className="font-mono text-xs font-bold"
                style={{ color: curve.color }}
              >
                {curve.name} =
              </span>

              <input
                type="text"
                value={curve.expr}
                onChange={(e) => updateExpr(curve.id, e.target.value)}
                placeholder="e.g. sin(x)"
                className="flex-1 bg-transparent text-sm font-mono text-slate-100 focus:outline-none"
              />

              {curves.length > 1 && (
                <button
                  onClick={() => removeCurve(curve.id)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Graph Viewport Stage */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
        {/* Floating HUD Controls */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => applyZoom(0.8)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyZoom(1.25)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
            title="Reset to [-10, 10]"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            onClick={findRoots}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-rose-400 transition-colors"
            title="Locate roots on active curve"
          >
            <Crosshair className="w-3.5 h-3.5 text-rose-400" />
            <span>Find Roots</span>
          </button>
          <button
            onClick={() => setShowTableModal(!showTableModal)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
            title="Generate Value Table"
          >
            <Table className="w-3.5 h-3.5 text-amber-400" />
            <span>Table</span>
          </button>
        </div>

        {/* Live Coordinate Crosshair Readout */}
        {hoverCoord && (
          <div className="absolute top-3 right-3 z-10 font-mono text-xs bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300 tabular-nums">
            <span className="text-slate-500">X:</span>{' '}
            <span className="text-cyan-400 font-semibold">{hoverCoord.x.toFixed(3)}</span>
            <span className="mx-2 text-slate-600">|</span>
            <span className="text-slate-500">Y:</span>{' '}
            <span className="text-cyan-400 font-semibold">{hoverCoord.y.toFixed(3)}</span>
          </div>
        )}

        {/* Graph Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDragging(false);
            setHoverCoord(null);
          }}
          onWheel={handleWheel}
          className="w-full h-[520px] cursor-crosshair block"
        />

        {/* Graph Footer Bar */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-4">
            <span>
              X: [{view.xMin.toFixed(1)}, {view.xMax.toFixed(1)}]
            </span>
            <span>
              Y: [{view.yMin.toFixed(1)}, {view.yMax.toFixed(1)}]
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span>Drag to Pan</span>
            <span>·</span>
            <span>Scroll to Zoom</span>
          </div>
        </div>
      </div>

      {/* Value Table Drawer */}
      {showTableModal && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Discrete Function Value Table
            </span>
            <button
              onClick={() => setShowTableModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-left font-mono text-xs tabular-nums">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3">X</th>
                  {curves.map(
                    (c) =>
                      c.visible && (
                        <th key={c.id} className="py-2 px-3" style={{ color: c.color }}>
                          {c.name}
                        </th>
                      )
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 21 }).map((_, i) => {
                  const xVal = -5 + i * 0.5;
                  return (
                    <tr
                      key={i}
                      className="border-b border-slate-800/40 hover:bg-slate-800/40"
                    >
                      <td className="py-1.5 px-3 font-semibold text-slate-300">
                        {xVal.toFixed(1)}
                      </td>
                      {curves.map(
                        (c) =>
                          c.visible && (
                            <td key={c.id} className="py-1.5 px-3 text-slate-200">
                              {formatNumber(
                                evaluateExpression(c.expr, {
                                  variables: { x: xVal },
                                }).value,
                                'standard',
                                4
                              )}
                            </td>
                          )
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
