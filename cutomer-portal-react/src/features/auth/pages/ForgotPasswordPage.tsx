import {
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";


import {
  requestPasswordReset,
} from "../../../services/authService";

import { Clock3, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { AuthField, AuthNotice } from "../components/IndividualAuthUI";

const recoveryInputClass =
  "block min-h-11 w-full rounded-xl border border-[#CDD5DF] bg-white py-2.5 pl-11 pr-4 text-sm text-[#111418] shadow-sm outline-none transition-colors placeholder:text-[#757575] hover:border-[#C6A15B] focus:border-[#113E65] focus:ring-2 focus:ring-[#113E65] disabled:cursor-not-allowed disabled:bg-[#E5EAF0] disabled:text-[#757575] motion-reduce:transition-none";
const recoveryPrimaryButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#56ABC0] bg-[#56ABC0] px-5 py-3 text-sm font-semibold text-[#122E52] shadow-sm transition-[background-color,box-shadow] hover:bg-[#4DA0B5] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#113E65] disabled:cursor-not-allowed disabled:saturate-50 disabled:opacity-70 disabled:hover:bg-[#56ABC0] motion-reduce:transition-none";
const recoveryLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-md px-2 text-sm font-semibold text-[#122E52] underline underline-offset-4 decoration-[#C6A15B] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#113E65] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

function ForgotPasswordPage() {

  // ======================================================
  // STATE
  // ======================================================

  const [
    loginIdentifier,
    setLoginIdentifier,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const navigate =
    useNavigate();


  // ======================================================
  // REQUEST PASSWORD RESET OTP
  // ======================================================

  const handleSubmit = async (
    e: FormEvent
  ) => {

    e.preventDefault();

    setError("");


    // ----------------------------------------------
    // 1. EMPTY FIELD CHECK
    // ----------------------------------------------

    if (
      !loginIdentifier.trim()
    ) {

      setError(
        "Please enter your Customer ID or Account Number."
      );

      return;
    }


    try {

      setLoading(
        true
      );


      // ----------------------------------------------
      // 2. CALL BACKEND
      // ----------------------------------------------

      const response =
        await requestPasswordReset({

          loginIdentifier:
            loginIdentifier.trim(),

        });


      // ----------------------------------------------
      // 3. SAVE PASSWORD RESET CHALLENGE
      // ----------------------------------------------

      sessionStorage.setItem(
        "passwordResetChallengeGroupId",
        response.challengeGroupId
      );


      // Backend returns destinationMasked
      // Example: su****@gmail.com

      if (
        response.destinationMasked
      ) {

        sessionStorage.setItem(
          "passwordResetMaskedEmail",
          response.destinationMasked
        );

      }


      // ----------------------------------------------
      // 4. GO TO PASSWORD RESET OTP PAGE
      // ----------------------------------------------

      navigate(
        "/password-reset/otp"
      );


    } catch (
      error: any
    ) {

      setError(

        error.response?.data?.message
        ||
        "Unable to request password reset. Please try again."

      );


    } finally {

      setLoading(
        false
      );

    }

  };


  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="flex min-h-dvh flex-col bg-[#E5EAF0] text-[#111418] antialiased">
      <title>EKARAJ BANK | Password Recovery</title>
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
        <section aria-label="Individual password recovery card" className="grid w-full max-w-[976px] rounded-3xl border border-[#CDC0A8] bg-[#F5F3EF] shadow-[0_18px_50px_-26px_rgba(18,46,82,0.3)] md:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative hidden flex-col justify-between overflow-hidden rounded-l-[23px] bg-[#E5EAF0] text-[#1A365D] md:flex">
            <img src="/assets/ekaraj-building-reference.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-[85%] w-[85%] object-cover object-[60%_70%] opacity-[0.1] [mask-image:radial-gradient(ellipse_at_75%_65%,#000_10%,transparent_80%)]" />
            <svg aria-hidden="true" focusable="false" viewBox="0 0 450 470" preserveAspectRatio="none" fill="none" className="pointer-events-none absolute inset-0 h-full w-full">
              <path d="M-30 130C100 145 140 350 285 325S420 300 490 260" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.5" />
              <path d="M-30 152C95 168 148 378 292 350S435 322 490 282" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.35" />
            </svg>
            <h2 className="relative px-6 pt-4 font-serif text-2xl font-medium leading-8 tracking-tight lg:px-7">
              Reset Your Password.<br />Restore Your Access.
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
          <section aria-label="Password recovery" className="flex min-w-0 items-center px-5 py-3 sm:px-8 md:px-7 lg:px-9">
            <div className="mx-auto w-full max-w-[392px]">
              <div className="mb-4 text-center">
                <span aria-hidden="true" className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-[#C6D5E3] bg-[#EAF2FA] text-[#113E65]">
                  <KeyRound size={24} strokeWidth={1.8} />
                </span>
                <h1 className="font-serif text-2xl font-medium leading-8 tracking-tight text-[#1A365D]">Forgot your password?</h1>
                <p className="mt-1 text-sm leading-5 text-[#59697D]">Enter your Customer ID or Account Number. We will send a verification code to your registered email.</p>
              </div>
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3 [&_label]:text-[#1A365D]">
          <AuthField label="Customer ID / Account Number" htmlFor="individual-recovery-id">
            <UserRound aria-hidden="true" size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#757575]" />
            <input
              type="text"
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="Enter Customer ID or Account Number"
              autoComplete="off"
              disabled={loading}
              id="individual-recovery-id"
              className={recoveryInputClass}
              aria-invalid={Boolean(error)}
              aria-required={true}
            />
          </AuthField>
          <AuthNotice error={error} />
          <button
            type="submit"
            disabled={loading}
            className={recoveryPrimaryButtonClass}
            aria-busy={loading}
          >
            {loading && (
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#122E52]/25 border-t-[#122E52] motion-reduce:animate-none"
              />
            )}{" "}
            {loading ? "Sending OTP..." : "Continue"}
          </button>
          <div className="relative pt-3 text-center">
            <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-px w-10 -translate-x-1/2 bg-[#CDD5DF]" />
            <p className="mb-1 text-xs leading-4 text-[#59697D]">Remember your password?</p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={loading}
              className={recoveryLinkClass}
            >
              {" "}
               Back to Login
            </button>
          </div>
        </form>
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-[#C6D5E3] bg-[#EAF2FA] p-2.5">
                <ShieldCheck aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-[#113E65]" />
                <div>
                  <p className="text-xs font-semibold leading-4 text-[#1A365D]">Secure account recovery</p>
                  <p className="mt-0.5 text-xs leading-4 text-[#59697D]">Verification codes are sent only to the email address registered with your Ekaraj Bank account.</p>
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


export default ForgotPasswordPage;
