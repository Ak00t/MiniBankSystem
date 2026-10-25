import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  WalletCards,
} from "lucide-react";
import BankCard from "./BankCard";
import type { DashboardAccount } from "../types/dashboardTypes";

interface BankCardsSectionProps {
  accounts: DashboardAccount[];
  customerName?: string;
  showBalance?: boolean;
  onToggleBalance?: () => void;
}

export default function BankCardsSection({
  accounts,
  customerName,
  showBalance = true,
}: BankCardsSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [accounts]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 390;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!accounts || accounts.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-[#00A3C4]">
          <WalletCards size={28} />
        </div>
        <h3 className="mt-4 text-base font-extrabold text-[#0A192F]">
          No Linked Accounts Found
        </h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          Your active Ekararj Bank cards and accounts will appear here once linked.
        </p>
        <Link
          to="/accounts"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00A3C4] to-[#0284C7] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-cyan-500/25 transition hover:from-[#0891B2] hover:to-[#0369A1]"
        >
          <Plus size={16} />
          <span>View All Accounts</span>
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="Customer Cards" className="space-y-4">
      {/* Header: Section Title (My Accounts) and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0A192F]">
            My Accounts
          </h2>
          <span className="inline-flex items-center justify-center rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-extrabold text-[#00A3C4] border border-cyan-200/60">
            {accounts.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation Arrows for Slider */}
          {(canScrollLeft || canScrollRight || accounts.length > 2) && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                aria-label="Previous card"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-[#0A192F] hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                aria-label="Next card"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-[#0A192F] hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <Link
            to="/accounts"
            className="text-xs font-bold text-[#00A3C4] hover:text-[#0891B2] hover:underline"
          >
            See All
          </Link>
        </div>
      </div>

      {/* Cards Slider Row: Smooth horizontal scrollable slider */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex items-center justify-start gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-none w-full"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {accounts.map((account, index) => (
          <div
            key={account.accountNumber}
            className="shrink-0 w-[330px] sm:w-[370px]"
          >
            <BankCard
              account={account}
              accountName={customerName}
              index={index}
              showBalance={showBalance}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
