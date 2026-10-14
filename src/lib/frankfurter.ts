const API = "https://api.frankfurter.dev";

export type Currency = {
  iso_code: string;
  name: string;
};

export type RateQuote = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

export class FrankfurterError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "FrankfurterError";
  }
}

export async function listCurrencies(): Promise<Currency[]> {
  const res = await fetch(`${API}/v2/currencies`);
  if (!res.ok) {
    throw new FrankfurterError(
      "Could not load the currency list. Check your internet connection and try again.",
      res.status,
    );
  }

  const rows = (await res.json()) as Currency[];
  return rows
    .filter((currency) => Boolean(currency.iso_code) && Boolean(currency.name))
    .sort((a, b) => a.iso_code.localeCompare(b.iso_code));
}

export async function getRate(base: string, quote: string): Promise<RateQuote> {
  const from = base.toUpperCase();
  const to = quote.toUpperCase();

  if (from === to) {
    return {
      date: new Date().toISOString().slice(0, 10),
      base: from,
      quote: to,
      rate: 1,
    };
  }

  const res = await fetch(
    `${API}/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
  );

  if (res.status === 422) {
    throw new FrankfurterError("Unknown currency code.", 422);
  }

  if (!res.ok) {
    throw new FrankfurterError(
      "Could not fetch the exchange rate. Check your internet connection and try again.",
      res.status,
    );
  }

  return (await res.json()) as RateQuote;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
