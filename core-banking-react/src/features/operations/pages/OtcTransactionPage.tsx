import { useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { otcApi, accountsApi } from '../../../services/apiClient';
import type { OtcTransactionResponseDto, AccountResponse } from '../../../types/api.types';
import { formatCurrency } from '../../../utils/formatCurrency';
import type { AxiosError } from 'axios';

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
      // Update local verified account balance if present
      if (verifiedAccount) {
        setVerifiedAccount({
          ...verifiedAccount,
          currentBalance: res.data.balanceAfter,
          availableBalance: res.data.balanceAfter,
        });
      }
      setAmount('');
      setRemark('');
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(
        axErr.response?.data?.message ||
          `OTC ${operationType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} failed. Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setReceipt(null);
    setError(null);
    setAmount('');
    setRemark('');
    setDepositorName('');
    setNrcOrId('');
  };

  return (
    <AdminLayout pageTitle="OTC Operations (Teller Counter)">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Over-the-Counter (OTC) Banking</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Process direct counter cash deposits and cash withdrawals for walk-in customers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Operations Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-6">
          {/* Operation Switcher Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Select Counter Operation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setOperationType('DEPOSIT');
                  setError(null);
                }}
                className={[
                  'flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-semibold transition-all',
                  operationType === 'DEPOSIT'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                ].join(' ')}
              >
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Cash Deposit (ငွေသွင်း)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOperationType('WITHDRAW');
                  setError(null);
                }}
                className={[
                  'flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-semibold transition-all',
                  operationType === 'WITHDRAW'
                    ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                ].join(' ')}
              >
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                <span>Cash Withdrawal (ငွေထုတ်)</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Operation Failed</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Lookup Row */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Bank Account Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 1001234567"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    setVerifiedAccount(null);
                    setAccountLookupError(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLookupAccount}
                  disabled={isVerifying || !accountNumber.trim()}
                >
                  {isVerifying ? 'Checking...' : 'Verify'}
                </Button>
              </div>
              {accountLookupError && (
                <p className="mt-1.5 text-xs text-red-600">{accountLookupError}</p>
              )}
            </div>

            {/* Verified Account Card */}
            {verifiedAccount && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Account Verified ✓
                  </span>
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      verifiedAccount.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700',
                    ].join(' ')}
                  >
                    {verifiedAccount.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Customer Name</span>
                    <span className="font-bold text-gray-900">{verifiedAccount.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Category / Type</span>
                    <span className="font-medium text-gray-800">
                      {verifiedAccount.accountCategory} • {verifiedAccount.accountType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Available Balance</span>
                    <span className="font-bold text-blue-700 font-mono">
                      {formatCurrency(verifiedAccount.availableBalance ?? 0, verifiedAccount.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Amount and Person Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={`${operationType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} Amount (MMK)`}
                type="number"
                placeholder="e.g. 500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={isLoading}
                min={100}
              />
              <Input
                label="Depositor / Withdrawer Full Name"
                placeholder="Walk-in customer name"
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="NRC or National ID Number"
                placeholder="e.g. 12/DAGAMA(N)123456"
                value={nrcOrId}
                onChange={(e) => setNrcOrId(e.target.value)}
                disabled={isLoading}
              />
              <Input
                label="Counter Narration / Notes"
                placeholder="e.g. Salary cash deposit / Cash withdrawal"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant={operationType === 'DEPOSIT' ? 'primary' : 'danger'}
                isLoading={isLoading}
                className="w-full sm:w-auto px-6 py-2.5"
              >
                {operationType === 'DEPOSIT' ? 'Confirm Cash Deposit' : 'Confirm Cash Withdrawal'}
              </Button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Receipt or Guidelines */}
        <div className="space-y-6">
          {receipt ? (
            <div className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-bold text-gray-900">Transaction Receipt</h3>
              </div>

              <div className="divide-y divide-gray-100 text-xs space-y-2.5">
                <div className="flex justify-between pt-2">
                  <span className="text-gray-500">Transaction Reference</span>
                  <span className="font-mono font-bold text-gray-900">{receipt.transactionRef}</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-gray-500">Operation Type</span>
                  <span
                    className={[
                      'font-semibold px-2 py-0.5 rounded text-[11px]',
                      receipt.transactionType === 'OTC_DEPOSIT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800',
                    ].join(' ')}
                  >
                    {receipt.transactionType}
                  </span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-gray-500">Account Number</span>
                  <span className="font-mono font-medium text-gray-800">{receipt.accountNumber}</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-medium text-gray-800">{receipt.customerName}</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-gray-500">Transacted Amount</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">
                    {formatCurrency(receipt.amount, receipt.currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-gray-500">Balance Before</span>
                  <span className="font-mono text-gray-600">
                    {formatCurrency(receipt.balanceBefore, receipt.currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-gray-500">Balance After</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatCurrency(receipt.balanceAfter, receipt.currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-gray-500">Processed By Teller</span>
                  <span className="font-mono text-gray-700">{receipt.tellerUsername}</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-gray-500">Time</span>
                  <span className="font-mono text-gray-500">
                    {receipt.transactedAt ? new Date(receipt.transactedAt).toLocaleTimeString() : '—'}
                  </span>
                </div>
              </div>

              <Button variant="secondary" onClick={handleReset} className="w-full mt-2">
                Process Another Transaction
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-4 text-xs text-gray-600">
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                Teller Counter Policy
              </h4>
              <ul className="space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Pessimistic Concurrency:</strong> Database accounts are locked during transaction execution to prevent double spending.
                </li>
                <li>
                  <strong>Minimum Balance (50,000 MMK):</strong> Savings and retail accounts must maintain a minimum reserve balance. Withdrawals exceeding net available funds will be rejected.
                </li>
                <li>
                  <strong>Vault Cash Recording:</strong> Counter deposits and withdrawals are recorded with double-entry General Ledger balancing vault cash accounts against customer liabilities.
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
