<script setup lang="ts">
import type { ConvergencePoint } from "@monty-hall/simulation";
import { computed } from "vue";

const props = defineProps<{
  series: ConvergencePoint[];
  totalTrials: number;
}>();

const width = 760;
const height = 276;
const padding = { top: 18, right: 18, bottom: 36, left: 44 };

const plotWidth = width - padding.left - padding.right;
const plotHeight = height - padding.top - padding.bottom;

function x(trial: number): number {
  return padding.left + (trial / props.totalTrials) * plotWidth;
}

function y(rate: number): number {
  return padding.top + (1 - rate) * plotHeight;
}

function pathFor(key: "stayWinRate" | "switchWinRate"): string {
  return props.series
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.trial)} ${y(point[key])}`)
    .join(" ");
}

const stayPath = computed(() => pathFor("stayWinRate"));
const switchPath = computed(() => pathFor("switchWinRate"));
const yTicks = [0, 1 / 3, 2 / 3, 1];

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
</script>

<template>
  <div class="chart-wrap">
    <svg
      class="chart"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      aria-labelledby="chart-title chart-description"
    >
      <title id="chart-title">Win rates as the simulation progresses</title>
      <desc id="chart-description">
        Stay converges toward one third while switch converges toward two thirds.
      </desc>

      <g class="chart-grid">
        <g v-for="tick in yTicks" :key="tick">
          <line :x1="padding.left" :x2="width - padding.right" :y1="y(tick)" :y2="y(tick)" />
          <text :x="padding.left - 10" :y="y(tick) + 4" text-anchor="end">
            {{ percent(tick) }}
          </text>
        </g>
      </g>

      <line class="expected stay" :x1="padding.left" :x2="width - padding.right" :y1="y(1 / 3)" :y2="y(1 / 3)" />
      <line class="expected switch" :x1="padding.left" :x2="width - padding.right" :y1="y(2 / 3)" :y2="y(2 / 3)" />
      <path class="data-line stay" :d="stayPath" />
      <path class="data-line switch" :d="switchPath" />

      <text class="axis-label" :x="padding.left" :y="height - 10">1</text>
      <text class="axis-label" :x="width - padding.right" :y="height - 10" text-anchor="end">
        {{ totalTrials.toLocaleString() }} {{ totalTrials === 1 ? "trial" : "trials" }}
      </text>
    </svg>

    <div class="chart-legend" aria-hidden="true">
      <span><i class="legend-switch"></i>Switch</span>
      <span><i class="legend-stay"></i>Stay</span>
      <span class="expected-key">Dashed = mathematical expectation</span>
    </div>
  </div>
</template>
