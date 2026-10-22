import {
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { ArrowLeft } from "lucide-react";

import {
  requestPasswordReset,
} from "../../../services/authService";

import PublicAuthLayout
  from "../components/PublicAuthLayout";


import { IndividualAuthCard, AuthHeading, AuthField, AuthNotice, AuthSecurityNote, AuthArrow } from "../components/IndividualAuthUI";
import { authInputClass, authPrimaryButtonClass, authLinkButtonClass } from "../components/IndividualAuthStyles";

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
    <PublicAuthLayout>
      <IndividualAuthCard variant="recovery">
        <AuthHeading
          title="Forgot your password?"
          description={
            "Enter your Customer ID or Account Number. We will send a verification code to your registered email."
          }
          variant="recovery"
        />
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
          <AuthField label="Customer ID / Account Number" htmlFor="individual-recovery-id">
            <input
              type="text"
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="Enter Customer ID or Account Number"
              autoComplete="off"
              disabled={loading}
              id="individual-recovery-id"
              className={authInputClass}
              aria-invalid={Boolean(error)}
              aria-required={true}
            />
          </AuthField>
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
            {loading ? "Sending OTP..." : "Continue"} <AuthArrow />
          </button>
          <div className="border-t border-slate-100 pt-5 text-center">
            <p className="mb-2 text-xs text-slate-500">Remember your password?</p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={loading}
              className={authLinkButtonClass}
            >
              {" "}
              <ArrowLeft size={17} /> Back to Login
            </button>
          </div>
        </form>
        <AuthSecurityNote title="Secure account recovery">
          Verification codes are sent only to the email address registered with your ACE Bank account.
        </AuthSecurityNote>
      </IndividualAuthCard>
    </PublicAuthLayout>
  );

}


export default ForgotPasswordPage;