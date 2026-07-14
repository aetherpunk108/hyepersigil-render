import type { RuntimeModule } from "../core/contracts";

export interface MeshletsModule extends RuntimeModule {}

export function createMeshletsModule(): MeshletsModule {
  return { name: "meshlets" };
}
