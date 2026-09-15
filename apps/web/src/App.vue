<script setup lang="ts">
import {
  compareStrategies,
  type ComparisonResult,
  type ConvergencePoint,
  type Strategy,
  type StrategyResult as StrategyResultData,
} from "@monty-hall/simulation";
import { computed, onBeforeUnmount, ref, watchEffect } from "vue";

import ConvergenceChart from "./components/ConvergenceChart.vue";
import SimulationControls from "./components/SimulationControls.vue";
import StrategyResult from "./components/StrategyResult.vue";

type Theme = "dark" | "light";

const trials = ref(100);
const seed = ref("opening-night");
const running = ref(false);
const progress = ref(1);
const error = ref("");
const statusMessage = ref("Initial simulation ready.");
const result = ref<ComparisonResult>(
  compareStrategies({ trials: trials.value, seed: seed.value }),
);
const theme = ref<Theme>(preferredTheme());
let animationFrame: number | undefined;

const leadingStrategy = computed<Strategy | null>(() => {
  if (result.value.switch.wins === result.value.stay.wins) return null;
  return result.value.switch.wins > result.value.stay.wins ? "switch" : "stay";
});

const delta = computed(() =>
  Math.abs(result.value.switch.winRate - result.value.stay.winRate) * 100,
);

const resultLine = computed(() => {
  if (running.value) {
    return `processing ${result.value.trials.toLocaleString()} / ${trials.value.toLocaleString()} trials`;
  }

  if (leadingStrategy.value === null) return "result: strategies tied in this sample";
  return `result: ${leadingStrategy.value} leads by ${delta.value.toFixed(1)} percentage points`;
});

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value;
  localStorage.setItem("monty-hall-theme", theme.value);
});

onBeforeUnmount(() => {
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
});

function runSimulation(): void {
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);

  error.value = "";
  running.value = true;
  progress.value = 0;
  statusMessage.value = `Running ${trials.value.toLocaleString()} trials.`;

  try {
    const finalResult = compareStrategies({
      trials: trials.value,
      seed: seed.value || undefined,
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishSimulation(finalResult);
      return;
    }

    const duration = Math.min(3_200, 1_600 + Math.log10(trials.value) * 320);
    let startedAt: number | undefined;

    const advance = (timestamp: number): void => {
      startedAt ??= timestamp;
      const nextProgress = Math.min(1, (timestamp - startedAt) / duration);
      const finalIndex = finalResult.series.length - 1;
      const seriesIndex = Math.min(finalIndex, Math.floor(nextProgress * finalIndex));
      const point = finalResult.series[seriesIndex];

      if (point !== undefined) {
        result.value = resultAtPoint(finalResult, point, seriesIndex);
        progress.value = point.trial / finalResult.trials;
      }

      if (nextProgress < 1) {
        animationFrame = requestAnimationFrame(advance);
      } else {
        finishSimulation(finalResult);
      }
    };

    animationFrame = requestAnimationFrame(advance);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "The experiment could not run.";
    running.value = false;
    statusMessage.value = "Simulation failed.";
  }
}

function finishSimulation(finalResult: ComparisonResult): void {
  result.value = finalResult;
  progress.value = 1;
  running.value = false;
  animationFrame = undefined;
  statusMessage.value = `Simulation complete: ${finalResult.trials.toLocaleString()} trials.`;
}

function resultAtPoint(
  finalResult: ComparisonResult,
  point: ConvergencePoint,
  seriesIndex: number,
): ComparisonResult {
  const stayWins = Math.round(point.stayWinRate * point.trial);
  const switchWins = point.trial - stayWins;

  return {
    trials: point.trial,
    seed: finalResult.seed,
    stay: partialStrategy("stay", stayWins, point.trial),
    switch: partialStrategy("switch", switchWins, point.trial),
    series: finalResult.series.slice(0, seriesIndex + 1),
  };
}

function partialStrategy(
  strategy: Strategy,
  wins: number,
  completedTrials: number,
): StrategyResultData {
  return {
    strategy,
    wins,
    losses: completedTrials - wins,
    winRate: wins / completedTrials,
    expectedWinRate: strategy === "stay" ? 1 / 3 : 2 / 3,
  };
}

function randomizeSeed(): void {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  seed.value = `run-${values[0]?.toString(36) ?? Date.now().toString(36)}`;
}

function toggleTheme(): void {
  theme.value = theme.value === "dark" ? "light" : "dark";
}

function preferredTheme(): Theme {
  const saved = localStorage.getItem("monty-hall-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
</script>

<template>
  <div class="desktop">
    <main class="terminal" aria-labelledby="page-title">
      <header class="titlebar">
        <span class="traffic-lights" aria-hidden="true"><i></i><i></i><i></i></span>
        <nav class="titlebar-links" aria-label="Project links">
          <span>monty-hall</span>
          <a href="/docs">api docs</a>
          <a
            href="https://github.com/kilinkis/monty-hall"
            target="_blank"
            rel="noreferrer"
          >github ↗</a>
        </nav>
        <button
          class="theme-toggle"
          type="button"
          :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`"
          @click="toggleTheme"
        >
          [{{ theme === "dark" ? "light" : "dark" }}]
        </button>
      </header>

      <div class="terminal-body">
        <section class="intro">
          <p class="command-line"><span class="prompt">$</span> monty-hall --explain</p>
          <div class="intro-output">
            <div>
              <p class="meta">MONTY-HALL(1) · probability utilities · v0.1.0</p>
              <h1 id="page-title">Should you switch?</h1>
              <p>
                One car, two goats, three doors. Monty opens a losing door after your
                first pick. Run both strategies against the same rounds and watch the
                answer emerge.
              </p>
            </div>
            <pre class="doors" aria-label="Three closed doors">┌─────┐ ┌─────┐ ┌─────┐
│  1  │ │  2  │ │  3  │
│   · │ │   · │ │   · │
└─────┘ └─────┘ └─────┘</pre>
          </div>
        </section>

        <SimulationControls
          v-model:trials="trials"
          v-model:seed="seed"
          :running="running"
          :progress="progress"
          @run="runSimulation"
          @randomize-seed="randomizeSeed"
        />

        <p class="sr-only" aria-live="polite">{{ statusMessage }}</p>
        <p v-if="error" class="error-line" role="alert">error: {{ error }}</p>

        <section class="output-block" aria-labelledby="results-heading">
          <div class="output-heading">
            <div>
              <p class="command-line"><span class="prompt">&gt;</span> {{ resultLine }}</p>
              <h2 id="results-heading">strategy comparison</h2>
            </div>
            <p class="seed-output">seed={{ result.seed }}</p>
          </div>

          <div class="result-table" role="table" aria-label="Strategy results">
            <div class="result-table-header" role="row">
              <span role="columnheader">strategy</span>
              <span role="columnheader">wins</span>
              <span role="columnheader">losses</span>
              <span role="columnheader">win rate</span>
              <span role="columnheader">distribution</span>
            </div>
            <StrategyResult
              :result="result.stay"
              :emphasized="leadingStrategy === 'stay'"
            />
            <StrategyResult
              :result="result.switch"
              :emphasized="leadingStrategy === 'switch'"
            />
          </div>

          <div class="chart-block">
            <div class="chart-labels">
              <h3>win_rate.log</h3>
              <span>observed ── expected ╌╌</span>
            </div>
            <ConvergenceChart :series="result.series" :total-trials="trials" />
          </div>
        </section>

        <section class="manual-grid">
          <article aria-labelledby="why-heading">
            <p class="command-line"><span class="prompt">$</span> man monty-hall</p>
            <h2 id="why-heading">WHY SWITCHING WORKS</h2>
            <dl class="manual">
              <div>
                <dt>01 / first pick</dt>
                <dd>Your door starts—and stays—at a 1/3 chance of holding the car.</dd>
              </div>
              <div>
                <dt>02 / remaining doors</dt>
                <dd>The other two doors collectively carry the remaining 2/3 chance.</dd>
              </div>
              <div>
                <dt>03 / informed reveal</dt>
                <dd>Monty knowingly removes a goat, concentrating that 2/3 on one door.</dd>
              </div>
            </dl>
          </article>

          <article aria-labelledby="api-heading">
            <p class="command-line"><span class="prompt">$</span> curl --request POST</p>
            <h2 id="api-heading">PUBLIC JSON API</h2>
            <pre class="code-block"><code>curl -X POST /api/simulate \
  -H 'Content-Type: application/json' \
  -d '{
    "trials": 10000,
    "strategy": "both",
    "seed": 42
  }'</code></pre>
            <p class="resource-links">
              <a href="/docs">[open api docs]</a>
              <a
                href="https://github.com/kilinkis/monty-hall"
                target="_blank"
                rel="noreferrer"
              >[view source ↗]</a>
            </p>
          </article>
        </section>
      </div>

      <footer class="statusbar">
        <span>vue + hono + typescript</span>
        <span>same engine · web / api / cli</span>
        <span class="online"><i></i> ready</span>
      </footer>
    </main>
  </div>
</template>
