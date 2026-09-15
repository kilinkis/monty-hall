import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
for (const separator of [[], ["--"]]) {
  const result = spawnSync(
    "corepack",
    [
      "pnpm",
      "simulate",
      ...separator,
      "--trials",
      "10",
      "--strategy",
      "both",
      "--seed",
      "cli-smoke-test",
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: process.env,
    },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  if (!result.stdout.includes("Monty Hall Lab · 10 trials")) {
    process.stderr.write("CLI smoke test did not receive the expected output.\n");
    process.exit(1);
  }
}

process.stdout.write("CLI argument forwarding smoke test passed.\n");
