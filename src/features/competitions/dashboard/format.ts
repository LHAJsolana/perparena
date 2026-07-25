import { MarketSymbol } from "@prisma/client";

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  style: "currency",
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  style: "percent",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number) {
  return `$${compactNumberFormatter.format(value)}`;
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatPercent(value: number | null) {
  return value === null ? "n/a" : percentFormatter.format(value);
}

export function formatDateRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });

  return `${formatter.format(start)} - ${formatter.format(end)} UTC`;
}

export function marketLabel(symbol: MarketSymbol) {
  return symbol.replace("_", "-");
}
