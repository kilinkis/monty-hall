export const MAX_TRIALS = 1_000_000;

export type Strategy = "stay" | "switch";
export type Seed = number | string;

export interface SimulationOptions {
  trials: number;
  strategy: Strategy;
  seed?: Seed;
}

export interface ComparisonOptions {
  trials: number;
  seed?: Seed;
}

export interface RoundResult {
  prizeDoor: number;
  firstChoice: number;
  openedDoor: number;
  finalChoice: number;
  strategy: Strategy;
  won: boolean;
}

export interface StrategyResult {
  strategy: Strategy;
  wins: number;
  losses: number;
  winRate: number;
  expectedWinRate: number;
}

export interface SimulationResult extends StrategyResult {
  trials: number;
  seed: number;
}

export interface ConvergencePoint {
  trial: number;
  stayWinRate: number;
  switchWinRate: number;
}

export interface ComparisonResult {
  trials: number;
  seed: number;
  stay: StrategyResult;
  switch: StrategyResult;
  series: ConvergencePoint[];
}

type Random = () => number;

interface BaseRound {
  prizeDoor: number;
  firstChoice: number;
  openedDoor: number;
  switchDoor: number;
}

export function playRound(strategy: Strategy, random: Random = Math.random): RoundResult {
  const round = createRound(random);
  const finalChoice = strategy === "stay" ? round.firstChoice : round.switchDoor;

  return {
    prizeDoor: round.prizeDoor,
    firstChoice: round.firstChoice,
    openedDoor: round.openedDoor,
    finalChoice,
    strategy,
    won: finalChoice === round.prizeDoor,
  };
}

export function simulate(options: SimulationOptions): SimulationResult {
  validateTrials(options.trials);
  const seed = normalizeSeed(options.seed);
  const random = createSeededRandom(seed);
  let wins = 0;

  for (let trial = 0; trial < options.trials; trial += 1) {
    if (playRound(options.strategy, random).won) wins += 1;
  }

  return {
    trials: options.trials,
    seed,
    ...toStrategyResult(options.strategy, wins, options.trials),
  };
}

export function compareStrategies(options: ComparisonOptions): ComparisonResult {
  validateTrials(options.trials);
  const seed = normalizeSeed(options.seed);
  const random = createSeededRandom(seed);
  const sampleEvery = Math.max(1, Math.ceil(options.trials / 72));
  const series: ConvergencePoint[] = [];
  let stayWins = 0;

  for (let trial = 1; trial <= options.trials; trial += 1) {
    const round = createRound(random);
    if (round.firstChoice === round.prizeDoor) stayWins += 1;

    if (trial === 1 || trial % sampleEvery === 0 || trial === options.trials) {
      series.push({
        trial,
        stayWinRate: stayWins / trial,
        switchWinRate: (trial - stayWins) / trial,
      });
    }
  }

  return {
    trials: options.trials,
    seed,
    stay: toStrategyResult("stay", stayWins, options.trials),
    switch: toStrategyResult("switch", options.trials - stayWins, options.trials),
    series,
  };
}

function createRound(random: Random): BaseRound {
  const prizeDoor = randomDoor(random);
  const firstChoice = randomDoor(random);
  const hostOptions = [0, 1, 2].filter(
    (door) => door !== prizeDoor && door !== firstChoice,
  );
  const openedDoor = hostOptions[Math.floor(random() * hostOptions.length)];

  if (openedDoor === undefined) {
    throw new Error("The host could not choose a door.");
  }

  const switchDoor = [0, 1, 2].find(
    (door) => door !== firstChoice && door !== openedDoor,
  );

  if (switchDoor === undefined) {
    throw new Error("No door was available to switch to.");
  }

  return { prizeDoor, firstChoice, openedDoor, switchDoor };
}

function randomDoor(random: Random): number {
  return Math.floor(random() * 3);
}

function toStrategyResult(
  strategy: Strategy,
  wins: number,
  trials: number,
): StrategyResult {
  return {
    strategy,
    wins,
    losses: trials - wins,
    winRate: wins / trials,
    expectedWinRate: strategy === "stay" ? 1 / 3 : 2 / 3,
  };
}

function validateTrials(trials: number): void {
  if (!Number.isInteger(trials) || trials < 1 || trials > MAX_TRIALS) {
    throw new RangeError(`trials must be an integer between 1 and ${MAX_TRIALS}`);
  }
}

function normalizeSeed(seed: Seed | undefined): number {
  if (typeof seed === "number") {
    if (!Number.isFinite(seed)) throw new TypeError("seed must be a finite number or string");
    return seed >>> 0;
  }

  if (typeof seed === "string") return hashString(seed);
  return Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
}

function hashString(value: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: number): Random {
  let state = seed;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}
