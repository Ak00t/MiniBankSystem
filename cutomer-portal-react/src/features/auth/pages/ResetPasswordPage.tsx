import {
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { Eye, EyeOff } from "lucide-react";

import {
  confirmPasswordReset,
} from "../../../services/authService";

import PublicAuthLayout
  from "../components/PublicAuthLayout";


import { IndividualAuthCard, AuthHeading, AuthField, AuthNotice, AuthPasswordRules, AuthSuccess } from "../components/IndividualAuthUI";
import { authInputClass, authPrimaryButtonClass, authLinkButtonClass, authToggleButtonClass } from "../components/IndividualAuthStyles";

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
    <PublicAuthLayout>
      <IndividualAuthCard variant="password">
        {success ? (
          <AuthSuccess title="Password reset successful">
            <p role="status">{success}</p>
            <p>You can now sign in to your ACE Bank account using your new password.</p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={authPrimaryButtonClass}
            >
              Back to Login
            </button>
          </AuthSuccess>
        ) : (
          <>
            <AuthHeading
              title="Create new password"
              description={"Choose a new password to restore secure access to your account."}
              variant="password"
            />
            <form onSubmit={handleResetPassword} className="space-y-3">
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
                  className={authInputClass}
                  aria-invalid={Boolean(error)}
                  aria-required={true}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  className={authToggleButtonClass}
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
                  className={authInputClass}
                  aria-invalid={Boolean(error)}
                  aria-required={true}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className={authToggleButtonClass}
                >
                  {" "}
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}{" "}
                </button>
              </AuthField>
              <AuthPasswordRules password={newPassword} confirmPassword={confirmPassword} reset />
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
                {loading ? "Resetting Password..." : "Reset Password"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className={authLinkButtonClass}
              >
                {" "}
                 Cancel Password Reset
              </button>
            </form>
          </>
        )}
      </IndividualAuthCard>
    </PublicAuthLayout>
  );

}


export default ResetPasswordPage;