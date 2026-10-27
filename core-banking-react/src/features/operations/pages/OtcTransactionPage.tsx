import { useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { otcApi, accountsApi } from '../../../services/apiClient';
import type { OtcTransactionResponseDto, AccountResponse } from '../../../types/api.types';
import { formatCurrency } from '../../../utils/formatCurrency';
import type { AxiosError } from 'axios';
import TellerDailyCashSummaryWidget from '../components/TellerDailyCashSummaryWidget';

type OtcOperationType = 'DEPOSIT' | 'WITHDRAW';

export default function OtcTransactionPage() {
  const [operationType, setOperationType] = useState<OtcOperationType>('DEPOSIT');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [nrcOrId, setNrcOrId] = useState('');
  const [remark, setRemark] = useState('');

  // Account verification state
  const [verifiedAccount, setVerifiedAccount] = useState<AccountResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [accountLookupError, setAccountLookupError] = useState<string | null>(null);

  // Form submission state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<OtcTransactionResponseDto | null>(null);

  const getAccountStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          cardBg: 'border-emerald-200 bg-emerald-50/70 text-slate-700',
          nameText: 'text-emerald-950 font-bold',
          badgeClass: 'status-pill-emerald',
          balanceText: 'text-emerald-800',
          notice: null,
        };
      case 'FROZEN':
        return {
          cardBg: 'border-rose-300 bg-rose-50/90 text-rose-950',
          nameText: 'text-rose-950 font-bold',
          badgeClass: 'status-pill-crimson',
          balanceText: 'text-rose-900',
          notice: (
            <div className="mt-2.5 pt-2 border-t border-rose-200 flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
              <svg className="h-4 w-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Account is FROZEN: Core banking policies restrict all deposits, withdrawals, and debit operations.</span>
            </div>
          ),
        };
      case 'DORMANT':
        return {
          cardBg: 'border-amber-300 bg-amber-50/90 text-amber-950',
          nameText: 'text-amber-950 font-bold',
          badgeClass: 'status-pill-amber',
          balanceText: 'text-amber-900',
          notice: (
            <div className="mt-2.5 pt-2 border-t border-amber-200 flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
              <svg className="h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Account is DORMANT: Re-verification or reactivation may be required before ledger settlement.</span>
            </div>
          ),
        };
      case 'CLOSED':
        return {
          cardBg: 'border-slate-300 bg-slate-100 text-slate-800',
          nameText: 'text-slate-900 font-bold',
          badgeClass: 'status-pill-crimson',
          balanceText: 'text-slate-700',
          notice: (
            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span>Account is CLOSED: No financial transactions can be executed on this account.</span>
            </div>
          ),
        };
      default:
        return {
          cardBg: 'border-slate-200 bg-slate-50 text-slate-700',
          nameText: 'text-slate-900 font-bold',
          badgeClass: 'status-pill-blue',
          balanceText: 'text-slate-800',
          notice: null,
        };
    }
  };

  const handleLookupAccount = async () => {
    if (!accountNumber.trim()) {
      setAccountLookupError('Please enter an account number to verify.');
      return;
    }
    setIsVerifying(true);
    setAccountLookupError(null);
    setVerifiedAccount(null);

    try {
      const res = await accountsApi.getByNumber(accountNumber.trim());
      setVerifiedAccount(res.data);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setAccountLookupError(
        axErr.response?.data?.message || 'Account not found. Please verify the account number.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim() || !amount) {
      setError('Account number and transaction amount are required.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      setError('Transaction amount must be at least 100 MMK.');
      return;
    }

    if (operationType === 'WITHDRAW' && verifiedAccount) {
      const minBalance = 50000;
      const netAvailable = (verifiedAccount.availableBalance ?? 0) - minBalance;
      if (numAmount > netAvailable) {
        setError(
          `Insufficient funds for withdrawal. Minimum balance to maintain is 50,000 MMK. Maximum withdrawable: ${Math.max(0, netAvailable).toLocaleString()} MMK.`,
        );
        return;
      }
    }

    if (verifiedAccount?.status === 'FROZEN') {
      setError(
        'Cannot process transaction: This account is currently FROZEN. Please unfreeze the account in Customer Accounts first.',
      );
      return;
    }

    if (verifiedAccount?.status === 'CLOSED') {
      setError('Cannot process transaction: This account is CLOSED.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReceipt(null);

    const idempotencyKey = `otc_${operationType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const payload = {
        accountNumber: accountNumber.trim(),
        amount: numAmount,
        depositorOrWithdrawerName: depositorName.trim() || undefined,
        nrcOrId: nrcOrId.trim() || undefined,
        remark: remark.trim() || undefined,
      };

      const res =
        operationType === 'DEPOSIT'
          ? await otcApi.deposit(payload, idempotencyKey)
          : await otcApi.withdraw(payload, idempotencyKey);

      setReceipt(res.data);
      if (verifiedAccount) {
        setVerifiedAccount({
          ...verifiedAccount,
          availableBalance: res.data.balanceAfter,
          currentBalance: res.data.balanceAfter,
        });
      }
      setAmount('');
      setDepositorName('');
      setNrcOrId('');
      setRemark('');
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(
        axErr.response?.data?.message ||
          `Failed to process OTC ${operationType.toLowerCase()}. Please verify drawer funds and account status.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setReceipt(null);
    setError(null);
    setAccountLookupError(null);
    setVerifiedAccount(null);
    setAccountNumber('');
    setAmount('');
    setDepositorName('');
    setNrcOrId('');
    setRemark('');
  };

  return (
    <AdminLayout pageTitle="VIP Overdrafts & OTC">
      <div className="max-w-[1440px] mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h2 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
              Over-the-Counter (OTC) Banking
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-medium">
              Process verified teller cash deposits and withdrawals with real-time audit ledger logging
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-xs w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Teller Desk Active</span>
          </div>
        </div>

        {/* Teller Cash Drawer Float Widget */}
        <TellerDailyCashSummaryWidget />

        {/* Main Grid: Form + Auxiliary Info */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Form Card */}
          <div className="bg-white rounded-xl p-6 sm:p-8 lg:col-span-2 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] space-y-6">
            
            {/* Operation Type Switcher */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Operation:</span>
                <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/60 shadow-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOperationType('DEPOSIT');
                      setError(null);
                    }}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      operationType === 'DEPOSIT'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cash Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOperationType('WITHDRAW');
                      setError(null);
                    }}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      operationType === 'WITHDRAW'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cash Withdrawal
                  </button>
                </div>
              </div>

              <span className={`status-pill-${operationType === 'DEPOSIT' ? 'emerald' : 'amber'} text-[11px]`}>
                {operationType === 'DEPOSIT' ? 'Credit Ledger' : 'Debit Ledger'}
              </span>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
                <svg className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Account Number Lookup Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Account Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="e.g. 1008207493"
                      value={accountNumber}
                      onChange={(e) => {
                        setAccountNumber(e.target.value);
                        setVerifiedAccount(null);
                        setAccountLookupError(null);
                      }}
                      disabled={isLoading || isVerifying}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleLookupAccount}
                    isLoading={isVerifying}
                    disabled={isLoading || !accountNumber.trim()}
                    className="shrink-0"
                  >
                    Verify Account
                  </Button>
                </div>

                {accountLookupError && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    {accountLookupError}
                  </p>
                )}

                {/* Verified Account Banner with Dynamic Status Colors */}
                {verifiedAccount && (() => {
                  const style = getAccountStatusStyle(verifiedAccount.status);
                  return (
                    <div className={`mt-2.5 rounded-xl border p-3.5 text-xs shadow-xs transition-all ${style.cardBg}`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className={style.nameText}>{verifiedAccount.customerName}</span>
                        <span className={`${style.badgeClass} text-[10px] uppercase font-bold tracking-wider`}>
                          {verifiedAccount.status}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] opacity-90">
                        <span>
                          Product: <strong className="font-semibold text-slate-800">{verifiedAccount.accountType}</strong> ({verifiedAccount.accountCategory})
                        </span>
                        <span>
                          Available: <strong className={`font-mono font-bold tabular-nums ${style.balanceText}`}>{formatCurrency(verifiedAccount.availableBalance, verifiedAccount.currency)}</strong>
                        </span>
                      </div>
                      {style.notice}
                    </div>
                  );
                })()}
              </div>

              {/* Amount */}
              <div>
                <Input
                  label={`Transaction Amount (MMK) *`}
                  placeholder="Minimum 100 MMK"
                  type="number"
                  step="0.01"
                  min="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Depositor / Presenter Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={operationType === 'DEPOSIT' ? 'Depositor Name (Optional)' : 'Withdrawer Name (Optional)'}
                  placeholder="Full name of person at counter"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  label="NRC / National ID (Optional)"
                  placeholder="e.g. 12/DAGAMA(N)123456"
                  value={nrcOrId}
                  onChange={(e) => setNrcOrId(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Remarks */}
              <div>
                <Input
                  label="Operation Remark (Optional)"
                  placeholder="e.g. Cash withdrawal for payroll"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  disabled={isLoading || verifiedAccount?.status === 'FROZEN' || verifiedAccount?.status === 'CLOSED'}
                  className={`w-full sm:w-auto px-8 ${
                    verifiedAccount?.status === 'FROZEN'
                      ? 'bg-rose-600 hover:bg-rose-700 opacity-60 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {verifiedAccount?.status === 'FROZEN'
                    ? 'Account is Frozen'
                    : verifiedAccount?.status === 'CLOSED'
                    ? 'Account is Closed'
                    : operationType === 'DEPOSIT'
                    ? 'Process Cash Deposit'
                    : 'Process Cash Withdrawal'}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Receipt or Counter Policy */}
          <div className="space-y-5">
            {receipt ? (
              <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                      ✓
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Receipt Ready
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {receipt.transactionRef}
                  </span>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400 font-medium">Operation</span>
                    <span className="status-pill-emerald text-[10px]">
                      {receipt.transactionType}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2.5">
                    <span className="text-slate-400 font-medium">Account Number</span>
                    <span className="font-mono font-bold text-slate-900">{receipt.accountNumber}</span>
                  </div>
                  <div className="flex justify-between pt-2.5">
                    <span className="text-slate-400 font-medium">Customer</span>
                    <span className="font-semibold text-slate-900">{receipt.customerName}</span>
                  </div>
                  <div className="flex justify-between pt-2.5">
                    <span className="text-slate-400 font-medium">Amount</span>
                    <span className="font-mono font-bold text-sky-600 text-sm tabular-nums">
                      {formatCurrency(receipt.amount, receipt.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2.5">
                    <span className="text-slate-400 font-medium">Balance After</span>
                    <span className="font-mono font-bold text-emerald-700 tabular-nums">
                      {formatCurrency(receipt.balanceAfter, receipt.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2.5">
                    <span className="text-slate-400 font-medium">Processed By</span>
                    <span className="font-mono text-slate-700 font-medium">{receipt.tellerUsername}</span>
                  </div>
                  <div className="flex justify-between pt-2.5">
                    <span className="text-slate-400 font-medium">Timestamp</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {receipt.transactedAt ? new Date(receipt.transactedAt).toLocaleTimeString() : '—'}
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={handleReset}
                  className="w-full mt-3"
                >
                  Process Another Transaction
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] space-y-4 text-xs text-slate-600 font-medium">
                {/* Modern Teller Counter Policy SVG Header (replacing ugly emoji) */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100 shadow-xs">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm tracking-tight">
                    Teller Counter Policy
                  </h4>
                </div>
                <ul className="space-y-3 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong className="text-slate-800">Pessimistic Concurrency:</strong> Database accounts are locked during transaction execution to prevent double spending.
                  </li>
                  <li>
                    <strong className="text-slate-800">Minimum Balance (50,000 MMK):</strong> Savings and retail accounts must maintain reserve balance. Withdrawals exceeding net available funds will be rejected.
                  </li>
                  <li>
                    <strong className="text-slate-800">Teller Drawer Balancing:</strong> Every cash-in and cash-out strictly debits or credits your current physical drawer float.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
