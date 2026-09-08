import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function ensureDirectory(filePath: string): string {
  const targetDir = dirname(resolve(filePath));

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  return targetDir;
}

export function readJsonFile<T = unknown>(filePath: string): T {
  const content = readFileSync(filePath, "utf8");
  return JSON.parse(content) as T;
}

export function writeJsonFile(filePath: string, data: unknown): void {
  ensureDirectory(filePath);
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export function readTextFile(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

export function writeTextFile(filePath: string, content: string): void {
  ensureDirectory(filePath);
  writeFileSync(filePath, content, "utf8");
}

export function readEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readTextFile(filePath);
  return content
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .reduce<Record<string, string>>((env, line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        return env;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      env[key] = value;
      return env;
    }, {});
}

export function upsertEnvEntries(filePath: string, entries: Record<string, string>): void {
  const existingEnv = readEnvFile(filePath);
  const merged = { ...existingEnv, ...entries };
  const lines = Object.entries(merged).map(([key, value]) => `${key}=${value}`);
  writeTextFile(filePath, `${lines.join("\n")}\n`);
}
