import React from 'react';

export type ReportTab = 'ledger' | 'account' | 'audit';

interface ReportFilterBarProps {
  activeTab: ReportTab;
  startDate: string;
  endDate: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  ledgerStatus: string;
  onLedgerStatusChange: (v: string) => void;
  ledgerTransactionType?: string;
  onLedgerTransactionTypeChange?: (v: string) => void;
  accountStatus: string;
  onAccountStatusChange: (v: string) => void;
  staffId: string;
  onStaffIdChange: (v: string) => void;
  actionType: string;
  onActionTypeChange: (v: string) => void;
  accountNo: string;
  onAccountNoChange: (v: string) => void;
  auditStartDate: string;
  onAuditStartDateChange: (v: string) => void;
  auditEndDate: string;
  onAuditEndDateChange: (v: string) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}

const LEDGER_STATUSES = ['', 'COMPLETED', 'PENDING', 'FAILED', 'REVERSED'];
const LEDGER_TRANSACTION_TYPES = [
  '',
  'INTERNAL_TRANSFER',
  'OTC_DEPOSIT',
  'OTC_WITHDRAWAL',
  'EXTERNAL_PAYMENT',
  'LEDGER_ADJUSTMENT',
  'REFUND',
];
const ACCOUNT_STATUSES = ['', 'ACTIVE', 'FROZEN', 'SUSPENDED', 'CLOSED'];
const ACTION_TYPES = [
  '',
  'LOGIN',
  'LOGOUT',
  'CREATE_ACCOUNT',
  'UPDATE_ACCOUNT',
  'FREEZE_ACCOUNT',
  'UNFREEZE_ACCOUNT',
  'SUSPEND_ACCOUNT',
  'CREATE_CUSTOMER',
  'UPDATE_CUSTOMER',
  'DELETE_CUSTOMER',
  'APPROVE_KYC',
  'REJECT_KYC',
  'TRANSFER',
  'OTC_DEPOSIT',
];

const ReportFilterBar: React.FC<ReportFilterBarProps> = (props) => {
  const {
    activeTab,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    ledgerStatus,
    onLedgerStatusChange,
    ledgerTransactionType = '',
    onLedgerTransactionTypeChange,
    accountStatus,
    onAccountStatusChange,
    staffId,
    onStaffIdChange,
    actionType,
    onActionTypeChange,
    accountNo,
    onAccountNoChange,
    auditStartDate,
    auditEndDate,
    onAuditStartDateChange,
    onAuditEndDateChange,
    onSearch,
    onReset,
    loading,
  } = props;

  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-purple-950/10">
        <span className="text-base font-black text-[#1E1B4B] tracking-tight">
          Filter Parameters &amp; Query Scope
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3.5">
        {(activeTab === 'ledger' || activeTab === 'account') && (
          <>
            <div className="flex flex-col min-w-[140px] flex-1">
              <label className="text-[11px] font-bold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="rounded-xl border border-purple-950/15 bg-white/80 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/25"
              />
            </div>

            <div className="flex flex-col min-w-[140px] flex-1">
              <label className="text-[11px] font-bold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="rounded-xl border border-purple-950/15 bg-white/80 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/25"
              />
            </div>
          </>
        )}

        {activeTab === 'ledger' && (
          <>
            <div className="flex flex-col min-w-[140px] flex-1">
              <label className="text-[11px] font-bold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
                Ledger Status
              </label>
              <select
                value={ledgerStatus}
                onChange={(e) => onLedgerStatusChange(e.target.value)}
                className="rounded-xl border border-purple-950/15 bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-amber-400/25"
              >
                {LEDGER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === '' ? 'All Statuses' : s}
                  </option>
                ))}
              </select>
            </div>

            {onLedgerTransactionTypeChange && (
              <div className="flex flex-col min-w-[160px] flex-1">
                <label className="text-[11px] font-bold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
                  Transaction Type
                </label>
                <select
                  value={ledgerTransactionType}
                  onChange={(e) => onLedgerTransactionTypeChange(e.target.value)}
                  className="rounded-xl border border-purple-950/15 bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-amber-400/25"
                >
                  {LEDGER_TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === '' ? 'All Types' : t.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {activeTab === 'account' && (
          <div className="flex flex-col min-w-[140px] flex-1">
            <label className="text-[11px] font-bold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
              Account Status
            </label>
            <select
              value={accountStatus}
              onChange={(e) => onAccountStatusChange(e.target.value)}
              className="rounded-xl border border-purple-950/15 bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-amber-400/25"
            >
              {ACCOUNT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === '' ? 'All Statuses' : s}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'audit' && (
          <>
            <div className="flex flex-col min-w-[150px] flex-1">
              <label className="text-[11px] font-bold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
                From Date/Time
              </label>
              <input
                type="datetime-local"
                value={auditStartDate}
                onChange={(e) => onAuditStartDateChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="rounded-xl border border-purple-950/15 bg-white/80 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/25"
              />
            </div>

            <div className="flex flex-col min-w-[150px] flex-1">
              <label className="text-[11px] font-bold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
                To Date/Time
              </label>
              <input
                type="datetime-local"
                value={auditEndDate}
                onChange={(e) => onAuditEndDateChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="rounded-xl border border-purple-950/15 bg-white/80 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/25"
              />
            </div>

            <div className="flex flex-col min-w-[120px] flex-1">
              <label className="text-[11px] font-bold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
                Staff ID
              </label>
              <input
                type="text"
                placeholder="e.g. STF-001"
                value={staffId}
                onChange={(e) => onStaffIdChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="rounded-xl border border-purple-950/15 bg-white/80 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/25"
              />
            </div>

            <div className="flex flex-col min-w-[140px] flex-1">
              <label className="text-[11px] font-bold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
                Action Type
              </label>
              <select
                value={actionType}
                onChange={(e) => onActionTypeChange(e.target.value)}
                className="rounded-xl border border-purple-950/15 bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-amber-400/25"
              >
                {ACTION_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {a === '' ? 'All Actions' : a.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col min-w-[130px] flex-1">
              <label className="text-[11px] font-bold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
                Account No.
              </label>
              <input
                type="text"
                placeholder="Account number"
                value={accountNo}
                onChange={(e) => onAccountNoChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="rounded-xl border border-purple-950/15 bg-white/80 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/25"
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={onSearch}
            disabled={loading}
            className="btn-liquid-gold px-6 py-2 text-xs"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="rounded-full border border-purple-950/15 bg-white/80 hover:bg-white px-5 py-2 text-xs font-bold text-[#1E1B4B] shadow-xs transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportFilterBar;
