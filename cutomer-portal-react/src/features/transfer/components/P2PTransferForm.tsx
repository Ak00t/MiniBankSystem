import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../lib/redux";
import { submitP2PTransfer, resetTransferState, clearTransferError } from "../store/transferSlice";
import { fetchMyAccounts } from "../../customer-account/accounts/stores/accountsSlice";
import { lookupDestinationAccount } from "../services/transferService";
import { getBeneficiaries, addBeneficiary } from "../../beneficiaries/services/beneficiaryService";
import type { Beneficiary } from "../../beneficiaries/types/beneficiaryTypes";
import type { P2PTransferRequest } from "../types/transferTypes";
import { getAccountTransferLimits } from "../../customer-account/accounts/api/customerAccountApi";
import type { TransferLimitInfo } from "../../customer-account/accounts/types/accountTypes";
import TransferReceiptView from "./TransferReceiptView";
import { mapP2PResponseToReceiptData } from "../types/transferReceiptTypes";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  PlusCircle,
  ChevronLeft,
  Send,
  Wallet,
  X,
  Printer,
  Home,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Lock,
  CreditCard,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const maskAccount = (accNo: string): string => {
  if (!accNo || accNo.length < 4) return accNo;
  return `••••  ••••  ${accNo.slice(-4)}`;
};

const formatMMK = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n) + " MMK";

/* -------------------------------------------------------------------------- */
/* PIN Modal (6-Box UI with Auto-advance, Backspace, Paste)                   */
/* -------------------------------------------------------------------------- */

interface PinModalProps {
  loading: boolean;
  error: string | null;
  onConfirm: (pin: string) => void;
  onClose: () => void;
  onClearError?: () => void;
}

function PinModal({ loading, error, onConfirm, onClose, onClearError }: PinModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  }, [error]);

  const handleChange = (index: number, value: string) => {
    if (error && onClearError) onClearError();
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (error && onClearError) onClearError();
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (error && onClearError) onClearError();
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = () => {
    const pin = digits.join("");
    if (pin.length === 6) onConfirm(pin);
  };

  const pin = digits.join("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00A3C4] to-[#0284C7] flex items-center justify-center shadow-lg shadow-cyan-500/25 text-white">
            <Lock className="w-7 h-7" />
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-900 text-center mb-1">
          Authorize Transfer
        </h3>
        <p className="text-xs text-slate-500 text-center mb-6">
          Enter your 6-digit transaction PIN to complete this payment
        </p>

        {/* 6 PIN Boxes */}
        <div className="flex justify-between items-center gap-2 mb-5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                d
                  ? "border-[#00A3C4] bg-cyan-50/70 text-[#00A3C4] ring-2 ring-cyan-100"
                  : "border-slate-200 bg-slate-50 text-slate-800"
              } focus:border-[#00A3C4] focus:bg-cyan-50/70 focus:ring-2 focus:ring-cyan-200`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-xs border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={pin.length < 6 || loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#00A3C4] to-[#0284C7] hover:from-[#0891B2] hover:to-[#0369A1] shadow-md shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying PIN &amp; Transferring...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Confirm &amp; Transfer
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="w-full mt-2.5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Review</span>
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 1 — Form Step                                                         */
/* -------------------------------------------------------------------------- */

interface FormStepProps {
  accounts: any[];
  accountsLoading: boolean;
  sourceAccount: string;
  setSourceAccount: (val: string) => void;
  destinationAccount: string;
  setDestinationAccount: (val: string) => void;
  recipientName: string;
  setRecipientName: (val: string) => void;
  lookupLoading: boolean;
  lookupError: string;
  amount: string;
  setAmount: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  validationError: string;
  recentAccounts: string[];
  beneficiaries: Beneficiary[];
  transferLimits: TransferLimitInfo | null;
  onContinue: () => void;
  onCancel?: () => void;
}

function FormStep({
  accounts,
  accountsLoading,
  sourceAccount,
  setSourceAccount,
  destinationAccount,
  setDestinationAccount,
  recipientName,
  setRecipientName,
  lookupLoading,
  lookupError,
  amount,
  setAmount,
  description,
  setDescription,
  validationError,
  recentAccounts,
  beneficiaries = [],
  transferLimits = null,
  onContinue,
  onCancel,
}: FormStepProps) {
  const [recipientTab, setRecipientTab] = useState<"beneficiaries" | "manual">(
    beneficiaries.length > 0 && !destinationAccount ? "beneficiaries" : "manual"
  );

  const selectedAcc = accounts.find((a) => a.accountNumber === sourceAccount);
  const quickAmounts = [10000, 50000, 100000, 500000];

  const cleanDest = destinationAccount?.trim();
  const isBeneficiary = Boolean(
    cleanDest &&
      beneficiaries.some(
        (b) => b.beneficiaryAccountNumber?.trim() === cleanDest
      )
  );
  const effectiveOneTimeLimit = transferLimits
    ? isBeneficiary
      ? transferLimits.effectiveOneTimeLimitBeneficiary
      : transferLimits.effectiveOneTimeLimitStranger
    : null;
  const amountNum = Number(amount) || 0;
  const availBalance = selectedAcc ? Number(selectedAcc.availableBalance) : 0;
  const minBalance = transferLimits?.minimumBalance ?? 10000;
  const netAvailable = Math.max(0, availBalance - minBalance);

  const isOverOneTimeLimit = Boolean(
    transferLimits && effectiveOneTimeLimit && amountNum > effectiveOneTimeLimit
  );
  const isOverDailyLimit = Boolean(
    transferLimits && amountNum > transferLimits.remainingDailyLimit
  );
  const isInsufficientBalance = Boolean(
    selectedAcc && amountNum > netAvailable
  );
  const isAmountInvalid =
    !amount ||
    amountNum <= 0 ||
    isOverOneTimeLimit ||
    isOverDailyLimit ||
    isInsufficientBalance;

  const isFormInvalid = Boolean(
    accountsLoading ||
      lookupLoading ||
      !sourceAccount ||
      !cleanDest ||
      Boolean(lookupError) ||
      !recipientName ||
      isAmountInvalid ||
      sourceAccount === cleanDest
  );

  return (
    <div className="space-y-6">
      {/* 1. From Account Selector */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          From Account
        </label>
        {accountsLoading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> Loading your accounts...
          </div>
        ) : (
          <div className="space-y-2">
            <select
              value={sourceAccount}
              onChange={(e) => setSourceAccount(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#0f2445] border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm font-extrabold text-slate-900 dark:text-white focus:border-[#00A3C4] focus:bg-white dark:focus:bg-[#0f2445] focus:ring-2 focus:ring-cyan-500/20 outline-none transition cursor-pointer shadow-xs"
            >
              {accounts.length === 0 && <option value="">No active accounts</option>}
              {accounts.map((acc) => (
                <option key={acc.accountNumber} value={acc.accountNumber} disabled={acc.status !== "ACTIVE"}>
                  {acc.accountNumber} — {acc.accountType} ({Number(acc.availableBalance).toLocaleString()} MMK)
                  {acc.status !== "ACTIVE" ? ` [${acc.status}]` : ""}
                </option>
              ))}
            </select>

            {selectedAcc && (
              <div className="px-4 py-3.5 bg-gradient-to-r from-cyan-50/90 via-sky-50/60 to-slate-50/70 dark:from-[#0a1f3d] dark:via-[#0c2447] dark:to-[#0f2a52] rounded-2xl border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-between shadow-xs dark:shadow-md dark:shadow-cyan-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-200/80 dark:border-cyan-500/30 flex items-center justify-center text-[#00A3C4] dark:text-cyan-300 shrink-0 shadow-xs">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#007B99] dark:text-cyan-300">
                      Available to Transfer
                    </p>
                    <p className="text-base sm:text-lg font-black text-[#0A192F] dark:text-white tracking-tight">
                      {netAvailable.toLocaleString()} MMK
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                      Total Balance: <span className="font-bold text-slate-800 dark:text-white">{availBalance.toLocaleString()} MMK</span> • Min reserve: {minBalance.toLocaleString()} MMK
                    </p>
                  </div>
                </div>
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-[#007088] dark:text-cyan-300 border border-cyan-300/80 dark:border-cyan-400/40 shadow-xs">
                  {selectedAcc.accountType}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Recipient Selector (2-Tab Experience: Saved Contacts vs Direct Number) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Transfer To
          </label>
          {beneficiaries.length > 0 && (
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-[#0f2445] p-1 text-xs font-semibold border border-slate-200/70 dark:border-slate-700/80 shadow-xs">
              <button
                type="button"
                onClick={() => setRecipientTab("beneficiaries")}
                className={`px-3 py-1.5 rounded-lg transition font-bold ${
                  recipientTab === "beneficiaries"
                    ? "bg-white dark:bg-[#00A3C4] text-[#00A3C4] dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Saved Contacts ({beneficiaries.length})
              </button>
              <button
                type="button"
                onClick={() => setRecipientTab("manual")}
                className={`px-3 py-1.5 rounded-lg transition font-bold ${
                  recipientTab === "manual"
                    ? "bg-white dark:bg-[#00A3C4] text-[#00A3C4] dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Enter Account No
              </button>
            </div>
          )}
        </div>

        {/* Tab A: Saved Contacts (Beneficiaries Grid / Chips) */}
        {recipientTab === "beneficiaries" && beneficiaries.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {beneficiaries.map((b) => {
              const isSelected = destinationAccount === b.beneficiaryAccountNumber;
              const initial = (b.nickname || b.beneficiaryAccountName || "B")[0].toUpperCase();
              return (
                <button
                  key={b.beneficiaryId}
                  type="button"
                  onClick={() => {
                    const accNo = b.beneficiaryAccountNumber?.trim() || "";
                    setDestinationAccount(accNo);
                    if (b.nickname || b.beneficiaryAccountName) {
                      setRecipientName(b.nickname || b.beneficiaryAccountName);
                    }
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                    isSelected
                      ? "border-[#00A3C4] bg-cyan-50/70 shadow-sm ring-2 ring-cyan-100"
                      : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-cyan-300"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? "bg-[#00A3C4] text-white" : "bg-cyan-100 text-[#00A3C4]"
                    }`}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {b.nickname || b.beneficiaryAccountName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {b.beneficiaryAccountNumber}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Account Number Input */}
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            list="recent-destinations"
            value={destinationAccount}
            onChange={(e) => setDestinationAccount(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 10 to 16 digit recipient account number"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-[#00A3C4] focus:bg-white focus:ring-2 focus:ring-cyan-100 outline-none transition"
            maxLength={34}
            required
          />
          <datalist id="recent-destinations">
            {recentAccounts.map((acc, i) => (
              <option key={i} value={acc} />
            ))}
          </datalist>
        </div>

        {/* Recipient Verification Status Badge */}
        {lookupLoading && (
          <div className="flex items-center gap-2 mt-2 px-3.5 py-2 bg-cyan-50/80 border border-cyan-100 rounded-xl text-xs text-[#00A3C4] font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
            <span>Verifying recipient account with Core Banking...</span>
          </div>
        )}

        {!lookupLoading && recipientName && (
          <div className="mt-2 space-y-1.5">
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Recipient: <strong className="font-bold text-sm text-emerald-950">{recipientName}</strong>
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Verified Account
              </span>
            </div>

            {/* Anti-Scam / Limit Classification Badge */}
            {transferLimits && (
              <div
                className={`px-3 py-1.5 rounded-xl border text-[11px] flex items-center justify-between transition-all ${
                  isBeneficiary
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                    : "bg-amber-50/80 border-amber-200 text-amber-800"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isBeneficiary ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                  <span>
                    {isBeneficiary ? (
                      <strong>Saved Beneficiary</strong>
                    ) : (
                      <strong>New / Unsaved Account</strong>
                    )}
                  </span>
                </div>
                <span className="font-semibold text-[10px]">
                  Max One-Time: {effectiveOneTimeLimit?.toLocaleString()} MMK
                </span>
              </div>
            )}
          </div>
        )}

        {lookupError && !lookupLoading && (
          <div className="flex items-center gap-1.5 mt-2 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}
      </div>

      {/* 3. Amount Input with Comma Formatting and Quick Pills */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Transfer Amount
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={amount ? Number(amount).toLocaleString("en-US") : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              setAmount(raw);
            }}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 placeholder-slate-300 focus:border-[#00A3C4] focus:bg-white focus:ring-2 focus:ring-cyan-100 outline-none transition"
            required
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
            MMK
          </div>
        </div>

        {/* Quick Amount Chips */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
          {quickAmounts.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              className="px-2.5 py-1 bg-slate-100 hover:bg-cyan-50 hover:text-[#00A3C4] hover:border-cyan-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition shrink-0"
            >
              +{q.toLocaleString()}
            </button>
          ))}
          {selectedAcc && (
            <button
              type="button"
              onClick={() => setAmount(String(Math.floor(netAvailable)))}
              className="px-2.5 py-1 bg-cyan-50/70 text-[#00A3C4] border border-cyan-200 rounded-xl text-xs font-black transition shrink-0"
            >
              Max
            </button>
          )}
        </div>

        {/* Real-time Amount Limit Warnings & Guidance */}
        {amountNum > 0 && (isOverOneTimeLimit || isOverDailyLimit || isInsufficientBalance) && (
          <div className="mt-3 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs space-y-2 transition-all">
            {isOverOneTimeLimit && (
              <div>
                <div className="flex items-center gap-1.5 font-bold text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>
                    Transfer amount of {amountNum.toLocaleString()} MMK exceeds {isBeneficiary ? "beneficiary" : "stranger"} limit of {effectiveOneTimeLimit?.toLocaleString()} MMK.
                  </span>
                </div>
                {!isBeneficiary && transferLimits && (
                  <p className="text-[11px] text-slate-600 pl-5.5 leading-relaxed mt-1">
                    💡 <strong>Tip:</strong> Add this account to beneficiaries to transfer up to{" "}
                    <span className="font-bold text-slate-800">
                      {transferLimits.effectiveOneTimeLimitBeneficiary.toLocaleString()} MMK
                    </span>.
                  </p>
                )}
              </div>
            )}

            {isOverDailyLimit && (
              <div className="flex items-start gap-1.5 font-bold text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p>
                    Transfer exceeds your remaining daily limit of {transferLimits?.remainingDailyLimit.toLocaleString()} MMK.
                  </p>
                  <p className="text-[11px] font-normal text-slate-600 mt-0.5">
                    Transferred today: {transferLimits?.todayTransferredAmount.toLocaleString()} MMK
                  </p>
                </div>
              </div>
            )}

            {isInsufficientBalance && (
              <div className="flex items-start gap-1.5 font-bold text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p>
                    Insufficient balance. You must maintain a minimum reserve balance of {minBalance.toLocaleString()} MMK.
                  </p>
                  <p className="text-[11px] font-normal text-slate-600 mt-0.5">
                    Net available to transfer: {netAvailable.toLocaleString()} MMK (Total Balance: {availBalance.toLocaleString()} MMK)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Description / Note (Optional) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Note / Payment Purpose (Optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Project payment, rent, dinner split"
          maxLength={100}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-[#00A3C4] focus:bg-white focus:ring-2 focus:ring-cyan-100 outline-none transition"
        />
      </div>

      {/* General Validation Error (suppressed when already shown inline in Amount) */}
      {validationError && !isOverOneTimeLimit && !isOverDailyLimit && !isInsufficientBalance && (
        <div className="p-3.5 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 rounded-2xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition flex items-center justify-center gap-1.5"
          >
            <span>Cancel</span>
          </button>
        )}

        <button
          type="button"
          onClick={onContinue}
          disabled={isFormInvalid}
          className={`${onCancel ? "flex-[2]" : "w-full"} py-4 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 ${
            isFormInvalid
              ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              : "text-white bg-gradient-to-r from-[#00A3C4] to-[#0284C7] hover:from-[#0891B2] hover:to-[#0369A1] shadow-md shadow-cyan-500/25 cursor-pointer"
          }`}
        >
          <span>Proceed to Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 2 — Review & Confirmation Step                                        */
/* -------------------------------------------------------------------------- */

interface ReviewStepProps {
  sourceAccount: string;
  destinationAccount: string;
  recipientName: string;
  amount: number;
  description: string;
  onConfirm: () => void;
  onBack: () => void;
}

function ReviewStep({
  sourceAccount,
  destinationAccount,
  recipientName,
  amount,
  description,
  onConfirm,
  onBack,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Hero Confirmation Card */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="bg-gradient-to-br from-[#0A192F] to-[#153564] p-6 text-white text-center">
          <p className="text-xs uppercase font-extrabold text-cyan-200 tracking-wider mb-1">
            Review Transfer Amount
          </p>
          <p className="text-4xl font-black tracking-tight">{amount.toLocaleString()}</p>
          <p className="text-xs font-bold text-cyan-200 mt-1">Myanmar Kyat (MMK)</p>
        </div>

        {/* Transfer Pathway (Sender ➔ Recipient) */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
              From (Sender)
            </span>
            <p className="text-xs font-mono font-bold text-slate-800 truncate">
              {sourceAccount}
            </p>
          </div>

          <div className="w-8 h-8 rounded-full bg-cyan-100 text-[#00A3C4] flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
              To (Recipient)
            </span>
            <p className="text-xs font-bold text-slate-900 truncate">
              {recipientName || "Verified Account"}
            </p>
            <p className="text-[10px] font-mono text-slate-500 truncate">
              {destinationAccount}
            </p>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="p-5 divide-y divide-slate-100 text-xs">
          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500 font-medium">Payment Channel</span>
            <span className="font-bold text-slate-800">Mini Bank Portal</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500 font-medium">Service Fee</span>
            <span className="font-bold text-emerald-600">0.00 MMK (Free)</span>
          </div>
          {description && (
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 font-medium">Transfer Memo</span>
              <span className="font-semibold text-slate-800 italic">"{description}"</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 text-sm">
            <span className="font-bold text-slate-900">Total Debited Amount</span>
            <span className="font-black text-[#00A3C4] text-base">
              {amount.toLocaleString()} MMK
            </span>
          </div>
        </div>
      </div>

      {/* Security Assurance Notice */}
      <div className="p-3.5 bg-cyan-50/70/60 border border-cyan-100 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
        <Lock className="w-4 h-4 text-[#00A3C4] shrink-0 mt-0.5" />
        <p>
          This transaction is authenticated with 2-Factor Transaction PIN. Funds will be deposited instantly.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className="flex-[2] py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#00A3C4] to-[#0284C7] hover:from-[#0891B2] hover:to-[#0369A1] shadow-md shadow-cyan-500/25 transition flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4" />
          <span>Authorize &amp; Enter PIN</span>
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 3 — Real-World Official E-Receipt                                     */
/* -------------------------------------------------------------------------- */

interface ReceiptStepProps {
  result: any;
  recipientName?: string;
  onNewTransfer: () => void;
  onGoDashboard: () => void;
  isSavedBeneficiary: boolean;
  onSaveBeneficiary: () => Promise<void>;
  savingBeneficiary: boolean;
  beneficiarySaved: boolean;
}

function ReceiptStep({
  result,
  recipientName,
  onNewTransfer,
  onGoDashboard,
  isSavedBeneficiary,
  onSaveBeneficiary,
  savingBeneficiary,
  beneficiarySaved,
}: ReceiptStepProps) {
  const [copied, setCopied] = useState(false);

  const receiptData = React.useMemo(
    () => mapP2PResponseToReceiptData(result, recipientName),
    [result, recipientName]
  );

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = "";
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.transactionRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard write failures gracefully
    }
  };

  return (
    <TransferReceiptView
      data={receiptData}
      showQr={true}
      actions={
        <>

          {/* Quick Add to Beneficiary */}
          {!isSavedBeneficiary && (
            <button
              type="button"
              onClick={onSaveBeneficiary}
              disabled={savingBeneficiary}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs font-bold text-amber-800 hover:bg-amber-100 transition disabled:opacity-60"
            >
              {savingBeneficiary ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Saving to Beneficiaries...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-amber-600" />
                  <span>Add {recipientName || "Recipient"} to Saved Contacts</span>
                </>
              )}
            </button>
          )}

          {beneficiarySaved && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Added to Beneficiaries successfully!</span>
            </div>
          )}

          {/* Print & Copy Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Reference</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Receipt</span>
            </button>
          </div>

          {/* New Transfer */}
          <button
            type="button"
            onClick={onNewTransfer}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#00A3C4] to-[#0284C7] hover:from-[#0891B2] hover:to-[#0369A1] shadow-md shadow-cyan-500/25 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Make Another Transfer</span>
          </button>

          {/* Return to Dashboard */}
          <button
            type="button"
            onClick={onGoDashboard}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>
        </>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Main P2P Transfer Component with 2-Column Responsive Layout                */
/* -------------------------------------------------------------------------- */

type Step = "form" | "review" | "receipt";

export const P2PTransferForm = () => {
  const dispatch = useAppDispatch();
  const { loading, error, success, transactionResult } = useAppSelector((s) => s.transfer);
  const { accounts, loading: accountsLoading } = useAppSelector((s) => s.accounts);

  const [step, setStep] = useState<Step>("form");
  const [showPinModal, setShowPinModal] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const [sourceAccount, setSourceAccount] = useState("");
  const [destinationAccount, setDestinationAccount] = useState<string>(
    () => (location.state as any)?.destinationAccount || ""
  );
  const [recipientName, setRecipientName] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState("");
  const [recentAccounts, setRecentAccounts] = useState<string[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [savingBeneficiary, setSavingBeneficiary] = useState(false);
  const [beneficiarySaved, setBeneficiarySaved] = useState(false);
  const [transferLimits, setTransferLimits] = useState<TransferLimitInfo | null>(null);

  // Function to load and sync beneficiaries
  const loadBeneficiaries = () => {
    getBeneficiaries()
      .then((data) => {
        if (Array.isArray(data)) {
          setBeneficiaries(data);
        }
      })
      .catch(() => {});
  };

  // Load transfer limits and sync beneficiaries when sourceAccount changes
  useEffect(() => {
    if (sourceAccount) {
      getAccountTransferLimits(sourceAccount)
        .then(setTransferLimits)
        .catch(() => setTransferLimits(null));
      loadBeneficiaries();
    } else {
      setTransferLimits(null);
    }
  }, [sourceAccount]);

  // Load beneficiaries on mount and window focus (auto-sync if added in another tab/page)
  useEffect(() => {
    loadBeneficiaries();
    const handleFocus = () => loadBeneficiaries();
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Update destination account and sync beneficiaries if navigated with router state
  useEffect(() => {
    const dest = (location.state as any)?.destinationAccount;
    if (dest) {
      setDestinationAccount(dest);
      loadBeneficiaries();
    }
  }, [location.state]);

  // Clear bottom validation error as user modifies form inputs
  useEffect(() => {
    if (validationError) {
      setValidationError("");
    }
    if (error) {
      dispatch(clearTransferError());
    }
  }, [amount, destinationAccount, sourceAccount, error, dispatch]);

  const isSavedBeneficiary = Boolean(
    beneficiarySaved ||
      (transactionResult &&
        beneficiaries.some(
          (b) =>
            b.beneficiaryAccountNumber?.trim() ===
            transactionResult.destinationAccountNumber?.trim()
        ))
  );

  const handleSaveBeneficiary = async () => {
    if (!transactionResult) return;
    try {
      setSavingBeneficiary(true);
      const created = await addBeneficiary({
        beneficiaryAccountNumber: transactionResult.destinationAccountNumber,
        nickname: recipientName || undefined,
      });
      setBeneficiaries((prev) => [created, ...prev]);
      setBeneficiarySaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBeneficiary(false);
    }
  };

  // Auto-select first active account
  useEffect(() => {
    if (accounts.length > 0 && !sourceAccount) {
      const firstActive = accounts.find((a) => a.status === "ACTIVE") ?? accounts[0];
      setSourceAccount(firstActive.accountNumber);
    }
  }, [accounts, sourceAccount]);

  // Load recent accounts & reset transfer state
  useEffect(() => {
    dispatch(fetchMyAccounts());
    const saved = localStorage.getItem("recentDestinations");
    if (saved) setRecentAccounts(JSON.parse(saved));
    return () => {
      dispatch(resetTransferState());
    };
  }, [dispatch]);

  // Debounced recipient account lookup
  useEffect(() => {
    const acc = destinationAccount.trim();
    if (!acc || acc.length < 5) {
      setRecipientName("");
      setLookupError("");
      return;
    }

    // Check if it matches a known saved beneficiary immediately to prevent flicker
    const matchedBeneficiary = beneficiaries.find(
      (b) => b.beneficiaryAccountNumber?.trim() === acc
    );
    if (matchedBeneficiary) {
      setRecipientName(
        matchedBeneficiary.nickname ||
        matchedBeneficiary.beneficiaryAccountName ||
        ""
      );
      setLookupError("");
    } else {
      setRecipientName("");
      setLookupError("");
    }

    const timer = setTimeout(async () => {
      try {
        setLookupLoading(true);
        setLookupError("");
        const res = await lookupDestinationAccount(acc);
        if (res && res.accountName) {
          setRecipientName(res.accountName);
        } else {
          setLookupError("Account not found");
        }
      } catch (err: any) {
        if (!err.response) {
          setLookupError("Cannot connect to server. Please ensure backend is running.");
        } else if (err.response.status === 401) {
          setLookupError("Session expired. Please log in again.");
        } else {
          setLookupError(err.response?.data?.message || "Account not found or inactive.");
          if (!matchedBeneficiary) {
            setRecipientName("");
          }
        }
      } finally {
        setLookupLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [destinationAccount, beneficiaries]);

  // Step transition on success
  useEffect(() => {
    if (success && transactionResult) {
      setShowPinModal(false);
      setStep("receipt");
    }
  }, [success, transactionResult]);

  const saveDestination = (accNo: string) => {
    const updated = [accNo, ...recentAccounts.filter((a) => a !== accNo)].slice(0, 5);
    setRecentAccounts(updated);
    localStorage.setItem("recentDestinations", JSON.stringify(updated));
  };

  /* Validation */
  const handleContinue = () => {
    setValidationError("");
    if (!sourceAccount) return setValidationError("Please select a source account.");
    if (!destinationAccount.trim()) return setValidationError("Please enter a destination account number.");
    if (!/^\d+$/.test(destinationAccount)) return setValidationError("Destination account number must contain only numbers.");
    if (sourceAccount === destinationAccount) return setValidationError("Source and destination accounts cannot be the same.");
    if (lookupLoading) return setValidationError("Verifying destination account, please wait...");
    if (lookupError) return setValidationError(lookupError);
    if (!recipientName) return setValidationError("Please enter a valid destination account number.");
    if (!amount || Number(amount) < 1) return setValidationError("Minimum transfer amount is 1 MMK.");

    const transferNum = Number(amount);
    const selected = accounts.find((a) => a.accountNumber === sourceAccount);
    const minReserve = transferLimits?.minimumBalance ?? 10000;
    const maxTransferable = selected ? Math.max(0, Number(selected.availableBalance) - minReserve) : 0;
    if (selected && transferNum > maxTransferable) {
      return setValidationError(
        `Insufficient available funds. You must maintain a minimum balance of ${minReserve.toLocaleString()} MMK. Net available for transfer is ${maxTransferable.toLocaleString()} MMK.`
      );
    }
    if (transferLimits) {
      const isBeneficiary = beneficiaries.some(
        (b) => b.beneficiaryAccountNumber === destinationAccount
      );
      const effectiveOneTime = isBeneficiary
        ? transferLimits.effectiveOneTimeLimitBeneficiary
        : transferLimits.effectiveOneTimeLimitStranger;

      if (transferNum > effectiveOneTime) {
        if (!isBeneficiary) {
          return setValidationError(
            `Transfer amount of ${transferNum.toLocaleString()} MMK exceeds stranger one-time limit of ${effectiveOneTime.toLocaleString()} MMK. Add this account to beneficiaries to transfer up to ${transferLimits.effectiveOneTimeLimitBeneficiary.toLocaleString()} MMK.`
          );
        } else {
          return setValidationError(
            `Transfer amount of ${transferNum.toLocaleString()} MMK exceeds your one-time transfer limit of ${effectiveOneTime.toLocaleString()} MMK.`
          );
        }
      }

      if (transferNum > transferLimits.remainingDailyLimit) {
        return setValidationError(
          `Transfer exceeds your remaining daily limit of ${transferLimits.remainingDailyLimit.toLocaleString()} MMK. Transferred today: ${transferLimits.todayTransferredAmount.toLocaleString()} MMK.`
        );
      }
    }

    setStep("review");
  };

  /* PIN Confirmation */
  const handlePinConfirm = (pin: string) => {
    const payload: P2PTransferRequest = {
      sourceAccountNumber: sourceAccount,
      destinationAccountNumber: destinationAccount,
      amount: Number(amount),
      currency: "MMK",
      transactionPin: pin,
      description: description || undefined,
      idempotencyKey: crypto.randomUUID(),
    };

    dispatch(submitP2PTransfer(payload)).then((res: any) => {
      if (res.meta.requestStatus === "fulfilled") {
        saveDestination(destinationAccount);
        dispatch(fetchMyAccounts());
      }
      window.dispatchEvent(new Event("new-notification-event"));
    });
  };

  /* Reset */
  const handleReset = () => {
    setStep("form");
    setDestinationAccount("");
    setRecipientName("");
    setLookupError("");
    setAmount("");
    setDescription("");
    setValidationError("");
    setShowPinModal(false);
    setBeneficiarySaved(false);
    dispatch(resetTransferState());
    dispatch(fetchMyAccounts());
  };

  /* Cancel / Clear Form */
  const handleCancelForm = () => {
    if (destinationAccount || amount || description || validationError) {
      setDestinationAccount("");
      setRecipientName("");
      setLookupError("");
      setAmount("");
      setDescription("");
      setValidationError("");
      dispatch(clearTransferError());
    } else {
      navigate(-1);
    }
  };

  const selectedAcc = accounts.find((a) => a.accountNumber === sourceAccount);
  const availBalance = selectedAcc ? Number(selectedAcc.availableBalance) : 0;
  const transferAmountNum = Number(amount) || 0;
  const newBalancePreview = Math.max(0, availBalance - transferAmountNum);

  const isBeneficiarySelected = Boolean(
    destinationAccount?.trim() &&
      beneficiaries.some(
        (b) => b.beneficiaryAccountNumber?.trim() === destinationAccount.trim()
      )
  );

  return (
    <>
      {/* PIN Modal */}
      {showPinModal && (
        <PinModal
          loading={loading}
          error={error}
          onConfirm={handlePinConfirm}
          onClearError={() => dispatch(clearTransferError())}
          onClose={() => {
            if (!loading) {
              setShowPinModal(false);
              dispatch(resetTransferState());
            }
          }}
        />
      )}

      {/* When in Receipt Step: Render Standalone Official E-Receipt */}
      {step === "receipt" && transactionResult ? (
        <ReceiptStep
          result={transactionResult}
          recipientName={recipientName}
          onNewTransfer={handleReset}
          onGoDashboard={() => navigate("/dashboard")}
          isSavedBeneficiary={isSavedBeneficiary}
          onSaveBeneficiary={handleSaveBeneficiary}
          savingBeneficiary={savingBeneficiary}
          beneficiarySaved={beneficiarySaved}
        />
      ) : (
        /* 2-Column Responsive Layout for Step 1 & Step 2 */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Left Column (Step Wizard Form) */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200">
            {/* Header with Visual Stepper */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00A3C4] to-[#0284C7] flex items-center justify-center text-white shadow-md shadow-cyan-500/25 shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {step === "review" ? "Review Transfer Details" : "Internal P2P Fund Transfer"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {step === "form"
                      ? "Instant, secure transfer to any account"
                      : "Confirm transfer details before PIN authorization"}
                  </p>
                </div>
              </div>

              {/* Stepper Pills */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                    step === "form"
                      ? "bg-[#00A3C4] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Setup</span>
                </span>
                <span className="text-slate-300 font-bold">➔</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                    step === "review"
                      ? "bg-[#00A3C4] text-white shadow-sm"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Review &amp; PIN</span>
                </span>
              </div>
            </div>

            {/* Step 1: Form */}
            {step === "form" && (
              <FormStep
                accounts={accounts}
                accountsLoading={accountsLoading}
                sourceAccount={sourceAccount}
                setSourceAccount={setSourceAccount}
                destinationAccount={destinationAccount}
                setDestinationAccount={setDestinationAccount}
                recipientName={recipientName}
                setRecipientName={setRecipientName}
                lookupLoading={lookupLoading}
                lookupError={lookupError}
                amount={amount}
                setAmount={setAmount}
                description={description}
                setDescription={setDescription}
                validationError={validationError}
                recentAccounts={recentAccounts}
                beneficiaries={beneficiaries}
                transferLimits={transferLimits}
                onContinue={handleContinue}
                onCancel={handleCancelForm}
              />
            )}

            {/* Step 2: Review */}
            {step === "review" && (
              <ReviewStep
                sourceAccount={sourceAccount}
                destinationAccount={destinationAccount}
                recipientName={recipientName}
                amount={Number(amount)}
                description={description}
                onConfirm={() => setShowPinModal(true)}
                onBack={() => setStep("form")}
              />
            )}
          </div>

          {/* Right Column: Live Summary & Safety Monitor */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-24">
            {/* Live Calculation Preview Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-[#00A3C4]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Transfer Summary
                </h3>
              </div>

              {/* Source Account Overview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Source Account</span>
                  <span className="font-mono font-bold text-slate-800">
                    {sourceAccount ? maskAccount(sourceAccount) : "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Current Balance</span>
                  <span className="font-bold text-slate-800">{formatMMK(availBalance)}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2">
                  <span className="text-slate-500 font-medium">Transfer Amount</span>
                  <span className="font-black text-[#00A3C4]">
                    -{formatMMK(transferAmountNum)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2">
                  <span className="text-slate-700 font-bold">Balance After Transfer</span>
                  <span className="font-black text-slate-900">
                    {formatMMK(newBalancePreview)}
                  </span>
                </div>
              </div>

              {/* Multi-Tier Transfer Limit Monitor */}
              {transferLimits && (
                <div className="p-3.5 rounded-2xl bg-cyan-50/70/50 border border-cyan-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#00A3C4]" />
                      Today's Limit Usage
                    </span>
                    <span className="font-bold text-[#00A3C4]">
                      {Math.min(
                        100,
                        Math.round(
                          (transferLimits.todayTransferredAmount /
                            Math.max(1, transferLimits.effectiveDailyLimit)) *
                            100
                        )
                      )}
                      %
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-cyan-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00A3C4] rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (transferLimits.todayTransferredAmount /
                              Math.max(1, transferLimits.effectiveDailyLimit)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Transferred: {formatMMK(transferLimits.todayTransferredAmount)}</span>
                    <span className="font-bold text-slate-700">
                      Remaining: {formatMMK(transferLimits.remainingDailyLimit)}
                    </span>
                  </div>
                </div>
              )}

              {/* Real-time Anti-Fraud / Beneficiary Badge */}
              <div
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                  isBeneficiarySelected
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isBeneficiarySelected ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>
                    {isBeneficiarySelected
                      ? "Saved Beneficiary (High Limit)"
                      : "Standard / Unsaved Payee Limit"}
                  </span>
                </div>
              </div>
            </div>

            {/* Instant Banking Guarantee */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 text-xs text-slate-500 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Instant Settlement Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Internal P2P transactions are executed in real time 24/7 with zero waiting time and encrypted end-to-end.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
