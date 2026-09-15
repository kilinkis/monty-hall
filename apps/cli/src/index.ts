#!/usr/bin/env node

import { parseArgs } from "node:util";

import {
  MAX_TRIALS,
  compareStrategies,
  simulate,
  type Strategy,
} from "@monty-hall/simulation";

const cliArguments = process.argv.slice(2);
if (cliArguments[0] === "--") cliArguments.shift();

const { values } = parseArgs({
  args: cliArguments,
  options: {
    help: { type: "boolean", short: "h" },
    json: { type: "boolean" },
    seed: { type: "string" },
    strategy: { type: "string", short: "s", default: "both" },
    trials: { type: "string", short: "t", default: "100" },
  },
  strict: true,
});

if (values.help) {
  printHelp();
  process.exit(0);
}

const trials = Number(values.trials);
const strategy = values.strategy;

if (!Number.isInteger(trials) || trials < 1 || trials > MAX_TRIALS) {
  fail(`--trials must be an integer between 1 and ${MAX_TRIALS}`);
}

if (strategy !== "stay" && strategy !== "switch" && strategy !== "both") {
  fail('--strategy must be "stay", "switch", or "both"');
}

const result =
  strategy === "both"
    ? compareStrategies({ trials, seed: values.seed })
    : simulate({ trials, strategy: strategy as Strategy, seed: values.seed });

if (values.json) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log(`\nMonty Hall Lab · ${trials.toLocaleString()} trials · seed ${result.seed}\n`);

if ("stay" in result) {
  printRow("Stay", result.stay.wins, result.stay.losses, result.stay.winRate);
  printRow("Switch", result.switch.wins, result.switch.losses, result.switch.winRate);
} else {
  printRow(capitalize(result.strategy), result.wins, result.losses, result.winRate);
}

console.log("\nTip: switching should converge toward a 66.7% win rate.\n");

function printRow(label: string, wins: number, losses: number, rate: number): void {
  const paddedLabel = label.padEnd(8);
  console.log(
    `${paddedLabel} ${formatPercent(rate).padStart(6)}  ${String(wins).padStart(8)} wins  ${String(losses).padStart(8)} losses`,
  );
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function fail(message: string): never {
  console.error(`Error: ${message}\nRun with --help for usage.`);
  process.exit(1);
}

function printHelp(): void {
  console.log(`
Monty Hall Lab

Run the classic probability experiment from your terminal.

Usage:
  monty-hall [options]

Options:
  -t, --trials <number>       Number of rounds (default: 100)
  -s, --strategy <strategy>  stay, switch, or both (default: both)
      --seed <value>          Reproduce an earlier experiment
      --json                  Print machine-readable JSON
  -h, --help                  Show this help

Examples:
  monty-hall --trials 10000
  monty-hall -t 1000 -s switch --seed portfolio
  monty-hall -t 100 --json
`);
}
