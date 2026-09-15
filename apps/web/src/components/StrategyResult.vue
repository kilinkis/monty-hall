<script setup lang="ts">
import type { StrategyResult } from "@monty-hall/simulation";

defineProps<{
  result: StrategyResult;
  emphasized?: boolean;
}>();

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
</script>

<template>
  <div
    class="result-row"
    :class="[`strategy-${result.strategy}`, { emphasized }]"
    role="row"
  >
    <span class="strategy-name" role="cell">
      <i aria-hidden="true">{{ emphasized ? ">" : " " }}</i>
      {{ result.strategy }}
    </span>
    <span role="cell">{{ result.wins.toLocaleString() }}</span>
    <span role="cell">{{ result.losses.toLocaleString() }}</span>
    <strong role="cell">{{ percent(result.winRate) }}</strong>
    <span class="ascii-meter" role="cell" :aria-label="`${percent(result.winRate)} win rate`">
      <i :style="{ transform: `scaleX(${result.winRate})` }"></i>
    </span>
  </div>
</template>
