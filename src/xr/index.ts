import type { RuntimeModule } from "../core/contracts";

export interface XRModule extends RuntimeModule {}

export function createXRModule(): XRModule {
  return { name: "xr" };
}
