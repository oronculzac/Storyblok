import Fastify from "fastify";
import cors from "@fastify/cors";
import OpenAI from "openai";
import { env } from "./env.js";
import { ensureDatabaseConnection } from "./prisma.js";
import { TranslationLlmClient } from "./llm.js";
import { registerRoutes } from "./routes.js";

export const buildServer = () => {
  const app = Fastify({
    logger: {
      transport: env.nodeEnv === "development" ? { target: "pino-pretty" } : undefined
    }
  });

  app.register(cors, { origin: false });

  const openai = new OpenAI({ apiKey: env.openaiApiKey });
  const llmClient = new TranslationLlmClient(openai);

  registerRoutes(app, { llmClient, storyblokToken: env.storyblokToken });

  return app;
};

const start = async () => {
  await ensureDatabaseConnection();
  const app = buildServer();
  await app.listen({ port: env.port, host: "0.0.0.0" });
};

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
