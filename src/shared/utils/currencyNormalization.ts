import currency from "currency.js";

const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  MXN: 20,
  EUR: 0.92,
  GBP: 0.79,
};

const normalizarCodigoMoneda = (currencyCode: string): string =>
  currencyCode.trim().toUpperCase();

export const getUsdExchangeRate = (currencyCode: string): number | null => {
  const normalizedCurrency = normalizarCodigoMoneda(currencyCode);
  return EXCHANGE_RATES_TO_USD[normalizedCurrency] ?? null;
};

export const normalizeMinorUnitsToUsd = (
  minorUnits: number,
  currencyCode: string,
): number | null => {
  const exchangeRate = getUsdExchangeRate(currencyCode);

  if (!exchangeRate || exchangeRate <= 0) {
    return null;
  }

  return Math.round(currency(minorUnits).divide(exchangeRate).value);
};

export const formatUsdMinorUnits = (minorUnits: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
