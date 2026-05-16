import { describe, expect, it } from "vitest";
import {
  addDaysToInputDate,
  formatPaymentDateUtc,
  formatPaymentDateTimeUtc,
  getFirstUtcMonthInputDate,
  getTodayInputDate,
  getUtcDateRange,
  getUtcMonthToDateInputRange,
  getUtcTodayRange,
  toExclusiveEndOfUtcDayIso,
  toStartOfUtcDayIso,
} from "./paymentDateRange";

describe("paymentDateRange", () => {
  it("uses UTC calendar date for today", () => {
    expect(getTodayInputDate(new Date("2026-05-14T04:30:00.000Z"))).toBe("2026-05-14");
  });

  it("builds full UTC day boundaries from an input date", () => {
    expect(toStartOfUtcDayIso("2026-05-14")).toBe("2026-05-14T00:00:00Z");
    expect(toExclusiveEndOfUtcDayIso("2026-05-14")).toBe("2026-05-15T00:00:00Z");
    expect(getUtcDateRange("2026-05-14", "2026-05-14")).toEqual({
      from: "2026-05-14T00:00:00Z",
      to: "2026-05-15T00:00:00Z",
    });
    expect(getUtcTodayRange(new Date("2026-05-14T23:30:00.000Z"))).toEqual({
      from: "2026-05-14T00:00:00Z",
      to: "2026-05-15T00:00:00Z",
    });
  });

  it("adds days without local timezone shifts", () => {
    expect(addDaysToInputDate("2026-05-14", -1)).toBe("2026-05-13");
  });

  it("formats payment timestamps in UTC system time", () => {
    const formattedDate = formatPaymentDateTimeUtc("2026-05-14T04:22:18.309738Z", "en-US");

    expect(formattedDate).toContain("May 14, 2026");
    expect(formattedDate).toContain("UTC");
    expect(formatPaymentDateTimeUtc("2026-05-14T04:22:18.309738", "en-US")).toContain("May 14, 2026");
  });

  it("formats payment date-only values in UTC without local day shifts", () => {
    expect(formatPaymentDateUtc("2026-05-14", "en-US")).toContain("May 14, 2026");
  });

  it("builds month-to-date ranges using UTC dates", () => {
    const date = new Date("2026-05-14T04:22:18.000Z");

    expect(getFirstUtcMonthInputDate(date)).toBe("2026-05-01");
    expect(getUtcMonthToDateInputRange(date)).toEqual({
      fromDate: "2026-05-01",
      toDate: "2026-05-14",
    });
  });
});
