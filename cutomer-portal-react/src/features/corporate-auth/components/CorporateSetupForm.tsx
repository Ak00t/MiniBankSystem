import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { changeCorporatePassword, completeCorporateLogin, setupCorporatePin } from "../api/auth";
import { useCorporateAction } from "../hooks/useCorporateAction";
import {
  clearCorporateAuth, corporateSetupRoute, getCorporateChallenge, getCorporateGeneration,
  getCorporateSetupExpiry, getCorporateSetupStep, hasCorporateSession,
} from "../utils/storage";
import CorporateAuthCard from "./CorporateAuthCard";
import { CorporateField, CorporateNotice, CorporateSubmit } from "./CorporateForm";
import { CheckCircle2 } from "lucide-react";
import { AuthPinRules, AuthSecurityNote } from "../../auth/components/IndividualAuthUI";
import { authLinkButtonClass } from "../../auth/components/IndividualAuthStyles";

export default function CorporateSetupForm({ mode }: { mode: "password" | "pin" }) {
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [expired, setExpired] = useState(() => getCorporateSetupExpiry() > 0 && getCorporateSetupExpiry() <= Date.now());
  const action = useCorporateAction();
  const navigate = useNavigate();
  const deadline = getCorporateSetupExpiry();
  useEffect(() => {
    if (!deadline) return;
    const generation = getCorporateGeneration();
    const timer = window.setTimeout(() => {
      if (getCorporateGeneration() === generation) {
        clearCorporateAuth(); setExpired(true);
      }
    }, Math.max(0, deadline - Date.now()));
    return () => window.clearTimeout(timer);
  }, [deadline]);

  if (hasCorporateSession()) return <Navigate to="/corporate/auth-success" replace />;
  if (expired) return <CorporateAuthCard variant="setup" title="Setup session expired" description="Your 10-minute Corporate first-login setup window has ended."><Link to="/corporate/login" replace className="font-semibold text-blue-600">Return to Corporate Login</Link></CorporateAuthCard>;
  const step = getCorporateSetupStep();
  if (!getCorporateChallenge() || !deadline || !step) return <Navigate to="/corporate/login" replace />;
  if (step !== "complete" && step !== mode) return <Navigate to={corporateSetupRoute()} replace />;
  const password = mode === "password";

  function submit(event: FormEvent) {
    event.preventDefault();
    if (step !== "complete") {
      if (password && !/^(?=\S{8,10}$)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).*$/.test(value)) {
        action.setError("Password must be 8–10 characters with uppercase, lowercase, number and special character, and no whitespace."); return;
      }
      if (!password && !/^\d{6}$/.test(value)) { action.setError("Transaction PIN must be exactly six digits."); return; }
      if (value !== confirm) { action.setError(password ? "Passwords do not match." : "Transaction PINs do not match."); return; }
    }
    void action.run(async () => {
      try {
        if (step !== "complete") {
          if (password) {
            const response = await changeCorporatePassword(value, confirm);
            if (response.pinSetupRequired) { await navigate("/corporate/first-login/setup-pin", { replace: true }); return; }
          } else { await setupCorporatePin(value, confirm); }
        }
        await completeCorporateLogin();
        await navigate("/corporate/auth-success", { replace: true });
      } finally { setValue(""); setConfirm(""); }
    });
  }

  return <CorporateAuthCard variant="setup" setupMode={mode} title={step === "complete" ? "Complete Corporate Login" : password ? "Change your password" : "Set up transaction PIN"} description="Complete your first-login setup within 10 minutes of OTP verification.">
    <form onSubmit={submit} noValidate className="space-y-3">
      {step !== "complete" && <>
        <CorporateField id={`corporate-new-${mode}`} label={password ? "New Password" : "Transaction PIN"} secret code={!password} value={value} onChange={e => setValue(password ? e.target.value : e.target.value.replace(/\D/g, ""))} disabled={action.busy} required maxLength={password ? 10 : 6} inputMode={password ? "text" : "numeric"} autoComplete="new-password" />
        <CorporateField id={`corporate-confirm-${mode}`} label={password ? "Confirm Password" : "Confirm Transaction PIN"} secret code={!password} value={confirm} onChange={e => setConfirm(password ? e.target.value : e.target.value.replace(/\D/g, ""))} disabled={action.busy} required maxLength={password ? 10 : 6} inputMode={password ? "text" : "numeric"} autoComplete="new-password" />
        {password ? <CorporatePasswordRules value={value} confirm={confirm} /> : <AuthPinRules pin={value} confirmPin={confirm} />}
      </>}
      <CorporateNotice error message={action.error} />
      <CorporateSubmit variant="verification" busy={action.busy}>{step === "complete" ? "Complete Corporate Login" : password ? "Change Password" : "Set Up PIN"}</CorporateSubmit>
    </form>
    <Link to="/corporate/login" replace className={`mt-3 w-full ${authLinkButtonClass}`}>Return to Corporate Login</Link>
    {!password && <AuthSecurityNote title="Keep your PIN private">Never share your Corporate password or transaction PIN with anyone.</AuthSecurityNote>}
  </CorporateAuthCard>;
}

// Informational only: submit() above remains the authority for the existing
// Corporate password policy. This does not enable, disable or submit the form.
function CorporatePasswordRules({ value, confirm }: { value: string; confirm: string }) {
  const rules = [
    ["8–10 characters", value.length >= 8 && value.length <= 10],
    ["Uppercase letter (A–Z)", /[A-Z]/.test(value)],
    ["Lowercase letter (a–z)", /[a-z]/.test(value)],
    ["At least one number", /\d/.test(value)],
    ["Special character", /[^A-Za-z0-9\s]/.test(value)],
    ["No whitespace", value.length > 0 && !/\s/.test(value)],
    ["Passwords match", value.length > 0 && value === confirm],
  ] as const;
  return <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
    <p className="mb-2 text-xs font-semibold text-[#08295C]">Password requirements</p>
    <ul className="grid gap-x-3 gap-y-1 sm:grid-cols-2">{rules.map(([label, valid]) => <li key={label} className={`flex items-center gap-2 text-[11px] leading-4 ${valid ? "text-emerald-700" : "text-slate-500"}`}>
      <CheckCircle2 aria-hidden="true" size={13} className={`shrink-0 ${valid ? "fill-emerald-600 text-white" : "text-slate-300"}`} />
      <span>{label}{valid && <span className="sr-only"> — met</span>}</span>
    </li>)}</ul>
  </div>;
}
