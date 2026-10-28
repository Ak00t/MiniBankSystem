import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Building2, ChartNoAxesCombined, ShieldCheck, UsersRound } from "lucide-react";
import { EkarajAuthLayout } from "../../auth/components/EkarajAuthLayout";
import { ekarajPrimaryButtonClass } from "../../auth/components/EkarajAuthStyles";
import { loginCorporate } from "../api/auth";
import { CorporateField, CorporateNotice } from "../components/CorporateForm";
import { useCorporateAction } from "../hooks/useCorporateAction";
import { hasCorporateSession } from "../utils/storage";

// Presentation overrides stay on this page; CorporateField retains its native input behavior.
const corporateLoginFormClass =
  "space-y-1.5 md:[@media(max-height:700px)]:space-y-1 [&_label]:mb-1 md:[@media(max-height:700px)]:[&_label]:mb-0.5 md:[@media(max-height:700px)]:[&>[role=alert]]:py-1 md:[@media(max-height:700px)]:[&>[role=alert]]:leading-[18px] [&_label]:text-[#1A365D] [&_input]:border-[#CDD5DF] [&_input]:text-[#111418] [&_input]:transition-colors [&_input]:placeholder:text-[#757575] [&_input]:hover:border-[#C6A15B] [&_input]:focus:border-[#113E65] [&_input]:focus:ring-[#113E65]/15 [&_input]:disabled:bg-[#E5EAF0] [&_input]:disabled:text-[#757575] [&_input]:motion-reduce:transition-none [&_svg]:text-[#757575] [&_button[type=button]]:hover:text-[#122E52] [&_button[type=button]]:focus-visible:ring-[#113E65]";
const corporateLoginLinkClass =
  "rounded-md font-semibold text-[#122E52] underline underline-offset-4 decoration-[#C6A15B] transition-colors hover:text-[#1A365D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#113E65] motion-reduce:transition-none";

export default function CorporateLoginPage() {
  const [company, setCompany] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  // Match Individual Login: discourage initial autofill, unlock each field on focus.
  const [companyEditable, setCompanyEditable] = useState(false);
  const [userEditable, setUserEditable] = useState(false);
  const [passwordEditable, setPasswordEditable] = useState(false);
  const action = useCorporateAction();
  const navigate = useNavigate();
  if (hasCorporateSession()) return <Navigate to="/corporate/auth-success" replace />;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!company.trim()) { action.setError("Company Customer ID is required."); return; }
    if (!user.trim()) { action.setError("Corporate User ID is required."); return; }
    if (!password.trim()) { action.setError("Password is required."); return; }
    void action.run(async () => {
      try {
        await loginCorporate({ companyCustomerCode: company.trim(), corporateUserCode: user.trim(), password });
        await navigate("/corporate/otp");
      } finally { setPassword(""); }
    });
  }

  return (
    <EkarajAuthLayout
      title="EKARAJ BANK | Corporate Login"
      portalLabel="EKARAJ BANK | Corporate Portal"
      securityLabel="Secure Corporate Banking"
    >
      <section aria-label="Corporate login card" className="grid w-full max-w-[976px] rounded-3xl border border-[#CDC0A8] bg-[#F5F3EF] shadow-[0_18px_50px_-26px_rgba(18,46,82,0.3)] md:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden rounded-l-[23px] bg-[#E5EAF0] text-[#1A365D] md:flex">
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-[75%] w-full">
            <img data-corporate-building src="/assets/ekaraj-building-reference.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[65%_top] opacity-80 [mask-image:linear-gradient(to_bottom,transparent_0%,#000_12%,#000_100%)]" />
            <div data-corporate-building-branding className="absolute right-[15%] top-[29%] flex w-[124px] flex-col items-center gap-0.5 text-[#122E52]">
              <img src="/assets/ekaraj-crown-transparent.png" alt="" width={375} height={340} className="h-8 w-auto object-contain" />
              <span className="text-[11px] font-semibold leading-4 tracking-[0.08em]">EKARAJ BANK</span>
            </div>
          </div>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 450 470" preserveAspectRatio="none" fill="none" className="pointer-events-none absolute inset-0 h-full w-full">
            <path d="M-70 85C95 35 120 300 330 285S500 215 520 150" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.35" />
            <path d="M-80 105C80 55 135 325 340 305S510 235 530 175" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.2" />
          </svg>
          <div className="relative px-6 pt-4 lg:px-7">
            <h2 className="font-serif text-[28px] font-medium leading-9 tracking-tight">Empower Your Business.<br />Bank with Confidence.</h2>
            <p className="mt-2 text-sm leading-5 text-[#59697D]">Securely access your company's banking services and stay connected with EKARAJ BANK.</p>
          </div>
          <div className="relative space-y-2.5 px-6 pb-4 pt-2 before:pointer-events-none before:absolute before:inset-x-0 before:-top-4 before:bottom-0 before:bg-[linear-gradient(90deg,rgba(229,234,240,0.97)_0%,rgba(229,234,240,0.90)_60%,rgba(229,234,240,0)_100%)] before:[mask-image:linear-gradient(to_bottom,transparent_0%,#000_18%,#000_100%)] [&>div]:relative lg:px-7">
            {[
              { icon: ShieldCheck, title: "Secure Corporate Access", description: "Your business, our priority." },
              { icon: UsersRound, title: "Multi-User Management", description: "Control and monitor with ease." },
              { icon: ChartNoAxesCombined, title: "Trusted Corporate Banking", description: "Stronger businesses, brighter futures." },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-[#C6A15B]" />
                <div>
                  <p className="text-xs font-semibold leading-4">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#59697D]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
        <section aria-label="Corporate banking login" className="flex min-w-0 items-center px-5 py-2 sm:px-8 md:px-7 lg:px-9 md:[@media(max-height:700px)]:px-6">
          <div className="mx-auto w-full max-w-[392px] md:[@media(max-height:700px)]:max-w-none">
            <div className="mb-1.5 text-center md:[@media(max-height:700px)]:mb-1">
              <span aria-hidden="true" className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-full border border-[#C6D5E3] bg-[#EAF2FA] text-[#113E65] md:[@media(max-height:700px)]:mb-0.5 md:[@media(max-height:700px)]:h-9 md:[@media(max-height:700px)]:w-9">
                <UsersRound size={24} strokeWidth={1.8} />
              </span>
              <h1 className="font-serif text-2xl font-medium leading-8 tracking-tight text-[#1A365D]">Corporate Login</h1>
              <p className="mt-0.5 text-sm leading-5 text-[#59697D] md:[@media(max-height:700px)]:leading-[18px]">Login securely using your Company Customer ID and Corporate User ID to access your corporate banking services.</p>
            </div>
            <form onSubmit={submit} autoComplete="off" noValidate className={corporateLoginFormClass}>
              <div className="relative [&>div>div>svg]:hidden">
                <CorporateField id="corporate-company" label="Company Customer ID" value={company} onChange={e => setCompany(e.target.value)} disabled={action.busy} required autoComplete="off" readOnly={!companyEditable} onFocus={() => setCompanyEditable(true)} placeholder="Enter Company Customer ID" />
                <Building2 aria-hidden="true" size={18} className="pointer-events-none absolute bottom-[13px] left-4 text-[#757575]" />
              </div>
              <CorporateField id="corporate-user" label="Corporate User ID" value={user} onChange={e => setUser(e.target.value)} disabled={action.busy} required autoComplete="off" readOnly={!userEditable} onFocus={() => setUserEditable(true)} placeholder="Enter Corporate User ID" />
              <CorporateField id="corporate-password" label="Password" secret value={password} onChange={e => setPassword(e.target.value)} disabled={action.busy} required autoComplete="new-password" readOnly={!passwordEditable} onFocus={() => setPasswordEditable(true)} placeholder="Enter your password" />
              <CorporateNotice error message={action.error} />
              <button type="submit" disabled={action.busy} aria-busy={action.busy} data-variant="login" className={ekarajPrimaryButtonClass}>
                {action.busy && <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#122E52]/25 border-t-[#122E52] motion-reduce:animate-none" />}
                {action.busy ? "Please wait..." : "Login"}
              </button>
            </form>
            <div className="mt-1.5 space-y-1 text-center text-xs leading-5 text-[#59697D] md:[@media(max-height:700px)]:mt-1 md:[@media(max-height:700px)]:space-y-0 md:[@media(max-height:700px)]:leading-4">
              <p>Personal Banking? <Link to="/login" className={corporateLoginLinkClass}>Individual Customer Login</Link></p>
              <p>Need assistance? <span className="font-semibold text-[#122E52]">Contact your bank</span></p>
            </div>
            <div className="mt-1.5 flex items-start gap-2.5 rounded-xl border border-[#C6D5E3] bg-[#EAF2FA] p-2 md:[@media(max-height:700px)]:mt-1 md:[@media(max-height:700px)]:p-1.5">
              <ShieldCheck aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-[#113E65]" />
              <div>
                <p className="text-xs font-semibold leading-4 text-[#1A365D]">Your security comes first</p>
                <p className="mt-0.5 text-xs leading-4 text-[#59697D]">For your security, never share your password or OTP with anyone.</p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </EkarajAuthLayout>
  );
}
