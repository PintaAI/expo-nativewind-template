import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  convertFromIdr,
  convertToIdr,
  formatCurrencyAmount,
  getCurrencyOption,
  getDenominations,
  type CurrencyOption,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: string;
  option: CurrencyOption;
  isIdr: boolean;
  format: (amountIdr: number, options?: { compact?: boolean }) => string;
  toIdr: (displayAmount: number) => number;
  toDisplay: (amountIdr: number) => number;
  setCurrency: (code: string) => void;
  denominations: number[];
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const DEFAULT_RATES_FROM_IDR: Record<string, number> = {
  IDR: 1,
  KRW: 0.087,
  JPY: 0.0094,
  VND: 1.6,
  USD: 0.000061,
  EUR: 0.000052,
  GBP: 0.000045,
  SGD: 0.000078,
  AUD: 0.000092,
  MYR: 0.00026,
  CNY: 0.00044,
  THB: 0.002,
  PHP: 0.0035,
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState("IDR");
  const rate = DEFAULT_RATES_FROM_IDR[currency] ?? 1;

  const value = useMemo<CurrencyContextValue>(() => {
    const option = getCurrencyOption(currency);

    return {
      currency,
      option,
      isIdr: currency === "IDR",
      format: (amountIdr, options) => {
        const converted = convertFromIdr(amountIdr, currency, rate);
        return formatCurrencyAmount(converted, currency, options);
      },
      toIdr: (displayAmount) => convertToIdr(displayAmount, currency, rate),
      toDisplay: (amountIdr) => convertFromIdr(amountIdr, currency, rate),
      setCurrency,
      denominations: getDenominations(currency),
    };
  }, [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
}
