import { Link } from "react-router-dom";
import type { DashboardAccount } from "../types/dashboardTypes";

interface StatisticCardProps {
  totalBalance: number;
  accounts: DashboardAccount[];
  showBalance: boolean;
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function StatisticCard({
  totalBalance,
  accounts,
  showBalance,
}: StatisticCardProps) {
  // Compute breakdown from accounts or default proportions
  const savingsTotal = accounts
    .filter((a) => a.accountType?.toUpperCase() === "SAVINGS")
    .reduce((sum, a) => sum + (a.availableBalance ?? 0), 0);

  const currentTotal = accounts
    .filter((a) => a.accountType?.toUpperCase() === "CURRENT")
    .reduce((sum, a) => sum + (a.availableBalance ?? 0), 0);

  const otherTotal = Math.max(0, totalBalance - savingsTotal - currentTotal);

  // Percentages for Donut segments
  const validTotal = totalBalance > 0 ? totalBalance : 1;
  const pSavings = totalBalance > 0 ? (savingsTotal / validTotal) * 100 : 65;
  const pCurrent = totalBalance > 0 ? (currentTotal / validTotal) * 100 : 25;
  const pOther = totalBalance > 0 ? (otherTotal / validTotal) * 100 : 10;

  // Circumference of radius 54 is 2 * PI * 54 = ~339.29
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Segment stroke lengths
  const lenSavings = (pSavings / 100) * circumference;
  const lenCurrent = (pCurrent / 100) * circumference;
  const lenOther = (pOther / 100) * circumference;

  // Offsets
  const offsetSavings = 0;
  const offsetCurrent = -lenSavings;
  const offsetOther = -(lenSavings + lenCurrent);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="text-base font-extrabold text-[#0A192F]">
          Statistic
        </h3>

        <Link
          to="/accounts"
          className="text-xs font-semibold text-[#00A3C4] transition hover:text-[#0891B2] hover:underline"
        >
          Check all
        </Link>
      </div>

      {/* Content: Donut Chart & Legend */}
      <div className="my-auto flex flex-col items-center justify-center gap-6 py-4 sm:flex-row sm:items-center sm:justify-around">
        {/* Donut Chart */}
        <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 140 140">
            {/* Background Circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="16"
            />

            {/* Savings Segment (Ekararj Sapphire Blue) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#1e40af"
              strokeWidth="16"
              strokeDasharray={`${lenSavings} ${circumference}`}
              strokeDashoffset={offsetSavings}
              strokeLinecap="round"
              className="transition-all duration-700"
            />

            {/* Current Segment (Ekararj Metallic Cyan) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#00a3c4"
              strokeWidth="16"
              strokeDasharray={`${lenCurrent} ${circumference}`}
              strokeDashoffset={offsetCurrent}
              strokeLinecap="round"
              className="transition-all duration-700"
            />

            {/* Other / Reserve Segment (Ekararj Crown Gold) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#d4af37"
              strokeWidth="16"
              strokeDasharray={`${lenOther} ${circumference}`}
              strokeDashoffset={offsetOther}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>

          {/* Donut Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Balance
            </span>
            <span className="mt-0.5 text-xs sm:text-sm font-extrabold text-[#0A192F]">
              {showBalance ? `${formatMoney(totalBalance)}` : "••••••"}
            </span>
            <span className="text-[9px] font-medium text-slate-400">MMK</span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full sm:w-auto space-y-3">
          {/* Savings */}
          <div className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1e40af]" />
              <span className="font-semibold text-slate-700">Savings</span>
            </div>
            <span className="font-bold text-[#0A192F]">
              {showBalance ? `${formatMoney(savingsTotal)}` : "••••"}
            </span>
          </div>

          {/* Current */}
          <div className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00a3c4]" />
              <span className="font-semibold text-slate-700">Current</span>
            </div>
            <span className="font-bold text-[#0A192F]">
              {showBalance ? `${formatMoney(currentTotal)}` : "••••"}
            </span>
          </div>

          {/* Reserve / Active */}
          <div className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d4af37]" />
              <span className="font-semibold text-slate-700">Reserve</span>
            </div>
            <span className="font-bold text-[#0A192F]">
              {showBalance ? `${formatMoney(otherTotal)}` : "••••"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
