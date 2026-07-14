import type { WebGPUContext } from "../core/webgpu";

export interface FrameGraphPassContext {
  gpu: WebGPUContext;
  colorView: GPUTextureView;
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
