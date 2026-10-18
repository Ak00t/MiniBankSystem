import { useEffect, useState, useCallback } from 'react';
import { tellerApi } from '../../../services/apiClient';
import type { DailyCashSummaryResponse } from '../../../types/api.types';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function TellerDailyCashSummaryWidget() {
  const [summary, setSummary] = useState<DailyCashSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tellerApi.getDailyCashSummary();
      setSummary(res.data);
    } catch (err: unknown) {
      console.error('Failed to load daily cash summary:', err);
      setError('Unable to load today\'s cash summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {/* Wallet Icon */}
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-white">My Daily Cash Summary</h3>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                Live OTC
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Drawer balancing for <span className="font-semibold text-blue-300">{summary?.tellerUsername || 'Current Teller'}</span> &bull; {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSummary}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur transition-all border border-white/15 disabled:opacity-50"
        >
          <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? 'Refreshing...' : 'Refresh Summary'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/40 p-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 relative z-10">
        {/* Total Cash In */}
        <div className="rounded-xl bg-slate-800/80 border border-emerald-500/30 p-4 transition-all hover:border-emerald-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Today's Cash In</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              {/* ArrowDownLeft / Deposit */}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 5l-14 14m0 0h10m-10 0V9" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-emerald-400">
              {loading && !summary ? '...' : formatCurrency(summary?.totalCashIn ?? 0)}
            </span>
            <span className="text-xs font-semibold text-emerald-500/80">MMK</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {summary?.depositCount ?? 0} OTC deposits processed
          </p>
        </div>

        {/* Total Cash Out */}
        <div className="rounded-xl bg-slate-800/80 border border-rose-500/30 p-4 transition-all hover:border-rose-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Today's Cash Out</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
              {/* ArrowUpRight / Withdrawal */}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 19L19 5m0 0H9m10 0v10" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-rose-400">
              {loading && !summary ? '...' : formatCurrency(summary?.totalCashOut ?? 0)}
            </span>
            <span className="text-xs font-semibold text-rose-500/80">MMK</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {summary?.withdrawalCount ?? 0} OTC withdrawals paid
          </p>
        </div>

        {/* Net Cash in Drawer */}
        <div className="rounded-xl bg-slate-800/80 border border-blue-500/30 p-4 transition-all hover:border-blue-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Net Cash in Drawer</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-28h6M4 10h16" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-2xl font-extrabold ${(summary?.netCashInDrawer ?? 0) >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
              {loading && !summary ? '...' : formatCurrency(summary?.netCashInDrawer ?? 0)}
            </span>
            <span className="text-xs font-semibold text-blue-500/80">MMK</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Total {summary?.totalTransactions ?? 0} transactions handled today
          </p>
        </div>
      </div>
    </div>
  );
}
