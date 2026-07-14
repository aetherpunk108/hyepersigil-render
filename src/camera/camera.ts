export type ViewMode = "mono" | "stereo";

export interface ViewFrustum {
  near: number;
  far: number;
  fovYRadians: number;
  aspect: number;
}

export interface ViewState {
  viewId: string;
  eye: "mono" | "left" | "right";
  position: [number, number, number];
  target: [number, number, number];
  frustum: ViewFrustum;
}

export interface CameraState {
  mode: ViewMode;
  position: [number, number, number];
  target: [number, number, number];
  fovYRadians: number;
  near: number;
  far: number;
  stereoEyeOffset: number;
}

export function createCameraState(): CameraState {
  return {
    mode: "mono",
    position: [0, 0, 4],
    target: [0, 0, 0],
    fovYRadians: Math.PI / 3,
    near: 0.1,
    far: 200,
    stereoEyeOffset: 0.032
  };
}

export function updateCameraState(camera: CameraState, elapsedMs: number): void {
  const yaw = elapsedMs * 0.00015;
  camera.position = [Math.cos(yaw) * 4, 0, Math.sin(yaw) * 4];
}

export function buildViewStates(camera: CameraState, aspect: number): ViewState[] {
  const baseFrustum: ViewFrustum = {
    near: camera.near,
    far: camera.far,
    fovYRadians: camera.fovYRadians,
    aspect
  };

  if (camera.mode === "stereo") {
    return [
      {
        viewId: "left-eye",
        eye: "left",
        position: [camera.position[0] - camera.stereoEyeOffset, camera.position[1], camera.position[2]],
        target: camera.target,
        frustum: baseFrustum
      },
      {
        viewId: "right-eye",
        eye: "right",
        position: [camera.position[0] + camera.stereoEyeOffset, camera.position[1], camera.position[2]],
        target: camera.target,
        frustum: baseFrustum
      }
    ];
  }

  return [
    {
      viewId: "mono",
      eye: "mono",
      position: camera.position,
      target: camera.target,
      frustum: baseFrustum
    }
  ];
}
