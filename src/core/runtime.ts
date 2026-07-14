import { buildViewStates, createCameraState, updateCameraState } from "../camera/camera";
import { createDebugModule, createDebugOverlay } from "../debug";
import { createImpostorsModule } from "../impostors";
import { createMCPModule } from "../mcp";
import { createMeshletDrawResources, createMeshletsModule } from "../meshlets";
import { createPointfieldModule } from "../pointfield";
import { createPostFXModule } from "../postfx";
import { createSceneState, updateSceneState } from "../scene/scene";
import { createSplatsModule } from "../splats";
import { createVisibilityModule, runVisibilityPass } from "../visibility";
import { createXRModule } from "../xr";
import { createRuntimeConfig } from "./config";
import type { Representation, RuntimeConfig, RuntimeModule } from "./contracts";
import { renderFrame } from "./renderer";
import { initializeWebGPU } from "./webgpu";

export interface RuntimeApp {
  start(): Promise<void>;
  stop(): void;
}

function createRepresentationCounts(): Record<Representation, number> {
  return {
    meshlets: 0,
    splats: 0,
    pointfield: 0,
    impostors: 0
  };
}

export function createRuntimeApp(canvas: HTMLCanvasElement, configOverrides: Partial<RuntimeConfig> = {}): RuntimeApp {
  const config = createRuntimeConfig(configOverrides);
  const scene = createSceneState();
  const camera = createCameraState();
  const debugOverlay = createDebugOverlay(config.debug.overlay);
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
      const meshletDrawResources = createMeshletDrawResources(gpu.device, gpu.format);

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

        const aspect = Math.max(1, canvas.clientWidth) / Math.max(1, canvas.clientHeight);
        const views = buildViewStates(camera, aspect);
        const visibility = views.map((view) => runVisibilityPass({ view, objects: scene.objects }, config));

        for (const module of modules) {
          module.update?.({ now, deltaMs, config });
        }

        renderFrame(canvas, gpu, config, {
          visibility,
          meshlets: meshletDrawResources
        });

        const representationCounts = createRepresentationCounts();
        const fallbackReasons = new Set<string>();
        for (const perView of visibility) {
          for (const visible of perView.visibleObjects) {
            representationCounts[visible.decision.representation] += 1;
            fallbackReasons.add(visible.decision.fallbackReason);
          }
        }

        debugOverlay.update({
          frameMs: deltaMs,
          representationCounts,
          fallbackReasons: [...fallbackReasons]
        });

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      debugOverlay.destroy();
      for (const module of modules) {
        void module.destroy?.();
      }
    }
  };
}
