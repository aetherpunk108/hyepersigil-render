import type { RuntimeModule } from "../core/contracts";

export interface MCPModule extends RuntimeModule {}

export function createMCPModule(): MCPModule {
  return { name: "mcp" };
}
