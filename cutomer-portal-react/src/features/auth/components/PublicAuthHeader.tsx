import { ShieldCheck } from "lucide-react";
import { AuthWordmark } from "./IndividualAuthUI";

function PublicAuthHeader() {
  return (
    <header className="border-b border-slate-200/70 bg-white">
      <div className="mx-auto flex min-h-[76px] max-w-[1280px] items-center justify-between gap-4 px-5 md:px-8">
        <div className="flex items-center gap-4">
          <AuthWordmark />
          <span className="hidden border-l border-slate-200 pl-4 text-xs text-slate-400 sm:block">
            Customer Portal
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/60 px-2.5 py-1.5 text-[10px] font-semibold text-[#123B72] sm:px-3 sm:text-xs">
            <ShieldCheck aria-hidden="true" size={14} />
            <span className="hidden sm:inline">Secure banking</span>
            <span className="sm:hidden">Secure</span>
          </span>
          <p className="hidden text-xs text-slate-400 lg:block">
            Need assistance? <span className="font-medium text-[#08295C]">Contact your bank</span>
          </p>
        </div>
      </div>
    </header>
  );
}
export default PublicAuthHeader;
