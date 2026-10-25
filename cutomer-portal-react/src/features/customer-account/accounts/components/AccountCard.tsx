import { Link } from "react-router-dom";
import { ArrowRight, FileText, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { CustomerAccount } from "../types/accountTypes";
import BankCard from "../../dashboard/components/BankCard";

interface AccountCardProps {
  account: CustomerAccount;
  index?: number;
  onSelect?: (accountNumber: string) => void;
}

const statusStyles: Record<CustomerAccount["status"], string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  DORMANT: "bg-amber-50 text-amber-700",
  FROZEN: "bg-amber-50 text-amber-700",
  CLOSED: "bg-red-50 text-red-700",
};

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export default function AccountCard({
  account,
  index = 0,
  onSelect,
}: AccountCardProps) {
  const { t } = useTranslation("accounts");

  const statusClass =
    statusStyles[account.status] ?? "bg-slate-100 text-slate-600";

  const accountTypeLabel =
    account.accountType.toUpperCase().includes("SAVING")
      ? t("accountTypeSavings", { defaultValue: "Savings Account" })
      : account.accountType.toUpperCase().includes("CURRENT")
        ? t("accountTypeCurrent", { defaultValue: "Current Account" })
        : account.accountType;

  const statusLabels: Record<CustomerAccount["status"], string> = {
    ACTIVE: t("statusActive", { defaultValue: "Active" }),
    DORMANT: t("statusDormant", { defaultValue: "Dormant" }),
    FROZEN: t("statusFrozen", { defaultValue: "Frozen" }),
    CLOSED: t("statusClosed", { defaultValue: "Closed" }),
  };

  const statusLabel = statusLabels[account.status] ?? account.status;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-200">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Bank Card Visual on Left */}
        <div className="shrink-0 flex justify-center">
          <BankCard
            account={{
              accountNumber: account.accountNumber,
              accountCategory: account.accountCategory,
              accountType: account.accountType,
              currency: account.currency,
              currentBalance: account.currentBalance,
              availableBalance: account.availableBalance,
              status: account.status,
              jointAccount: account.jointAccount,
              openedAt: account.openedAt,
            }}
            index={index}
            showBalance={true}
            isLink={false}
            onClick={() => onSelect?.(account.accountNumber)}
          />
        </div>

        {/* Account Details & Management on Right */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Header row: Account Type and Status badge */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {account.accountCategory}
              </p>
              <h2 className="text-lg font-extrabold text-[#0A192F]">
                {accountTypeLabel}
              </h2>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
            >
              <span className="h-2 w-2 rounded-full bg-current opacity-80" />
              {statusLabel}
            </span>
          </div>

          {/* Account Metrics Grid (Real-World: Non-redundant operational metrics, never truncated) */}
          <div className="flex flex-wrap gap-3">
            {/* 1. Current / Ledger Balance */}
            <div className="flex-1 min-w-[140px] rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400">
                Current Balance
              </p>
              <p className="mt-1 font-mono text-sm sm:text-base font-extrabold text-[#0A192F] whitespace-nowrap">
                {formatMoney(account.currentBalance)}{" "}
                <span className="font-sans text-xs font-normal text-slate-500">
                  {account.currency}
                </span>
              </p>
            </div>

            {/* 2. Daily Transfer Limit */}
            <div className="flex-1 min-w-[140px] rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400">
                Daily Limit
              </p>
              <p className="mt-1 font-mono text-sm sm:text-base font-bold text-slate-700 whitespace-nowrap">
                {formatMoney(account.dailyTransferLimit)}{" "}
                <span className="font-sans text-xs font-normal text-slate-500">
                  {account.currency}
                </span>
              </p>
            </div>

            {/* 3. Minimum Balance */}
            <div className="flex-1 min-w-[140px] rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400">
                Minimum Balance
              </p>
              <p className="mt-1 font-mono text-sm sm:text-base font-bold text-slate-700 whitespace-nowrap">
                {formatMoney(account.minimumBalance ?? 0)}{" "}
                <span className="font-sans text-xs font-normal text-slate-500">
                  {account.currency}
                </span>
              </p>
            </div>
          </div>

          {/* Action Shortcuts Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
            <Link
              to="/transfer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all duration-200 hover:border-[#00A3C4] hover:bg-[#00A3C4] hover:text-white hover:shadow-xs"
            >
              <Send size={14} />
              <span>Transfer</span>
            </Link>

            <Link
              to="/statements"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-200 hover:border-[#00A3C4] hover:bg-[#00A3C4] hover:text-white hover:shadow-xs"
            >
              <FileText size={14} />
              <span>Statement</span>
            </Link>

            <button
              type="button"
              onClick={() => onSelect?.(account.accountNumber)}
              className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-[#0A192F] transition hover:text-[#00A3C4] hover:underline"
            >
              <span>{t("viewDetails", { defaultValue: "View Details" })}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
