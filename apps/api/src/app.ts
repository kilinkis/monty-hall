import { MAX_TRIALS, compareStrategies, simulate } from "@monty-hall/simulation";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

const requestSchema = z.object({
  trials: z.number().int().min(1).max(MAX_TRIALS).default(100),
  strategy: z.enum(["stay", "switch", "both"]).default("both"),
  seed: z.union([z.string(), z.number().finite()]).optional(),
});

export const app = new Hono();

app.use("/api/*", cors());

app.get("/api", (context) =>
  context.json({
    name: "Monty Hall Lab API",
    endpoints: {
      health: "GET /api/health",
      simulate: "POST /api/simulate",
    },
    maxTrials: MAX_TRIALS,
  }),
);

app.get("/api/health", (context) =>
  context.json({ status: "ok", service: "monty-hall-lab" }),
);

app.post("/api/simulate", async (context) => {
  let body: unknown;

  try {
    body = await context.req.json();
  } catch {
    return context.json(
      { error: "invalid_json", message: "The request body must be valid JSON." },
      400,
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return context.json(
      {
        error: "invalid_request",
        message: "The simulation options are invalid.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      400,
    );
  }

  const { trials, strategy, seed } = parsed.data;
  const result =
    strategy === "both"
      ? compareStrategies({ trials, seed })
      : simulate({ trials, strategy, seed });

  return context.json(result);
});

app.notFound((context) =>
  context.json(
    { error: "not_found", message: `No API route matches ${context.req.path}.` },
    404,
  ),
);
