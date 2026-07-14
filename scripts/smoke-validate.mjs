import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const repoRoot = new URL("../", import.meta.url);
const repoPath = new URL("./", repoRoot).pathname;
const viteEntrypoint = new URL("./node_modules/vite/bin/vite.js", repoRoot).pathname;
const host = "127.0.0.1";
const port = String(4300 + Math.floor(Math.random() * 500));

function waitForReady(proc, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const onData = (chunk) => {
      const text = chunk.toString();
      if (text.includes("ready in")) {
        cleanup();
        resolve();
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`Dev server exited before ready (code ${String(code)}).`));
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const timeout = setTimeout(() => {
      proc.kill("SIGTERM");
      cleanup();
      reject(new Error("Dev server did not become ready in time."));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeout);
      proc.stdout.off("data", onData);
      proc.stderr.off("data", onData);
      proc.off("exit", onExit);
      proc.off("error", onError);
    };

    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("exit", onExit);
    proc.on("error", onError);
  });
}

async function validateUnavailablePath() {
  const [main, webgpu] = await Promise.all([
    readFile(new URL("./src/main.ts", repoRoot), "utf8"),
    readFile(new URL("./src/core/webgpu.ts", repoRoot), "utf8")
  ]);

  if (!main.includes("Runtime unavailable:")) {
    throw new Error("Missing runtime unavailable UI path in src/main.ts.");
  }
  if (!webgpu.includes("WebGPU is not available in this browser.")) {
    throw new Error("Missing WebGPU unavailable error path in src/core/webgpu.ts.");
  }
}

async function validateBrowserBoot() {
  const proc = spawn("node", [viteEntrypoint, "--host", host, "--port", port, "--strictPort"], {
    cwd: repoPath,
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    await waitForReady(proc);
    const response = await fetch(`http://${host}:${port}`);
    const html = await response.text();
    if (!html.includes('id="render-canvas"') || !html.includes('id="runtime-status"')) {
      throw new Error("Boot HTML is missing expected runtime elements.");
    }
  } finally {
    if (proc.exitCode === null && proc.signalCode === null) {
      proc.kill("SIGTERM");
      await new Promise((resolve) => proc.once("close", resolve));
    }
  }
}

await validateUnavailablePath();
await validateBrowserBoot();
console.log("Smoke validation passed: browser boot + WebGPU unavailable path checks are healthy.");
