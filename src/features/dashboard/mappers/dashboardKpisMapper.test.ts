import { describe, expect, it } from "vitest";

import { mapDashboardKpis } from "./dashboardKpisMapper";

describe("mapDashboardKpis", () => {
  it("keeps USD minor units unchanged", () => {
    const result = mapDashboardKpis([
      {
        fecha: "2026-05-06",
        gmvTotal: 10000,
        ticketPromedio: 10000,
        currency: "USD",
      },
    ]);

    expect(result.gmvTotal).toBe(10000);
    expect(result.ticketPromedio).toBe(10000);
    expect(result.currency).toBe("USD");
  });

  it("normalizes MXN minor units to USD minor units", () => {
    const result = mapDashboardKpis({
      gmvTotal: 10000,
      ticketPromedio: 10000,
      currency: "MXN",
    });

    expect(result.gmvTotal).toBe(500);
    expect(result.ticketPromedio).toBe(500);
    expect(result.currency).toBe("USD");
  });

  it("normalizes EUR minor units to USD minor units", () => {
    const result = mapDashboardKpis({
      gmvTotal: 10000,
      ticketPromedio: 10000,
      currency: "EUR",
    });

    expect(result.gmvTotal).toBe(10870);
    expect(result.ticketPromedio).toBe(10870);
    expect(result.currency).toBe("USD");
  });
});