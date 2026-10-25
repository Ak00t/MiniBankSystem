import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import type { DashboardAccount } from "../types/dashboardTypes";
import {
  EkararjCrown,
  EbMonogram,
  CrownEmbossedWatermark,
} from "../../../../components/common/EkararjLogo";
import { useAppSelector, type RootState } from "../../../../lib/redux";

interface BankCardProps {
  account: DashboardAccount;
  accountName?: string;
  index?: number;
  showBalance?: boolean;
  onToggleBalance?: () => void;
  className?: string;
  isLink?: boolean;
  onClick?: () => void;
}

export interface EkararjCardTheme {
  id: string;
  name: string;
  cardClass: string;
  themeType: "platinum" | "navy" | "gold" | "obsidian";
  textMode: "dark" | "light";
  embossedClass: string;
}

export const EKARARJ_CARD_THEMES: EkararjCardTheme[] = [
  // 1. Brushed Platinum Silver (Reference photo hero card)
  {
    id: "platinum",
    name: "Platinum Silver",
    cardClass: "card-brushed-platinum border border-slate-300/80 shadow-xl",
    themeType: "platinum",
    textMode: "dark",
    embossedClass: "embossed-text-silver",
  },
  // 2. Royal Sapphire Navy (Ekararj Signature Navy)
  {
    id: "navy",
    name: "Sapphire Navy",
    cardClass: "card-brushed-navy border border-blue-900/60 shadow-xl",
    themeType: "navy",
    textMode: "light",
    embossedClass: "embossed-text-navy",
  },
  // 3. Titanium Champagne Gold (Ekararj Gold VIP)
  {
    id: "gold",
    name: "Titanium Gold",
    cardClass: "card-brushed-gold border border-amber-300/70 shadow-xl",
    themeType: "gold",
    textMode: "dark",
    embossedClass: "embossed-text-gold",
  },
  // 4. Obsidian Black Diamond
  {
    id: "obsidian",
    name: "Black Diamond",
    cardClass: "card-brushed-obsidian border border-slate-700/80 shadow-xl",
    themeType: "obsidian",
    textMode: "light",
    embossedClass: "embossed-text-navy",
  },
];

export function formatBalance(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Returns clean masked account number for card display
 * DB 10 digits format: '••••  •••  568'
 */
export function formatHashedCardNumber(accountNumber: string): string {
  if (!accountNumber) return "••••  •••  •••";
  const cleaned = accountNumber.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `••••  •••  ${cleaned.slice(7, 10)}`;
  }

  if (cleaned.length === 16) {
    return `••••  ••••  ••••  ${cleaned.slice(12, 16)}`;
  }

  const last4 = cleaned.length >= 4 ? cleaned.slice(-4) : cleaned;
  return `•••••• ${last4}`;
}

export default function BankCard({
  account,
  accountName,
  index = 0,
  showBalance = true,
  onToggleBalance,
  className = "",
  isLink = true,
  onClick,
}: BankCardProps) {
  const [copied, setCopied] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(showBalance);

  useEffect(() => {
    setIsBalanceVisible(showBalance);
  }, [showBalance]);

  // Resolve customer name from props, account, or Redux state
  const reduxFullName = useAppSelector((state: RootState) => {
    const profile = state.profile?.profile;
    if (profile) {
      if (profile.firstName || profile.lastName) {
        return `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
      }
      if (profile.companyName) {
        return profile.companyName;
      }
    }
    return state.dashboard?.data?.fullName || null;
  });

  const customerDisplayName = (
    accountName ||
    (account as unknown as { accountName?: string }).accountName ||
    reduxFullName ||
    "EKARARJ CUSTOMER"
  ).toUpperCase();

  const theme = EKARARJ_CARD_THEMES[index % EKARARJ_CARD_THEMES.length];
  const isLightText = theme.textMode === "light";

  const accountTypeLabel =
    account.accountType?.toUpperCase() === "SAVINGS"
      ? "SAVINGS ACCOUNT"
      : "CURRENT ACCOUNT";

  const hashedCardNumber = formatHashedCardNumber(account.accountNumber);

  const handleToggleEye = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBalanceVisible((prev) => !prev);
    if (onToggleBalance) {
      onToggleBalance();
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const cardInner = (
    <>
      {/* 1. Embossed Watermark Crown Silhouettes & 3D Emblem in Background */}
      <CrownEmbossedWatermark theme={theme.themeType} />

      {/* 2. TOP ROW: 'EB' Monogram + 'EKARARJ BANK' on Left, Official 3D Crown on Right */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {/* 3D Metallic Cyan 'EB' */}
          <EbMonogram size={34} />

          <div>
            <h3
              className={`text-[15px] sm:text-[16px] font-black tracking-wide leading-none ${
                isLightText
                  ? "text-white drop-shadow-sm"
                  : "text-[#0A192F] drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
              }`}
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              EKARARJ BANK
            </h3>
          </div>
        </div>

        {/* Official 3D Crown Logo */}
        <div className="flex items-center gap-2">
          <EkararjCrown size={42} />
        </div>
      </div>

      {/* 3. MIDDLE: Real-World Digital Bank Available Balance with Eye Toggle */}
      <div className="relative z-10 my-auto py-1 space-y-1">
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
              isLightText ? "text-cyan-200/90" : "text-slate-500"
            }`}
          >
            Available Balance
          </span>

          {/* Eye Toggle button for Balance */}
          <button
            type="button"
            onClick={handleToggleEye}
            className={`rounded-lg p-1 transition-colors ${
              isLightText
                ? "text-white/75 hover:bg-white/20 hover:text-white"
                : "text-slate-500 hover:bg-slate-200/60 hover:text-[#0A192F]"
            } focus:outline-none`}
            title={isBalanceVisible ? "Hide balance" : "Show balance"}
            aria-label={isBalanceVisible ? "Hide balance" : "Show balance"}
          >
            {isBalanceVisible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isLightText ? "text-white" : "text-[#0A192F]"
            }`}
          >
            {isBalanceVisible ? (
              <>
                <span
                  className={`mr-1.5 text-xs sm:text-sm font-extrabold ${
                    isLightText ? "text-cyan-300" : "text-[#00A3C4]"
                  }`}
                >
                  {account.currency || "MMK"}
                </span>
                {formatBalance(account.availableBalance ?? 0)}
              </>
            ) : (
              <span className="tracking-widest">••••••••••</span>
            )}
          </span>
        </div>
      </div>

      {/* 4. LOWER BODY: Hashed Account Number & Account Holder Name */}
      <div className="relative z-10 pt-1 space-y-1">
        <div className="flex items-center justify-between">
          {/* Hashed 10-digit DB Account Number */}
          <p
            className={`font-mono text-[15px] sm:text-[16.5px] font-black tracking-[0.2em] ${theme.embossedClass}`}
            style={{ letterSpacing: "0.2em" }}
          >
            {hashedCardNumber}
          </p>

          {/* 1-Click Copy Account Number */}
          <button
            type="button"
            onClick={handleCopy}
            className={`rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 ${
              isLightText
                ? "text-white/80 hover:bg-white/20"
                : "text-slate-500 hover:bg-slate-200/60"
            }`}
            title="Copy account number"
          >
            {copied ? (
              <Check size={13} className="text-emerald-500 font-bold" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        </div>

        {/* Account Holder Name */}
        <p
          className={`truncate font-mono text-[11px] sm:text-xs font-bold tracking-[0.16em] uppercase ${
            isLightText
              ? "text-white/90 drop-shadow-xs"
              : "text-slate-700 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
          }`}
          style={{ letterSpacing: "0.16em" }}
        >
          {customerDisplayName}
        </p>
      </div>

      {/* 5. BOTTOM ROW: Account Type Badge */}
      <div className="relative z-10 flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/10">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${
            isLightText
              ? "bg-white/15 text-cyan-200 border border-white/20"
              : "bg-[#0A192F]/10 text-[#0A192F] border border-[#0A192F]/15"
          }`}
        >
          {accountTypeLabel}
        </span>
      </div>
    </>
  );

  const cardClasses = `group relative flex h-[225px] sm:h-[235px] w-full min-w-[320px] max-w-[400px] shrink-0 flex-col justify-between overflow-hidden rounded-[26px] p-5 sm:p-6 select-none transition-all duration-300 ${
    isLink ? "hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer" : ""
  } ${theme.cardClass} ${className}`;

  if (!isLink) {
    return (
      <div
        className={cardClasses}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {cardInner}
      </div>
    );
  }

  return (
    <Link
      to="/accounts"
      state={{ accountNumber: account.accountNumber }}
      title="Click to view full account details"
      className={cardClasses}
      onClick={onClick}
    >
      {cardInner}
    </Link>
  );
}
