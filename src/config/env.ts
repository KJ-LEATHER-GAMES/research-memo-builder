import dotenv from "dotenv";
import path from "node:path";

export type AppEnv = {
  braveApiKey: string;
};

export class EnvConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvConfigError";
  }
}

export function loadEnvConfig(): AppEnv {
  dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
  });

  const braveApiKey = process.env.BRAVE_API_KEY?.trim();

  if (!braveApiKey) {
    throw new EnvConfigError(
      "BRAVE_API_KEY is required. Please set BRAVE_API_KEY in .env.",
    );
  }

  return {
    braveApiKey,
  };
}
