import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { AuthCodeField, AuthSecurityNote } from "../../auth/components/IndividualAuthUI";
import { authCodeInputClass, authLinkButtonClass } from "../../auth/components/IndividualAuthStyles";
import { resendCorporateOtp, verifyCorporateOtp } from "../api/auth";
import CorporateAuthCard from "../components/CorporateAuthCard";
import { CorporateNotice, CorporateSubmit } from "../components/CorporateForm";
import { useCorporateAction } from "../hooks/useCorporateAction";
import { corporateSetupRoute, getCorporateChallenge, getCorporateSetupStep, hasCorporateSession } from "../utils/storage";

export default function CorporateOtpPage() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const action = useCorporateAction();
  const navigate = useNavigate();
  // Check authenticated state first: verification deliberately clears the challenge.
  if (hasCorporateSession()) return <Navigate to="/corporate/auth-success" replace />;
  if (!getCorporateChallenge()) return <Navigate to="/corporate/login" replace />;
  if (getCorporateSetupStep()) return <Navigate to={corporateSetupRoute()} replace />;

  function verify(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) { action.setError("OTP must be exactly 6 digits."); return; }
    void action.run(async () => {
      setMessage("");
      const response = await verifyCorporateOtp(otp);
      await navigate(response.firstLogin ? corporateSetupRoute() : "/corporate/auth-success", { replace: true });
    });
  }
  function resend() {
    void action.run(async () => {
      setMessage("");
      const response = await resendCorporateOtp();
      setOtp(""); setMessage(response.message || "A new OTP has been sent to your registered email.");
    });
  }

  return <CorporateAuthCard title="Verify your identity" description="Enter the 6-digit verification code sent to your registered Corporate email.">
    <form onSubmit={verify} noValidate className="space-y-3">
      <div><label htmlFor="corporate-otp" className="mb-1.5 block text-xs font-semibold text-[#08295C]">Verification Code</label>
        <AuthCodeField value={otp}>
          <input id="corporate-otp" name="corporate-otp" type="text" inputMode="numeric" maxLength={6} autoComplete="one-time-code" required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} disabled={action.busy} placeholder="000000" className={authCodeInputClass} />
        </AuthCodeField>
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500"><Clock3 aria-hidden="true" size={15} />The code is valid for 5 minutes.</p>
      </div>
      <CorporateNotice error message={action.error} /><CorporateNotice message={message} />
      <CorporateSubmit variant="verification" busy={action.busy}>Verify OTP</CorporateSubmit>
    </form>
    <div className="mt-3 text-center"><p className="mb-1 text-xs text-slate-500">Didn’t receive the code?</p><button type="button" onClick={resend} disabled={action.busy} className={authLinkButtonClass}>Resend OTP</button></div>
    <AuthSecurityNote title="Secure verification">ACE Bank will never ask you to share your OTP by phone, message, or email.</AuthSecurityNote>
    <Link to="/corporate/login" replace className={`mt-3 w-full ${authLinkButtonClass}`}>Return to Corporate Login</Link>
  </CorporateAuthCard>;
}
