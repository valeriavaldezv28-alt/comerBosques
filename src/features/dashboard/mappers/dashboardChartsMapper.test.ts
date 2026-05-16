import { describe, expect, it } from "vitest";

import {
  mapDashboardHourlyPerformance,
  mapDashboardPulse,
  mapDashboardStatusDistribution,
} from "./dashboardChartsMapper";

describe("mapDashboardHourlyPerformance", () => {
  it("uses the backend local hour when available", () => {
    const result = mapDashboardHourlyPerformance([
      {
        hora: 20,
        horaLocal: 14,
        horaUtc: 20,
        intentos: 10,
        exitos: 10,
        volumenVentas: 35624805,
      },
    ]);

    expect(result).toEqual([
      {
        hour: 14,
        attempts: 10,
        successes: 10,
        salesVolume: 356248.05,
      },
    ]);
  });
});

describe("mapDashboardPulse", () => {
  it("uses the backend local hour when available", () => {
    const result = mapDashboardPulse([
      {
        hora: 20,
        horaLocal: 14,
        horaUtc: 20,
        totalTransacciones: 10,
        volumenDinero: 356248.05,
      },
    ]);

    expect(result).toEqual([
      {
        hour: 14,
        transactionCount: 10,
        moneyVolume: 356248.05,
      },
    ]);
  });
});

describe("mapDashboardStatusDistribution", () => {
  it("only keeps statuses visible in the dashboard distribution chart", () => {
    const result = mapDashboardStatusDistribution([
      { status: "SUCCEEDED", count: 43 },
      { status: "LINK_CREATED", count: 20 },
      { status: "FAILED", count: 7 },
      { status: "ERROR", count: 1 },
    ]);

    expect(result).toEqual([
      { status: "SUCCEEDED", count: 43 },
      { status: "LINK_CREATED", count: 20 },
    ]);
  });
});
