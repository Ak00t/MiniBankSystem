import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";

import DashboardSkeleton from "../components/DashboardSkeleton";
import TotalBalanceCard from "../components/TotalBalanceCard";
import BankCardsSection from "../components/BankCardsSection";
import RecentTransactions from "../components/RecentTransactions";
import StatisticCard from "../components/StatisticCard";

import { fetchDashboard } from "../store/dashboardSlice";
import { useAppDispatch, useAppSelector } from "../../../../lib/redux";

export default function DashboardPage() {
  const dispatch = useAppDispatch();

  const { data: dashboard, status, error } = useAppSelector(
    (state) => state.dashboard,
  );

  const { t } = useTranslation("dashboard");

  // Balance visible by default, with toggle state shared across components
  const [showBalance, setShowBalance] = useState(true);

  const handleToggleBalance = () => {
    setShowBalance((prev) => !prev);
  };

  useEffect(() => {
    const request = dispatch(fetchDashboard());

    return () => {
      request.abort();
    };
  }, [dispatch]);

  const initialLoading =
    dashboard === null &&
    (status === "idle" || status === "pending");

  const refreshing = status === "pending" && dashboard !== null;
  const hasError = status === "failed" && error !== null;

  const totalBalance = dashboard?.totalBalance ?? 0;
  const accounts = dashboard?.accounts ?? [];
  const primaryAccount = accounts.length > 0 ? accounts[0] : undefined;

  const handleRetry = () => {
    void dispatch(fetchDashboard());
  };

  return (
    <main className="relative min-h-screen bg-[#F4F6F9] px-3 py-5 text-[#0A192F] sm:px-6 sm:py-7 lg:px-10">
      {/* Background Soft Blobs with Ekararj Cyan & Sapphire Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-cyan-100/35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-slate-200/40 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-[1450px] space-y-6">
        {/* Loading Skeleton */}
        {initialLoading && (
          <DashboardSkeleton
            label={t("loadingDashboard", {
              defaultValue: "Loading dashboard",
            })}
          />
        )}

        {/* Error Notification */}
        {hasError && (
          <section
            role="alert"
            className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <ShieldCheck size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-red-700">{t("loadError")}</h2>
                <p className="mt-1 break-words text-sm text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-4 rounded-xl bg-[#0A192F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#153564] focus:outline-none focus:ring-4 focus:ring-cyan-200"
                >
                  {t("tryAgain")}
                </button>
              </div>
            </div>
          </section>
        )}

        {dashboard && (
          <div className="space-y-6">
            {refreshing && (
              <p
                role="status"
                className="flex items-center gap-2 text-xs font-medium text-[#00A3C4]"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#00A3C4]" />
                <span>Refreshing dashboard...</span>
              </p>
            )}

            {/* 1. TOP SECTION: Total Available Balance Hero Card (Greeting, Bell, Balance, Quick Actions) */}
            <TotalBalanceCard
              totalBalance={totalBalance}
              accountCount={accounts.length}
              showBalance={showBalance}
              onToggleBalance={handleToggleBalance}
              customerName={dashboard?.fullName}
              loading={refreshing}
            />

            {/* 2. MIDDLE SECTION: My Accounts Cards Slider (Horizontal Scroll) */}
            <BankCardsSection
              accounts={accounts}
              customerName={dashboard?.fullName}
              showBalance={showBalance}
              onToggleBalance={handleToggleBalance}
            />

            {/* 3. BOTTOM SECTION: Recent Transactions & Statistic (Donut Chart) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr] pt-2">
              <RecentTransactions
                accountNumber={primaryAccount?.accountNumber}
                showBalance={showBalance}
              />

              <StatisticCard
                totalBalance={totalBalance}
                accounts={accounts}
                showBalance={showBalance}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
