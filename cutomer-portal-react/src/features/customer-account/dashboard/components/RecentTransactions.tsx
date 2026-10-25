import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  User,
  Building,
  ChevronDown,
} from "lucide-react";
import { getTransactions } from "../../transactions/services/transactionHistoryService";
import type { CusTransactionHistoryItemDTO } from "../../transactions/types/transactionHistoryTypes";

interface RecentTransactionsProps {
  accountNumber?: string;
  showBalance?: boolean;
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

function getTransactionIcon(type: string, isCredit: boolean) {
  const t = type?.toUpperCase() || "";
  if (t.includes("MERCHANT") || t.includes("SHOP") || t.includes("BUY")) {
    return <ShoppingBag size={17} className="text-[#00A3C4]" />;
  }
  if (t.includes("P2P") || t.includes("TRANSFER") || t.includes("BENEFICIARY")) {
    return isCredit ? (
      <User size={17} className="text-emerald-600" />
    ) : (
      <User size={17} className="text-slate-600" />
    );
  }
  if (t.includes("SALARY") || t.includes("DEPOSIT") || t.includes("INTEREST")) {
    return <Building size={17} className="text-emerald-600" />;
  }
  if (isCredit) {
    return <ArrowDownLeft size={17} className="text-emerald-600" />;
  }
  return <ArrowUpRight size={17} className="text-slate-600" />;
}

export default function RecentTransactions({
  accountNumber,
}: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<CusTransactionHistoryItemDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"month" | "all">("month");

  useEffect(() => {
    if (!accountNumber) return;

    let isMounted = true;
    const fetchRecent = async () => {
      try {
        setLoading(true);
        const data = await getTransactions({
          accountNumber,
          size: 6,
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

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="text-base font-extrabold text-[#0A192F]">
          Recent Transaction
        </h3>

        {/* Dropdown / Filter pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPeriod(period === "month" ? "all" : "month")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <span>{period === "month" ? "This month" : "All time"}</span>
            <ChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-slate-50 py-1">
        {loading && (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-100" />
                  <div className="space-y-1">
                    <div className="h-3 w-28 rounded bg-slate-100" />
                    <div className="h-2 w-16 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-4 w-20 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="py-10 text-center text-xs text-slate-400">
            No transactions found for this period.
          </div>
        )}

        {!loading &&
          transactions.map((tx) => {
            const isCredit = tx.direction === "IN";
            const title =
              tx.counterpartyName ||
              tx.displayTitle ||
              tx.description ||
              tx.transactionType ||
              "Transaction";

            const dateStr = formatDate(tx.transactionDate || tx.initiatedAt);

            return (
              <div
                key={tx.transactionRef}
                className="flex items-center justify-between py-3 transition hover:bg-slate-50/60 rounded-xl px-2"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-xs">
                    {getTransactionIcon(tx.transactionType, isCredit)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-semibold text-[#0A192F]">
                      {title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {dateStr}
                    </p>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="shrink-0 text-right">
                  <p
                    className={`text-xs sm:text-sm font-bold ${
                      isCredit ? "text-emerald-600" : "text-[#0A192F]"
                    }`}
                  >
                    {isCredit ? "+" : "-"}
                    {formatAmount(tx.amount)} {tx.currency || "MMK"}
                  </p>
                </div>
              </div>
            );
          })}
      </div>

      {/* Footer link */}
      <div className="border-t border-slate-100 pt-3 text-right">
        <Link
          to="/transaction"
          className="text-xs font-semibold text-[#00A3C4] transition hover:text-[#0891B2] hover:underline"
        >
          View all transactions &rarr;
        </Link>
      </div>
    </div>
  );
}
