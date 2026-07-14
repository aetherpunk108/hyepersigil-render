import type { Representation, RuntimeConfig, RuntimeModule } from "../core/contracts";
import type { SceneObject } from "../scene/scene";
import type { ViewState } from "../camera/camera";

export interface RepresentationDecision {
  representation: Representation;
  distance: number;
  fallbackReason: string;
}

export interface VisibleObject {
  object: SceneObject;
  decision: RepresentationDecision;
}

export interface VisibilityPassInput {
  view: ViewState;
  objects: SceneObject[];
}

export interface VisibilityPassOutput {
  viewId: string;
  visibleObjects: VisibleObject[];
  culledCount: number;
}

function firstEnabled(config: RuntimeConfig): Representation {
  const fallback: Representation[] = ["meshlets", "splats", "pointfield", "impostors"];
  return fallback.find((kind) => config.routing.enabled[kind]) ?? "meshlets";
}

function distanceToObject(object: SceneObject, view: ViewState): number {
  const worldCenter: [number, number, number] = [
    object.bounds.center[0] + object.transform.position[0],
    object.bounds.center[1] + object.transform.position[1],
    object.bounds.center[2] + object.transform.position[2]
  ];
  const dx = worldCenter[0] - view.position[0];
  const dy = worldCenter[1] - view.position[1];
  const dz = worldCenter[2] - view.position[2];
  return Math.hypot(dx, dy, dz);
}

function isInView(object: SceneObject, distance: number, view: ViewState): boolean {
  return distance >= view.frustum.near - object.bounds.radius && distance <= view.frustum.far + object.bounds.radius;
}

export function routeRepresentationV1(object: SceneObject, distance: number, config: RuntimeConfig): RepresentationDecision {
  if (distance >= config.routing.distanceThresholds.impostors && config.routing.enabled.impostors) {
    return { representation: "impostors", distance, fallbackReason: "distance-impostor-threshold" };
  }

  if (object.materialTags.includes("dense-capture") && config.routing.enabled.splats) {
    return { representation: "splats", distance, fallbackReason: "dense-capture-tag" };
  }

  if (object.materialTags.includes("volumetric") && config.routing.enabled.pointfield) {
    return { representation: "pointfield", distance, fallbackReason: "volumetric-tag" };
  }

  if (distance <= config.routing.distanceThresholds.pointfield && config.routing.enabled.pointfield) {
    return { representation: "pointfield", distance, fallbackReason: "near-pointfield-threshold" };
  }

  if (config.routing.enabled[config.routing.defaultRepresentation]) {
    return {
      representation: config.routing.defaultRepresentation,
      distance,
      fallbackReason: "default-route"
    };
  }

  const fallback = firstEnabled(config);
  return { representation: fallback, distance, fallbackReason: "fallback-first-enabled" };
}

export function runVisibilityPass(input: VisibilityPassInput, config: RuntimeConfig): VisibilityPassOutput {
  const visibleObjects: VisibleObject[] = [];
  let culledCount = 0;

  for (const object of input.objects) {
    const distance = distanceToObject(object, input.view);
    if (!isInView(object, distance, input.view)) {
      culledCount += 1;
      continue;
    }

    visibleObjects.push({
      object,
      decision: routeRepresentationV1(object, distance, config)
    });
  }

  return {
    viewId: input.view.viewId,
    visibleObjects,
    culledCount
  };
}

export interface VisibilityModule extends RuntimeModule {}

export function createVisibilityModule(): VisibilityModule {
  return { name: "visibility" };
}
