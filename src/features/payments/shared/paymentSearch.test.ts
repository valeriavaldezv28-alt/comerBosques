import { describe, expect, it, vi } from "vitest";
import {
  getPaymentSearchDateRange,
  getPaymentSearchInputDateRange,
  getTransactionSearchDateRange,
  isValidTransactionSearchTerm,
} from "./paymentSearch";

describe("paymentSearch UTC ranges", () => {
  it("validates transaction timestamps with UTC calendar rules", () => {
    expect(isValidTransactionSearchTerm("TRX-20260514042218-mct82-63")).toBe(true);
    expect(isValidTransactionSearchTerm("TRX-20260230042218-mct82-63")).toBe(false);
  });

  it("builds UTC day ranges from transaction ids", () => {
    expect(getTransactionSearchDateRange("TRX-20260514042218-mct82-63")).toEqual({
      from: "2026-05-14T00:00:00Z",
      to: "2026-05-15T00:00:00Z",
    });
  });

  it("builds order search ranges from the UTC month to the UTC current day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-14T04:22:18.000Z"));

    expect(getPaymentSearchInputDateRange("ORD-199")).toEqual({
      fromDate: "2026-05-01",
      toDate: "2026-05-14",
    });
    expect(getPaymentSearchDateRange("ORD-199")).toEqual({
      from: "2026-05-01T00:00:00Z",
      to: "2026-05-15T00:00:00Z",
    });

    vi.useRealTimers();
  });
});
