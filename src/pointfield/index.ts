import type { RuntimeModule } from "../core/contracts";

export interface PointfieldModule extends RuntimeModule {}

export function createPointfieldModule(): PointfieldModule {
  return { name: "pointfield" };
}
