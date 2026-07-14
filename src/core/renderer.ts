import type { RuntimeConfig } from "./contracts";
import type { WebGPUContext } from "./webgpu";
import { drawMeshletPlaceholder, type MeshletDrawResources } from "../meshlets";
import { drawSplatsPlaceholder, type SplatDrawResources } from "../splats";
import { drawPointfieldPlaceholder, type PointfieldDrawResources } from "../pointfield";
import { drawImpostorsPlaceholder, type ImpostorDrawResources } from "../impostors";
import { createPostFXResources, type PostFXResources } from "../postfx";
import { createFrameGraph } from "../postfx/frame-graph";
import type { VisibilityPassOutput } from "../visibility";

export const HDR_FORMAT: GPUTextureFormat = "rgba16float";
export const DEPTH_FORMAT: GPUTextureFormat = "depth24plus";

export interface FrameRenderInput {
  visibility: VisibilityPassOutput[];
  meshlets: MeshletDrawResources;
  splats: SplatDrawResources;
  pointfield: PointfieldDrawResources;
  impostors: ImpostorDrawResources;
}

export interface FrameRenderer {
  render(canvas: HTMLCanvasElement, config: RuntimeConfig, frame: FrameRenderInput): void;
  destroy(): void;
}

function resizeCanvas(canvas: HTMLCanvasElement): void {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function hasRepresentationWork(outputs: VisibilityPassOutput[], kind: string): boolean {
  return outputs.some((v) => v.visibleObjects.some((o) => o.decision.representation === kind));
}

export function createFrameRenderer(gpu: WebGPUContext): FrameRenderer {
  let depthTexture: GPUTexture | null = null;
  let hdrTexture: GPUTexture | null = null;
  // Views are stable per texture — recreated only on canvas resize
  let cachedDepthView: GPUTextureView | null = null;
  let cachedHdrView: GPUTextureView | null = null;
  let lastWidth = 0;
  let lastHeight = 0;
  let postfxResources: PostFXResources | null = null;

  function ensureTextures(width: number, height: number): { depthView: GPUTextureView; hdrView: GPUTextureView } {
    if (width !== lastWidth || height !== lastHeight || !depthTexture || !hdrTexture) {
      depthTexture?.destroy();
      hdrTexture?.destroy();
      depthTexture = gpu.device.createTexture({
        label: "frame-depth",
        size: { width, height, depthOrArrayLayers: 1 },
        format: DEPTH_FORMAT,
        usage: 0x10 // RENDER_ATTACHMENT
      });
      hdrTexture = gpu.device.createTexture({
        label: "frame-hdr",
        size: { width, height, depthOrArrayLayers: 1 },
        format: HDR_FORMAT,
        usage: 0x10 | 0x04 // RENDER_ATTACHMENT | TEXTURE_BINDING
      });
      cachedDepthView = depthTexture.createView();
      cachedHdrView = hdrTexture.createView();
      lastWidth = width;
      lastHeight = height;
      // Invalidate postfx bind group since the HDR view changed
      postfxResources?.invalidate();
    }
    return { depthView: cachedDepthView!, hdrView: cachedHdrView! };
  }

  function getPostFXResources(): PostFXResources {
    if (!postfxResources) {
      postfxResources = createPostFXResources(gpu.device, gpu.format);
    }
    return postfxResources;
  }

  return {
    render(canvas, config, frame) {
      resizeCanvas(canvas);
      const width = Math.max(1, canvas.width);
      const height = Math.max(1, canvas.height);
      const { depthView, hdrView } = ensureTextures(width, height);
      const colorView = gpu.context.getCurrentTexture().createView();
      const pfx = getPostFXResources();
      const graph = createFrameGraph();

      graph.register({
        name: "clear-pass",
        execute({ gpu: g, hdrView: hv, depthView: dv }) {
          const encoder = g.device.createCommandEncoder();
          const pass = encoder.beginRenderPass({
            colorAttachments: [
              { view: hv, clearValue: config.clearColor, loadOp: "clear", storeOp: "store" }
            ],
            depthStencilAttachment: {
              view: dv,
              depthClearValue: 1.0,
              depthLoadOp: "clear",
              depthStoreOp: "store"
            }
          });
          pass.end();
          g.device.queue.submit([encoder.finish()]);
        }
      });

      graph.register({
        name: "meshlets-placeholder-pass",
        execute({ gpu: g, hdrView: hv, depthView: dv }) {
          if (!hasRepresentationWork(frame.visibility, "meshlets")) return;
          const encoder = g.device.createCommandEncoder();
          const pass = encoder.beginRenderPass({
            colorAttachments: [{ view: hv, loadOp: "load", storeOp: "store" }],
            depthStencilAttachment: { view: dv, depthLoadOp: "load", depthStoreOp: "store" }
          });
          drawMeshletPlaceholder(pass, frame.meshlets);
          pass.end();
          g.device.queue.submit([encoder.finish()]);
        }
      });

      graph.register({
        name: "splats-placeholder-pass",
        execute({ gpu: g, hdrView: hv, depthView: dv }) {
          if (!hasRepresentationWork(frame.visibility, "splats")) return;
          const encoder = g.device.createCommandEncoder();
          const pass = encoder.beginRenderPass({
            colorAttachments: [{ view: hv, loadOp: "load", storeOp: "store" }],
            depthStencilAttachment: { view: dv, depthLoadOp: "load", depthStoreOp: "store" }
          });
          drawSplatsPlaceholder(pass, frame.splats);
          pass.end();
          g.device.queue.submit([encoder.finish()]);
        }
      });

      graph.register({
        name: "pointfield-placeholder-pass",
        execute({ gpu: g, hdrView: hv, depthView: dv }) {
          if (!hasRepresentationWork(frame.visibility, "pointfield")) return;
          const encoder = g.device.createCommandEncoder();
          const pass = encoder.beginRenderPass({
            colorAttachments: [{ view: hv, loadOp: "load", storeOp: "store" }],
            depthStencilAttachment: { view: dv, depthLoadOp: "load", depthStoreOp: "store" }
          });
          drawPointfieldPlaceholder(pass, frame.pointfield);
          pass.end();
          g.device.queue.submit([encoder.finish()]);
        }
      });

      graph.register({
        name: "impostors-placeholder-pass",
        execute({ gpu: g, hdrView: hv, depthView: dv }) {
          if (!hasRepresentationWork(frame.visibility, "impostors")) return;
          const encoder = g.device.createCommandEncoder();
          const pass = encoder.beginRenderPass({
            colorAttachments: [{ view: hv, loadOp: "load", storeOp: "store" }],
            depthStencilAttachment: { view: dv, depthLoadOp: "load", depthStoreOp: "store" }
          });
          drawImpostorsPlaceholder(pass, frame.impostors);
          pass.end();
          g.device.queue.submit([encoder.finish()]);
        }
      });

      graph.register({
        name: "postfx-tonemap-pass",
        execute({ gpu: g, colorView: cv, hdrView: hv }) {
          const encoder = g.device.createCommandEncoder();
          const pass = encoder.beginRenderPass({
            colorAttachments: [
              { view: cv, loadOp: "clear", clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: "store" }
            ]
          });
          pfx.drawToneMap(pass, hv);
          pass.end();
          g.device.queue.submit([encoder.finish()]);
        }
      });

      graph.execute({ gpu, colorView, hdrView, depthView });
    },
    destroy() {
      depthTexture?.destroy();
      hdrTexture?.destroy();
    }
  };
}
