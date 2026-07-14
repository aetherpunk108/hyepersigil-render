import { createRuntimeApp } from "./core/runtime";
import "./styles.css";

function requireElement<T extends Element>(id: string, kind: { new (): T }): T {
  const element = document.getElementById(id);
  if (!(element instanceof kind)) {
    throw new Error(`Runtime bootstrap failed: missing #${id}.`);
  }
  return element;
}

async function bootstrap(): Promise<void> {
  const canvas = requireElement("render-canvas", HTMLCanvasElement);
  const status = requireElement("runtime-status", HTMLElement);
  const app = createRuntimeApp(canvas);
  try {
    await app.start();
    status.textContent = "WebGPU runtime active (baseline clear path).";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    status.textContent = `Runtime unavailable: ${message}`;
    status.style.background = "rgba(64, 6, 14, 0.85)";
    console.error("[hypersigil-render]", error);
  }
}

void bootstrap();
