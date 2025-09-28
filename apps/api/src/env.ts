import { config } from "dotenv";

config();

const number = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected numeric environment variable but received '${value}'`);
  }
  return parsed;
};

const nodeEnv = process.env.NODE_ENV ?? "development";

const required = (value: string | undefined, name: string): string => {
  if (!value) {
    if (nodeEnv === "test") {
      return `test-${name.toLowerCase()}`;
    }
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
};

export const env = {
  nodeEnv,
  port: number(process.env.PORT, 4000),
  openaiApiKey: required(process.env.OPENAI_API_KEY, "OPENAI_API_KEY"),
  storyblokToken: required(process.env.STORYBLOK_MANAGEMENT_TOKEN, "STORYBLOK_MANAGEMENT_TOKEN"),
  databaseUrl: process.env.DATABASE_URL ?? "file:./data/dev.db"
};
