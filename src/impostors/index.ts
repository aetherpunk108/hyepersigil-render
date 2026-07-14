import type { RuntimeModule } from "../core/contracts";

export interface ImpostorsModule extends RuntimeModule {}

export function createImpostorsModule(): ImpostorsModule {
  return { name: "impostors" };
}
