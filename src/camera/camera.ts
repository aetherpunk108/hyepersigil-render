export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  fovYRadians: number;
}

export function createCameraState(): CameraState {
  return {
    position: [0, 0, 4],
    target: [0, 0, 0],
    fovYRadians: Math.PI / 3
  };
}

export function updateCameraState(camera: CameraState, elapsedMs: number): void {
  const yaw = elapsedMs * 0.00015;
  camera.position = [Math.cos(yaw) * 4, 0, Math.sin(yaw) * 4];
}
