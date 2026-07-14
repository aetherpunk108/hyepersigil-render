import type { RepresentationRoutingConfig, RuntimeConfig } from "./contracts";

const DEFAULT_ROUTING: RepresentationRoutingConfig = {
  defaultRepresentation: "meshlets",
  enabled: {
    meshlets: true,
    splats: true,
    pointfield: true,
    impostors: true
  },
  distanceThresholds: {
    meshlets: 25,
    splats: 16,
    pointfield: 10,
    impostors: 60
  }
};

export const DEFAULT_CONFIG: RuntimeConfig = {
  clearColor: { r: 0.02, g: 0.03, b: 0.06, a: 1.0 },
  routing: DEFAULT_ROUTING,
  debug: { overlay: true }
};

export function createRuntimeConfig(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    clearColor: { ...DEFAULT_CONFIG.clearColor, ...overrides.clearColor },
    debug: { ...DEFAULT_CONFIG.debug, ...overrides.debug },
    routing: {
      ...DEFAULT_CONFIG.routing,
      ...overrides.routing,
      enabled: {
        ...DEFAULT_CONFIG.routing.enabled,
        ...overrides.routing?.enabled
      },
      distanceThresholds: {
        ...DEFAULT_CONFIG.routing.distanceThresholds,
        ...overrides.routing?.distanceThresholds
      }
    }
  };
}
