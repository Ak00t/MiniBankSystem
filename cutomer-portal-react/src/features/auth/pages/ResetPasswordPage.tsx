import {
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { Clock3, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";

import {
  confirmPasswordReset,
} from "../../../services/authService";

import { AuthField, AuthNotice, AuthPasswordRules, AuthSuccess } from "../components/IndividualAuthUI";

const resetPasswordInputClass =
  "block min-h-11 w-full rounded-xl border border-[#CDD5DF] bg-white py-2.5 pl-4 pr-12 text-sm text-[#111418] shadow-sm outline-none transition-colors placeholder:text-[#757575] hover:border-[#C6A15B] focus:border-[#113E65] focus:ring-2 focus:ring-[#113E65] disabled:cursor-not-allowed disabled:bg-[#E5EAF0] disabled:text-[#757575] motion-reduce:transition-none";
const resetPasswordPrimaryButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#56ABC0] bg-[#56ABC0] px-5 py-3 text-sm font-semibold text-[#122E52] shadow-sm transition-[background-color,box-shadow] hover:bg-[#4DA0B5] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#113E65] disabled:cursor-not-allowed disabled:saturate-50 disabled:opacity-70 disabled:hover:bg-[#56ABC0] motion-reduce:transition-none";
const resetPasswordLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-md px-2 text-sm font-semibold text-[#122E52] underline underline-offset-4 decoration-[#C6A15B] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#113E65] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
const resetPasswordToggleClass =
  "absolute inset-y-0 right-1 inline-flex w-11 items-center justify-center rounded-lg text-[#757575] transition-colors hover:text-[#122E52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#113E65] disabled:opacity-50 motion-reduce:transition-none";

// Presentation overrides stay local; the shared rules and their live checks are unchanged.
const resetPasswordRulesClass =
  "rounded-xl border border-[#C6D5E3] bg-[#EAF2FA] [&>div]:border-0 [&>div]:bg-transparent [&>div]:p-2.5 [&>div>p]:mb-1.5 [&>div>p]:text-[#1A365D] [&_ul]:gap-y-0.5 [&_li]:text-xs [&_li.text-slate-500]:text-[#59697D]";
const resetPasswordSuccessClass =
  "[&_h1]:font-serif [&_h1]:font-medium [&_h1]:text-[#1A365D] [&>div>svg]:bg-[#EAF2FA] [&>div>svg]:text-[#113E65] [&>div>div]:space-y-3 [&>div>div]:text-[#59697D]";

function ResetPasswordPage() {

  // ======================================================
  // STATE
  // ======================================================

  const [
    newPassword,
    setNewPassword,
  ] = useState("");


  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");


  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);


  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const navigate =
    useNavigate();


  // ======================================================
  // GET VERIFIED CHALLENGE GROUP ID
  // ======================================================

  const verifiedChallengeGroupId =
    sessionStorage.getItem(
      "verifiedPasswordResetChallengeGroupId"
    );


  // ======================================================
  // PASSWORD VALIDATION
  // ======================================================

  const isValidPassword = (
    password: string
  ) => {

    // Minimum 8, Maximum 10

    if (
      password.length < 8
      ||
      password.length > 10
    ) {

      return false;

    }


    // At least one uppercase letter

    if (
      !/[A-Z]/.test(
        password
      )
    ) {

      return false;

    }


    // At least one lowercase letter

    if (
      !/[a-z]/.test(
        password
      )
    ) {

      return false;

    }


    // At least one number

    if (
      !/[0-9]/.test(
        password
      )
    ) {

      return false;

    }


    // At least one special character

    if (
      !/[^A-Za-z0-9]/.test(
        password
      )
    ) {

      return false;

    }


    // No whitespace

    if (
      /\s/.test(
        password
      )
    ) {

      return false;

    }


    return true;

  };


  // ======================================================
  // RESET PASSWORD
  // ======================================================

  const handleResetPassword =
    async (
      e: FormEvent
    ) => {

      e.preventDefault();


      setError("");

      setSuccess("");


      // ====================================================
      // 1. VERIFIED CHALLENGE ID CHECK
      // ====================================================

      if (
        !verifiedChallengeGroupId
        ||
        verifiedChallengeGroupId === "undefined"
        ||
        verifiedChallengeGroupId === "null"
      ) {

        setError(
          "Password reset authorization is missing. Please start again."
        );

        return;

      }


      // Temporary development log

      console.log(
        "verifiedChallengeGroupId sent to backend:",
        verifiedChallengeGroupId
      );


      // ====================================================
      // 2. EMPTY FIELD CHECK
      // ====================================================

      if (
        !newPassword
        ||
        !confirmPassword
      ) {

        setError(
          "Please enter new password and confirm password."
        );

        return;

      }


      // ====================================================
      // 3. PASSWORDS MUST MATCH
      // ====================================================

      if (
        newPassword !==
        confirmPassword
      ) {

        setError(
          "New password and confirm password do not match."
        );

        return;

      }


      // ====================================================
      // 4. PASSWORD POLICY CHECK
      // ====================================================

      if (
        !isValidPassword(
          newPassword
        )
      ) {

        setError(
          "Password must be between 8 and 10 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character. Whitespace is not allowed."
        );

        return;

      }


      try {

        setLoading(
          true
        );


        // ==================================================
        // 5. CALL PASSWORD RESET API
        // ==================================================

        const response =
          await confirmPasswordReset({

            verifiedChallengeGroupId:
              verifiedChallengeGroupId,

            newPassword:
              newPassword,

            confirmPassword:
              confirmPassword,

          });


        // ==================================================
        // 6. CLEAR RESET SESSION DATA
        // ==================================================

        sessionStorage.removeItem(
          "verifiedPasswordResetChallengeGroupId"
        );


        sessionStorage.removeItem(
          "passwordResetChallengeGroupId"
        );


        sessionStorage.removeItem(
          "passwordResetMaskedEmail"
        );


        // ==================================================
        // 7. CLEAR PASSWORD INPUTS
        // ==================================================

        setNewPassword("");

        setConfirmPassword("");


        // ==================================================
        // 8. SUCCESS MESSAGE
        // ==================================================

        setSuccess(

          response
          ||
          "Password reset successfully."

        );


      } catch (
        error: any
      ) {

        setError(

          error.response?.data?.message
          ||
          "Unable to reset password. Please try again."

        );


      } finally {

        setLoading(
          false
        );

      }

    };


  // ======================================================
  // CANCEL RESET
  // ======================================================

  const handleCancel =
    () => {

      sessionStorage.removeItem(
        "verifiedPasswordResetChallengeGroupId"
      );


      sessionStorage.removeItem(
        "passwordResetChallengeGroupId"
      );


      sessionStorage.removeItem(
        "passwordResetMaskedEmail"
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
      <title>EKARAJ BANK | Create New Password</title>
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
        <section aria-label="Individual password reset card" className="grid w-full max-w-[976px] rounded-3xl border border-[#CDC0A8] bg-[#F5F3EF] shadow-[0_18px_50px_-26px_rgba(18,46,82,0.3)] md:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative hidden flex-col justify-between overflow-hidden rounded-l-[23px] bg-[#E5EAF0] text-[#1A365D] md:flex">
            <img src="/assets/ekaraj-building-reference.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-[85%] w-[85%] object-cover object-[60%_70%] opacity-[0.1] [mask-image:radial-gradient(ellipse_at_75%_65%,#000_10%,transparent_80%)]" />
            <svg aria-hidden="true" focusable="false" viewBox="0 0 450 470" preserveAspectRatio="none" fill="none" className="pointer-events-none absolute inset-0 h-full w-full">
              <path d="M-30 130C100 145 140 350 285 325S420 300 490 260" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.5" />
              <path d="M-30 152C95 168 148 378 292 350S435 322 490 282" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.35" />
            </svg>
            <h2 className="relative px-6 pt-4 font-serif text-2xl font-medium leading-8 tracking-tight lg:px-7">
              Create a New Password.<br />Secure Your Account.
            </h2>
            <div aria-hidden="true" className="relative flex min-h-[200px] flex-1 items-center justify-center px-6 py-2">
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
          <section aria-label="Create a new password" className="flex min-w-0 items-center px-5 py-2.5 sm:px-8 md:px-7 lg:px-9">
            <div className="mx-auto w-full max-w-[392px]">
        {success ? (
          <div className={resetPasswordSuccessClass}>
          <AuthSuccess title="Password reset successful">
            <p role="status">{success}</p>
            <p>You can now sign in to your Ekaraj Bank account using your new password.</p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={resetPasswordPrimaryButtonClass}
            >
              Back to Login
            </button>
          </AuthSuccess>
          </div>
        ) : (
          <>
            <div className="mb-1.5 text-center">
              <span aria-hidden="true" className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#C6D5E3] bg-[#EAF2FA] text-[#113E65]">
                <KeyRound size={20} strokeWidth={1.8} />
              </span>
              <h1 className="font-serif text-2xl font-medium leading-8 tracking-tight text-[#1A365D]">Create New Password</h1>
              <p className="mt-0.5 text-sm leading-5 text-[#59697D]">Choose a new password to restore secure access to your account.</p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-2 [&_label]:text-[#1A365D] [&>[role=alert]]:my-1 [&>[role=alert]]:py-1.5">
              <AuthField label="New password" htmlFor="individual-reset-password">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  maxLength={10}
                  disabled={loading}
                  id="individual-reset-password"
                  className={resetPasswordInputClass}
                  aria-invalid={Boolean(error)}
                  aria-required={true}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  className={resetPasswordToggleClass}
                >
                  {" "}
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}{" "}
                </button>
              </AuthField>
              <AuthField label="Confirm password" htmlFor="individual-reset-confirm-password">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  maxLength={10}
                  disabled={loading}
                  id="individual-reset-confirm-password"
                  className={resetPasswordInputClass}
                  aria-invalid={Boolean(error)}
                  aria-required={true}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className={resetPasswordToggleClass}
                >
                  {" "}
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}{" "}
                </button>
              </AuthField>
              <div className={resetPasswordRulesClass}>
                <AuthPasswordRules password={newPassword} confirmPassword={confirmPassword} reset />
              </div>
              <AuthNotice error={error} />
              <button
                type="submit"
                disabled={loading}
                className={resetPasswordPrimaryButtonClass}
                aria-busy={loading}
              >
                {loading && (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#122E52]/25 border-t-[#122E52] motion-reduce:animate-none"
                  />
                )}{" "}
                {loading ? "Resetting Password..." : "Reset Password"}
              </button>
              <div className="text-center">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className={resetPasswordLinkClass}
              >
                {" "}
                 Cancel Password Reset
              </button>
              </div>
            </form>
          </>
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


export default ResetPasswordPage;
