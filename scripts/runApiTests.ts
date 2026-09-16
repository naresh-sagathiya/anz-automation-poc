import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";

const defaultPort = 4011;
const mockBaseUrl = `http://127.0.0.1:${defaultPort}`;
const cucumberCli = path.join(import.meta.dirname, "..", "node_modules", "@cucumber", "cucumber", "bin", "cucumber.js");
const cucumberArgs = [cucumberCli, "--profile", "api", ...process.argv.slice(2)];

function runCucumber(env: NodeJS.ProcessEnv, onExit: (code: number) => void): void {
  const cucumber = spawn(process.execPath, cucumberArgs, { stdio: "inherit", env });
  cucumber.on("exit", (code, signal) => onExit(code ?? (signal ? 1 : 0)));
  cucumber.on("error", (error) => {
    console.error(`Unable to start Cucumber: ${error.message}`);
    onExit(1);
  });
}

function waitForMockServer(retries = 50): Promise<void> {
  return new Promise((resolve, reject) => {
    const probe = (): void => {
      const request = http.get(`${mockBaseUrl}/health`, (response) => {
        response.resume();
        if (response.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      request.on("error", retry);

      function retry(): void {
        if (retries-- <= 0) {
          reject(new Error(`Mock API did not become ready at ${mockBaseUrl}`));
          return;
        }
        setTimeout(probe, 100);
      }
    };
    probe();
  });
}

if (process.env.API_BASE_URL) {
  runCucumber(process.env, (code) => process.exit(code));
} else {
  const mockServer = spawn(process.execPath, ["api/mock-server/server.js"], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(defaultPort) },
  });
  let finished = false;
  const finish = (code: number): void => {
    if (finished) return;
    finished = true;
    if (!mockServer.killed) mockServer.kill();
    process.exit(code);
  };

  process.once("SIGINT", () => finish(130));
  process.once("SIGTERM", () => finish(143));
  mockServer.once("error", (error) => {
    console.error(`Unable to start the mock API: ${error.message}`);
    finish(1);
  });
  waitForMockServer()
    .then(() => runCucumber({ ...process.env, API_BASE_URL: mockBaseUrl }, finish))
    .catch((error: Error) => {
      console.error(error.message);
      finish(1);
    });
}
