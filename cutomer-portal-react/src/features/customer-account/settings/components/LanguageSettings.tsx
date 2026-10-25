import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAppDispatch, useAppSelector } from "../../../../lib/redux";
import { setLanguage } from "../store/SettingsSlice";
import { saveLanguage } from "../utils/SettingsStorage";
import type { LanguagePreference } from "../types/settingsTypes";
import SettingsSection from "./SettingsSection";

const languages: {
  value: LanguagePreference;
  labelKey: string;
  defaultLabel: string;
  descKey: string;
  defaultDesc: string;
  badge: string;
}[] = [
  {
    value: "en",
    labelKey: "english",
    defaultLabel: "English",
    descKey: "englishDesc",
    defaultDesc: "English (US)",
    badge: "EN",
  },
  {
    value: "my",
    labelKey: "myanmar",
    defaultLabel: "မြန်မာ",
    descKey: "myanmarDesc",
    defaultDesc: "Myanmar (Burmese)",
    badge: "MY",
  },
];

export default function LanguageSettings() {
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.settings.language);
  const { t, i18n } = useTranslation("settings");

  async function handleLanguageChange(nextLanguage: LanguagePreference) {
    if (i18n.resolvedLanguage === nextLanguage) {
      dispatch(setLanguage(nextLanguage));
      saveLanguage(nextLanguage);
      return;
    }

    try {
      await i18n.changeLanguage(nextLanguage);
      dispatch(setLanguage(nextLanguage));
      saveLanguage(nextLanguage);
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  }

  return (
    <SettingsSection
      title={t("language", { defaultValue: "Language" })}
      description={t("languageDescription", {
        defaultValue: "Choose your preferred language",
      })}
    >
      <div>
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {t("displayLanguage", { defaultValue: "Display language" })}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {t("displayLanguageDesc", {
            defaultValue:
              "Select the language you want to use across the banking portal.",
          })}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {languages.map((item) => {
          const selected = language === item.value;

          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={selected}
              onClick={() => void handleLanguageChange(item.value)}
              className={[
                "relative flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-colors cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A3C4] focus-visible:ring-offset-2",
                selected
                  ? "border-[#00A3C4] bg-cyan-50/70 dark:border-blue-400 dark:bg-blue-950/40"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              <span
                className={[
                  "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  selected
                    ? "bg-cyan-100 text-[#00A3C4] dark:bg-blue-900 dark:text-blue-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                ].join(" ")}
              >
                {item.badge}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  {t(item.labelKey, { defaultValue: item.defaultLabel })}
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {t(item.descKey, { defaultValue: item.defaultDesc })}
                </span>
              </span>

              {selected && (
                <Check
                  size={18}
                  className="shrink-0 text-[#00A3C4] dark:text-blue-400 mt-1"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}
