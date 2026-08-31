import { existsSync, readFileSync } from "node:fs";

export function assertFileExists(path: string): void {
  if (!existsSync(path))
    throw new Error(`Expected artefact does not exist: ${path}`);
}

export function assertDoesNotContainSecrets(
  path: string,
  secrets: string[],
): void {
  assertFileExists(path);
  const content = readFileSync(path, "utf8").toLowerCase();
  for (const secret of secrets) {
    if (secret && content.includes(secret.toLowerCase()))
      throw new Error(`Sensitive value found in artefact: ${path}`);
  }
}
