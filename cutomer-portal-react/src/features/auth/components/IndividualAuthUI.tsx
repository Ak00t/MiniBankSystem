import type { ReactNode } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

type AuthVariant = "login" | "otp" | "password" | "pin" | "recovery";

export function AuthWordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${inverse ? "text-white" : "text-[#08295C]"}`}>
      <svg aria-hidden="true" viewBox="0 0 40 42" className="h-9 w-9 shrink-0" fill="currentColor">
        <path d="M20 2 2 39l9-4 9-20 9 20 9 4L20 2Z" />
        <path d="m12 31 8-6 8 6-3 6-5-4-5 4-3-6Z" />
      </svg>
      <span className="text-xl font-bold tracking-tight">ACE Bank</span>
    </div>
  );
}

const panels: Record<AuthVariant, { title: string; description: string }> = {
  login: {
    title: "Welcome to better banking.",
    description:
      "Your everyday banking, thoughtfully connected. Secure access. Greater peace of mind.",
  },
  otp: {
    title: "Secure banking.\nA brighter tomorrow.",
    description:
      "Your security is our priority. An extra layer of verification helps protect what matters most.",
  },
  password: {
    title: "Your security.\nOur commitment.",
    description: "A strong password keeps your account safe and your banking secure.",
  },
  pin: {
    title: "Extra security for\nyour transactions.",
    description: "Protect your payments with a personal transaction PIN, known only to you.",
  },
  recovery: {
    title: "We're here\nto help you.",
    description: "A simple, secure way to restore access and get back to your everyday banking.",
  },
};

export function IndividualAuthCard({
  variant,
  children,
}: {
  variant: AuthVariant;
  children: ReactNode;
}) {
  const panel = panels[variant];
  return (
    <section className="isolate w-full max-w-[1080px] overflow-hidden rounded-[28px] border border-white/80 bg-[#08295C] shadow-[0_24px_80px_-32px_rgba(8,41,92,0.38)] md:rounded-[32px]">
      <div className="grid md:grid-cols-[0.88fr_1.12fr]">
        <aside
          className={`relative hidden min-h-[690px] overflow-hidden text-white md:flex md:flex-col ${variant === "login" ? "justify-end" : "justify-between"}`}
        >
          <img
            src="/images.jfif"
            alt={variant === "login" ? "ACE Bank Building" : ""}
            className={`absolute inset-0 h-full w-full object-cover ${variant === "login" ? "object-center" : "object-[center_70%]"}`}
          />
          <div
            className={`absolute inset-0 ${variant === "login" ? "bg-gradient-to-t from-[#041b3c] via-[#08295C]/55 to-[#08295C]/15" : "bg-gradient-to-b from-[#061d43] via-[#08295C]/95 to-[#08295C]/35"}`}
          />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[40px] border-cyan-400/5" />
          <div className={`relative p-9 lg:p-11 ${variant === "login" ? "pb-6" : ""}`}>
            <AuthWordmark inverse />
            <div className={variant === "login" ? "mt-44" : "mt-12"}>
              <div className="mb-5 h-1 w-10 rounded-full bg-[#06B6D4]" />
              <h2 className="whitespace-pre-line text-[30px] font-semibold leading-[1.25] tracking-tight lg:text-[34px]">
                {panel.title}
              </h2>
              <p className="mt-4 max-w-xs text-sm leading-6 text-blue-100/90">
                {panel.description}
              </p>
            </div>
          </div>
          <div className="relative space-y-4 bg-gradient-to-t from-[#041b3c]/95 to-transparent px-9 py-8 lg:px-11">
            {[
              [ShieldCheck, "Secure verification"],
              [WalletCards, "Safe transactions"],
              [CheckCircle2, "Your trusted banking partner"],
            ].map(([Icon, text]) => {
              const Mark = Icon as typeof ShieldCheck;
              return (
                <div
                  key={String(text)}
                  className="flex items-center gap-3 text-xs font-medium text-blue-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/5 text-cyan-300">
                    <Mark size={16} />
                  </span>
                  {String(text)}
                </div>
              );
            })}
          </div>
        </aside>
        <div className="bg-gradient-to-br from-[#123B72] to-[#08295C] p-3 sm:p-5 md:p-5 lg:p-6">
          <div className="flex h-full items-center rounded-[21px] border border-white/80 bg-white px-5 py-8 shadow-lg sm:px-9 sm:py-10 lg:px-11">
            <div className="w-full min-w-0">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AuthHeading({
  title,
  description,
  variant = "otp",
}: {
  title: string;
  description: ReactNode;
  variant?: AuthVariant;
}) {
  const Icon = variant === "otp" ? Mail : variant === "pin" ? LockKeyhole : KeyRound;
  return (
    <div className="mb-7 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] ring-8 ring-blue-50/40">
        <Icon aria-hidden="true" size={25} strokeWidth={1.8} />
      </span>
      <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#08295C] sm:text-[27px]">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function AuthSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol aria-label="Account security setup" className="mb-8 grid grid-cols-3">
      {["Verify email", "Change password", "Set PIN"].map((label, index) => (
        <li
          key={label}
          aria-current={current === index + 1 ? "step" : undefined}
          className="relative text-center"
        >
          {index < 2 && (
            <span
              aria-hidden="true"
              className={`absolute left-1/2 top-3.5 h-px w-full ${current > index + 1 ? "bg-blue-200" : "bg-slate-100"}`}
            />
          )}
          <span
            className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${current === index + 1 ? "bg-[#08295C] text-white ring-4 ring-blue-50" : current > index + 1 ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400"}`}
          >
            {current > index + 1 ? <Check aria-hidden="true" size={14} /> : index + 1}
          </span>
          <span
            className={`relative mt-2 block text-[10px] sm:text-[11px] ${current === index + 1 ? "font-semibold text-[#08295C]" : "text-slate-500"}`}
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function AuthField({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-xs font-semibold text-[#08295C]">
        {label}
      </label>
      <div className="relative">{children}</div>
      {hint && <p className="mt-2 text-xs leading-5 text-slate-400">{hint}</p>}
    </div>
  );
}

// One native input retains paste, autofill, selection, validation and keyboard behavior.
// The six cells are decorative; assistive technology encounters only the labelled input.
export function AuthCodeField({
  value,
  masked = false,
  children,
}: {
  value: string;
  masked?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="group relative w-full rounded-xl focus-within:ring-4 focus-within:ring-blue-100">
      <div aria-hidden="true" className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            className={`flex h-13 min-w-0 items-center justify-center rounded-lg border bg-white font-mono text-xl font-semibold text-[#08295C] transition sm:h-14 ${index === Math.min(value.length, 5) ? "border-blue-200 group-focus-within:border-[#2563EB] group-focus-within:shadow-[0_0_0_1px_#2563EB]" : "border-slate-200"}`}
          >
            {value[index] ? (masked ? "•" : value[index]) : ""}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}

export function AuthNotice({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
      className={`my-4 rounded-xl border px-4 py-3 text-sm leading-6 ${error ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}
    >
      {error || message}
    </div>
  );
}

export function AuthSecurityNote({
  children,
  title = "Secure banking",
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="mt-6 flex gap-3 rounded-xl border border-blue-50 bg-[#F3F7FB] p-4">
      <ShieldCheck aria-hidden="true" size={21} className="mt-0.5 shrink-0 text-[#2563EB]" />
      <div>
        <p className="text-xs font-semibold text-[#08295C]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{children}</p>
      </div>
    </div>
  );
}

export function AuthExpiryNote() {
  return (
    <p className="my-5 flex items-center justify-center gap-2 text-xs text-slate-500">
      <Clock3 aria-hidden="true" size={14} />
      Your verification code is valid for 5 minutes.
    </p>
  );
}

export function AuthPasswordRules({
  password,
  confirmPassword,
  reset = false,
}: {
  password: string;
  confirmPassword: string;
  reset?: boolean;
}) {
  const rules = [
    [
      reset ? "8–10 characters" : "At least 8 characters",
      password.length >= 8 && (!reset || password.length <= 10),
    ],
    ["At least one uppercase letter (A–Z)", /[A-Z]/.test(password)],
    ["At least one lowercase letter (a–z)", /[a-z]/.test(password)],
    ["At least one number (0–9)", /[0-9]/.test(password)],
    [
      "At least one special character",
      reset ? /[^A-Za-z0-9]/.test(password) : /[!@#$%^&*(),.?":{}|<>]/.test(password),
    ],
    ...(reset ? [["No whitespace", password.length > 0 && !/\s/.test(password)]] : []),
    ["Passwords match", password.length > 0 && password === confirmPassword],
  ] as const;
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <p className="mb-2.5 text-xs font-semibold text-[#08295C]">Password requirements</p>
      <ul className="space-y-1.5">
        {rules.map(([label, valid]) => (
          <li
            key={String(label)}
            className={`flex items-center gap-2 text-[11px] leading-4 ${valid ? "text-emerald-700" : "text-slate-500"}`}
          >
            <CheckCircle2
              aria-hidden="true"
              size={13}
              className={`shrink-0 ${valid ? "fill-emerald-600 text-white" : "text-slate-300"}`}
            />
            <span>
              {label}
              {valid && <span className="sr-only"> — met</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AuthPinRules({ pin, confirmPin }: { pin: string; confirmPin: string }) {
  return (
    <ul className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">
      {[
        ["Exactly 6 digits", /^\d{6}$/.test(pin)],
        ["PINs match", pin.length > 0 && pin === confirmPin],
      ].map(([label, valid]) => (
        <li
          key={String(label)}
          className={`flex items-center gap-2 ${valid ? "text-emerald-700" : ""}`}
        >
          <CheckCircle2
            aria-hidden="true"
            size={14}
            className={valid ? "text-emerald-600" : "text-slate-300"}
          />
          {String(label)}
        </li>
      ))}
    </ul>
  );
}

export function AuthSuccess({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-4 text-center">
      <CheckCircle2
        aria-hidden="true"
        className="mx-auto mb-5 h-16 w-16 rounded-full bg-emerald-50 p-3 text-emerald-600"
      />
      <h1 className="text-2xl font-bold tracking-tight text-[#08295C]">{title}</h1>
      <div className="mt-4 space-y-5 text-sm leading-6 text-slate-500">{children}</div>
    </div>
  );
}

export function AuthArrow() {
  return <ArrowRight aria-hidden="true" size={17} />;
}

// PIN recovery stays inside the existing protected route and timeout provider.
// On small screens its own surface covers the fixed dashboard chrome; the
// existing timeout modal (z-100) remains above this presentation layer (z-60).
export function AuthRecoveryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#F3F7FB] p-3 md:static md:z-auto md:overflow-visible md:bg-transparent md:p-0">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center">
        <div className="flex w-full items-center px-2 pb-5 pt-2 md:hidden">
          <AuthWordmark />
        </div>
        {children}
      </div>
    </div>
  );
}
