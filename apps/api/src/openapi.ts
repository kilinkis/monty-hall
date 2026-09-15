import { MAX_TRIALS } from "@monty-hall/simulation";

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Monty Hall Lab API",
    version: "0.1.0",
    description:
      "Run reproducible Monty Hall simulations with the same TypeScript engine used by the web app and CLI.",
  },
  servers: [
    {
      url: "https://monty-hall-lab.monty-hall-api.workers.dev",
      description: "Production",
    },
    { url: "http://localhost:8787", description: "Local development" },
  ],
  tags: [{ name: "Simulation" }, { name: "System" }],
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Check API health",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "The service is available.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/simulate": {
      post: {
        tags: ["Simulation"],
        summary: "Run a Monty Hall simulation",
        description:
          "Use `both` to compare staying and switching against the same generated rounds.",
        operationId: "simulateMontyHall",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SimulationRequest" },
              examples: {
                comparison: {
                  summary: "Compare both strategies",
                  value: { trials: 10_000, strategy: "both", seed: 42 },
                },
                switching: {
                  summary: "Only test switching",
                  value: { trials: 100, strategy: "switch", seed: "portfolio" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Simulation completed.",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { $ref: "#/components/schemas/ComparisonResult" },
                    { $ref: "#/components/schemas/SimulationResult" },
                  ],
                },
              },
            },
          },
          "400": {
            description: "The request body is invalid.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: "object",
        required: ["status", "service"],
        properties: {
          status: { type: "string", const: "ok" },
          service: { type: "string", const: "monty-hall-lab" },
        },
      },
      SimulationRequest: {
        type: "object",
        properties: {
          trials: {
            type: "integer",
            minimum: 1,
            maximum: MAX_TRIALS,
            default: 100,
            description: "Number of rounds to run.",
          },
          strategy: {
            type: "string",
            enum: ["stay", "switch", "both"],
            default: "both",
          },
          seed: {
            oneOf: [{ type: "string" }, { type: "number" }],
            description: "Optional seed for a reproducible result.",
          },
        },
      },
      StrategyResult: {
        type: "object",
        required: ["strategy", "wins", "losses", "winRate", "expectedWinRate"],
        properties: {
          strategy: { type: "string", enum: ["stay", "switch"] },
          wins: { type: "integer", minimum: 0 },
          losses: { type: "integer", minimum: 0 },
          winRate: { type: "number", minimum: 0, maximum: 1 },
          expectedWinRate: { type: "number", minimum: 0, maximum: 1 },
        },
      },
      SimulationResult: {
        allOf: [
          { $ref: "#/components/schemas/StrategyResult" },
          {
            type: "object",
            required: ["trials", "seed"],
            properties: {
              trials: { type: "integer" },
              seed: { type: "integer" },
            },
          },
        ],
      },
      ConvergencePoint: {
        type: "object",
        required: ["trial", "stayWinRate", "switchWinRate"],
        properties: {
          trial: { type: "integer" },
          stayWinRate: { type: "number", minimum: 0, maximum: 1 },
          switchWinRate: { type: "number", minimum: 0, maximum: 1 },
        },
      },
      ComparisonResult: {
        type: "object",
        required: ["trials", "seed", "stay", "switch", "series"],
        properties: {
          trials: { type: "integer" },
          seed: { type: "integer" },
          stay: { $ref: "#/components/schemas/StrategyResult" },
          switch: { $ref: "#/components/schemas/StrategyResult" },
          series: {
            type: "array",
            items: { $ref: "#/components/schemas/ConvergencePoint" },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["error", "message"],
        properties: {
          error: { type: "string" },
          message: { type: "string" },
          issues: {
            type: "array",
            items: {
              type: "object",
              required: ["path", "message"],
              properties: {
                path: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;
