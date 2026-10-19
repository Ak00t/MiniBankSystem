import { useEffect, type FC } from "react";
import { AlertTriangle, X } from "lucide-react";

interface StatementErrorModalProps {
  isOpen: boolean;
  error: string | null;
  onClose: () => void;
}

export const StatementErrorModal: FC<StatementErrorModalProps> = ({
  isOpen,
  error,
  onClose,
}) => {
  // ESC key dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !error) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="statement-error-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0878E8]/20"
          aria-label="Close error dialog"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Warning Icon Badge */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
            <AlertTriangle size={28} />
          </div>

          <h3
            id="statement-error-title"
            className="text-lg font-bold text-slate-900"
          >
            Validation Error
          </h3>

          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {error}
          </p>

          {/* Action Button */}
          <div className="mt-6 w-full">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[#0878E8] py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#0878E8] focus:ring-offset-2"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
