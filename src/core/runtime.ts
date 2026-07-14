import { createCameraState, updateCameraState } from "../camera/camera";
import { createDebugModule } from "../debug";
import { createImpostorsModule } from "../impostors";
import { createMCPModule } from "../mcp";
import { createMeshletsModule } from "../meshlets";
import { createPointfieldModule } from "../pointfield";
import { createPostFXModule } from "../postfx";
import { createSceneState, updateSceneState } from "../scene/scene";
import { createSplatsModule } from "../splats";
import { createVisibilityModule } from "../visibility";
import { createXRModule } from "../xr";
import { createRuntimeConfig } from "./config";
import type { RuntimeConfig, RuntimeModule } from "./contracts";
import { renderFrame } from "./renderer";
import { initializeWebGPU } from "./webgpu";

export interface RuntimeApp {
  start(): Promise<void>;
  stop(): void;
}

export function createRuntimeApp(canvas: HTMLCanvasElement, configOverrides: Partial<RuntimeConfig> = {}): RuntimeApp {
  const config = createRuntimeConfig(configOverrides);
  const scene = createSceneState();
  const camera = createCameraState();
  const modules: RuntimeModule[] = [
    createMeshletsModule(),
    createSplatsModule(),
    createPointfieldModule(),
    createImpostorsModule(),
    createPostFXModule(),
    createXRModule(),
    createMCPModule(),
    createVisibilityModule(),
    createDebugModule()
  ];

  let rafId = 0;
  let running = false;

  return {
    async start() {
      const gpu = await initializeWebGPU(canvas);
      for (const module of modules) {
        await module.initialize?.();
      }

      running = true;
      let lastNow = performance.now();
      const tick = (now: number) => {
        if (!running) {
          return;
        }

        const deltaMs = now - lastNow;
        lastNow = now;
        updateSceneState(scene, deltaMs);
        updateCameraState(camera, scene.elapsedMs);

        for (const module of modules) {
          module.update?.({ now, deltaMs, config });
        }

        renderFrame(canvas, gpu, config);
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      for (const module of modules) {
        void module.destroy?.();
      }
    }
  };
}
