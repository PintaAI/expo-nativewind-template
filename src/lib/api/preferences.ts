import { apiGet, apiPut } from "./client";

export async function getUserCurrency(): Promise<string> {
  const payload = await apiGet<{ currency: string }>("/preferences/currency");
  return payload.currency;
}

export async function updateUserCurrency(currency: string): Promise<void> {
  await apiPut("/preferences/currency", { currency });
}

export function getExchangeRates(): Promise<Record<string, number>> {
  return apiGet<Record<string, number>>("/preferences/exchange-rates");
}
