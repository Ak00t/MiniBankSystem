import React, { useState } from 'react';
import ReportFilterBar, { type ReportTab } from './components/ReportFilterBar';
import DailyLedgerPanel from './components/DailyLedgerPanel';
import AccountStatusPanel from './components/AccountStatusPanel';
import AuditTrailPanel from './components/AuditTrailPanel';

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
const todayDt = today + 'T23:59';
const monthAgoDt = monthAgo + 'T00:00';

const ReportingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('ledger');

  // Input filter states (edited in the filter bar)
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [ledgerStatus, setLedgerStatus] = useState('');
  const [ledgerTransactionType, setLedgerTransactionType] = useState('');
  const [accountStatus, setAccountStatus] = useState('');

  const [auditStartDate, setAuditStartDate] = useState(monthAgoDt);
  const [auditEndDate, setAuditEndDate] = useState(todayDt);
  const [staffId, setStaffId] = useState('');
  const [actionType, setActionType] = useState('');
  const [accountNo, setAccountNo] = useState('');

  // Applied filter states (applied on Search / Reset)
  const [appliedStartDate, setAppliedStartDate] = useState(monthAgo);
  const [appliedEndDate, setAppliedEndDate] = useState(today);
  const [appliedLedgerStatus, setAppliedLedgerStatus] = useState('');
  const [appliedLedgerTransactionType, setAppliedLedgerTransactionType] = useState('');
  const [appliedAccountStatus, setAppliedAccountStatus] = useState('');

  const [appliedAuditStartDate, setAppliedAuditStartDate] = useState(monthAgoDt);
  const [appliedAuditEndDate, setAppliedAuditEndDate] = useState(todayDt);
  const [appliedStaffId, setAppliedStaffId] = useState('');
  const [appliedActionType, setAppliedActionType] = useState('');
  const [appliedAccountNo, setAppliedAccountNo] = useState('');

  const [hasSearched, setHasSearched] = useState<Record<ReportTab, boolean>>({
    ledger: false,
    account: false,
    audit: false,
  });

  const [searchKeys, setSearchKeys] = useState<Record<ReportTab, number>>({
    ledger: 0,
    account: 0,
    audit: 0,
  });

  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedLedgerStatus(ledgerStatus);
    setAppliedLedgerTransactionType(ledgerTransactionType);
    setAppliedAccountStatus(accountStatus);
    setAppliedAuditStartDate(auditStartDate);
    setAppliedAuditEndDate(auditEndDate);
    setAppliedStaffId(staffId);
    setAppliedActionType(actionType);
    setAppliedAccountNo(accountNo);

    setHasSearched((prev) => ({ ...prev, [activeTab]: true }));
    setSearchKeys((prev) => ({ ...prev, [activeTab]: prev[activeTab] + 1 }));
  };

  const handleReset = () => {
    if (activeTab === 'ledger') {
      setStartDate(monthAgo);
      setEndDate(today);
      setLedgerStatus('');
      setLedgerTransactionType('');
      setAppliedStartDate(monthAgo);
      setAppliedEndDate(today);
      setAppliedLedgerStatus('');
      setAppliedLedgerTransactionType('');
    } else if (activeTab === 'account') {
      setStartDate(monthAgo);
      setEndDate(today);
      setAccountStatus('');
      setAppliedStartDate(monthAgo);
      setAppliedEndDate(today);
      setAppliedAccountStatus('');
    } else if (activeTab === 'audit') {
      setAuditStartDate(monthAgoDt);
      setAuditEndDate(todayDt);
      setStaffId('');
      setActionType('');
      setAccountNo('');
      setAppliedAuditStartDate(monthAgoDt);
      setAppliedAuditEndDate(todayDt);
      setAppliedStaffId('');
      setAppliedActionType('');
      setAppliedAccountNo('');
    }

    setHasSearched((prev) => ({ ...prev, [activeTab]: false }));
    setSearchKeys((prev) => ({ ...prev, [activeTab]: 0 }));
    setIsSearching(false);
  };

  const tabInfo: Record<ReportTab, { title: string; description: string }> = {
    ledger: {
      title: 'Ready to Generate Daily Ledger Summary',
      description:
        'Select your date range and filters above, then click "Search Report" to inspect transaction volumes and double-entry General Ledger reconciliation.',
    },
    account: {
      title: 'Ready to Generate Account Status Report',
      description:
        'Select your date range and status filters above, then click "Search Report" to inspect accounts portfolio standing and balance brackets.',
    },
    audit: {
      title: 'Ready to View Audit Trail Logs',
      description:
        'Specify your desired time window, staff ID, or account number above, then click "Search Report" to retrieve tamper-evident audit records.',
    },
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            Reporting & Financial Analytics
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-medium">
            EKARAJ BANK Core Banking Telemetry: General Ledger summaries, balance reconciliations, and audit trail logs
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-xs w-fit">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Ledger Balancing</span>
        </div>
      </div>

      {/* Tabs Switcher (No Emojis, No Black color - Clean Light Theme) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/60 shadow-xs flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={[
              'px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'ledger'
                ? 'bg-white text-sky-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900',
            ].join(' ')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <span>Daily Ledger Summary</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={[
              'px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'account'
                ? 'bg-white text-sky-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900',
            ].join(' ')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span>Account Status</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={[
              'px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'audit'
                ? 'bg-white text-sky-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900',
            ].join(' ')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span>Audit Trail Logs</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        activeTab={activeTab}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        ledgerStatus={ledgerStatus}
        onLedgerStatusChange={setLedgerStatus}
        ledgerTransactionType={ledgerTransactionType}
        onLedgerTransactionTypeChange={setLedgerTransactionType}
        accountStatus={accountStatus}
        onAccountStatusChange={setAccountStatus}
        staffId={staffId}
        onStaffIdChange={setStaffId}
        actionType={actionType}
        onActionTypeChange={setActionType}
        accountNo={accountNo}
        onAccountNoChange={setAccountNo}
        auditStartDate={auditStartDate}
        onAuditStartDateChange={setAuditStartDate}
        auditEndDate={auditEndDate}
        onAuditEndDateChange={setAuditEndDate}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={isSearching}
      />

      {hasSearched.ledger && (
        <div style={{ display: activeTab === 'ledger' ? 'block' : 'none' }}>
          <DailyLedgerPanel
            startDate={appliedStartDate}
            endDate={appliedEndDate}
            ledgerStatus={appliedLedgerStatus}
            transactionType={appliedLedgerTransactionType}
            searchKey={searchKeys.ledger}
            onLoadingChange={(l) => {
              if (activeTab === 'ledger') setIsSearching(l);
            }}
          />
        </div>
      )}
      {hasSearched.account && (
        <div style={{ display: activeTab === 'account' ? 'block' : 'none' }}>
          <AccountStatusPanel
            startDate={appliedStartDate}
            endDate={appliedEndDate}
            accountStatus={appliedAccountStatus}
            searchKey={searchKeys.account}
            onLoadingChange={(l) => {
              if (activeTab === 'account') setIsSearching(l);
            }}
          />
        </div>
      )}
      {hasSearched.audit && (
        <div style={{ display: activeTab === 'audit' ? 'block' : 'none' }}>
          <AuditTrailPanel
            staffId={appliedStaffId}
            actionType={appliedActionType}
            auditStartDate={appliedAuditStartDate}
            auditEndDate={appliedAuditEndDate}
            accountNo={appliedAccountNo}
            searchKey={searchKeys.audit}
            onLoadingChange={(l) => {
              if (activeTab === 'audit') setIsSearching(l);
            }}
          />
        </div>
      )}

      {!hasSearched[activeTab] && (
        <div className="glass-panel p-16 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-800 text-2xl mx-auto border border-amber-400/30">
            🔍
          </div>
          <div>
            <h3 className="text-base font-black text-[#1E1B4B] tracking-tight">
              {tabInfo[activeTab].title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto mt-1 font-medium leading-relaxed">
              {tabInfo[activeTab].description}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="btn-liquid-gold px-8 py-2.5 text-xs inline-flex items-center gap-2"
          >
            {isSearching ? 'Generating Report...' : 'Search Report'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportingView;
