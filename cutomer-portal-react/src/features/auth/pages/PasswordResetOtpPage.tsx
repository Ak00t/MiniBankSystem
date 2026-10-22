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

import PublicAuthLayout
  from "../components/PublicAuthLayout";


import { IndividualAuthCard, AuthHeading, AuthField, AuthCodeField, AuthNotice, AuthSecurityNote, AuthExpiryNote } from "../components/IndividualAuthUI";
import { authPrimaryButtonClass, authSecondaryButtonClass, authLinkButtonClass, authCodeInputClass } from "../components/IndividualAuthStyles";

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
    <PublicAuthLayout>
      <IndividualAuthCard variant="otp">
        <AuthHeading
          title="Verify your email"
          description={
            <>
              Enter the 6-digit code sent to{" "}
              <strong className="font-semibold text-[#08295C]">
                {maskedEmail || "your registered email"}
              </strong>{" "}
              to reset your password.
            </>
          }
          variant="otp"
        />
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <AuthField label="Verification code" htmlFor="individual-recovery-otp">
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
          </AuthField>
          <AuthExpiryNote />
          <AuthNotice error={error} />
          <AuthNotice message={message} />
          <button
            type="submit"
            disabled={loading || resending}
            className={authPrimaryButtonClass}
            aria-busy={loading || resending}
          >
            {loading ||
              (resending && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none"
                />
              ))}{" "}
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        <div className="mt-3 text-center">
          <p className="mb-2 text-xs text-slate-500">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading || resending}
            className={authSecondaryButtonClass}
          >
            {" "}
            {resending ? "Sending..." : "Resend OTP"}{" "}
          </button>
        </div>
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={handleBack}
            disabled={loading || resending}
            className={authLinkButtonClass}
          >
            {" "}
             Back to Password Recovery
          </button>
        </div>
        <AuthSecurityNote title="Secure verification">
          Your verification code is valid for 5 minutes. Do not share it with anyone.
        </AuthSecurityNote>
      </IndividualAuthCard>
    </PublicAuthLayout>
  );

}


export default PasswordResetOtpPage;