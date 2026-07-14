export type MaterialTag = "hard-surface" | "dense-capture" | "volumetric" | "fallback-friendly";

export interface SceneTransform {
  position: [number, number, number];
  rotationEuler: [number, number, number];
  scale: [number, number, number];
}

export interface SceneBounds {
  center: [number, number, number];
  radius: number;
}

export interface SceneObject {
  id: string;
  name: string;
  transform: SceneTransform;
  bounds: SceneBounds;
  materialTags: MaterialTag[];
}

export interface SceneState {
  frame: number;
  elapsedMs: number;
  objects: SceneObject[];
}

export function createSceneState(): SceneState {
  return {
    frame: 0,
    elapsedMs: 0,
    objects: [
      {
        id: "test-meshlet-0",
        name: "Test Meshlet",
        transform: {
          position: [0, 0, 0],
          rotationEuler: [0, 0, 0],
          scale: [1, 1, 1]
        },
        bounds: {
          center: [0, 0, 0],
          radius: 1.2
        },
        materialTags: ["hard-surface", "fallback-friendly"]
      }
    ]
  };
}

export function updateSceneState(scene: SceneState, deltaMs: number): void {
  scene.frame += 1;
  scene.elapsedMs += deltaMs;
  const object = scene.objects[0];
  if (!object) {
    return;
  }
  object.transform.rotationEuler = [0, scene.elapsedMs * 0.00045, 0];
}
