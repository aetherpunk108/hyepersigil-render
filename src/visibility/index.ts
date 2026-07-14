import type { Representation, RuntimeConfig, RuntimeModule } from "../core/contracts";

export interface VisibilityInput {
  distance: number;
  prefersDenseCapture?: boolean;
}

function firstEnabled(config: RuntimeConfig): Representation {
  const fallback: Representation[] = ["meshlets", "splats", "pointfield", "impostors"];
  return fallback.find((kind) => config.routing.enabled[kind]) ?? "meshlets";
}

export function routeRepresentation(input: VisibilityInput, config: RuntimeConfig): Representation {
  if (input.prefersDenseCapture && config.routing.enabled.splats) {
    return "splats";
  }
  if (input.distance >= config.routing.distanceThresholds.impostors && config.routing.enabled.impostors) {
    return "impostors";
  }
  if (input.distance <= config.routing.distanceThresholds.pointfield && config.routing.enabled.pointfield) {
    return "pointfield";
  }
  if (config.routing.enabled[config.routing.defaultRepresentation]) {
    return config.routing.defaultRepresentation;
  }
  return firstEnabled(config);
}

export interface VisibilityModule extends RuntimeModule {}

export function createVisibilityModule(): VisibilityModule {
  return { name: "visibility" };
}
