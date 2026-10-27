import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { Clock3, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound, WalletCards } from "lucide-react";

import {
  loginCustomer,
} from "../../../services/authService";

import { AuthField, AuthNotice } from "../components/IndividualAuthUI";

const loginInputClass =
  "block min-h-11 w-full rounded-xl border border-[#CDD5DF] bg-white py-2.5 text-sm text-[#111418] shadow-sm outline-none transition-colors placeholder:text-[#757575] hover:border-[#C6A15B] focus:border-[#113E65] focus:ring-4 focus:ring-[#113E65]/15 disabled:cursor-not-allowed disabled:bg-[#E5EAF0] disabled:text-[#757575] motion-reduce:transition-none";
const loginLinkClass =
  "rounded-md font-semibold text-[#122E52] underline-offset-4 transition-colors hover:text-[#122E52] hover:underline decoration-[#B89146] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#56ABC0]/30 motion-reduce:transition-none";

function LoginPage() {

  // =====================================================
  // STATE
  // =====================================================

  const [
    loginIdentifier,
    setLoginIdentifier,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  // =====================================================
  // AUTOFILL CONTROL
  // =====================================================

  const [
    loginFieldEditable,
    setLoginFieldEditable,
  ] = useState(false);

  const [
    passwordFieldEditable,
    setPasswordFieldEditable,
  ] = useState(false);


  const navigate =
    useNavigate();


  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (
    e: FormEvent
  ) => {

    e.preventDefault();

    setError("");


    // Empty field validation

    if (
      !loginIdentifier ||
      !password
    ) {

      setError(
        "Please enter Customer ID / Account Number and password."
      );

      return;
    }


    try {

      setLoading(true);


      const response =
        await loginCustomer({

          loginIdentifier:
            loginIdentifier,

          password:
            password,

        });


      // Password correct → OTP required

      if (
        response.otpRequired
      ) {

        sessionStorage.setItem(
          "challengeGroupId",
          response.challengeGroupId
        );


        if (
          response.maskedEmail
        ) {

          sessionStorage.setItem(
            "maskedEmail",
            response.maskedEmail
          );

        }


        navigate(
          "/otp"
        );

      }


    } catch (error: any) {

      setError(

        error.response?.data?.message
        ||
        "Login failed. Please try again."

      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="flex min-h-dvh flex-col bg-[#E5EAF0] text-[#111418] antialiased">
      <title>EKARAJ BANK | Personal Banking</title>
      <header className="shrink-0 border-b border-[#C5AF82] bg-[#FAF9F7] text-[#1A365D]">
        <div className="mx-auto flex min-h-[55px] max-w-[1200px] items-center justify-between gap-3 px-3 py-1.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src="/assets/ekaraj-crown-transparent.png"
              alt=""
              aria-hidden="true"
              width={375}
              height={340}
              className="h-10 w-auto shrink-0 object-contain"
            />
            <p className="min-w-0 text-xs font-semibold leading-4 tracking-[0.02em] text-[#113E65] sm:text-sm sm:tracking-[0.06em]">Ekaraj Bank Customer Portal</p>
          </div>
          <p className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium leading-4 sm:gap-2 sm:text-xs">
            <ShieldCheck aria-hidden="true" size={18} className="shrink-0" />
            <span className="max-w-[88px] sm:max-w-none">Secure Personal Banking</span>
          </p>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-3 py-1.5 sm:px-6">
      <section aria-label="Individual login card" className="grid w-full max-w-[976px] rounded-3xl border border-[#CDC0A8] bg-[#F5F3EF] shadow-[0_18px_50px_-26px_rgba(18,46,82,0.3)] md:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden rounded-l-[23px] bg-[#E5EAF0] text-[#1A365D] md:flex">
          <img src="/assets/ekaraj-building-reference.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-[85%] w-[85%] object-cover object-[60%_70%] opacity-[0.1] [mask-image:radial-gradient(ellipse_at_75%_65%,#000_10%,transparent_80%)]" />
          <svg aria-hidden="true" focusable="false" viewBox="0 0 450 470" preserveAspectRatio="none" fill="none" className="pointer-events-none absolute inset-0 h-full w-full">
            <path d="M-70 85C95 35 120 300 330 285S500 215 520 150" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.35" />
            <path d="M-80 105C80 55 135 325 340 305S510 235 530 175" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.2" />
          </svg>
          <h2 className="relative px-6 pt-4 font-serif text-2xl font-medium leading-8 tracking-tight lg:px-7">
            Your Trust.<br />Our Commitment.
          </h2>
          <div aria-hidden="true" className="relative flex min-h-0 flex-1 items-center justify-center px-6 py-2">
            <img src="/assets/ekaraj-crown-transparent.png" alt="" width={375} height={340} className="h-auto w-40 max-w-full object-contain" />
          </div>
          <div className="relative space-y-2.5 px-6 pb-4 pt-2 lg:px-7">
            {[
              [ShieldCheck, "Secure Verification", "Your safety is our priority"],
              [WalletCards, "Safe Transactions", "Bank with confidence"],
              [Clock3, "Your Trusted Banking Partner", "Always by your side"],
            ].map(([Icon, title, description]) => {
              const Mark = Icon as typeof ShieldCheck;
              return (
                <div key={String(title)} className="flex items-start gap-3">
                  <Mark aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-[#C6A15B]" />
                  <div>
                    <p className="text-xs font-semibold leading-4 text-[#1A365D]">{String(title)}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-[#627084]">{String(description)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
        <section aria-label="Individual banking login" className="flex min-w-0 items-center px-5 py-3 sm:px-8 md:px-7 lg:px-9">
          <div className="mx-auto w-full max-w-[392px]">
            <div className="mb-4">
              <h1 className="font-serif text-2xl font-medium leading-8 tracking-tight text-[#1A365D]">Welcome Ekaraj Banking</h1>
              <p className="mt-0.5 text-sm leading-5 text-[#111418]">Login securely using your Customer ID or Account Number.</p>
              <div aria-hidden="true" className="mt-1 h-px w-10 bg-[#C6A15B]" />
            </div>
        <form onSubmit={handleLogin} autoComplete="off" className="space-y-2 [&_label]:text-[#111418] [&>div:first-child]:mb-4 [&>div:nth-child(2)]:mb-0.5 [&>div:nth-child(3)]:mb-0 [&>[role=alert]]:mt-1">
          <AuthField label="Customer ID / Account Number" htmlFor="individual-login-id">
            <UserRound aria-hidden="true" size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#757575]" />
            <input
              type="text"
              name="customerLookupValue"
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              onFocus={() => setLoginFieldEditable(true)}
              readOnly={!loginFieldEditable}
              placeholder="Enter Customer ID or Account Number"
              autoComplete="off"
              disabled={loading}
              id="individual-login-id"
              className={`${loginInputClass} pl-11 pr-4`}
              aria-invalid={Boolean(error)}
              aria-required={true}
            />
          </AuthField>
          <AuthField label="Password" htmlFor="individual-login-password">
            <LockKeyhole aria-hidden="true" size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#757575]" />
            <input
              type={showPassword ? "text" : "password"}
              name="customerSecretValue"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFieldEditable(true)}
              readOnly={!passwordFieldEditable}
              placeholder="Enter your password"
              autoComplete="new-password"
              disabled={loading}
              id="individual-login-password"
              className={`${loginInputClass} pl-11 pr-12`}
              aria-invalid={Boolean(error)}
              aria-required={true}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-1 inline-flex w-11 items-center justify-center rounded-lg text-[#757575] hover:text-[#122E52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#122E52]"
            >
              {" "}
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}{" "}
            </button>
          </AuthField>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className={`${loginLinkClass} inline-flex min-h-9 items-start px-1 pt-1 text-sm`}
            >
              Forgot password?
            </button>
          </div>
          <AuthNotice error={error} />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#113E65] bg-[#113E65] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow] hover:bg-[#092C4C] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#113E65]/30 disabled:cursor-not-allowed disabled:saturate-50 disabled:opacity-70 disabled:hover:bg-[#113E65] motion-reduce:transition-none"
            aria-busy={loading}
          >
            {loading && (
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white motion-reduce:animate-none"
              />
            )}{" "}
            {loading ? "Sending OTP..." : "Login"}
          </button>
        </form>

        <div className="mt-2 space-y-1 text-center text-xs leading-5 text-[#111418]">
          <p>
            Corporate Banking?{" "}
            <Link
              to="/corporate/login"
              className={loginLinkClass}
            >
              Corporate Login
            </Link>
          </p>
          <p>
            Don't have an account?{" "}
            <span className="font-semibold text-[#111418]">Contact your bank</span>
          </p>
        </div>
        <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-[#C6D5E3] bg-[#EAF2FA] p-2">
          <ShieldCheck aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-[#113E65]" />
          <div>
            <p className="text-xs font-semibold leading-4 text-[#1A365D]">Your security comes first.</p>
            <p className="mt-0.5 text-xs leading-4 text-[#627084]">For your security, never share your password or OTP with anyone.</p>
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


export default LoginPage;
