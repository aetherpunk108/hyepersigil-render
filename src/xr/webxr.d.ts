// Minimal WebXR type declarations for the XR scaffold.
// Replace with @types/webxr when full WebXR integration is required.

declare class XRSession extends EventTarget {
  requestAnimationFrame(callback: XRFrameRequestCallback): number;
  cancelAnimationFrame(id: number): void;
  requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
  updateRenderState(state: XRRenderStateInit): Promise<void>;
  end(): Promise<void>;
  addEventListener(type: "end", listener: () => void): void;
}

declare class XRFrame {
  readonly session: XRSession;
  getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | null;
}

declare class XRReferenceSpace extends EventTarget {}

declare class XRViewerPose {
  readonly views: ReadonlyArray<XRView>;
}

declare class XRView {
  readonly eye: "left" | "right" | "none";
  readonly transform: XRRigidTransform;
  readonly projectionMatrix: Float32Array;
}

declare class XRRigidTransform {
  readonly matrix: Float32Array;
  readonly position: DOMPointReadOnly;
  readonly orientation: DOMPointReadOnly;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
declare class XRWebGLLayer {
  constructor(session: XRSession, context: WebGLRenderingContext | WebGL2RenderingContext);
}

declare interface XRRenderStateInit {
  baseLayer?: XRWebGLLayer;
  depthFar?: number;
  depthNear?: number;
}

declare type XRReferenceSpaceType = "viewer" | "local" | "local-floor" | "bounded-floor" | "unbounded";
declare type XRFrameRequestCallback = (time: number, frame: XRFrame) => void;

declare interface Navigator {
  readonly xr?: XRSystem;
}

declare interface XRSystem {
  isSessionSupported(mode: string): Promise<boolean>;
  requestSession(mode: string, options?: XRSessionInit): Promise<XRSession>;
}

declare interface XRSessionInit {
  requiredFeatures?: string[];
  optionalFeatures?: string[];
}
