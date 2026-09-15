import { describe, expect, it } from "vitest";

import { app } from "./app";

describe("simulation API", () => {
  it("reports its health", async () => {
    const response = await app.request("http://local.test/api/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
  });

  it("compares both strategies", async () => {
    const response = await app.request("http://local.test/api/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trials: 1_000, strategy: "both", seed: 42 }),
    });

    expect(response.status).toBe(200);
    const result = await response.json<{
      trials: number;
      stay: { wins: number };
      switch: { wins: number };
    }>();
    expect(result.stay.wins + result.switch.wins).toBe(result.trials);
  });

  it("returns useful validation errors", async () => {
    const response = await app.request("http://local.test/api/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trials: -5, strategy: "guess" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "invalid_request" });
  });
});
