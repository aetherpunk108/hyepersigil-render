import type { RuntimeConfig } from "./contracts";
import type { WebGPUContext } from "./webgpu";

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

export function renderFrame(canvas: HTMLCanvasElement, gpu: WebGPUContext, config: RuntimeConfig): void {
  resizeCanvas(canvas);

  const encoder = gpu.device.createCommandEncoder();
  const view = gpu.context.getCurrentTexture().createView();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view,
        clearValue: config.clearColor,
        loadOp: "clear",
        storeOp: "store"
      }
    ]
  });
  pass.end();

  gpu.device.queue.submit([encoder.finish()]);
}
