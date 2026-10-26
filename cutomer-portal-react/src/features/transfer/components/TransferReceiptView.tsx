import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  QrCode,
  X,
  ArrowRight,
} from "lucide-react";
import { QRCodeView } from "../../../components/common/QRCodeView";
import { EkararjCrown } from "../../../components/common/EkararjLogo";
import type { TransferReceiptViewProps } from "../types/transferReceiptTypes";

const maskAccount = (accNo?: string | null): string => {
  if (!accNo || accNo.length < 4) return accNo || "-";
  return `**** ${accNo.slice(-4)}`;
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
    const d = new Date(data.completedAt);
    const dateStr = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr}, ${timeStr}`;
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
        `EKARARJ BANK OFFICIAL RECEIPT`,
        `Ref ID: ${data.transactionRef}`,
        `Amount: ${Number(data.amount).toLocaleString()} ${data.currency || "MMK"}`,
        `Sender: ${maskAccount(data.sourceAccountNumber)}`,
        `Recipient: ${data.destinationDisplayName || "Recipient"} (${maskAccount(data.destinationAccountNumber)})`,
        `Date: ${completedDate}`,
        `Status: ${data.status || "COMPLETED"}`,
      ].join("\n"),
    [data, completedDate]
  );

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
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#00A3C4] flex items-center justify-center mx-auto mb-3">
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
                <strong>Bank:</strong> EKARARJ BANK
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
        className={`print-receipt-container max-w-xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative ${className}`}
      >
        {/* Printable/Shareable Receipt Slip Body */}
        <div id="receipt-capture-area" className="relative bg-white overflow-hidden">
          {/* Background Security Watermark (Center of Slip, 7% opacity) */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-0 select-none"
            aria-hidden="true"
          >
            <img
              src="/ekararj-crown-transparent.png"
              alt=""
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain opacity-[0.07] grayscale contrast-125 select-none"
            />
          </div>

        {/* Official Bank Header: EKARARJ BANK with Official Receipt directly below */}
        <div className="bg-[#08295C] px-6 py-4 text-white flex items-center justify-between border-b border-blue-900/50 relative z-10">
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-white leading-tight">
              EKARARJ BANK
            </h2>
            <p className="text-[10px] text-blue-200 font-semibold tracking-wider uppercase mt-0.5">
              Official Receipt
            </p>
          </div>

          <div className="flex items-center shrink-0">
            <EkararjCrown size={36} className="drop-shadow-md" />
          </div>
        </div>

        {/* Hero Section: Status & Amount */}
        <div className="bg-white/95 px-6 pt-5 pb-3 text-center relative z-10">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs shadow-emerald-500/40 shrink-0">
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            </div>
            <span className="text-emerald-600 font-black text-base sm:text-lg tracking-tight">
              Payment Successful
            </span>
          </div>

          <div>
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              {Number(data.amount).toLocaleString()} {data.currency || "MMK"}
            </p>
          </div>
        </div>

        {/* FROM ➔ TO Transfer Pathway Card */}
        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 relative z-10">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            {/* Header: FROM  →  TO */}
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3">
              <span className="text-slate-500 font-extrabold">FROM</span>
              <div className="w-6 h-6 rounded-full bg-cyan-50 border border-cyan-200/80 flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 text-[#00A3C4]" />
              </div>
              <span className="text-slate-500 font-extrabold">TO</span>
            </div>

            {/* Accounts Row */}
            <div className="grid grid-cols-2 gap-4 text-left items-start">
              {/* Sender */}
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  {data.sourceDisplayName || "My Account"}
                </p>
                <p className="text-xs font-bold text-slate-600 truncate">
                  {maskAccount(data.sourceAccountNumber)}
                </p>
              </div>

              {/* Recipient */}
              <div className="text-right space-y-0.5 min-w-0">
                <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  {data.destinationDisplayName || "Recipient"}
                </p>
                <p className="text-xs font-bold text-slate-600 truncate">
                  {maskAccount(data.destinationAccountNumber)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details (8 Rows with Date & Time in "26 Oct 2026, 15:59" format) */}
        <div className="px-6 pt-3.5 pb-2.5 bg-white/95 border-b border-slate-100 relative z-10">
          <div className="border-b border-slate-200/80 pb-2 mb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Transaction Details
            </h4>
          </div>

          <div className="divide-y divide-slate-100 text-xs sm:text-[13px]">
            {/* 1. Transaction ID */}
            <div className="flex items-center justify-between py-2.5 gap-3">
              <span className="text-slate-600 font-semibold shrink-0">Transaction ID</span>
              <div className="flex items-center justify-end gap-1.5 min-w-0 max-w-[65%]">
                <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md truncate">
                  {data.transactionRef}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-cyan-600 transition p-1 shrink-0"
                  title="Copy Transaction ID"
                  aria-label="Copy Transaction ID"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* 2. Date & Time */}
            <div className="flex items-center justify-between py-2.5 gap-3">
              <span className="text-slate-600 font-semibold shrink-0">Date &amp; Time</span>
              <span className="font-bold text-slate-900 text-right truncate">
                {completedDate}
              </span>
            </div>

            {/* 3. Transfer Type */}
            <div className="flex items-center justify-between py-2.5 gap-3">
              <span className="text-slate-600 font-semibold shrink-0">Transfer Type</span>
              <span className="font-bold text-slate-900 text-right truncate">
                Internal Fund Transfer
              </span>
            </div>

            {/* 4. Transfer Amount */}
            <div className="flex items-center justify-between py-2.5 gap-3">
              <span className="text-slate-600 font-semibold shrink-0">Transfer Amount</span>
              <span className="font-bold text-slate-900 text-right truncate">
                {Number(data.amount).toLocaleString()} {data.currency || "MMK"}
              </span>
            </div>

            {/* 5. Service Fee */}
            <div className="flex items-center justify-between py-2.5 gap-3">
              <span className="text-slate-600 font-semibold shrink-0">Service Fee</span>
              <span className="font-bold text-emerald-600 text-right truncate">
                {Number(data.serviceFee || 0) === 0
                  ? "0.00 MMK"
                  : `${Number(data.serviceFee).toLocaleString()} ${data.currency || "MMK"}`}
              </span>
            </div>

            {/* 6. Total Debited */}
            <div className="flex items-center justify-between py-2.5 gap-3 border-t border-slate-100">
              <span className="text-slate-800 font-bold shrink-0">Total Debited</span>
              <span className="font-black text-slate-900 text-sm sm:text-base text-right truncate">
                {Number(
                  data.totalDebitedAmount != null ? data.totalDebitedAmount : data.amount
                ).toLocaleString()}{" "}
                {data.currency || "MMK"}
              </span>
            </div>

            {/* 7. Status (Vibrant Emerald Badge) */}
            <div className="flex items-center justify-between py-2.5 gap-3">
              <span className="text-slate-600 font-semibold shrink-0">Status</span>
              <span className="inline-flex items-center gap-1.5 font-black text-white bg-emerald-500 px-3 py-0.5 rounded-full shadow-xs shadow-emerald-500/30 text-xs shrink-0 tracking-wide">
                <Check className="w-3 h-3 stroke-[3]" />
                {data.status || "COMPLETED"}
              </span>
            </div>

            {/* 8. Memo */}
            <div className="flex items-center justify-between py-2.5 gap-3">
              <span className="text-slate-600 font-semibold shrink-0">Memo</span>
              <span className="font-semibold text-slate-900 italic text-right truncate max-w-[65%]">
                {data.description ? `"${data.description}"` : "P2P Fund Transfer"}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Integrated Transaction QR Section */}
        {showQr && (
          <div className="py-2.5 px-6 border-b border-slate-100 flex flex-col items-center justify-center text-center relative z-10 bg-slate-50/50">
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <QrCode className="w-3 h-3 text-[#00A3C4]" />
                <span>Transaction QR</span>
              </div>

              <div
                onClick={() => setShowQrModal(true)}
                className="cursor-pointer transition transform hover:scale-105 p-1 bg-white rounded-lg border border-slate-200/90 shadow-2xs my-0.5"
                title="Click to enlarge QR"
              >
                <QRCodeView value={qrPayload} size={84} />
              </div>

              <p className="text-[10px] font-medium text-slate-400 leading-none">
                Scan to verify transaction
              </p>
            </div>
          </div>
        )}
        </div>

        {/* Action Toolbar */}
        {actions && (
          <div className="no-print px-6 pt-3 pb-5 bg-white space-y-2 relative z-10">
            {actions}
          </div>
        )}
      </div>
    </>
  );
}
