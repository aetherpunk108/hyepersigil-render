import type { RuntimeModule } from "../core/contracts";

export interface PostFXModule extends RuntimeModule {}

export function createPostFXModule(): PostFXModule {
  return { name: "postfx" };
}
