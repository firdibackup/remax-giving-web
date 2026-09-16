const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("id-ID");

const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dayMonthFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const normalized = value.length === 10 ? `${value}T00:00:00` : value;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatCurrency(amount: number | null | undefined): string {
  return currencyFormatter.format(amount ?? 0);
}

export function formatCompactCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0;

  if (value >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    return `Rp ${compactNumberFormatter.format(Number(billions.toFixed(billions >= 10 ? 0 : 1)))} M`;
  }

  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `Rp ${compactNumberFormatter.format(Number(millions.toFixed(millions >= 10 ? 0 : 1)))} Jt`;
  }

  return currencyFormatter.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  return compactNumberFormatter.format(value ?? 0);
}

export function formatLongDate(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? longDateFormatter.format(date) : "-";
}

export function formatShortDate(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? shortDateFormatter.format(date) : "-";
}

export function formatDayMonth(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? dayMonthFormatter.format(date) : "-";
}

export function formatDateTime(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "-";
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate && !endDate) {
    return null;
  }

  if (startDate && endDate) {
    return `Siklus ${dayMonthFormatter.format(startDate)} – ${longDateFormatter.format(endDate)}`;
  }

  const single = startDate || endDate;
  return single ? `Siklus ${longDateFormatter.format(single)}` : null;
}

export function formatReadMinutes(minutes: number | null | undefined): string | null {
  return minutes && minutes > 0 ? `${minutes} menit baca` : null;
}

export function formatDateInput(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function todayInJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
