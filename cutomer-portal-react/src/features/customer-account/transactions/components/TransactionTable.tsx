import { Inbox, RotateCcw } from "lucide-react";
import type { CusTransactionHistoryItemDTO } from "../types/transactionHistoryTypes";
import {
  formatTransactionDateTime,
  formatTransactionAmount,
  formatTypeLabel,
} from "../types/transactionHistoryTypes";
import TransactionStatusBadge from "./TransactionStatusBadge";

interface TransactionTableProps {
  transactions: CusTransactionHistoryItemDTO[];
  isLoading: boolean;
  hasFiltersApplied: boolean;
  onClearFilters: () => void;
}

export default function TransactionTable({
  transactions,
  isLoading,
  hasFiltersApplied,
  onClearFilters,
}: TransactionTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-5 py-3.5 whitespace-nowrap">
                Date &amp; Time
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap">
                Transaction Ref
              </th>
              <th scope="col" className="px-4 py-3.5">
                Description
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap">
                Transaction Type
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap text-right">
                Amount
              </th>
              <th scope="col" className="px-5 py-3.5 whitespace-nowrap text-center">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {/* Loading Skeleton */}
            {isLoading && (
              <>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-4 w-32 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-44 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="ml-auto h-4 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="mx-auto h-5 w-20 rounded-full bg-slate-200" />
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Empty State */}
            {!isLoading && transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                    <Inbox size={24} aria-hidden="true" />
                  </div>
                  {hasFiltersApplied ? (
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        No transactions found matching your criteria.
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Try modifying or clearing your filter criteria to see more transactions.
                      </p>
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        <RotateCcw size={13} aria-hidden="true" />
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        No transaction history is available for this account.
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        When transactions occur on this account, they will appear here.
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            )}

            {/* Populated Data Rows */}
            {!isLoading &&
              transactions.map((tx) => (
                <tr
                  key={tx.transactionRef}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  {/* 1. Date & Time */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                    {formatTransactionDateTime(tx.transactionDate || tx.initiatedAt)}
                  </td>

                  {/* 2. Transaction Ref */}
                  <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-700">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                      {tx.transactionRef}
                    </span>
                  </td>

                  {/* 3. Description */}
                  <td className="px-4 py-3.5 text-slate-800 font-medium max-w-xs truncate">
                    {tx.description || "-"}
                  </td>

                  {/* 4. Transaction Type */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                    {formatTypeLabel(tx.transactionType)}
                  </td>

                  {/* 5. Amount (Strictly neutral styling with directional prefix) */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-right font-semibold tabular-nums text-slate-900">
                    {formatTransactionAmount(tx.amount, tx.currency, tx.direction)}
                  </td>

                  {/* 6. Status */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-center">
                    <TransactionStatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
