/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CalculatorMode, HistoryItem, MemoryStore } from './types/calculator';
import { StepTrace } from './utils/mathEngine';
import { soundManager } from './utils/soundEffects';
import { Header } from './components/Header';
import { ScientificEngine } from './components/ScientificEngine';
import { GraphingEngine } from './components/GraphingEngine';
import { ProgrammerEngine } from './components/ProgrammerEngine';
import { MatrixEngine } from './components/MatrixEngine';
import { UnitConverterEngine } from './components/UnitConverterEngine';
import { FinancialEngine } from './components/FinancialEngine';
import { StatisticsEngine } from './components/StatisticsEngine';
import { StepByStepModal } from './components/StepByStepModal';
import { KeyboardGuideModal } from './components/KeyboardGuideModal';
import {
  Calculator,
  LineChart,
  Binary,
  Grid3X3,
  ArrowRightLeft,
  DollarSign,
  BarChart3,
} from 'lucide-react';

export default function App() {
  const [activeMode, setActiveMode] = useState<CalculatorMode>('scientific');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Persistent History
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('omni_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Memory Registers & Custom Variables
  const [memory, setMemory] = useState<MemoryStore>(() => {
    try {
      const saved = localStorage.getItem('omni_calc_memory');
      return saved ? JSON.parse(saved) : { M: 0, vars: { x: 5, y: 10, a: 1, b: 2 } };
    } catch {
      return { M: 0, vars: { x: 5, y: 10, a: 1, b: 2 } };
    }
  });

  // Step modal state
  const [stepModalData, setStepModalData] = useState<{
    isOpen: boolean;
    expression: string;
    result: string;
    steps: StepTrace[];
  }>({
    isOpen: false,
    expression: '',
    result: '',
    steps: [],
  });

  // Help modal state
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Sync sound settings with soundManager
  useEffect(() => {
    soundManager.enabled = soundEnabled;
  }, [soundEnabled]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omni_calc_history', JSON.stringify(history.slice(0, 50)));
    } catch {
      // storage full or unavailable
    }
  }, [history]);

  // Sync memory to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omni_calc_memory', JSON.stringify(memory));
    } catch {
      // ignore
    }
  }, [memory]);

  const addHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
  };

  const clearHistory = () => {
    soundManager.playClearSound();
    setHistory([]);
    try {
      localStorage.removeItem('omni_calc_history');
    } catch {
      // ignore
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
    if (next) soundManager.playActionSound();
  };

  const openStepModal = (steps: StepTrace[], expr: string, result: string) => {
    setStepModalData({
      isOpen: true,
      expression: expr,
      result,
      steps,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar Header */}
      <Header
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Mobile Mode Switcher (Visible on small screens) */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-slate-900 border-b border-slate-800">
        {[
          { id: 'scientific' as CalculatorMode, label: 'Scientific', icon: Calculator },
          { id: 'graphing' as CalculatorMode, label: 'Graphing', icon: LineChart },
          { id: 'programmer' as CalculatorMode, label: 'Programmer', icon: Binary },
          { id: 'matrix' as CalculatorMode, label: 'Matrix', icon: Grid3X3 },
          { id: 'converter' as CalculatorMode, label: 'Units', icon: ArrowRightLeft },
          { id: 'financial' as CalculatorMode, label: 'Financial', icon: DollarSign },
          { id: 'statistics' as CalculatorMode, label: 'Statistics', icon: BarChart3 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              soundManager.playKeyClick();
              setActiveMode(id);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeMode === id
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Main Workspace Stage */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col justify-center">
        {activeMode === 'scientific' && (
          <ScientificEngine
            history={history}
            onAddHistory={addHistory}
            onClearHistory={clearHistory}
            memory={memory}
            onUpdateMemory={setMemory}
            onOpenStepModal={openStepModal}
            onOpenHelp={() => setIsHelpOpen(true)}
          />
        )}

        {activeMode === 'graphing' && <GraphingEngine />}

        {activeMode === 'programmer' && (
          <ProgrammerEngine onAddHistory={addHistory} />
        )}

        {activeMode === 'matrix' && <MatrixEngine />}

        {activeMode === 'converter' && <UnitConverterEngine />}

        {activeMode === 'financial' && <FinancialEngine />}

        {activeMode === 'statistics' && <StatisticsEngine />}
      </main>

      {/* Modals */}
      <StepByStepModal
        isOpen={stepModalData.isOpen}
        onClose={() => setStepModalData((prev) => ({ ...prev, isOpen: false }))}
        expression={stepModalData.expression}
        result={stepModalData.result}
        steps={stepModalData.steps}
      />

      <KeyboardGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
