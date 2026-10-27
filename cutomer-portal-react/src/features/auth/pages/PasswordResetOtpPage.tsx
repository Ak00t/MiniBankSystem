import {
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";


import {
  verifyPasswordResetOtp,
  resendPasswordResetOtp,
} from "../../../services/authService";

import { Clock3, Mail, ShieldCheck } from "lucide-react";
import { AuthField, AuthCodeField, AuthNotice } from "../components/IndividualAuthUI";
import { authCodeInputClass } from "../components/IndividualAuthStyles";

const resetOtpPrimaryButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#56ABC0] bg-[#56ABC0] px-5 py-3 text-sm font-semibold text-[#122E52] shadow-sm transition-[background-color,box-shadow] hover:bg-[#4DA0B5] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#113E65] disabled:cursor-not-allowed disabled:saturate-50 disabled:opacity-70 disabled:hover:bg-[#56ABC0] motion-reduce:transition-none";
const resetOtpSecondaryButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#C5AF82] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A365D] shadow-sm transition-colors hover:bg-[#FAF9F7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#113E65] disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none";
const resetOtpLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-md px-2 text-sm font-semibold text-[#122E52] underline underline-offset-4 decoration-[#C6A15B] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#113E65] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

// Keep shared field defaults intact; scope the recovery page's cell styling here.
const resetOtpCodeClass =
  "mx-auto w-full max-w-[298px] sm:max-w-[318px] [&>div]:max-w-none [&_[aria-hidden=true]]:gap-0.5 sm:[&_[aria-hidden=true]]:gap-1.5 [&_[aria-hidden=true]>span]:rounded-xl [&_[aria-hidden=true]>span]:border-[#CDD5DF] [&_[aria-hidden=true]>span]:font-medium [&_[aria-hidden=true]>span]:text-[#122E52] [&_[aria-hidden=true]>span]:shadow-sm [&_.group:focus-within_span[class*='group-focus-within']]:border-[#113E65] [&_.group:focus-within_span[class*='group-focus-within']]:ring-2 [&_.group:focus-within_span[class*='group-focus-within']]:ring-[#113E65]";

function PasswordResetOtpPage() {

  // ======================================================
  // STATE
  // ======================================================

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
    loading,
    setLoading,
  ] = useState(false);


  const [
    resending,
    setResending,
  ] = useState(false);


  const navigate =
    useNavigate();


  // ======================================================
  // GET PASSWORD RESET DATA FROM SESSION STORAGE
  // ======================================================

  const challengeGroupId =
    sessionStorage.getItem(
      "passwordResetChallengeGroupId"
    );


  const maskedEmail =
    sessionStorage.getItem(
      "passwordResetMaskedEmail"
    );


  // ======================================================
  // VERIFY PASSWORD RESET OTP
  // ======================================================

  const handleVerifyOtp = async (
    e: FormEvent
  ) => {

    e.preventDefault();


    setError("");

    setMessage("");


    // ====================================================
    // 1. CHALLENGE GROUP ID CHECK
    // ====================================================

    if (
      !challengeGroupId
    ) {

      setError(
        "Password reset session is missing. Please start again."
      );

      return;

    }


    // ====================================================
    // 2. OTP MUST BE EXACTLY 6 DIGITS
    // ====================================================

    if (
      !/^\d{6}$/.test(
        otp
      )
    ) {

      setError(
        "Please enter a valid 6-digit OTP."
      );

      return;

    }


    try {

      setLoading(
        true
      );


      // ==================================================
      // 3. CALL VERIFY OTP API
      // ==================================================

      const response =
        await verifyPasswordResetOtp({

          challengeGroupId:
            challengeGroupId,

          otp:
            otp,

        });


      // ==================================================
      // 4. DEVELOPMENT LOG
      // ==================================================

      console.log(
        "PASSWORD RESET VERIFY RESPONSE:",
        response
      );


      console.log(
        "verified challenge id:",
        response.challengeGroupId
      );


      // ==================================================
      // 5. BACKEND RESPONSE CHECK
      // ==================================================

      if (
        !response.challengeGroupId
      ) {

        setError(
          "Password reset verification information is missing."
        );

        return;

      }


      // ==================================================
      // 6. SAVE VERIFIED CHALLENGE ID
      //
      // Backend property name = challengeGroupId
      // But this value is the NEW verified challenge ID.
      // ==================================================

      sessionStorage.setItem(
        "verifiedPasswordResetChallengeGroupId",
        response.challengeGroupId
      );


      // ==================================================
      // 7. REMOVE OLD OTP CHALLENGE
      // ==================================================

      sessionStorage.removeItem(
        "passwordResetChallengeGroupId"
      );


      // ==================================================
      // 8. GO TO NEW PASSWORD PAGE
      // ==================================================

      navigate(
        "/password-reset/new-password"
      );


    } catch (
      error: any
    ) {

      setError(

        error.response?.data?.message
        ||
        "OTP verification failed. Please try again."

      );


    } finally {

      setLoading(
        false
      );

    }

  };


  // ======================================================
  // RESEND PASSWORD RESET OTP
  // ======================================================

  const handleResendOtp =
    async () => {

      setError("");

      setMessage("");


      // ====================================================
      // 1. CHALLENGE GROUP ID CHECK
      // ====================================================

      if (
        !challengeGroupId
      ) {

        setError(
          "Password reset session is missing. Please start again."
        );

        return;

      }


      try {

        setResending(
          true
        );


        // ==================================================
        // 2. CALL RESEND OTP API
        // ==================================================

        const response =
          await resendPasswordResetOtp({

            challengeGroupId:
              challengeGroupId,

          });


        // ==================================================
        // 3. SAVE RETURNED CHALLENGE GROUP ID
        // ==================================================

        if (
          response.challengeGroupId
        ) {

          sessionStorage.setItem(
            "passwordResetChallengeGroupId",
            response.challengeGroupId
          );

        }


        // ==================================================
        // 4. CLEAR OLD OTP INPUT
        // ==================================================

        setOtp("");


        // ==================================================
        // 5. SUCCESS MESSAGE
        // ==================================================

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
          "Unable to resend OTP. Please try again."

        );


      } finally {

        setResending(
          false
        );

      }

    };


  // ======================================================
  // BACK TO FORGOT PASSWORD
  // ======================================================

  const handleBack =
    () => {

      sessionStorage.removeItem(
        "passwordResetChallengeGroupId"
      );


      sessionStorage.removeItem(
        "passwordResetMaskedEmail"
      );


      sessionStorage.removeItem(
        "verifiedPasswordResetChallengeGroupId"
      );


      navigate(
        "/forgot-password"
      );

    };


  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="flex min-h-dvh flex-col bg-[#E5EAF0] text-[#111418] antialiased">
      <title>EKARAJ BANK | Password Reset Verification</title>
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
        <section aria-label="Password reset OTP card" className="grid w-full max-w-[976px] rounded-3xl border border-[#CDC0A8] bg-[#F5F3EF] shadow-[0_18px_50px_-26px_rgba(18,46,82,0.3)] md:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative hidden flex-col justify-between overflow-hidden rounded-l-[23px] bg-[#E5EAF0] text-[#1A365D] md:flex">
            <img src="/assets/ekaraj-building-reference.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-[85%] w-[85%] object-cover object-[60%_70%] opacity-[0.1] [mask-image:radial-gradient(ellipse_at_75%_65%,#000_10%,transparent_80%)]" />
            <svg aria-hidden="true" focusable="false" viewBox="0 0 450 470" preserveAspectRatio="none" fill="none" className="pointer-events-none absolute inset-0 h-full w-full">
              <path d="M-30 130C100 145 140 350 285 325S420 300 490 260" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.5" />
              <path d="M-30 152C95 168 148 378 292 350S435 322 490 282" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.35" />
            </svg>
            <h2 className="relative px-6 pt-4 font-serif text-2xl font-medium leading-8 tracking-tight lg:px-7">
              Verify Your Identity.<br />Complete Your Password Reset.
            </h2>
            <div aria-hidden="true" className="relative flex min-h-0 flex-1 items-center justify-center px-6 py-2">
              <img src="/assets/ekaraj-crown-transparent.png" alt="" width={375} height={340} className="h-auto w-40 max-w-full translate-y-5 object-contain" />
            </div>
            <div className="relative space-y-2.5 px-6 pb-4 pt-2 lg:px-7">
              {[
                [ShieldCheck, "Secure Verification", "Your identity, our priority."],
                [Mail, "Protected Recovery", "Reset your password safely."],
                [Clock3, "Trusted Banking", "Your security comes first."],
              ].map(([Icon, title, description]) => {
                const Mark = Icon as typeof ShieldCheck;
                return (
                  <div key={String(title)} className="flex items-start gap-3">
                    <Mark aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-[#C6A15B]" />
                    <div>
                      <p className="text-xs font-bold leading-4 text-[#1A365D]">{String(title)}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-[#59697D]">{String(description)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
          <section aria-label="Password reset verification" className="flex min-w-0 items-center px-5 py-3 sm:px-8 md:px-7 lg:px-9">
            <div className="mx-auto w-full max-w-[392px]">
              <div className="mb-3 text-center">
                <span aria-hidden="true" className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full border border-[#C6D5E3] bg-[#EAF2FA] text-[#113E65]">
                  <Mail size={21} strokeWidth={1.8} />
                </span>
                <h1 className="font-serif text-2xl font-medium leading-8 tracking-tight text-[#1A365D]">OTP Verification</h1>
                <p className="mt-1 break-words text-sm leading-5 text-[#59697D]">
              Enter the 6-digit code sent to{" "}
              <strong className="font-semibold text-[#1A365D]">
                {maskedEmail || "your registered email"}
              </strong>{" "}
              to reset your password.
                </p>
              </div>
        <form onSubmit={handleVerifyOtp} className="space-y-2.5 [&_label]:text-[#1A365D]">
          <AuthField label="Verification code" htmlFor="individual-recovery-otp">
            <div className="-mx-3 sm:mx-0">
            <div className={resetOtpCodeClass}>
            <AuthCodeField value={otp}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                placeholder="000000"
                autoComplete="one-time-code"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");

                  setOtp(value);
                }}
                disabled={loading || resending}
                id="individual-recovery-otp"
                className={authCodeInputClass}
                aria-invalid={Boolean(error)}
                aria-required={true}
              />
            </AuthCodeField>
            </div>
            </div>
          </AuthField>
          <p className="flex items-center justify-center gap-1.5 text-xs leading-4 text-[#59697D]"><Clock3 aria-hidden="true" size={14} />Your verification code is valid for 5 minutes.</p>
          <AuthNotice error={error} />
          <AuthNotice message={message} />
          <button
            type="submit"
            disabled={loading || resending}
            className={resetOtpPrimaryButtonClass}
            aria-busy={loading || resending}
          >
            {loading ||
              (resending && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#122E52]/25 border-t-[#122E52] motion-reduce:animate-none"
                />
              ))}{" "}
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        <div className="mt-2.5 text-center">
          <p className="mb-1.5 text-xs leading-4 text-[#59697D]">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading || resending}
            className={resetOtpSecondaryButtonClass}
          >
            {" "}
            {resending ? "Sending..." : "Resend OTP"}{" "}
          </button>
        </div>
        <div className="mt-1.5 text-center">
          <button
            type="button"
            onClick={handleBack}
            disabled={loading || resending}
            className={resetOtpLinkClass}
          >
            {" "}
             Back to Password Recovery
          </button>
        </div>
              <div className="mt-2.5 flex items-start gap-3 rounded-xl border border-[#C6D5E3] bg-[#EAF2FA] p-2.5">
                <ShieldCheck aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-[#113E65]" />
                <div>
                  <p className="text-xs font-semibold leading-4 text-[#1A365D]">Secure verification</p>
                  <p className="mt-0.5 text-xs leading-4 text-[#59697D]">Your verification code is valid for 5 minutes. Do not share it with anyone.</p>
                </div>
              </div>
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


export default PasswordResetOtpPage;
