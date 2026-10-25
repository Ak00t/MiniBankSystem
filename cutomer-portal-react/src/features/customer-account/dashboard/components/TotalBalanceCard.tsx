import { Link } from "react-router-dom";
import {
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

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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
  const greeting = `${getTimeGreeting()}, ${displayName}`;

  return (
    <section
      aria-label="Total Available Balance"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A192F] via-[#102A54] to-[#153564] p-5 sm:p-6 text-white shadow-lg border border-cyan-500/20"
    >
      {/* 1. Subtle Ambient Lighting & Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-cyan-400/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-blue-600/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-3 bottom-1 opacity-10 select-none"
      >
        <CrownEmbossedWatermark theme="navy" className="w-36 h-36" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* ROW 1: Greeting without Bell icon */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30 shadow-xs">
            <User size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
              {greeting}
            </h2>
          </div>
        </div>

        {/* ROW 2: Total Available Balance (Compact & User-Friendly) */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
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
              {showBalance ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>

            {accountCount > 0 && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300 border border-white/10">
                Across {accountCount} {accountCount === 1 ? "Account" : "Accounts"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
            <span className="font-mono text-base sm:text-lg font-bold text-cyan-200">
              MMK
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
              {loading ? (
                <span className="inline-block h-8 w-40 animate-pulse rounded-lg bg-white/15 align-middle" />
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
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Add Money */}
          <Link
            to="/accounts"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white shadow-xs backdrop-blur-md transition hover:bg-white/20 active:scale-95"
          >
            <PlusCircle size={15} className="text-cyan-300" />
            <span>Add Money</span>
          </Link>

          {/* Transfer */}
          <Link
            to="/transfer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00A3C4] via-[#0284C7] to-[#0369A1] px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/25 transition hover:from-[#0891B2] hover:via-[#0369A1] hover:to-[#075985] active:scale-95"
          >
            <ArrowUpRight size={15} strokeWidth={2.4} />
            <span>Transfer</span>
          </Link>

          {/* Pay */}
          <Link
            to="/checkout"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white shadow-xs backdrop-blur-md transition hover:bg-white/20 active:scale-95"
          >
            <Receipt size={15} className="text-cyan-300" />
            <span>Pay</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
