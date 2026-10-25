import { useState, useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  X,
} from "lucide-react";
import { QRCodeView } from "../../../components/common/QRCodeView";
import type { TransferReceiptViewProps } from "../types/transferReceiptTypes";

const maskAccount = (accNo?: string | null): string => {
  if (!accNo || accNo.length < 4) return accNo || "-";
  return `••••  ••••  ${accNo.slice(-4)}`;
};

export default function TransferReceiptView({
  data,
  showQr = true,
  actions,
  onCopyReference,
  className = "",
}: TransferReceiptViewProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  const completedDate = useMemo(() => {
    if (!data.completedAt) return "";
    return new Date(data.completedAt).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [data.completedAt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.transactionRef);
      setCopied(true);
      onCopyReference?.();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard write failures gracefully
    }
  };

  // Neutral transaction QR payload formatted cleanly for mobile cameras
  const qrPayload = useMemo(
    () =>
      [
        `MINI BANK TRANSACTION RECEIPT`,
        `Ref ID: ${data.transactionRef}`,
        `Amount: ${Number(data.amount).toLocaleString()} ${data.currency || "MMK"}`,
        `Sender: ${maskAccount(data.sourceAccountNumber)}`,
        `Recipient: ${data.destinationDisplayName || "Recipient"} (${maskAccount(data.destinationAccountNumber)})`,
        `Date: ${completedDate}`,
        `Status: ${data.status || "COMPLETED"}`,
      ].join("\n"),
    [data, completedDate]
  );

  const fromLabel = data.isOwnAccount
    ? "From: Own Account"
    : data.direction === "IN"
      ? "From (Sender)"
      : "From (Sender)";

  const toLabel = data.isOwnAccount
    ? "To: Own Account"
    : data.direction === "IN"
      ? "To (Your Account)"
      : "To (Recipient)";

  const amountSign =
    data.direction === "IN" ? "+" : data.direction === "OUT" ? "-" : "";

  return (
    <>
      {/* Transaction QR Modal */}
      {showQr && showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowQrModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Encoded Transaction Details
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Scan this QR with any device to view encoded transaction details.
            </p>

            <div className="flex justify-center mb-4">
              <QRCodeView value={qrPayload} size={160} />
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-[11px] font-mono text-left text-slate-600 space-y-1 border border-slate-100">
              <p>
                <strong>Bank:</strong> Mini Bank
              </p>
              <p>
                <strong>Ref ID:</strong> {data.transactionRef}
              </p>
              <p>
                <strong>Status:</strong> {data.status || "COMPLETED"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Official Banking E-Receipt Card */}
      <div
        className={`print-receipt-container max-w-xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden ${className}`}
      >
        {/* Official Bank Header */}
        <div className="bg-[#08295C] px-6 py-4 text-white flex items-center justify-between border-b border-blue-900/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase text-white">
                Mini Bank
              </h2>
              <p className="text-[10px] text-blue-200 font-medium">
                Official Electronic Transfer Receipt
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-800/60 text-blue-200 border border-blue-700/50">
              {data.badgeLabel || "P2P TRANSFER"}
            </span>
            <p className="text-[10px] text-blue-300 mt-1">{completedDate}</p>
          </div>
        </div>

        {/* Transfer Status Banner (White Background with Green Checkmark) */}
        <div className="bg-white px-6 py-4 text-center border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-emerald-50 border border-emerald-200/80 rounded-full mb-2 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Successful</h3>

          <div className="mt-2 inline-block bg-slate-50 border border-slate-200/70 px-5 py-1.5 rounded-2xl">
            <p className="text-3xl font-black tracking-tight text-slate-900">
              {amountSign ? `${amountSign} ` : ""}
              {Number(data.amount).toLocaleString()}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              {data.currency || "MMK"}
            </p>
          </div>
        </div>

        {/* Two-Party Visual Transfer Path */}
        <div className="p-3.5 bg-slate-50/70 border-b border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            {/* Sender Box */}
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                {fromLabel}
              </span>
              <p className="text-xs font-mono font-bold text-slate-800 truncate">
                {maskAccount(data.sourceAccountNumber)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {data.sourceDisplayName || "Mini Bank Account"}
              </p>
            </div>

            {/* Recipient Box */}
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                {toLabel}
              </span>
              <p className="text-xs font-bold text-slate-900 truncate">
                {data.destinationDisplayName || "Verified Account"}
              </p>
              <p className="text-[11px] font-mono font-bold text-slate-800 mt-0.5 truncate">
                {maskAccount(data.destinationAccountNumber)}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="px-6 py-3 divide-y divide-slate-100 text-xs">
          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500 font-medium">Transaction Reference</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                {data.transactionRef}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-slate-400 hover:text-blue-600 transition p-1"
                title="Copy Reference ID"
                aria-label="Copy transaction reference"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500 font-medium">Transfer Amount</span>
            <span className="font-bold text-slate-800">
              {Number(data.amount).toLocaleString()} {data.currency || "MMK"}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500 font-medium">Service Fee</span>
            <span className="font-bold text-emerald-600">
              {Number(data.serviceFee || 0).toLocaleString()} {data.currency || "MMK"}
            </span>
          </div>

          {data.totalDebitedAmount != null && (
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 font-medium">Total Debited</span>
              <span className="font-black text-rose-600 text-sm">
                - {Number(data.totalDebitedAmount).toLocaleString()}{" "}
                {data.currency || "MMK"}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500 font-medium">Status</span>
            <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {data.status || "COMPLETED"}
            </span>
          </div>

          {data.description && (
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 font-medium">Transfer Memo</span>
              <span className="font-semibold text-slate-700 italic">"{data.description}"</span>
            </div>
          )}
        </div>

        {/* Transaction QR Code Section */}
        {showQr && (
          <div className="mx-5 mb-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-slate-800">Transaction QR</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Scan to view encoded transaction details.
              </p>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="no-print mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                <span>Inspect encoded details</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div
              onClick={() => setShowQrModal(true)}
              className="cursor-pointer transition transform hover:scale-105 shrink-0"
              title="Click to enlarge QR"
            >
              <QRCodeView value={qrPayload} size={76} />
            </div>
          </div>
        )}

        {/* Action Toolbar (hidden on print) */}
        {actions && (
          <div className="no-print p-5 bg-white border-t border-slate-100 space-y-2.5">
            {actions}
          </div>
        )}
      </div>
    </>
  );
}
