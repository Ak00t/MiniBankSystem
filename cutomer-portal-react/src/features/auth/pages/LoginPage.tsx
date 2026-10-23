import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { Crown, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";

import {
  loginCustomer,
} from "../../../services/authService";

import { AuthField, AuthNotice, AuthSecurityNote } from "../components/IndividualAuthUI";
import { authInputClass, authLinkButtonClass, authToggleButtonClass } from "../components/IndividualAuthStyles";

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
    <div className="flex min-h-dvh items-center justify-center bg-[#F3F6FA] px-3 py-6 text-[#243247] antialiased sm:px-6">
      <main className="grid w-full max-w-[1080px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_26px_85px_-30px_rgba(11,31,58,0.28)] md:min-h-[620px] md:grid-cols-2 md:rounded-[32px]">
        {/* Branding belongs to the individual login only; shared auth and dashboard layouts stay untouched. */}
        <aside className="relative flex flex-col items-center justify-center overflow-hidden bg-[#0B1F3A] px-6 py-9 text-center text-white sm:px-10 md:min-h-full md:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full border border-[#C9A45C]/20" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 -right-24 h-96 w-96 rounded-full border border-[#36B6C5]/15" />
          <div className="relative flex flex-col items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[26px] border border-[#C9A45C]/60 bg-white/5 shadow-[0_0_45px_rgba(201,164,92,0.12)] sm:h-32 sm:w-32">
              <Crown aria-hidden="true" className="h-16 w-16 text-[#C9A45C] sm:h-20 sm:w-20" strokeWidth={1.2} />
            </div>
            <div className="mt-7 h-px w-20 bg-[#C9A45C]" />
            <p className="mt-6 text-3xl font-bold tracking-[0.12em] sm:text-4xl">EKARAJ BANK</p>
            <p className="mt-3 text-lg font-medium text-[#D9C18B]" lang="my">ဧကရာဇ်ဘဏ်</p>
            <p className="mt-5 text-sm tracking-[0.04em] text-slate-200">Your Trust. Our Commitment.</p>
            <div className="mt-7 flex items-center gap-2 text-xs font-medium text-[#A8DCE4]">
              <ShieldCheck aria-hidden="true" size={16} />
              Secure Personal Banking
            </div>
          </div>
        </aside>
        <section aria-label="Individual banking login" className="flex items-center bg-white px-5 py-8 sm:px-10 md:px-9 lg:px-14">
          <div className="w-full min-w-0">
            <div className="mb-5">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#C9A45C]/40 bg-[#F6F3EC] text-[#0B1F3A]">
                <Crown aria-hidden="true" size={26} strokeWidth={1.6} />
              </span>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#166D80]">
                EKARAJ Personal Banking
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[#0B1F3A]">Welcome Back</h1>
              <p className="mt-2 text-sm leading-5 text-slate-500">
                Login securely using your Customer ID or Account Number.
              </p>
            </div>
        <form onSubmit={handleLogin} autoComplete="off" className="space-y-3">
          <AuthField label="Customer ID / Account Number" htmlFor="individual-login-id">
            <UserRound aria-hidden="true" size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
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
              className={`${authInputClass} pl-11 pr-4 focus:border-[#36B6C5] focus:ring-[#36B6C5]/20`}
              aria-invalid={Boolean(error)}
              aria-required={true}
            />
          </AuthField>
          <AuthField label="Password" htmlFor="individual-login-password">
            <LockKeyhole aria-hidden="true" size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
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
              className={`${authInputClass} pl-11 pr-12 focus:border-[#36B6C5] focus:ring-[#36B6C5]/20`}
              aria-invalid={Boolean(error)}
              aria-required={true}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className={authToggleButtonClass}
            >
              {" "}
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}{" "}
            </button>
          </AuthField>
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className={authLinkButtonClass}
            >
              Forgot password?
            </button>
          </div>
          <AuthNotice error={error} />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0B1F3A]/20 transition hover:bg-[#163A63] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#36B6C5]/30 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            aria-busy={loading}
          >
            {loading && (
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none"
              />
            )}{" "}
            {loading ? "Sending OTP..." : "Login"}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-center text-xs leading-5 text-slate-500">
          <p>
            Corporate Banking?{" "}
            <Link
              to="/corporate/login"
              className="rounded font-semibold text-[#166D80] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#36B6C5]/20"
            >
              Corporate Login
            </Link>
          </p>
          <p>
            Don't have an account?{" "}
            <span className="font-semibold text-slate-600">Contact your bank</span>
          </p>
        </div>
        <AuthSecurityNote title="Your security comes first">
          For your security, never share your password or OTP with anyone.
        </AuthSecurityNote>

          </div>
        </section>
      </main>
    </div>
  );
}


export default LoginPage;
