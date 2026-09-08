import "dotenv/config";

export type ApiEnvironment = "local" | "sit" | "uat";

export type ApiConfig = {
  environment: ApiEnvironment;
  baseUrl: string;
  username: string;
  password: string;
};

function environmentName(): ApiEnvironment {
  const value = (process.env.TEST_ENV || "local").toLowerCase();
  if (value === "sit" || value === "uat") return value;
  return "local";
}

export function getApiConfig(): ApiConfig {
  const environment = environmentName();
  const prefix = `API_${environment.toUpperCase()}_`;

  return {
    environment,
    baseUrl:
      process.env[`${prefix}BASE_URL`] ||
      process.env.API_BASE_URL ||
      "http://localhost:4010",
    username:
      process.env[`${prefix}USER`] || process.env.API_USER_ALICE || "alice",
    password:
      process.env[`${prefix}PASSWORD`] ||
      process.env.API_PASSWORD_ALICE ||
      "Password123!",
  };
}