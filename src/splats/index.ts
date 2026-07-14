import type { RuntimeModule } from "../core/contracts";

export interface SplatsModule extends RuntimeModule {}

export function createSplatsModule(): SplatsModule {
  return { name: "splats" };
}
