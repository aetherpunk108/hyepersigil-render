import type { WebGPUContext } from "../core/webgpu";

export interface FrameGraphPassContext {
  gpu: WebGPUContext;
  /** Swap-chain view — final output written here by the tone-mapping pass. */
  colorView: GPUTextureView;
  /** HDR offscreen view — all scene passes render into this. */
  hdrView: GPUTextureView;
  /** Depth view — shared across all scene passes in a frame. */
  depthView: GPUTextureView;
}

export interface FrameGraphPass {
  name: string;
  execute(context: FrameGraphPassContext): void;
}

export interface FrameGraph {
  register(pass: FrameGraphPass): void;
  execute(context: FrameGraphPassContext): void;
  getPassNames(): string[];
}

export function createFrameGraph(): FrameGraph {
  const passes: FrameGraphPass[] = [];
  return {
    register(pass) {
      passes.push(pass);
    },
    execute(context) {
      for (const pass of passes) {
        pass.execute(context);
      }
    },
    getPassNames() {
      return passes.map((pass) => pass.name);
    }
  };
}
