import api from "../config/api";

import type {
  LoginRequest,
  LoginResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  ChangePasswordRequest,
  SetupPinRequest,
  ResendOtpRequest,
  ResendOtpResponse,

  PasswordResetRequest,
  PasswordResetStartResponse,
  PasswordResetOtpVerifyRequest,
  PasswordResetOtpVerifyResponse,
  PasswordResetConfirmRequest,

  PinResetStartResponse,
  PinResetOtpVerifyRequest,
  PinResetOtpVerifyResponse,
  PinResetConfirmRequest,
} from "../types/auth";


// ======================================================
// LOGIN
// POST /api/customer/auth/login
// ======================================================

export const loginCustomer = async (
  data: LoginRequest
): Promise<LoginResponse> => {

  const response =
    await api.post<LoginResponse>(
      "/auth/login",
      data
    );

  return response.data;
};


// ======================================================
// VERIFY OTP
// POST /api/customer/auth/verify-otp
// ======================================================

export const verifyOtp = async (
  data: OtpVerifyRequest
): Promise<OtpVerifyResponse> => {

  const response =
    await api.post<OtpVerifyResponse>(
      "/auth/verify-otp",
      data
    );

  return response.data;
};