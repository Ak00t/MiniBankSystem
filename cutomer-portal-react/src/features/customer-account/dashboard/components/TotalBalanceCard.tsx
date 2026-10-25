import { Link } from "react-router-dom";
import {
  Bell,
  Eye,
  EyeOff,
  PlusCircle,
  ArrowUpRight,
  Receipt,
  User,
} from "lucide-react";
import { CrownEmbossedWatermark } from "../../../../components/common/EkararjLogo";

interface TotalBalanceCardProps {
  totalBalance: number;
  accountCount: number;
  showBalance: boolean;
  loading?: boolean;
  onToggleBalance: () => void;
  customerName?: string;
}

function formatBalance(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TotalBalanceCard({
  totalBalance,
  accountCount,
  showBalance,
  loading = false,
  onToggleBalance,
  customerName,
}: TotalBalanceCardProps) {
  const displayName = customerName?.trim() || "Customer";

  return (
    <section
      aria-label="Total Available Balance"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#102A54] to-[#153564] p-6 sm:p-8 text-white shadow-xl border border-cyan-500/25"
    >
      {/* 1. Ambient Lighting & Ekararj Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-4 bottom-2 opacity-15 select-none"
      >
        <CrownEmbossedWatermark theme="navy" className="w-48 h-48" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* ROW 1: Greeting & Notification Bell */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40 shadow-xs">
              <User size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300/80 uppercase tracking-wider">
                Welcome back
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                Hi, {displayName}
              </h2>
            </div>
          </div>

          {/* Notification Bell Button */}
          <Link
            to="/announcements"
            className="group relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 hover:border-cyan-400/40 active:scale-95 shadow-xs"
            title="Notifications & Announcements"
            aria-label="Notifications"
          >
            <Bell size={18} className="transition group-hover:rotate-12" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#00A3C4] ring-2 ring-[#0A192F]" />
          </Link>
        </div>

        {/* ROW 2: Total Available Balance */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-300">
              Total Available Balance
            </span>
            <button
              type="button"
              onClick={onToggleBalance}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
              title={showBalance ? "Hide Balance" : "Show Balance"}
              aria-label={showBalance ? "Hide Balance" : "Show Balance"}
            >
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            {accountCount > 0 && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300 border border-white/10">
                Across {accountCount} {accountCount === 1 ? "Account" : "Accounts"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-2 pt-1">
            <span className="font-mono text-xl sm:text-2xl font-bold text-cyan-200">
              MMK
            </span>
            <div className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-sm">
              {loading ? (
                <span className="inline-block h-10 w-48 animate-pulse rounded-xl bg-white/15 align-middle" />
              ) : showBalance ? (
                formatBalance(totalBalance)
              ) : (
                <span className="tracking-widest text-slate-300/80">
                  ••••••••
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ROW 3: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-2">
          {/* Add Money */}
          <Link
            to="/accounts"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs backdrop-blur-md transition hover:bg-white/20 active:scale-95"
          >
            <PlusCircle size={16} className="text-cyan-300" />
            <span>Add Money</span>
          </Link>

          {/* Transfer */}
          <Link
            to="/transfer"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00A3C4] via-[#0284C7] to-[#0369A1] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:from-[#0891B2] hover:via-[#0369A1] hover:to-[#075985] hover:shadow-cyan-500/35 active:scale-95"
          >
            <ArrowUpRight size={17} strokeWidth={2.4} />
            <span>Transfer</span>
          </Link>

          {/* Pay */}
          <Link
            to="/checkout"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs backdrop-blur-md transition hover:bg-white/20 active:scale-95"
          >
            <Receipt size={16} className="text-cyan-300" />
            <span>Pay</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
