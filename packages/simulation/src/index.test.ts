import { describe, expect, it } from "vitest";

import { compareStrategies, playRound, simulate } from "./index";

describe("Monty Hall simulation", () => {
  it("is reproducible when a seed is supplied", () => {
    const first = simulate({ trials: 10_000, strategy: "switch", seed: "portfolio" });
    const second = simulate({ trials: 10_000, strategy: "switch", seed: "portfolio" });

    expect(first).toEqual(second);
  });

  it("makes stay and switch complementary for the same rounds", () => {
    const result = compareStrategies({ trials: 10_000, seed: 42 });

    expect(result.stay.wins + result.switch.wins).toBe(result.trials);
    expect(result.stay.winRate).toBeCloseTo(1 / 3, 1);
    expect(result.switch.winRate).toBeCloseTo(2 / 3, 1);
  });

  it("never lets the host reveal the prize or the selected door", () => {
    for (let index = 0; index < 100; index += 1) {
      const round = playRound("switch");
      expect(round.openedDoor).not.toBe(round.prizeDoor);
      expect(round.openedDoor).not.toBe(round.firstChoice);
    }
  });

  it("rejects unsafe trial counts", () => {
    expect(() => simulate({ trials: 0, strategy: "stay" })).toThrow(RangeError);
    expect(() => simulate({ trials: 1_000_001, strategy: "switch" })).toThrow(
      RangeError,
    );
  });
});
