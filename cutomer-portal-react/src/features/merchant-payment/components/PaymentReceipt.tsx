import React from 'react';
import { CheckCircle2, LayoutDashboard, ShieldCheck } from 'lucide-react';
import type { PaymentReceipt as ReceiptType, PaymentDetails } from '../types/merchantPayment';

interface Props {
  receipt: ReceiptType;
  details: PaymentDetails;
  selectedAccount: string;
}

export const PaymentReceipt: React.FC<Props> = ({ receipt, details, selectedAccount }) => {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        {/* Status Badge */}
        <div className="mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Payment Authorized
          </span>
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 mb-1">Payment Successful</h2>
        <p className="text-xs text-slate-500 mb-6">
          Your payment has been authorized and dispatched for merchant settlement.
        </p>
        
        {/* Receipt Details Card */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3 text-sm text-left mb-6">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
            <span className="text-slate-500 text-xs font-medium">Merchant</span>
            <span className="font-semibold text-slate-900">{details.merchantName}</span>
          </div>
          {details.orderId && (
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
              <span className="text-slate-500 text-xs font-medium">Order Reference</span>
              <span className="font-mono text-xs font-semibold text-slate-800">{details.orderId}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
            <span className="text-slate-500 text-xs font-medium">Amount Paid</span>
            <span className="text-base font-bold text-emerald-600">{receipt.amount.toLocaleString()} {receipt.currency}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
            <span className="text-slate-500 text-xs font-medium">Paid From</span>
            <span className="font-mono text-xs text-slate-800">****{selectedAccount.slice(-4)} (CURRENT)</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
            <span className="text-slate-500 text-xs font-medium">Approval Code</span>
            <span className="font-mono text-xs font-semibold text-slate-700">{receipt.coreLedgerReference || 'AUTH-SUCCESS'}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
            <span className="text-slate-500 text-xs font-medium">Payment Token</span>
            <span className="font-mono text-xs text-slate-700">{receipt.paymentToken}</span>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-slate-500 text-xs font-medium">Date & Time</span>
            <span className="text-xs text-slate-800">
              {new Date(receipt.timestamp).toLocaleString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>

        {/* Settlement Callout */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 flex items-start gap-2.5 text-xs text-slate-600 mb-6 text-left">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Funds have been verified and reserved. The transaction will appear on your account statement upon ledger settlement.</span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button 
            type="button"
            onClick={() => window.location.href = '/dashboard'} 
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 transition-colors shadow-xs text-sm"
          >
            <LayoutDashboard className="h-4 w-4" />
            Done & Return to Dashboard
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Official bank statement and transaction receipt will be available under <span className="font-medium text-slate-600">Transaction History</span> upon ledger settlement.
          </p>
        </div>
      </div>
    </div>
  );
};
