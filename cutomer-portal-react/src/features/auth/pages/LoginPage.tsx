import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound, WalletCards } from "lucide-react";

import {
  loginCustomer,
} from "../../../services/authService";

import { AuthField, AuthNotice } from "../components/IndividualAuthUI";

const loginInputClass =
  "block min-h-12 w-full rounded-xl border border-[#C5AF82] bg-white py-3 text-sm text-[#122E52] shadow-sm outline-none transition-colors placeholder:text-[#757575] hover:border-[#B89146] focus:border-[#122E52] focus:ring-4 focus:ring-[#56ABC0]/25 disabled:cursor-not-allowed disabled:bg-[#E5EAF0] disabled:text-[#757575] motion-reduce:transition-none";
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
    <div className="flex min-h-dvh items-center justify-center bg-[#E5EAF0] px-3 py-4 text-[#122E52] antialiased sm:px-6">
      <title>EKARAJ BANK | Personal Banking</title>
      <main className="grid w-full max-w-[1080px] overflow-hidden rounded-3xl border border-[#CDC0A8] bg-[#FAF9F7] shadow-[0_20px_65px_-28px_rgba(18,46,82,0.3)] md:grid-cols-[0.95fr_1.05fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#122E52] text-white md:flex">
          <img src="/images.jfif" alt="Bank building" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,46,82,0.94)_0%,rgba(18,46,82,0.5)_43%,rgba(209,177,112,0.12)_63%,rgba(18,46,82,0.96)_100%)]" />
          <div className="relative px-8 pt-9 lg:px-10">
            <p className="text-sm font-semibold tracking-[0.18em] text-[#E6D4B1]">EKARAJ BANK</p>
            <p className="mt-2 text-base text-white/90" lang="my">ဧကရာဇ်ဘဏ်</p>
            <div aria-hidden="true" className="my-7 h-px w-12 bg-[#D1B170]" />
            <h2 className="max-w-xs text-[32px] font-medium leading-tight tracking-tight lg:text-4xl">
              Your Trust.<br />Our Commitment.
            </h2>
            <p className="mt-4 flex items-center gap-2 text-sm text-white">
              <ShieldCheck aria-hidden="true" size={17} className="shrink-0 text-[#56ABC0]" />
              Secure Personal Banking
            </p>
          </div>
          <div className="relative space-y-3 px-8 pb-8 pt-32 lg:px-10">
            {[
              [ShieldCheck, "Secure verification"],
              [WalletCards, "Safe transactions"],
              [CheckCircle2, "Your trusted banking partner"],
            ].map(([Icon, text]) => {
              const Mark = Icon as typeof ShieldCheck;
              return (
                <p key={String(text)} className="flex items-center gap-3 text-xs text-white">
                  <Mark aria-hidden="true" size={17} className="shrink-0 text-[#D1B170]" />
                  {String(text)}
                </p>
              );
            })}
          </div>
        </aside>
        <section aria-label="Individual banking login" className="flex min-w-0 items-center px-5 py-6 sm:px-9 md:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="mb-4">
              {/* Original supplied PNG, including its metallic background. */}
              <img
                src="/assets/ekaraj-bank-logo.png"
                alt="EKARAJ BANK logo"
                width={1280}
                height={714}
                className="mx-auto mb-2 h-auto w-56 max-w-full object-contain"
                onError={(event) => { event.currentTarget.style.display = "none"; }}
              />
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-semibold tracking-[0.14em]">EKARAJ BANK</p>
                <p className="text-sm text-[#6B6B6B]" lang="my">ဧကရာဇ်ဘဏ်</p>
              </div>
              <p className="mb-2 mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#122E52]">
                EKARAJ Personal Banking
              </p>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#1A365D] sm:text-3xl">Welcome Back</h1>
              <p className="mt-2 text-sm leading-5 text-[#6B6B6B]">
                Login securely using your Customer ID or Account Number.
              </p>
            </div>
        <form onSubmit={handleLogin} autoComplete="off" className="space-y-2 [&_label]:text-[#122E52]">
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
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className={`${loginLinkClass} min-h-11 px-1 text-sm`}
            >
              Forgot password?
            </button>
          </div>
          <AuthNotice error={error} />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D1B170] px-5 py-3 text-sm font-semibold text-[#122E52] shadow-sm transition-colors hover:bg-[#B89146] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#122E52]/30 disabled:cursor-not-allowed disabled:border disabled:border-[#CDC0A8] disabled:bg-[#E5EAF0] disabled:text-[#122E52] motion-reduce:transition-none"
            aria-busy={loading}
          >
            {loading && (
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#122E52]/25 border-t-[#122E52] motion-reduce:animate-none"
              />
            )}{" "}
            {loading ? "Sending OTP..." : "Login"}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-center text-xs leading-5 text-[#6B6B6B]">
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
            <span className="font-semibold text-[#122E52]">Contact your bank</span>
          </p>
        </div>
        <div className="mt-4 flex gap-3 rounded-xl border border-[#CDC0A8] bg-white p-3">
          <ShieldCheck aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-[#122E52]" />
          <div>
            <p className="text-xs font-semibold">Your security comes first</p>
            <p className="mt-1 text-xs leading-4 text-[#757575]">
              For your security, never share your password or OTP with anyone.
            </p>
          </div>
        </div>

          </div>
        </section>
      </main>
    </div>
  );
}


export default LoginPage;
