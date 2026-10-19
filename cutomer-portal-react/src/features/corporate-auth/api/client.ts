import axios, { type InternalAxiosRequestConfig } from "axios";
import type { CorporateTokens } from "../types";
import {
  assertCorporateGeneration, endCorporateSession, getCorporateAccessToken,
  getCorporateGeneration, getCorporateRefreshToken, isCorporateGenerationCurrent,
  saveCorporateTokens,
} from "../utils/storage";

const options = { baseURL: "http://localhost:8080/api/corporate", timeout: 10_000 };
const corporateApi = axios.create(options);
const refreshClient = axios.create(options);
interface CorporateRequest extends InternalAxiosRequestConfig {
  corporateGeneration?: number;
  corporateRetry?: boolean;
}
const isPublic = (url?: string) => Boolean(url && [
  "/auth/login", "/auth/verify-otp", "/auth/resend-otp", "/auth/refresh",
  "/auth/first-login/change-password", "/auth/first-login/setup-pin", "/auth/first-login/complete",
].includes(url));

corporateApi.interceptors.request.use(config => {
  const request = config as CorporateRequest;
  request.corporateGeneration ??= getCorporateGeneration();
  if (config.url !== "/auth/logout") assertCorporateGeneration(request.corporateGeneration);
  if (!isPublic(config.url)) {
    const token = getCorporateAccessToken();
    if (token && !(config.url === "/auth/logout" && config.headers.Authorization)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshLock: { generation: number; promise: Promise<string> } | null = null;
async function refreshCorporateAccess(generation: number) {
  assertCorporateGeneration(generation);
  if (refreshLock?.generation === generation) return refreshLock.promise;
  const promise = (async () => {
    const refreshToken = getCorporateRefreshToken();
    if (!refreshToken) throw new Error("Corporate refresh token is missing.");
    const { data } = await refreshClient.post<CorporateTokens & { success: boolean }>("/auth/refresh", { refreshToken });
    assertCorporateGeneration(generation);
    if (!data.success) throw new Error("Corporate session refresh failed.");
    saveCorporateTokens(data, generation, true);
    return data.accessToken;
  })();
  refreshLock = { generation, promise };
  try { return await promise; }
  finally { if (refreshLock?.promise === promise) refreshLock = null; }
}

corporateApi.interceptors.response.use(response => {
  const config = response.config as CorporateRequest;
  if (config.url !== "/auth/logout") assertCorporateGeneration(config.corporateGeneration!);
  return response;
}, async (error: unknown) => {
  if (!axios.isAxiosError(error)) return Promise.reject(error);
  const request = error.config as CorporateRequest | undefined;
  if (!request || isPublic(request.url) || request.url === "/auth/logout" || error.response?.status !== 401) {
    return Promise.reject(error);
  }
  const generation = request.corporateGeneration!;
  if (!isCorporateGenerationCurrent(generation)) return Promise.reject(error);
  if (error.response?.data?.code === "SESSION_EXPIRED" || request.corporateRetry) {
    endCorporateSession();
    return Promise.reject(error);
  }
  request.corporateRetry = true;
  try {
    const token = await refreshCorporateAccess(generation);
    assertCorporateGeneration(generation);
    request.headers.Authorization = `Bearer ${token}`;
    return corporateApi(request);
  } catch (refreshError) {
    if (isCorporateGenerationCurrent(generation)) endCorporateSession();
    return Promise.reject(refreshError);
  }
});

export function corporateErrorMessage(error: unknown, fallback = "Unable to complete Corporate authentication. Please try again.") {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "string" && data) return data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") return data.message;
    return fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export default corporateApi;
