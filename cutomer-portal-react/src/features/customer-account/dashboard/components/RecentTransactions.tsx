import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  Building2,
  ChevronDown,
  Check,
  Smartphone,
  Zap,
} from "lucide-react";
import { getTransactions } from "../../transactions/services/transactionHistoryService";
import type { CusTransactionHistoryItemDTO } from "../../transactions/types/transactionHistoryTypes";

interface RecentTransactionsProps {
  accountNumber?: string;
  showBalance?: boolean;
}

type PeriodFilter = "today" | "week" | "month" | "all";

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

const AVATAR_PALETTES = [
  { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  { bg: "bg-blue-100 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  { bg: "bg-indigo-100 dark:bg-indigo-950/60", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
  { bg: "bg-violet-100 dark:bg-violet-950/60", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800" },
  { bg: "bg-purple-100 dark:bg-purple-950/60", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  { bg: "bg-sky-100 dark:bg-sky-950/60", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800" },
  { bg: "bg-teal-100 dark:bg-teal-950/60", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
  { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-800 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  { bg: "bg-rose-100 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
];

function getInitials(name: string): string {
  if (!name) return "TX";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${day} ${month}, ${hours}:${minutes}`;
    }
  } catch {
    // Fallback
  }
  return isoString;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface ParsedTransactionInfo {
  title: string;
  subtitle: string;
  isCredit: boolean;
  isP2P: boolean;
  avatarInitials: string;
}

function parseTransactionInfo(tx: CusTransactionHistoryItemDTO): ParsedTransactionInfo {
  const isCredit = tx.direction === "IN";
  const type = (tx.transactionType || "").toUpperCase();
  const desc = tx.description || "";
  const rawTitle = tx.displayTitle || "";

  let counterparty = tx.counterpartyName?.trim() || "";

  if (!counterparty) {
    const match =
      rawTitle.match(/^(?:Transfer\s+(?:to|from)|Receive\s+from|Payment\s+to|Sent\s+to)\s+(.+)$/i) ||
      desc.match(/^(?:Transfer\s+(?:to|from)|Receive\s+from|Payment\s+to|Sent\s+to)\s+(.+)$/i);
    if (match && match[1]) {
      counterparty = match[1].trim();
    }
  }

  const isP2P =
    Boolean(counterparty) ||
    type.includes("TRANSFER") ||
    type.includes("P2P") ||
    type.includes("BENEFICIARY");

  let title = "";
  let subtitle = "";

  if (counterparty) {
    title = counterparty;
    subtitle = isCredit ? "Transfer In" : "Transfer Out";
  } else if (type.includes("BILL") || desc.toUpperCase().includes("BILL")) {
    title = rawTitle || desc || "Electricity Bill";
    subtitle = "Bill Payment";
  } else if (type.includes("MOBILE") || type.includes("TOPUP") || desc.toUpperCase().includes("TOPUP")) {
    title = rawTitle || desc || "Mobile Top-up";
    subtitle = "Phone Bill";
  } else if (type.includes("MERCHANT") || type.includes("SHOP") || desc.toUpperCase().includes("MERCHANT")) {
    title = rawTitle || desc || "Merchant Payment";
    subtitle = "Purchase";
  } else if (type.includes("SALARY") || type.includes("DEPOSIT") || type.includes("OTC")) {
    title = rawTitle || desc || "Bank Deposit";
    subtitle = "Account Credit";
  } else {
    title = rawTitle || desc || tx.transactionType || "Bank Transfer";
    subtitle = isCredit ? "Transfer In" : "Transfer Out";
  }

  const avatarInitials = getInitials(counterparty || title);

  return {
    title,
    subtitle,
    isCredit,
    isP2P,
    avatarInitials,
  };
}

function renderTransactionIconOrAvatar(tx: CusTransactionHistoryItemDTO, info: ParsedTransactionInfo) {
  const type = (tx.transactionType || "").toUpperCase();
  const desc = (tx.description || "").toUpperCase();
  const title = (tx.displayTitle || "").toUpperCase();

  // Electricity / Utility Bill
  if (
    type.includes("BILL") ||
    type.includes("ELECTRIC") ||
    desc.includes("ELECTRIC") ||
    title.includes("ELECTRIC") ||
    desc.includes("BILL")
  ) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60 shadow-xs">
        <Zap size={18} />
      </div>
    );
  }

  // Mobile Topup / Phone Bill
  if (
    type.includes("MOBILE") ||
    type.includes("TOPUP") ||
    type.includes("PHONE") ||
    desc.includes("TOPUP") ||
    title.includes("TOPUP")
  ) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200/70 dark:border-sky-800/60 shadow-xs">
        <Smartphone size={18} />
      </div>
    );
  }

  // Merchant / Shopping POS
  if (
    type.includes("MERCHANT") ||
    type.includes("SHOP") ||
    type.includes("POS") ||
    desc.includes("SHOP")
  ) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/70 dark:border-purple-800/60 shadow-xs">
        <ShoppingBag size={18} />
      </div>
    );
  }

  // Salary / Bank Deposit / OTC
  if (
    type.includes("SALARY") ||
    type.includes("INTEREST") ||
    type.includes("DEPOSIT") ||
    type.includes("OTC")
  ) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 shadow-xs">
        <Building2 size={18} />
      </div>
    );
  }

  // Interbank / other bank
  if (type.includes("INTERBANK")) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
        <Building2 size={18} />
      </div>
    );
  }

  // P2P Transfer / Person-to-Person: Initials Avatar
  const color = getAvatarColor(info.title);

  return (
    <div className="relative shrink-0">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl font-bold text-xs ${color.bg} ${color.text} shadow-xs border ${color.border}`}
      >
        {info.avatarInitials}
      </div>
      {/* Mini directional arrow indicator */}
      <div
        className={`absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white dark:border-[#0A192F] text-white shadow-xs ${
          info.isCredit ? "bg-emerald-500" : "bg-rose-500"
        }`}
      >
        {info.isCredit ? (
          <ArrowDownLeft size={10} strokeWidth={3} />
        ) : (
          <ArrowUpRight size={10} strokeWidth={3} />
        )}
      </div>
    </div>
  );
}

export default function RecentTransactions({
  accountNumber,
  showBalance = true,
}: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<CusTransactionHistoryItemDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!accountNumber) return;

    let isMounted = true;
    const fetchRecent = async () => {
      try {
        setLoading(true);
        const data = await getTransactions({
          accountNumber,
          size: 25,
          page: 0,
        });
        if (isMounted && data && Array.isArray(data.content)) {
          setTransactions(data.content);
        }
      } catch (err) {
        console.error("Failed to load dashboard recent transactions:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchRecent();
    return () => {
      isMounted = false;
    };
  }, [accountNumber]);

  // Real-time client-side date filter
  const filteredTransactions = useMemo(() => {
    if (period === "all") return transactions;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const currentDay = now.getDay();
    const daysSinceMonday = (currentDay + 6) % 7;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions.filter((tx) => {
      const rawDate = tx.transactionDate || tx.initiatedAt;
      if (!rawDate) return false;
      const txDate = new Date(rawDate);
      if (isNaN(txDate.getTime())) return false;

      if (period === "today") {
        return txDate >= startOfToday;
      }
      if (period === "week") {
        return txDate >= startOfWeek;
      }
      if (period === "month") {
        return txDate >= startOfMonth;
      }
      return true;
    });
  }, [transactions, period]);

  const displayItems = filteredTransactions.slice(0, 6);

  return (
    <div className="flex flex-col rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0A192F] p-5 sm:p-6 shadow-xs transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-base sm:text-lg font-extrabold text-[#0A192F] dark:text-white">
          Recent Transactions
        </h3>

        <div className="flex items-center gap-3">
          {/* Real-time Time Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00A3C4]/30 cursor-pointer"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <span>{PERIOD_LABELS[period]}</span>
              <ChevronDown
                size={13}
                className={`text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180 text-[#00A3C4]" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-lg ring-1 ring-black/5 z-30">
                {(["today", "week", "month", "all"] as PeriodFilter[]).map((p) => {
                  const isSelected = period === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPeriod(p);
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? "bg-slate-100 dark:bg-slate-700 text-[#00A3C4] font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>{PERIOD_LABELS[p]}</span>
                      {isSelected && <Check size={13} className="text-[#00A3C4]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Standard Single "See All" link in Header */}
          <Link
            to="/transaction"
            className="text-xs font-bold text-[#00A3C4] transition hover:text-[#0891B2] hover:underline"
          >
            See All
          </Link>
        </div>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 py-1">
        {loading && (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2.5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
                <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        )}

        {!loading && displayItems.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              No transactions found for {PERIOD_LABELS[period].toLowerCase()}.
            </p>
            {period !== "all" && (
              <button
                type="button"
                onClick={() => setPeriod("all")}
                className="mt-2 text-xs font-bold text-[#00A3C4] hover:underline cursor-pointer"
              >
                View all transactions
              </button>
            )}
          </div>
        )}

        {!loading &&
          displayItems.map((tx) => {
            const info = parseTransactionInfo(tx);
            const isPending = tx.status?.toUpperCase() === "PENDING";
            const isFailed = tx.status?.toUpperCase() === "FAILED";

            return (
              <Link
                key={tx.transactionRef}
                to="/transaction"
                className="group flex items-center justify-between py-3 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/60 rounded-2xl px-2 -mx-2 cursor-pointer"
              >
                {/* Left: Avatar/Icon + Primary Name + Subtitle (Direction + Date) */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {renderTransactionIconOrAvatar(tx, info)}
                  <div className="min-w-0">
                    {/* Primary Title: Prominent Counterparty / Merchant Name */}
                    <p className="truncate text-sm font-bold text-[#0A192F] dark:text-white group-hover:text-[#00A3C4] transition-colors">
                      {info.title}
                    </p>

                    {/* Subtitle: Direction + Date */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-400 mt-0.5">
                      <span className="inline-flex items-center gap-0.5 font-semibold">
                        {info.isCredit ? (
                          <>
                            <ArrowDownLeft size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-emerald-600 dark:text-emerald-400">{info.subtitle}</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight size={11} className="text-slate-400 dark:text-slate-400 shrink-0" />
                            <span className="text-slate-500 dark:text-slate-400">{info.subtitle}</span>
                          </>
                        )}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span>{formatDate(tx.transactionDate || tx.initiatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount + Status */}
                <div className="text-right shrink-0 pl-3">
                  <p
                    className={`text-sm font-extrabold font-mono tracking-tight ${
                      info.isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {!showBalance ? (
                      <span className="text-slate-400 dark:text-slate-500 tracking-wider">••••••</span>
                    ) : (
                      <>
                        {info.isCredit ? "+" : "-"} {formatAmount(tx.amount || 0)}{" "}
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{tx.currency || "MMK"}</span>
                      </>
                    )}
                  </p>
                  {isPending && (
                    <span className="mt-0.5 inline-block rounded-md bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                      Pending
                    </span>
                  )}
                  {isFailed && (
                    <span className="mt-0.5 inline-block rounded-md bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50">
                      Failed
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
