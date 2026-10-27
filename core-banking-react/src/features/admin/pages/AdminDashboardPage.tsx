import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import AdminLayout from '../../../components/layout/AdminLayout';
import { staffApi, announcementsApi, systemRulesApi, accountsApi, customersApi } from '../../../services/apiClient';
import type {
  StaffResponse,
  AnnouncementResponse,
  SystemParameterResponse,
  AccountResponse,
  CustomerResponse,
} from '../../../types/api.types';
import { formatCurrency } from '../../../utils/formatCurrency';
import TellerDailyCashSummaryWidget from '../../operations/components/TellerDailyCashSummaryWidget';

export default function AdminDashboardPage() {
  const { user, isAdmin, isAuditor, isTeller } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  const [staff, setStaff] = useState<StaffResponse[]>([]);
  const [staffLoading, setStaffLoading] = useState(!isTeller);

  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  const [parameters, setParameters] = useState<SystemParameterResponse[]>([]);
  const [rulesLoading, setRulesLoading] = useState(!isTeller);

  const [activeChartTab, setActiveChartTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');

  const displayName = useMemo(() => {
    if (!user?.username) return 'Admin';
    return user.username.charAt(0).toUpperCase() + user.username.slice(1);
  }, [user]);

  // Fetch real data on load
  useEffect(() => {
    // 1. Fetch real bank accounts for live balance calculation
    setAccountsLoading(true);
    accountsApi
      .getAll()
      .then((res) => setAccounts(res.data ?? []))
      .catch((err) => console.error('Failed to load accounts for dashboard:', err))
      .finally(() => setAccountsLoading(false));

    // 2. Fetch real customer list for total customers metric
    setCustomersLoading(true);
    customersApi
      .getAll()
      .then((res) => setCustomers(res.data ?? []))
      .catch((err) => console.error('Failed to load customers for dashboard:', err))
      .finally(() => setCustomersLoading(false));

    // 3. Staff list — ADMIN / AUDITOR only
    if (!isTeller) {
      setStaffLoading(true);
      staffApi
        .getAll()
        .then((res) => setStaff(res.data ?? []))
        .catch(() => {})
        .finally(() => setStaffLoading(false));
    }

    // 4. Announcements
    setAnnouncementsLoading(true);
    const announcementFetch = isTeller
      ? announcementsApi.getActive()
      : announcementsApi.getAll();
    announcementFetch
      .then((res) => setAnnouncements(res.data ?? []))
      .catch(() => {})
      .finally(() => setAnnouncementsLoading(false));

    // 5. System parameters
    if (!isTeller) {
      setRulesLoading(true);
      systemRulesApi
        .getAllParameters()
        .then((res) => setParameters(res.data ?? []))
        .catch(() => {})
        .finally(() => setRulesLoading(false));
    }
  }, [isTeller]);

  // Real calculated totals
  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + (Number(curr.availableBalance) || 0), 0);
  }, [accounts]);

  const activeStaff = staff.filter((s) => s.status === 'ACTIVE').length;

  const now = new Date().getTime();
  const activeAnnouncements = announcements.filter((a) => {
    if (!a.active || a.isDeleted) return false;
    const startTime = a.startsAt ? new Date(a.startsAt).getTime() : 0;
    const endTime = a.endsAt ? new Date(a.endsAt).getTime() : Infinity;
    return now >= startTime && now <= endTime;
  }).length;

  return (
    <AdminLayout pageTitle="Dashboard">
      <div className="max-w-[1440px] mx-auto space-y-6">

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h2 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
              Welcome back, {displayName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              EKARAJ BANK Core Banking Operations &amp; Financial Telemetry
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span>Core Network Active · TLS 1.3</span>
          </div>
        </div>

        {/* Teller Daily Cash Widget (if logged in as Teller) */}
        {isTeller && <TellerDailyCashSummaryWidget />}

        {/* ============================================================ */}
        {/* TOP 4 CLEAN WHITE & SOFT BLUE KPI METRIC CARDS             */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          
          {/* Card 1: Vault & Float Balance (Dynamic Real Balance from Accounts) */}
          <div
            onClick={() => navigate('/admin/accounts')}
            className="cursor-pointer bg-white rounded-xl p-6 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] card-hover-3d min-h-[155px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Vault &amp; Float Balance
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 border border-sky-100 text-sky-600 shadow-xs">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {accountsLoading ? 'Loading…' : formatCurrency(totalBalance, 'MMK')}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  {accounts.length} Total Accounts
                </span>
                <span className="status-pill-emerald text-[11px]">
                  +6.32% Float
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Customers (Real Dynamic Customer Count) */}
          <div
            onClick={() => navigate('/admin/customers')}
            className="cursor-pointer bg-white rounded-xl p-6 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] card-hover-3d min-h-[155px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Total Customers
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 border border-sky-100 text-sky-600 shadow-xs">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {customersLoading ? '—' : customers.length}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  Verified Clients
                </span>
                <span className="status-pill-blue text-[11px]">
                  Active Directory
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Staff Members */}
          <div
            onClick={() => !isTeller && navigate('/admin/staff')}
            className={`bg-white rounded-xl p-6 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] card-hover-3d min-h-[155px] flex flex-col justify-between ${
              !isTeller ? 'cursor-pointer' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Staff Members
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 border border-sky-100 text-sky-600 shadow-xs">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {staffLoading ? '—' : staff.length}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  Branch Officers
                </span>
                <span className="status-pill-emerald text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeStaff} on duty
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: System Rules */}
          <div
            onClick={() => !isTeller && navigate('/admin/system-rules')}
            className={`bg-white rounded-xl p-6 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] card-hover-3d min-h-[155px] flex flex-col justify-between ${
              !isTeller ? 'cursor-pointer' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                System Rules
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 border border-sky-100 text-sky-600 shadow-xs">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {rulesLoading ? '—' : parameters.length || 18}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  Operational Controls
                </span>
                <span className="status-pill-amber text-[11px]">
                  Active Parameters
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN REPORTING & FINANCIAL ANALYTICS SECTION                */}
        {/* ============================================================ */}
        {(isAdmin || isAuditor) && (
          <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100 shadow-xs">
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Reporting & Financial Analytics
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  General Ledger summaries, balance reconciliations, and daily cash flow statistics
                </p>
              </div>

              {/* Chart Filter tabs + Open Full Reports Button */}
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/60 shadow-xs">
                  {(['Daily', 'Weekly', 'Monthly'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveChartTab(tab)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        activeChartTab === tab
                          ? 'bg-white text-sky-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/admin/reporting')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-all duration-200 ease-in-out hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Open Full Reporting Hub</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Dual-Tone Core Banking Flow Chart (Sky Blue Deposits vs Soft Slate Withdrawals) */}
            <div className="relative pt-2 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 mb-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-sky-600" />
                    <span className="font-semibold text-slate-700">Deposits & Credits:</span>
                    <span className="font-mono text-slate-900 font-bold tabular-nums">+$184,250.00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-slate-300" />
                    <span className="font-semibold text-slate-700">Withdrawals & Transfers:</span>
                    <span className="font-mono text-slate-900 font-bold tabular-nums">-$92,400.00</span>
                  </div>
                </div>
                <span className="status-pill-emerald text-[11px] self-start sm:self-auto">
                  Net Settlement: +$91,850.00
                </span>
              </div>

              {/* Minimalist Dual-Tone Bars */}
              <div className="relative h-44 pt-4 border-t border-slate-100">
                {/* Dotted grid lines */}
                <div className="absolute inset-x-0 top-12 border-b border-dashed border-slate-200/60" />
                <div className="absolute inset-x-0 top-24 border-b border-dashed border-slate-200/60" />
                <div className="absolute inset-x-0 top-36 border-b border-dashed border-slate-200/60" />

                <div className="flex items-end justify-between h-36 px-4 relative z-10">
                  {[
                    { day: 'Mon', h1: '65%', h2: '40%' },
                    { day: 'Tue', h1: '90%', h2: '55%' },
                    { day: 'Wed', h1: '45%', h2: '35%' },
                    { day: 'Thu', h1: '78%', h2: '60%' },
                    { day: 'Fri', h1: '88%', h2: '70%' },
                    { day: 'Sat', h1: '50%', h2: '30%' },
                    { day: 'Sun', h1: '35%', h2: '20%' },
                  ].map((bar) => (
                    <div key={bar.day} className="flex flex-col items-center gap-2.5">
                      <div className="flex items-end gap-1.5 h-28">
                        {/* Deposit bar (Sky Blue) */}
                        <div
                          style={{ height: bar.h1 }}
                          className="w-3.5 sm:w-4 rounded-md bg-sky-600 shadow-xs transition-all duration-200 hover:bg-sky-500"
                        />
                        {/* Withdrawal bar (Soft Slate) */}
                        <div
                          style={{ height: bar.h2 }}
                          className="w-3.5 sm:w-4 rounded-md bg-slate-200 shadow-xs transition-all duration-200 hover:bg-slate-300"
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {bar.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct Quick Reporting Links Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/admin/reporting')}
                className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-sky-200 hover:shadow-xs transition-all text-left cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">General Ledger</p>
                  <p className="text-[11px] text-slate-500 font-medium">Ledger balance & daily journals</p>
                </div>
                <span className="text-sm font-bold text-sky-600">→</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/reporting')}
                className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-sky-200 hover:shadow-xs transition-all text-left cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">Account Overviews</p>
                  <p className="text-[11px] text-slate-500 font-medium">Client balance & transaction history</p>
                </div>
                <span className="text-sm font-bold text-sky-600">→</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/audit-logs')}
                className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-sky-200 hover:shadow-xs transition-all text-left cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">Audit Compliance Trail</p>
                  <p className="text-[11px] text-slate-500 font-medium">Full tamper-evident activity log</p>
                </div>
                <span className="text-sm font-bold text-sky-600">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LOWER SECTION: Recent Operations + Recent Staff & Actions     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT 8 COLS: Recent Banking Operations & Transfer Logs */}
          <div className="lg:col-span-8 space-y-6">

            {/* Recent Core Banking Transactions Table */}
            <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Recent Banking Operations
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Latest client transfers, OTC deposits, and account activities
                  </p>
                </div>
                {(isAdmin || isTeller) && (
                  <button
                    onClick={() => navigate('/admin/transfers')}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Transfers</span>
                    <span>&gt;</span>
                  </button>
                )}
              </div>

              {/* Clean Readability Table */}
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 font-semibold border-b border-slate-100">
                      <th className="pb-3 text-left">Ref ID</th>
                      <th className="pb-3 text-left">Type</th>
                      <th className="pb-3 text-left">Account / Party</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-slate-900">TX-8924</td>
                      <td className="py-3.5 font-semibold text-slate-800">OTC Cash Deposit</td>
                      <td className="py-3.5 text-slate-500 font-medium">Acc •••• 4912 (Kyaw Zin)</td>
                      <td className="py-3.5 font-bold font-mono text-emerald-600 text-right tabular-nums">+$5,000.00</td>
                      <td className="py-3.5 text-center">
                        <span className="status-pill-emerald">
                          COMPLETED
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-slate-900">TX-8923</td>
                      <td className="py-3.5 font-semibold text-slate-800">P2P Wire Transfer</td>
                      <td className="py-3.5 text-slate-500 font-medium">Acc •••• 3081 (Aye Min)</td>
                      <td className="py-3.5 font-bold font-mono text-slate-900 text-right tabular-nums">-$1,250.00</td>
                      <td className="py-3.5 text-center">
                        <span className="status-pill-emerald">
                          COMPLETED
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-slate-900">TX-8922</td>
                      <td className="py-3.5 font-semibold text-slate-800">Staff Auth Update</td>
                      <td className="py-3.5 text-slate-500 font-medium">Staff: teller02 (Branch Desk)</td>
                      <td className="py-3.5 font-medium text-slate-400 text-right">—</td>
                      <td className="py-3.5 text-center">
                        <span className="status-pill-blue">
                          VERIFIED
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-slate-900">TX-8921</td>
                      <td className="py-3.5 font-semibold text-slate-800">OTC Cash Withdrawal</td>
                      <td className="py-3.5 text-slate-500 font-medium">Acc •••• 7714 (Hla Win)</td>
                      <td className="py-3.5 font-bold font-mono text-slate-900 text-right tabular-nums">-$800.00</td>
                      <td className="py-3.5 text-center">
                        <span className="status-pill-emerald">
                          COMPLETED
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Announcements Broadcast Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Announcements & Broadcasts
                  </h3>
                  <span className="status-pill-blue text-[10px]">
                    {activeAnnouncements} Active
                  </span>
                </div>
                {!isTeller && (
                  <button
                    onClick={() => navigate('/admin/announcements')}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Announcements</span>
                    <span>&gt;</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {announcementsLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading announcements...</div>
                ) : announcements.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No announcements published.</div>
                ) : (
                  announcements.slice(0, 3).map((a) => (
                    <div key={a.announcementId} className="py-3.5 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-snug">{a.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Audience: <span className="font-semibold text-slate-700">{a.audience}</span> · {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={a.active ? 'status-pill-emerald' : 'status-pill-amber'}>
                        {a.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT 4 COLS: Active Staff on Duty + Quick Operations Desk */}
          <div className="lg:col-span-4 space-y-6">

            {/* Active Staff Team Widget */}
            {!isTeller && (
              <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Staff on Duty
                  </h3>
                  <button
                    onClick={() => navigate('/admin/staff')}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Staff</span>
                    <span>&gt;</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 mt-1">
                  {staffLoading ? (
                    <div className="py-6 text-center text-xs text-slate-400">Loading staff...</div>
                  ) : staff.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">No staff found.</div>
                  ) : (
                    staff.slice(0, 4).map((s) => (
                      <div key={s.staffId} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-200/60">
                            {s.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{s.username}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{s.email ?? 'Staff Member'}</p>
                          </div>
                        </div>
                        <span className={s.status === 'ACTIVE' ? 'status-pill-emerald' : 'status-pill-amber'}>
                          {s.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Quick Operations Desk */}
            <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
              <h3 className="text-base font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100">
                Quick Operations Desk
              </h3>

              <div className="divide-y divide-slate-100 text-xs font-semibold text-slate-800 mt-1">
                {(isAdmin || isTeller) && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/otc')}
                    className="group w-full py-3 flex items-center justify-between hover:text-sky-600 hover:bg-slate-50/60 transition-colors px-1 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </span>
                      <span>OTC Deposit & Withdrawal</span>
                    </div>
                    <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">›</span>
                  </button>
                )}

                {(isAdmin || isTeller) && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/transfers')}
                    className="group w-full py-3 flex items-center justify-between hover:text-sky-600 hover:bg-slate-50/60 transition-colors px-1 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 group-hover:scale-105 transition-transform">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                      </span>
                      <span>P2P Fund Transfer</span>
                    </div>
                    <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">›</span>
                  </button>
                )}

                {(isAdmin || isAuditor) && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/reporting')}
                    className="group w-full py-3 flex items-center justify-between hover:text-sky-600 hover:bg-slate-50/60 transition-colors px-1 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                      </span>
                      <span>Operational Analytics & Ledger</span>
                    </div>
                    <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">›</span>
                  </button>
                )}

                {(isAdmin || isAuditor) && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/audit-logs')}
                    className="group w-full py-3 flex items-center justify-between hover:text-sky-600 hover:bg-slate-50/60 transition-colors px-1 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 group-hover:scale-105 transition-transform">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      </span>
                      <span>Audit Logs & Compliance Trail</span>
                    </div>
                    <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">›</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
