import type { RuntimeModule } from "../core/contracts";

export interface DebugModule extends RuntimeModule {}

export function createDebugModule(): DebugModule {
  return { name: "debug" };
}
