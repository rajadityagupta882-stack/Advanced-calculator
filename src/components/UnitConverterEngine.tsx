import React, { useState } from 'react';
import { soundManager } from '../utils/soundEffects';
import { formatNumber } from '../utils/mathEngine';
import { ArrowRightLeft, Search, Copy, Check } from 'lucide-react';

interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

interface UnitCategory {
  id: string;
  name: string;
  units: UnitDef[];
}

const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    name: 'Length & Distance',
    units: [
      { id: 'm', name: 'Meter', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km', name: 'Kilometer', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cm', name: 'Centimeter', symbol: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: 'mm', name: 'Millimeter', symbol: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'in', name: 'Inch', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: 'ft', name: 'Foot', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'yd', name: 'Yard', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: 'mi', name: 'Mile', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { id: 'nmi', name: 'Nautical Mile', symbol: 'nmi', toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
      { id: 'ly', name: 'Light-year', symbol: 'ly', toBase: (v) => v * 9.461e15, fromBase: (v) => v / 9.461e15 },
    ],
  },
  {
    id: 'mass',
    name: 'Mass & Weight',
    units: [
      { id: 'kg', name: 'Kilogram', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', name: 'Gram', symbol: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'mg', name: 'Milligram', symbol: 'mg', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { id: 'lb', name: 'Pound', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: 'oz', name: 'Ounce', symbol: 'oz', toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
      { id: 'ton', name: 'Metric Ton', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'st', name: 'Stone', symbol: 'st', toBase: (v) => v * 6.350293, fromBase: (v) => v / 6.350293 },
      { id: 'ct', name: 'Carat', symbol: 'ct', toBase: (v) => v * 0.0002, fromBase: (v) => v / 0.0002 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
      { id: 'r', name: 'Rankine', symbol: '°R', toBase: (v) => ((v - 491.67) * 5) / 9, fromBase: (v) => ((v + 273.15) * 9) / 5 },
    ],
  },
  {
    id: 'data',
    name: 'Digital Data & Storage',
    units: [
      { id: 'b', name: 'Byte', symbol: 'B', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kb', name: 'Kilobyte (10³)', symbol: 'KB', toBase: (v) => v * 1e3, fromBase: (v) => v / 1e3 },
      { id: 'mb', name: 'Megabyte (10⁶)', symbol: 'MB', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'gb', name: 'Gigabyte (10⁹)', symbol: 'GB', toBase: (v) => v * 1e9, fromBase: (v) => v / 1e9 },
      { id: 'tb', name: 'Terabyte (10¹²)', symbol: 'TB', toBase: (v) => v * 1e12, fromBase: (v) => v / 1e12 },
      { id: 'kib', name: 'Kibibyte (2¹⁰)', symbol: 'KiB', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { id: 'mib', name: 'Mebibyte (2²⁰)', symbol: 'MiB', toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
      { id: 'gib', name: 'Gibibyte (2³⁰)', symbol: 'GiB', toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
      { id: 'tib', name: 'Tebibyte (2⁴⁰)', symbol: 'TiB', toBase: (v) => v * 1099511627776, fromBase: (v) => v / 1099511627776 },
      { id: 'bit', name: 'Bit', symbol: 'bit', toBase: (v) => v / 8, fromBase: (v) => v * 8 },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    units: [
      { id: 's', name: 'Second', symbol: 's', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ms', name: 'Millisecond', symbol: 'ms', toBase: (v) => v / 1e3, fromBase: (v) => v * 1e3 },
      { id: 'us', name: 'Microsecond', symbol: 'µs', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { id: 'ns', name: 'Nanosecond', symbol: 'ns', toBase: (v) => v / 1e9, fromBase: (v) => v * 1e9 },
      { id: 'min', name: 'Minute', symbol: 'min', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: 'h', name: 'Hour', symbol: 'hr', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'd', name: 'Day', symbol: 'd', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { id: 'w', name: 'Week', symbol: 'wk', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
      { id: 'y', name: 'Year (Julian)', symbol: 'yr', toBase: (v) => v * 31557600, fromBase: (v) => v / 31557600 },
    ],
  },
  {
    id: 'speed',
    name: 'Speed & Velocity',
    units: [
      { id: 'mps', name: 'Meters/second', symbol: 'm/s', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kph', name: 'Kilometers/hour', symbol: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: 'mph', name: 'Miles/hour', symbol: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { id: 'knot', name: 'Knot (nautical mi/h)', symbol: 'kn', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
      { id: 'fps', name: 'Feet/second', symbol: 'ft/s', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'c', name: 'Speed of Light', symbol: 'c', toBase: (v) => v * 299792458, fromBase: (v) => v / 299792458 },
      { id: 'mach', name: 'Mach (sea level)', symbol: 'Ma', toBase: (v) => v * 340.29, fromBase: (v) => v / 340.29 },
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    units: [
      { id: 'pa', name: 'Pascal', symbol: 'Pa', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kpa', name: 'Kilopascal', symbol: 'kPa', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'bar', name: 'Bar', symbol: 'bar', toBase: (v) => v * 1e5, fromBase: (v) => v / 1e5 },
      { id: 'psi', name: 'Pound-force/sq inch', symbol: 'psi', toBase: (v) => v * 6894.757, fromBase: (v) => v / 6894.757 },
      { id: 'atm', name: 'Standard Atmosphere', symbol: 'atm', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
      { id: 'mmhg', name: 'Millimeter of Mercury', symbol: 'mmHg', toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 },
      { id: 'torr', name: 'Torr', symbol: 'Torr', toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 },
    ],
  },
  {
    id: 'energy',
    name: 'Energy & Power',
    units: [
      { id: 'j', name: 'Joule', symbol: 'J', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kj', name: 'Kilojoule', symbol: 'kJ', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cal', name: 'Calorie (thermochemical)', symbol: 'cal', toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
      { id: 'kcal', name: 'Kilocalorie (food)', symbol: 'kcal', toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
      { id: 'wh', name: 'Watt-hour', symbol: 'Wh', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'kwh', name: 'Kilowatt-hour', symbol: 'kWh', toBase: (v) => v * 3.6e6, fromBase: (v) => v / 3.6e6 },
      { id: 'ev', name: 'Electronvolt', symbol: 'eV', toBase: (v) => v * 1.602176634e-19, fromBase: (v) => v / 1.602176634e-19 },
      { id: 'btu', name: 'BTU', symbol: 'BTU', toBase: (v) => v * 1055.06, fromBase: (v) => v / 1055.06 },
    ],
  },
  {
    id: 'angle',
    name: 'Angle',
    units: [
      { id: 'deg', name: 'Degree', symbol: '°', toBase: (v) => v, fromBase: (v) => v },
      { id: 'rad', name: 'Radian', symbol: 'rad', toBase: (v) => (v * 180) / Math.PI, fromBase: (v) => (v * Math.PI) / 180 },
      { id: 'grad', name: 'Gradian', symbol: 'grad', toBase: (v) => (v * 180) / 200, fromBase: (v) => (v * 200) / 180 },
      { id: 'arcmin', name: 'Arcminute', symbol: "'", toBase: (v) => v / 60, fromBase: (v) => v * 60 },
      { id: 'arcsec', name: 'Arcsecond', symbol: '"', toBase: (v) => v / 3600, fromBase: (v) => v * 3600 },
      { id: 'turn', name: 'Turn / Revolution', symbol: 'rev', toBase: (v) => v * 360, fromBase: (v) => v / 360 },
    ],
  },
];

export const UnitConverterEngine: React.FC = () => {
  const [selectedCatId, setSelectedCatId] = useState<string>('length');
  const [fromValue, setFromValue] = useState<string>('1');
  const [fromUnitId, setFromUnitId] = useState<string>('m');
  const [toUnitId, setToUnitId] = useState<string>('ft');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const activeCat = UNIT_CATEGORIES.find((c) => c.id === selectedCatId) || UNIT_CATEGORIES[0];

  const fromUnit = activeCat.units.find((u) => u.id === fromUnitId) || activeCat.units[0];
  const toUnit = activeCat.units.find((u) => u.id === toUnitId) || activeCat.units[1] || activeCat.units[0];

  // Calculate To value
  const numFrom = parseFloat(fromValue) || 0;
  const baseValue = fromUnit.toBase(numFrom);
  const calculatedTo = toUnit.fromBase(baseValue);

  const swapUnits = () => {
    soundManager.playActionSound();
    setFromUnitId(toUnitId);
    setToUnitId(fromUnitId);
  };

  const copyResult = () => {
    soundManager.playKeyClick();
    navigator.clipboard.writeText(`${calculatedTo} ${toUnit.symbol}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Category Navigation Pills */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {UNIT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundManager.playKeyClick();
                setSelectedCatId(cat.id);
                setFromUnitId(cat.units[0].id);
                setToUnitId(cat.units[1]?.id || cat.units[0].id);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCatId === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Source Card */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Source Value & Unit
            </span>
            <span className="font-mono text-xs text-slate-400">{fromUnit.symbol}</span>
          </div>

          <input
            type="number"
            step="any"
            value={fromValue}
            onChange={(e) => setFromValue(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-lg p-3 text-2xl font-mono text-slate-100 focus:outline-none focus:border-cyan-400 tabular-nums"
          />

          <select
            value={fromUnitId}
            onChange={(e) => setFromUnitId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-400"
          >
            {activeCat.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button (Middle) */}
        <div className="md:col-span-1 flex justify-center">
          <button
            onClick={swapUnits}
            className="p-3 rounded-full bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 border border-slate-700 transition-colors shadow-lg"
            title="Swap Source and Target Units"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Destination Card */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Target Conversion
            </span>
            <button
              onClick={copyResult}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="w-full bg-slate-850 border border-slate-700/80 rounded-lg p-3 text-2xl font-mono font-bold text-amber-300 tabular-nums truncate">
            {formatNumber(calculatedTo, 'standard', 6)}
          </div>

          <select
            value={toUnitId}
            onChange={(e) => setToUnitId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-400"
          >
            {activeCat.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Reference Grid of All Units in this category */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
          Equivalent Values Across {activeCat.name}
        </span>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {activeCat.units.map((u) => {
            const equiv = u.fromBase(baseValue);
            return (
              <div
                key={u.id}
                className="p-3 bg-slate-850 rounded-lg border border-slate-800 flex flex-col justify-between"
              >
                <span className="text-[11px] text-slate-400 truncate">{u.name}</span>
                <span className="font-mono text-sm font-bold text-slate-100 tabular-nums truncate mt-1">
                  {formatNumber(equiv, 'standard', 4)}{' '}
                  <span className="text-xs text-cyan-400">{u.symbol}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
