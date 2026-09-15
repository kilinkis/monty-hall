<script setup lang="ts">
const props = defineProps<{
  trials: number;
  seed: string;
  running: boolean;
  progress: number;
}>();

const emit = defineEmits<{
  run: [];
  randomizeSeed: [];
  "update:seed": [value: string];
  "update:trials": [value: number];
}>();

const presets = [100, 1_000, 10_000, 100_000];

function updateTrials(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  emit("update:trials", Math.min(1_000_000, Math.max(1, Math.round(value || 1))));
}

function updateSeed(event: Event): void {
  emit("update:seed", (event.target as HTMLInputElement).value);
}

function compactNumber(value: number): string {
  return value >= 1_000 ? `${value / 1_000}k` : String(value);
}
</script>

<template>
  <form class="command-form" @submit.prevent="emit('run')">
    <p class="command-line"><span class="prompt">$</span> monty-hall simulate</p>

    <div class="command-builder">
      <label class="inline-field">
        <span>--trials</span>
        <input
          :value="trials"
          aria-label="Number of trials"
          type="number"
          min="1"
          max="1000000"
          inputmode="numeric"
          :disabled="running"
          @change="updateTrials"
        />
      </label>

      <label class="inline-field seed-field">
        <span>--seed</span>
        <input
          :value="seed"
          aria-label="Simulation seed"
          type="text"
          maxlength="80"
          :disabled="running"
          @input="updateSeed"
        />
      </label>

      <button
        class="icon-button"
        type="button"
        :disabled="running"
        aria-label="Generate a new random seed"
        title="Generate a new seed"
        @click="emit('randomizeSeed')"
      >
        ↻
      </button>

      <button class="execute-button" type="submit" :disabled="running">
        {{ running ? "running…" : "execute ↵" }}
      </button>
    </div>

    <div class="preset-line" aria-label="Trial presets">
      <span>quick:</span>
      <button
        v-for="preset in presets"
        :key="preset"
        type="button"
        :disabled="running"
        :aria-pressed="trials === preset"
        @click="emit('update:trials', preset)"
      >
        [{{ compactNumber(preset) }}]
      </button>
    </div>

    <div
      v-if="running"
      class="execution-progress"
      role="progressbar"
      aria-label="Simulation progress"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(progress * 100)"
    >
      <span>running</span>
      <i><b :style="{ transform: `scaleX(${progress})` }"></b></i>
      <output>{{ Math.round(progress * 100).toString().padStart(3, " ") }}%</output>
    </div>
  </form>
</template>
