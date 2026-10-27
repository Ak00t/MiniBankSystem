import {
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { Eye, EyeOff } from "lucide-react";

import {
  changeFirstLoginPassword,
} from "../../../services/authService";

import PublicAuthLayout
  from "../components/PublicAuthLayout";


import { IndividualAuthCard, AuthHeading, AuthSteps, AuthField, AuthNotice, AuthPasswordRules } from "../components/IndividualAuthUI";
import { authInputClass, authPrimaryButtonClass, authToggleButtonClass } from "../components/IndividualAuthStyles";

function ChangePasswordPage() {

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
    loading,
    setLoading,
  ] = useState(false);


  const navigate =
    useNavigate();


  // ======================================================
  // CHANGE FIRST LOGIN PASSWORD
  // ======================================================

  const handleChangePassword = async (
    e: FormEvent
  ) => {

    e.preventDefault();

    setError("");


    // =====================================
    // VALIDATION
    // =====================================

    if (
      !newPassword
      ||
      !confirmPassword
    ) {

      setError(
        "Please fill in all password fields."
      );

      return;

    }


    if (
      newPassword.length < 8
    ) {

      setError(
        "Password must be at least 8 characters."
      );

      return;

    }


    if (
      !/[A-Z]/.test(
        newPassword
      )
    ) {

      setError(
        "Password must contain at least one uppercase letter."
      );

      return;

    }


    if (
      !/[a-z]/.test(
        newPassword
      )
    ) {

      setError(
        "Password must contain at least one lowercase letter."
      );

      return;

    }


    if (
      !/[0-9]/.test(
        newPassword
      )
    ) {

      setError(
        "Password must contain at least one number."
      );

      return;

    }


    if (
      !/[!@#$%^&*(),.?":{}|<>]/.test(
        newPassword
      )
    ) {

      setError(
        "Password must contain at least one special character."
      );

      return;

    }


    if (
      newPassword !==
      confirmPassword
    ) {

      setError(
        "Passwords do not match."
      );

      return;

    }


    // =====================================
    // CHALLENGE ID
    // =====================================

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


    // =====================================
    // API CALL
    // =====================================

    try {

      setLoading(
        true
      );


      await changeFirstLoginPassword({

        challengeGroupId:
          challengeGroupId,

        newPassword:
          newPassword,

        confirmPassword:
          confirmPassword,

      });


      // Password change success
      // challengeGroupId ကို မဖျက်သေးပါ
      // Setup PIN မှာ ပြန်သုံးရမယ်

      navigate(
        "/first-login/setup-pin"
      );


    } catch (
      error: any
    ) {

      setError(

        error.response?.data?.message
        ||
        "Unable to change password."

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
      <IndividualAuthCard variant="password">
        <AuthSteps current={2} />
        <AuthHeading
          title="Create new password"
          description={"Choose a strong password to secure your ACE Bank account."}
          variant="password"
        />
        <form onSubmit={handleChangePassword} className="space-y-3">
          <AuthField label="New password" htmlFor="individual-new-password">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
              disabled={loading}
              id="individual-new-password"
              className={authInputClass}
              aria-invalid={Boolean(error)}
              aria-required={true}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              disabled={loading}
              aria-label={showNewPassword ? "Hide new password" : "Show new password"}
              className={authToggleButtonClass}
            >
              {" "}
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}{" "}
            </button>
          </AuthField>
          <AuthField label="Confirm password" htmlFor="individual-confirm-password">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              disabled={loading}
              id="individual-confirm-password"
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
          <AuthPasswordRules password={newPassword} confirmPassword={confirmPassword} />
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
            {loading ? (
              "Changing Password..."
            ) : (
              <>
                Continue to PIN Setup
              </>
            )}{" "}
          </button>
        </form>
      </IndividualAuthCard>
    </PublicAuthLayout>
  );

}


export default ChangePasswordPage;