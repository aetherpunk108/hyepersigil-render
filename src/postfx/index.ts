import type { RuntimeModule } from "../core/contracts";
import type { FrameGraph } from "./frame-graph";

export interface PostFXModule extends RuntimeModule {}

export function registerPostFXPasses(frameGraph: FrameGraph): void {
  frameGraph.register({
    name: "postfx-tonemap-placeholder",
    execute() {}
  });
}

export function createPostFXModule(): PostFXModule {
  return { name: "postfx" };
}
