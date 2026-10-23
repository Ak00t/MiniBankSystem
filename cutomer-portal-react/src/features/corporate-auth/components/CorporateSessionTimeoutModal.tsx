import { Clock3, ShieldAlert } from "lucide-react";
import { AuthWordmark } from "../../auth/components/IndividualAuthUI";
import { authPrimaryButtonClass } from "../../auth/components/IndividualAuthStyles";

export default function CorporateSessionTimeoutModal({ message, onLoginAgain }: { message: string; onLoginAgain: () => void }) {
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#041b3c]/70 backdrop-blur-sm">
    <div className="flex min-h-full items-center justify-center px-4 py-6">
      <div role="alertdialog" aria-modal="true" aria-labelledby="corporate-timeout-title" aria-describedby="corporate-timeout-message" className="w-full max-w-md rounded-[28px] border border-white/80 bg-white p-6 text-center text-[#08295C] shadow-[0_24px_80px_-32px_rgba(8,41,92,0.38)] sm:p-8">
        <div className="mb-5 flex justify-center"><AuthWordmark /></div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] ring-4 ring-blue-50/40"><Clock3 aria-hidden="true" size={28} /></div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#123B72]"><ShieldAlert aria-hidden="true" size={14} />Security Timeout</div>
        <h2 id="corporate-timeout-title" className="text-2xl font-bold">Session Timed Out</h2>
        <p id="corporate-timeout-message" className="mt-3 text-sm leading-5 text-slate-500">{message}</p>
        <p className="mt-2 text-sm leading-5 text-slate-500">Please login again to continue using ACE Bank securely.</p>
        <button autoFocus type="button" onClick={onLoginAgain} className={`mt-5 ${authPrimaryButtonClass}`}>Login Again</button>
      </div>
    </div>
  </div>;
}
