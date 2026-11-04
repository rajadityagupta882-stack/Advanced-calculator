import React, { useState } from 'react';
import { soundManager } from '../utils/soundEffects';
import { formatNumber } from '../utils/mathEngine';
import { DollarSign, TrendingUp, Calendar, PieChart } from 'lucide-react';

export const FinancialEngine: React.FC = () => {
  const [tab, setTab] = useState<'loan' | 'compound'>('loan');

  // Loan State
  const [principal, setPrincipal] = useState<number>(350000);
  const [annualRate, setAnnualRate] = useState<number>(6.5);
  const [termYears, setTermYears] = useState<number>(30);
  const [extraMonthly, setExtraMonthly] = useState<number>(0);
  const [showAmortization, setShowAmortization] = useState<boolean>(false);

  // Compound Interest State
  const [initialInvestment, setInitialInvestment] = useState<number>(10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [growthRate, setGrowthRate] = useState<number>(8.0);
  const [growthYears, setGrowthYears] = useState<number>(20);
  const [compoundFreq, setCompoundFreq] = useState<number>(12); // monthly = 12

  // Loan Computations
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = termYears * 12;

  const monthlyPayment =
    monthlyRate > 0
      ? (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : principal / totalMonths;

  // Generate Amortization Schedule
  const amortizationSchedule = React.useMemo(() => {
    const schedule: {
      month: number;
      principalPaid: number;
      interestPaid: number;
      totalPaid: number;
      balance: number;
    }[] = [];

    let currentBalance = principal;
    const payment = monthlyPayment + extraMonthly;

    for (let m = 1; m <= totalMonths && currentBalance > 0.01; m++) {
      const interest = currentBalance * monthlyRate;
      const principalPart = Math.min(payment - interest, currentBalance);
      currentBalance -= principalPart;

      schedule.push({
        month: m,
        principalPaid: principalPart,
        interestPaid: interest,
        totalPaid: principalPart + interest,
        balance: Math.max(0, currentBalance),
      });
    }
    return schedule;
  }, [principal, monthlyRate, totalMonths, monthlyPayment, extraMonthly]);

  const totalInterestPaid = amortizationSchedule.reduce(
    (acc, row) => acc + row.interestPaid,
    0
  );
  const totalLoanCost = principal + totalInterestPaid;

  // Compound Interest Computations
  const compoundCalculations = React.useMemo(() => {
    const ratePerPeriod = growthRate / 100 / compoundFreq;
    const totalPeriods = growthYears * compoundFreq;
    const monthsPerPeriod = 12 / compoundFreq;

    let balance = initialInvestment;
    let totalInvested = initialInvestment;

    const timeline: { year: number; balance: number; invested: number; interest: number }[] = [];

    for (let year = 1; year <= growthYears; year++) {
      for (let p = 0; p < compoundFreq; p++) {
        balance += monthlyContribution * monthsPerPeriod;
        totalInvested += monthlyContribution * monthsPerPeriod;
        balance *= 1 + ratePerPeriod;
      }
      timeline.push({
        year,
        balance,
        invested: totalInvested,
        interest: Math.max(0, balance - totalInvested),
      });
    }

    const finalBalance = timeline.length > 0 ? timeline[timeline.length - 1].balance : initialInvestment;
    const finalInvested = timeline.length > 0 ? timeline[timeline.length - 1].invested : initialInvestment;
    const finalInterest = Math.max(0, finalBalance - finalInvested);

    return { finalBalance, finalInvested, finalInterest, timeline };
  }, [initialInvestment, monthlyContribution, growthRate, growthYears, compoundFreq]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Sub-mode Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
        <button
          onClick={() => {
            soundManager.playKeyClick();
            setTab('loan');
          }}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            tab === 'loan'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Loan & Mortgage Amortization
        </button>
        <button
          onClick={() => {
            soundManager.playKeyClick();
            setTab('compound');
          }}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            tab === 'compound'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Compound Interest & Growth
        </button>
      </div>

      {tab === 'loan' ? (
        /* Loan / Mortgage Calculator */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block pb-2 border-b border-slate-800">
              Mortgage / Loan Parameters
            </span>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Principal Loan Amount ($)</label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Annual Interest Rate (%)</label>
              <input
                type="number"
                step="0.05"
                value={annualRate}
                onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">Term (Years)</label>
                <input
                  type="number"
                  value={termYears}
                  onChange={(e) => setTermYears(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">Extra Monthly ($)</label>
                <input
                  type="number"
                  value={extraMonthly}
                  onChange={(e) => setExtraMonthly(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="w-full py-2.5 mt-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-mono border border-slate-700 transition-colors"
            >
              {showAmortization ? 'Hide Amortization Table' : 'View Full Amortization Table'}
            </button>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-800">
                Payment Summary
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                <div className="p-4 bg-slate-850 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Monthly Payment</span>
                  <span className="text-2xl font-bold text-cyan-400 tabular-nums">
                    ${(monthlyPayment + extraMonthly).toFixed(2)}
                  </span>
                </div>

                <div className="p-4 bg-slate-850 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Total Interest</span>
                  <span className="text-xl font-bold text-amber-400 tabular-nums">
                    ${totalInterestPaid.toFixed(2)}
                  </span>
                </div>

                <div className="p-4 bg-slate-850 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Total Loan Cost</span>
                  <span className="text-xl font-bold text-slate-100 tabular-nums">
                    ${totalLoanCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Progress bar of Principal vs Interest */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>
                    Principal: {((principal / totalLoanCost) * 100).toFixed(1)}%
                  </span>
                  <span>
                    Interest: {((totalInterestPaid / totalLoanCost) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-cyan-500 h-full"
                    style={{ width: `${(principal / totalLoanCost) * 100}%` }}
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${(totalInterestPaid / totalLoanCost) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Amortization Table */}
            {showAmortization && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left font-mono text-xs tabular-nums">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 px-3">Month</th>
                        <th className="py-2 px-3">Principal</th>
                        <th className="py-2 px-3">Interest</th>
                        <th className="py-2 px-3">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {amortizationSchedule.slice(0, 120).map((row) => (
                        <tr
                          key={row.month}
                          className="border-b border-slate-800/40 hover:bg-slate-800/40"
                        >
                          <td className="py-1.5 px-3 text-slate-400">{row.month}</td>
                          <td className="py-1.5 px-3 text-cyan-400 font-semibold">
                            ${row.principalPaid.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-3 text-amber-400">
                            ${row.interestPaid.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-3 text-slate-200">
                            ${row.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Compound Interest & Wealth Growth */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block pb-2 border-b border-slate-800">
              Investment Parameters
            </span>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Initial Deposit ($)</label>
              <input
                type="number"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Monthly Contribution ($)</label>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">Estimated Return (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={growthRate}
                  onChange={(e) => setGrowthRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">Time Horizon (Years)</label>
                <input
                  type="number"
                  value={growthYears}
                  onChange={(e) => setGrowthYears(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Compounding Frequency</label>
              <select
                value={compoundFreq}
                onChange={(e) => setCompoundFreq(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
              >
                <option value={12}>Monthly (12/yr)</option>
                <option value={4}>Quarterly (4/yr)</option>
                <option value={1}>Annually (1/yr)</option>
                <option value={365}>Daily (365/yr)</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-800">
              Projected Wealth Accumulation
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div className="p-4 bg-slate-850 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Future Value</span>
                <span className="text-2xl font-bold text-emerald-400 tabular-nums">
                  ${compoundCalculations.finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="p-4 bg-slate-850 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Total Principal Invested</span>
                <span className="text-lg font-bold text-cyan-400 tabular-nums">
                  ${compoundCalculations.finalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="p-4 bg-slate-850 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Total Interest Earned</span>
                <span className="text-lg font-bold text-amber-400 tabular-nums">
                  ${compoundCalculations.finalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Growth timeline table preview */}
            <div className="overflow-x-auto max-h-[260px]">
              <table className="w-full text-left font-mono text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Year</th>
                    <th className="py-2 px-3">Total Invested</th>
                    <th className="py-2 px-3">Total Interest</th>
                    <th className="py-2 px-3">Ending Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {compoundCalculations.timeline.map((row) => (
                    <tr
                      key={row.year}
                      className="border-b border-slate-800/40 hover:bg-slate-800/40"
                    >
                      <td className="py-1.5 px-3 text-slate-400">Yr {row.year}</td>
                      <td className="py-1.5 px-3 text-cyan-400 font-semibold">
                        ${Math.round(row.invested).toLocaleString()}
                      </td>
                      <td className="py-1.5 px-3 text-amber-400">
                        ${Math.round(row.interest).toLocaleString()}
                      </td>
                      <td className="py-1.5 px-3 text-emerald-400 font-bold">
                        ${Math.round(row.balance).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
