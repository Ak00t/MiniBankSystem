import {
  useState,
  type ReactNode,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";



import {
  verifyOtp,
  resendOtp,
  testProtectedApi,
} from "../../../services/authService";

import {
  saveTokens,
  hasTokens,
} from "../../../utils/tokenStorage";

import { consumePendingPaymentRedirect } from "../utils/pendingPaymentRedirect";


import { Clock3, ShieldCheck } from "lucide-react";
import { AuthField, AuthNotice } from "../components/IndividualAuthUI";
import { authCodeInputClass } from "../components/IndividualAuthStyles";

const otpPrimaryButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#56ABC0] bg-[#56ABC0] px-5 py-3 text-sm font-semibold text-[#122E52] shadow-sm transition-[background-color,box-shadow] hover:bg-[#4DA0B5] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#113E65]/30 disabled:cursor-not-allowed disabled:saturate-50 disabled:opacity-70 disabled:hover:bg-[#56ABC0] motion-reduce:transition-none";
const otpSecondaryButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#C5AF82] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A365D] shadow-sm transition-colors hover:bg-[#FAF9F7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#113E65]/20 disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none";

function IndividualOtpCodeField({ value, children }: { value: string; children: ReactNode }) {
  return (
    <div className="group relative mx-auto w-full max-w-[298px] sm:max-w-[318px]">
      <div aria-hidden="true" className="pointer-events-none grid grid-cols-6 gap-0.5 sm:gap-1.5">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            className={[
              "inline-flex h-13 min-w-0 items-center justify-center rounded-xl border border-[#CDD5DF] bg-white font-mono text-xl font-medium text-[#122E52] shadow-sm transition-colors motion-reduce:transition-none",
              index === Math.min(value.length, 5) ? "group-focus-within:border-[#56ABC0] group-focus-within:ring-2 group-focus-within:ring-[#56ABC0]/35" : "",
            ].join(" ")}
          >
            {value[index] || ""}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}

function OtpPage() {

  // =========================================
  // STATE
  // =========================================

  const [
    otp,
    setOtp,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    verifying,
    setVerifying,
  ] = useState(false);


  const [
    resending,
    setResending,
  ] = useState(false);


  const [
    completed,
    setCompleted,
  ] = useState(false);

  const [completedDestination, setCompletedDestination] = useState("/dashboard");


  const [
    testMessage,
    setTestMessage,
  ] = useState("");


  const navigate =
    useNavigate();


  const maskedEmail =
    sessionStorage.getItem(
      "maskedEmail"
    );


  // =========================================
  // VERIFY OTP
  // =========================================

  const handleVerifyOtp =
    async () => {

      setError("");

      setMessage("");

      setTestMessage("");


      const challengeGroupId =
        sessionStorage.getItem(
          "challengeGroupId"
        );


      if (
        !challengeGroupId
      ) {

        setError(
          "Login session is missing. Please login again."
        );

        return;

      }


      if (
        !otp
      ) {

        setError(
          "Please enter OTP."
        );

        return;

      }


      if (
        !/^\d{6}$/.test(
          otp
        )
      ) {

        setError(
          "OTP must be exactly 6 digits."
        );

        return;

      }


      try {

        setVerifying(
          true
        );


        const response =
          await verifyOtp({

            challengeGroupId,

            otp,

          });


        // =====================================
        // FIRST LOGIN
        // =====================================

        if (
          response.firstLoginSetupRequired
        ) {

          if (
            response.passwordChangeRequired
          ) {

            navigate(
              "/first-login/change-password"
            );

            return;

          }


          if (
            response.pinSetupRequired
          ) {

            navigate(
              "/first-login/setup-pin"
            );

            return;

          }


          setError(
            "Unable to determine first-login setup step."
          );

          return;

        }


        // =====================================
        // NORMAL LOGIN
        // =====================================

        if (
          response.accessToken
          &&
          response.refreshToken
        ) {

          saveTokens(
            response.accessToken,
            response.refreshToken
          );

          const destination = consumePendingPaymentRedirect();
          setCompletedDestination(destination);


          sessionStorage.removeItem(
            "challengeGroupId"
          );


          sessionStorage.removeItem(
            "maskedEmail"
          );


          setCompleted(
            true
          );


          setMessage(
            "Login completed successfully."
          );


          navigate(
            destination,
            { replace: true }
          );

          return;

        }


        setError(
          "Login could not be completed."
        );


      } catch (
        error: any
      ) {

        setError(

          error.response?.data?.message
          ||
          "OTP verification failed."

        );


      } finally {

        setVerifying(
          false
        );

      }

    };


  // =========================================
  // RESEND OTP
  // =========================================

  const handleResendOtp =
    async () => {

      setError("");

      setMessage("");


      const challengeGroupId =
        sessionStorage.getItem(
          "challengeGroupId"
        );


      if (
        !challengeGroupId
      ) {

        setError(
          "Login session is missing. Please login again."
        );

        return;

      }


      try {

        setResending(
          true
        );


        const response =
          await resendOtp({

            challengeGroupId,

          });


        // Backend returns new challengeGroupId

        if (
          response.challengeGroupId
        ) {

          sessionStorage.setItem(
            "challengeGroupId",
            response.challengeGroupId
          );

        }


        setOtp("");


        setMessage(

          response.message
          ||
          "A new OTP has been sent to your registered email."

        );


      } catch (
        error: any
      ) {

        setError(

          error.response?.data?.message
          ||
          "Unable to resend OTP."

        );


      } finally {

        setResending(
          false
        );

      }

    };


  // =========================================
  // TEST PROTECTED API
  // KEEP CURRENT LOGIC
  // UI IS HIDDEN
  // =========================================

  const handleTestProtectedApi =
    async () => {

      setTestMessage("");


      try {

        const response =
          await testProtectedApi();


        console.log(
          "Protected API success:",
          response
        );


        setTestMessage(
          "Protected API success."
        );


      } catch (
        error: any
      ) {

        console.log(
          "Protected API failed:",
          error.response?.data
        );


        setTestMessage(

          error.response?.data?.message
          ||
          "Protected API failed."

        );

      }

    };


  // =========================================
  // UI
  // =========================================

  // Verification removes the challenge before the destination transition commits.
  // Completed verification must never compete with that transition; after logout,
  // cleared tokens still send any restored completed page to Login.
  if (completed) {
    return <Navigate to={hasTokens() ? completedDestination : "/login"} replace />;
  }

  // Login challenges are UUIDs. Never restore the form from browser history
  // after successful verification or logout has removed the challenge.
  const challengeGroupId = sessionStorage.getItem("challengeGroupId");
  if (
    !challengeGroupId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(challengeGroupId)
  ) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#E5EAF0] text-[#111418] antialiased">
      <title>EKARAJ BANK | Email Verification</title>
      <header className="shrink-0 border-b border-[#C5AF82] bg-[#FAF9F7] text-[#1A365D]">
        <div className="mx-auto flex min-h-[55px] max-w-[1200px] items-center justify-between gap-3 px-3 py-1.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img src="/assets/ekaraj-crown-transparent.png" alt="" aria-hidden="true" width={375} height={340} className="h-10 w-auto shrink-0 object-contain" />
            <p className="min-w-0 text-xs font-semibold leading-4 tracking-[0.02em] text-[#113E65] sm:text-sm sm:tracking-[0.06em]">Ekaraj Bank Customer Portal</p>
          </div>
          <p className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium leading-4 sm:gap-2 sm:text-xs">
            <ShieldCheck aria-hidden="true" size={18} className="shrink-0" />
            <span className="max-w-[88px] sm:max-w-none">Secure Personal Banking</span>
          </p>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-3 py-1.5 sm:px-6">
        <section aria-label="Individual OTP verification card" className="grid w-full max-w-[976px] rounded-3xl border border-[#CDC0A8] bg-[#F5F3EF] shadow-[0_18px_50px_-26px_rgba(18,46,82,0.3)] md:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative hidden flex-col justify-between overflow-hidden rounded-l-[23px] bg-[#E5EAF0] text-[#1A365D] md:flex">
            <img src="/assets/ekaraj-building-reference.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-[85%] w-[85%] object-cover object-[60%_70%] opacity-[0.1] [mask-image:radial-gradient(ellipse_at_75%_65%,#000_10%,transparent_80%)]" />
            <svg aria-hidden="true" focusable="false" viewBox="0 0 450 470" preserveAspectRatio="none" fill="none" className="pointer-events-none absolute inset-0 h-full w-full">
              <path d="M-70 85C95 35 120 300 330 285S500 215 520 150" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.35" />
              <path d="M-80 105C80 55 135 325 340 305S510 235 530 175" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.2" />
            </svg>
            <h2 className="relative px-6 pt-4 font-serif text-2xl font-medium leading-8 tracking-tight lg:px-7">
              Secure Verification<br />for a Safer Tomorrow.
            </h2>
            <div aria-hidden="true" className="relative flex min-h-0 flex-1 items-center justify-center px-6 py-2">
              <img src="/assets/ekaraj-crown-transparent.png" alt="" width={375} height={340} className="h-auto w-40 max-w-full object-contain" />
            </div>
            <div className="relative space-y-2.5 px-6 pb-4 pt-2 lg:px-7">
              <p className="flex items-center gap-3 text-xs font-medium leading-4"><ShieldCheck aria-hidden="true" size={20} className="shrink-0 text-[#C6A15B]" />Secure Verification</p>
              <p className="flex items-center gap-3 text-xs font-medium leading-4"><Clock3 aria-hidden="true" size={20} className="shrink-0 text-[#C6A15B]" />Your Trusted Banking Partner</p>
            </div>
          </aside>
          <section aria-label="Email verification" className="flex min-w-0 items-center px-5 py-3 sm:px-8 md:px-7 lg:px-9">
            <div className="mx-auto w-full max-w-[392px]">
              <div className="mb-4">
                <h1 className="font-serif text-2xl font-medium leading-8 tracking-tight text-[#1A365D]">Verify your email</h1>
                <p className="mt-0.5 text-sm leading-5 text-[#111418]">
              We've sent a 6-digit verification code to{" "}
              <strong className="font-semibold text-[#122E52]">
                {maskedEmail || "your registered email"}
              </strong>
              .
                </p>
                <div aria-hidden="true" className="mt-1 h-px w-10 bg-[#C6A15B]" />
              </div>
        <AuthField label="Verification code" htmlFor="individual-login-otp">
          <div className="-mx-3 sm:mx-0">
          <IndividualOtpCodeField value={otp}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              disabled={completed || verifying || resending}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              autoComplete="one-time-code"
              id="individual-login-otp"
              className={authCodeInputClass}
              aria-invalid={Boolean(error)}
              aria-required={true}
            />
          </IndividualOtpCodeField>
          </div>
        </AuthField>
        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs leading-4 text-[#627084]"><Clock3 aria-hidden="true" size={14} />Your verification code is valid for 5 minutes.</p>
        <AuthNotice error={error} />
        <AuthNotice message={message} />
        <div className="mt-3">
        <button
          type="button"
          onClick={handleVerifyOtp}
          disabled={verifying || resending || completed}
          className={otpPrimaryButtonClass}
          aria-busy={verifying || resending || completed}
        >
          {(verifying ||
            resending ||
            completed) && (
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#122E52]/25 border-t-[#122E52] motion-reduce:animate-none"
              />
            )}{" "}
          {verifying ? "Verifying..." : "Verify OTP"}
        </button>
        </div>
        {!completed && (
          <div className="mt-3 text-center">
            <p className="mb-1.5 text-xs leading-4 text-[#627084]">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={verifying || resending}
              className={otpSecondaryButtonClass}
              aria-busy={resending}
            >
              {resending && <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#1A365D]/25 border-t-[#1A365D] motion-reduce:animate-none" />}
              {" "}
              {resending ? "Sending..." : "Resend OTP"}{" "}
            </button>
          </div>
        )}
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#C6D5E3] bg-[#EAF2FA] p-2">
          <ShieldCheck aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-[#113E65]" />
          <div>
            <p className="text-xs font-semibold leading-4 text-[#1A365D]">Your security comes first.</p>
            <p className="mt-0.5 text-xs leading-4 text-[#627084]">Never share your OTP with anyone.</p>
          </div>
        </div>
        {completed && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleTestProtectedApi}
              className={otpSecondaryButtonClass}
            >
              Test Protected API
            </button>
            <AuthNotice message={testMessage} />
          </div>
        )}
            </div>
          </section>
        </section>
      </main>
      <footer className="shrink-0 border-t border-[#EBEAE6] bg-[#FAF9F7] text-[#1A365D]">
        <div className="mx-auto flex min-h-[39px] max-w-[1200px] flex-wrap items-center justify-center gap-x-4 px-3 py-1 text-[10px] leading-4 sm:justify-between sm:px-6 sm:text-[11px]">
          <p>© 2026 EKARAJ BANK. All rights reserved.</p>
          <p>
            Secure <span aria-hidden="true" className="mx-1 text-[#757575]">•</span> Simple <span aria-hidden="true" className="mx-1 text-[#757575]">•</span> Convenient
          </p>
        </div>
      </footer>
    </div>
  );

}


export default OtpPage;
