// Pure helpers for campaign lifecycle (no server-only imports, so they stay testable).

/** Today's date in Asia/Jakarta as YYYY-MM-DD (matches the DB view's timezone). */
export function jakartaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    now,
  );
}

/**
 * A campaign is expired once its end date has passed. The final day is still
 * open — expiry only kicks in after `endsOn` (string ISO date comparison).
 */
export function isCampaignExpired(
  endsOn: string | null,
  today: string = jakartaToday(),
): boolean {
  return endsOn !== null && endsOn < today;
}
