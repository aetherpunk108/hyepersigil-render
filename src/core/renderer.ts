import type { RuntimeConfig } from "./contracts";
import type { WebGPUContext } from "./webgpu";
import { drawMeshletPlaceholder, type MeshletDrawResources } from "../meshlets";
import { registerPostFXPasses } from "../postfx";
import { createFrameGraph } from "../postfx/frame-graph";
import type { VisibilityPassOutput } from "../visibility";

export interface FrameRenderInput {
  visibility: VisibilityPassOutput[];
  meshlets: MeshletDrawResources;
}

function resizeCanvas(canvas: HTMLCanvasElement): boolean {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

function hasMeshletWork(outputs: VisibilityPassOutput[]): boolean {
  return outputs.some((viewOutput) =>
    viewOutput.visibleObjects.some((visible) => visible.decision.representation === "meshlets")
  );
}

export function renderFrame(
  canvas: HTMLCanvasElement,
  gpu: WebGPUContext,
  config: RuntimeConfig,
  frame: FrameRenderInput
): void {
  resizeCanvas(canvas);

  const colorView = gpu.context.getCurrentTexture().createView();
  const graph = createFrameGraph();

  graph.register({
    name: "clear-pass",
    execute({ gpu: contextGpu, colorView: contextColorView }) {
      const encoder = contextGpu.device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: contextColorView,
            clearValue: config.clearColor,
            loadOp: "clear",
            storeOp: "store"
          }
        ]
      });
      pass.end();
      contextGpu.device.queue.submit([encoder.finish()]);
    }
  });

  graph.register({
    name: "meshlets-placeholder-pass",
    execute({ gpu: contextGpu, colorView: contextColorView }) {
      if (!hasMeshletWork(frame.visibility)) {
        return;
      }
      const encoder = contextGpu.device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: contextColorView,
            loadOp: "load",
            storeOp: "store"
          }
        ]
      });
      drawMeshletPlaceholder(pass, frame.meshlets);
      pass.end();
      contextGpu.device.queue.submit([encoder.finish()]);
    }
  });

  registerPostFXPasses(graph);
  graph.execute({ gpu, colorView });
}
