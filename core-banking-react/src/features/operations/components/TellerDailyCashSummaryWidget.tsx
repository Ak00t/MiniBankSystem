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
      setError("Unable to load today's cash summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="mb-6 rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm relative overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#0284C7] border border-sky-100 shadow-xs">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                Teller Cash Float Telemetry
              </h3>
              <span className="status-pill-emerald text-[10px]">
                Live OTC Desk
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Drawer balance for <span className="font-bold text-slate-800">{summary?.tellerUsername || 'Current Teller'}</span> &bull; {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSummary}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-all border border-slate-200 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? 'Refreshing...' : 'Refresh Summary'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Cash In */}
        <div className="rounded-xl bg-emerald-50/40 border border-emerald-100 p-4 transition-all hover:bg-emerald-50/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Cash In</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 5l-14 14m0 0h10m-10 0V9" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
              {loading && !summary ? '...' : formatCurrency(summary?.totalCashIn ?? 0)}
            </span>
            <span className="text-xs font-bold text-emerald-600">MMK</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            {summary?.depositCount ?? 0} OTC deposits processed
          </p>
        </div>

        {/* Total Cash Out */}
        <div className="rounded-xl bg-rose-50/40 border border-rose-100 p-4 transition-all hover:bg-rose-50/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Cash Out</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 19L19 5m0 0H9m10 0v10" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-700 font-mono tabular-nums">
              {loading && !summary ? '...' : formatCurrency(summary?.totalCashOut ?? 0)}
            </span>
            <span className="text-xs font-bold text-rose-600">MMK</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            {summary?.withdrawalCount ?? 0} OTC withdrawals paid
          </p>
        </div>

        {/* Net Cash in Drawer */}
        <div className="rounded-xl bg-sky-50/40 border border-sky-100 p-4 transition-all hover:bg-sky-50/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Cash in Drawer</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-[#0284C7]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-28h6M4 10h16" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-black font-mono tabular-nums ${(summary?.netCashInDrawer ?? 0) >= 0 ? 'text-[#0284C7]' : 'text-rose-700'}`}>
              {loading && !summary ? '...' : formatCurrency(summary?.netCashInDrawer ?? 0)}
            </span>
            <span className="text-xs font-bold text-[#0284C7]">MMK</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Total {summary?.totalTransactions ?? 0} transactions handled today
          </p>
        </div>
      </div>
    </div>
  );
}
