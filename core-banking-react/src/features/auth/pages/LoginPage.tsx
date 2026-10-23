import { useState, type FormEvent, useEffect, type KeyboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginThunk } from '../authSlice';
import Input from '../../../components/common/Input';
import hirokiEmblem from '../../../assets/hiroki-emblem.png';
import hirokiHeroCard from '../../../assets/hiroki-hero-card.png';

const REMEMBERED_USER_KEY = 'hiroki_remembered_username';

export default function LoginPage() {
  const { login, isLoading, error, isAuthenticated, dismissError } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(() => {
    return localStorage.getItem(REMEMBERED_USER_KEY) || '';
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return Boolean(localStorage.getItem(REMEMBERED_USER_KEY));
  });
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  // If already authenticated, redirect immediately to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors on change
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (error) dismissError();
    if (fieldErrors.username) setFieldErrors((e) => ({ ...e, username: undefined }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (error) dismissError();
    if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const validate = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) errors.username = 'Email or Username is required.';
    if (!password) errors.password = 'Password is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    if (rememberMe) {
      localStorage.setItem(REMEMBERED_USER_KEY, username.trim());
    } else {
      localStorage.removeItem(REMEMBERED_USER_KEY);
    }

    const result = await login({ username: username.trim(), password });

    if (loginThunk.fulfilled.match(result)) {
      navigate('/admin/dashboard', { replace: true });
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden bg-gradient-to-br from-[#faf7f2] via-[#f5efe4] to-[#ece3d4] p-4 sm:p-6 lg:p-10 select-none">
      {/* ============================================================ */}
      {/* Soft Ambient Light Orbs with Pure Luxury Gold Theme          */}
      {/* ============================================================ */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Warm champagne gold aura */}
        <div className="animate-orb-a absolute -top-24 -right-24 h-[650px] w-[650px] rounded-full bg-gradient-to-br from-amber-400/25 via-yellow-200/15 to-transparent blur-3xl" />
        {/* Honey gold & warm amber aura */}
        <div className="animate-orb-b absolute -bottom-28 -left-28 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-300/15 to-transparent blur-3xl" />
        {/* Soft center ambient golden glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-amber-100/35 blur-[130px] pointer-events-none" />
        {/* Subtle luxury architectural grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#d4af3710_1px,transparent_1px),linear-gradient(to_bottom,#d4af3710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* ============================================================ */}
      {/* Main Split-Screen Canvas Container                           */}
      {/* ============================================================ */}
      <div className="relative z-10 w-full max-w-6xl min-h-[680px] rounded-[36px] bg-white/92 backdrop-blur-2xl shadow-[0_30px_90px_-15px_rgba(180,135,60,0.15),0_0_0_1px_rgba(255,255,255,0.95)] border border-amber-100/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: Clean Form Panel (6 of 12 columns)              */}
        {/* ============================================================ */}
        <div className="lg:col-span-6 flex flex-col justify-between p-8 sm:p-12 lg:p-14">
          <div>
            {/* Brand Logo Header: Clean Emblem + HIROKI Banking */}
            <div className="flex items-center gap-3 mb-7">
              <img
                src={hirokiEmblem}
                alt="Hiroki Logo"
                className="h-9 w-auto object-contain select-none drop-shadow-[0_2px_8px_rgba(198,159,75,0.35)]"
              />
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-widest text-[#1e293b]">
                  HIROKI
                </span>
                <span className="text-[9px] font-bold tracking-[0.22em] text-[#b88c3a] -mt-1 uppercase">
                  Banking
                </span>
              </div>
            </div>

            {/* Heading in Warm Gold */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-[26px] font-bold text-[#9e7b44] tracking-tight">
                Sign in to Hiroki Banking
              </h1>
              <p className="mt-1 text-xs text-stone-500 font-normal">
                Staff & Client Portal — Enter your credentials to continue
              </p>
            </div>

            {/* Server Error Alert */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 p-3.5 transition-all shadow-sm"
              >
                <svg
                  className="h-5 w-5 text-red-500 shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-800">Authentication Failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={dismissError}
                  className="shrink-0 text-red-400 hover:text-red-600 focus:outline-none"
                  aria-label="Dismiss error message"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email / Username Input with Mail Icon */}
              <Input
                label="Email / Username"
                id="email-username"
                type="text"
                placeholder="Email / Username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                error={fieldErrors.username}
                autoComplete="username"
                disabled={isLoading}
                leadingIcon={
                  <svg className="h-5 w-5 text-amber-800/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                }
              />

              {/* Password Input with Lock Icon */}
              <div>
                <Input
                  label="Password"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyDown}
                  error={fieldErrors.password}
                  showPasswordToggle
                  autoComplete="current-password"
                  disabled={isLoading}
                  leadingIcon={
                    <svg className="h-5 w-5 text-amber-800/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  }
                />
                {capsLockActive && (
                  <p className="mt-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Caps Lock is ON
                  </p>
                )}
              </div>

              {/* Utility Row: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500/30 accent-[#c69f4b]"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-medium text-stone-500 hover:text-[#9e7b44] transition-colors focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Champagne Gold Gradient Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative group w-full py-3.5 px-4 rounded-xl font-semibold text-stone-900 bg-gradient-to-r from-[#c69f4b] via-[#ecd599] to-[#b88c3a] hover:from-[#d4af58] hover:via-[#fae8b8] hover:to-[#c69a42] active:scale-[0.99] transition-all duration-200 shadow-md shadow-amber-900/20 hover:shadow-lg hover:shadow-amber-900/25 focus:outline-none focus:ring-2 focus:ring-amber-500/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden border border-amber-300/40"
                >
                  {/* Light sheen sweep */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                  
                  {isLoading && (
                    <svg className="h-4 w-4 animate-spin text-stone-900" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
                </button>
              </div>

              {/* Don't have an account / Setup */}
              <p className="pt-2 text-center text-xs text-stone-500">
                Don't have an account?{' '}
                <Link
                  to="/setup-password"
                  className="font-semibold text-[#8c672b] hover:text-[#b88c3a] hover:underline transition-colors"
                >
                  Sign up
                </Link>
              </p>

              {/* Social / SSO Auth Pills */}
              <div className="pt-3 flex items-center justify-center gap-4">
                {/* Google */}
                <button
                  type="button"
                  title="Sign in with Google"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/80 bg-white shadow-sm hover:bg-gray-50 hover:shadow-md transition-all focus:outline-none"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </button>

                {/* GitHub */}
                <button
                  type="button"
                  title="Sign in with GitHub"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/80 bg-white shadow-sm hover:bg-gray-50 hover:shadow-md transition-all focus:outline-none"
                >
                  <svg className="h-5 w-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  title="Sign in with Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-100/90 bg-white shadow-sm hover:bg-amber-50/50 hover:border-amber-300 hover:shadow-md transition-all focus:outline-none"
                >
                  <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Secure Footer Note */}
          <div className="mt-8 pt-5 border-t border-amber-100/80 flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1.5 text-stone-500">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Hiroki Gold Standard Security • Active
            </span>
            <span className="flex items-center gap-1 font-mono text-stone-400">
              <svg className="h-3 w-3 text-amber-600/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              TLS 1.3 • 256-bit Encrypted
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Static Luxury Glass Showcase                   */}
        {/* ============================================================ */}
        <div className="hidden lg:col-span-6 lg:flex relative overflow-hidden p-8 items-center justify-center">
          {/* Card Container (Clean, Crisp & Still) */}
          <div className="relative w-full h-full max-h-[640px] rounded-[32px] overflow-hidden shadow-[0_20px_50px_-15px_rgba(180,135,60,0.22)] border border-amber-100/70">
            {/* The Silk & Glassmorphism Showcase Hero Image */}
            <img
              src={hirokiHeroCard}
              alt="Hiroki Banking Showcase"
              className="w-full h-full object-cover object-center pointer-events-none select-none"
            />

            {/* Breathing Golden Ambient Backlight behind the 3D Crest Logo */}
            <div className="animate-gold-backlight absolute top-[27%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 rounded-full bg-gradient-to-r from-amber-400/50 via-yellow-300/60 to-amber-500/50 pointer-events-none mix-blend-screen" />
            <div className="animate-gold-backlight absolute top-[27%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-gradient-to-r from-amber-200/70 via-yellow-100/80 to-amber-300/70 pointer-events-none mix-blend-screen blur-md" />

            {/* Crisp Glass Inner Border Highlight with Warm Gold Accent */}
            <div className="absolute inset-0 rounded-[32px] ring-1 ring-inset ring-amber-200/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Forgot Password Modal Dialog                                 */}
      {/* ============================================================ */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-amber-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="text-base font-semibold text-stone-900">
                Staff Credential Assistance
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-stone-400 hover:text-stone-600 focus:outline-none"
              >
                ✕
              </button>
            </div>
            <div className="py-4 text-xs text-stone-600 space-y-2.5">
              <p>
                In compliance with Core Banking security regulations, password resets require verification from a System Administrator or an active security setup token.
              </p>
              <p>
                If you have an invitation token, you can activate your credentials directly via the Setup Portal.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 focus:outline-none"
              >
                Dismiss
              </button>
              <Link
                to="/setup-password"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#c69f4b] via-[#ecd599] to-[#b88c3a] text-stone-900 hover:brightness-105 transition-all shadow-sm"
              >
                Go to Setup Portal →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
