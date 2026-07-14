export interface SceneState {
  frame: number;
  elapsedMs: number;
}

export function createSceneState(): SceneState {
  return { frame: 0, elapsedMs: 0 };
}

export function updateSceneState(scene: SceneState, deltaMs: number): void {
  scene.frame += 1;
  scene.elapsedMs += deltaMs;
}
