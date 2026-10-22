import {
  useState,
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

import PublicAuthLayout
  from "../components/PublicAuthLayout";
import { consumePendingPaymentRedirect } from "../utils/pendingPaymentRedirect";


import { IndividualAuthCard, AuthHeading, AuthField, AuthCodeField, AuthNotice, AuthSecurityNote, AuthExpiryNote, AuthArrow } from "../components/IndividualAuthUI";
import { authPrimaryButtonClass, authSecondaryButtonClass, authCodeInputClass } from "../components/IndividualAuthStyles";

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
    <PublicAuthLayout>
      <IndividualAuthCard variant="otp">
        <AuthHeading
          title="Verify your email"
          description={
            <>
              We've sent a 6-digit verification code to{" "}
              <strong className="font-semibold text-[#08295C]">
                {maskedEmail || "your registered email"}
              </strong>
              .
            </>
          }
          variant="otp"
        />
        <AuthField label="Verification code" htmlFor="individual-login-otp">
          <AuthCodeField value={otp}>
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
          </AuthCodeField>
        </AuthField>
        <AuthExpiryNote />
        <AuthNotice error={error} />
        <AuthNotice message={message} />
        <button
          type="button"
          onClick={handleVerifyOtp}
          disabled={verifying || resending || completed}
          className={authPrimaryButtonClass}
          aria-busy={verifying || resending || completed}
        >
          {verifying ||
            resending ||
            (completed && (
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none"
              />
            ))}{" "}
          {verifying ? "Verifying..." : "Verify OTP"} <AuthArrow />
        </button>
        {!completed && (
          <div className="mt-6 text-center">
            <p className="mb-2 text-xs text-slate-500">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={verifying || resending}
              className={authSecondaryButtonClass}
            >
              {" "}
              {resending ? "Sending..." : "Resend OTP"}{" "}
            </button>
          </div>
        )}
        <AuthSecurityNote title="Secure verification">
          This code will expire in 5 minutes. ACE Bank will never ask you to share your OTP by phone,
          message, or email.
        </AuthSecurityNote>
        {completed && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleTestProtectedApi}
              className={authSecondaryButtonClass}
            >
              Test Protected API
            </button>
            <AuthNotice message={testMessage} />
          </div>
        )}
      </IndividualAuthCard>
    </PublicAuthLayout>
  );

}


export default OtpPage;
