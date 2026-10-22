import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { Eye, EyeOff } from "lucide-react";

import {
  loginCustomer,
} from "../../../services/authService";

import PublicAuthLayout
  from "../components/PublicAuthLayout";


import { IndividualAuthCard, AuthField, AuthNotice, AuthSecurityNote } from "../components/IndividualAuthUI";
import { authInputClass, authPrimaryButtonClass, authLinkButtonClass, authToggleButtonClass } from "../components/IndividualAuthStyles";

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
    <PublicAuthLayout>
      <IndividualAuthCard variant="login">
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-600">
            ACE Bank
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#08295C]">Welcome!</h1>
          <p className="mt-2 text-sm leading-5 text-slate-500">
            Login securely using your Customer ID or Account Number.
          </p>
        </div>
        <form onSubmit={handleLogin} autoComplete="off" className="space-y-3">
          <AuthField label="Customer ID / Account Number" htmlFor="individual-login-id">
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
              className={authInputClass}
              aria-invalid={Boolean(error)}
              aria-required={true}
            />
          </AuthField>
          <AuthField label="Password" htmlFor="individual-login-password">
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
              className={authInputClass}
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
            className={authPrimaryButtonClass}
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
              className="rounded font-semibold text-cyan-600 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100"
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
      </IndividualAuthCard>
    </PublicAuthLayout>
  );
}


export default LoginPage;