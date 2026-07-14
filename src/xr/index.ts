import type { RuntimeModule } from "../core/contracts";

// ---------------------------------------------------------------------------
// WebXR session scaffold
// Manages immersive-vr / immersive-ar session lifecycle.
// The runtime checks xrModule.isActive each tick and delegates the
// per-eye rendering loop to xrModule.onXRFrame when a session is live.
// ---------------------------------------------------------------------------

export type XRSessionMode = "immersive-vr" | "immersive-ar" | "inline";

export interface XRFrameInfo {
  session: XRSession;
  frame: XRFrame;
  referenceSpace: XRReferenceSpace;
}

export interface XRModule extends RuntimeModule {
  /** True while an XR session is active. */
  readonly isActive: boolean;
  /** Request an immersive XR session and bind it to the given canvas. */
  requestSession(canvas: HTMLCanvasElement, mode?: XRSessionMode): Promise<void>;
  /** End the current XR session (no-op if none active). */
  endSession(): Promise<void>;
  /**
   * Optional frame callback — invoked by the XR session's rAF when active.
   * Set this to integrate XR poses into the camera / render loop.
   */
  onXRFrame: ((info: XRFrameInfo) => void) | null;
}

export function createXRModule(): XRModule {
  let session: XRSession | null = null;
  let referenceSpace: XRReferenceSpace | null = null;
  let xrRafId = 0;
  let onXRFrame: ((info: XRFrameInfo) => void) | null = null;

  function isXRSupported(): boolean {
    return typeof navigator !== "undefined" && "xr" in navigator;
  }

  async function startSessionLoop(sess: XRSession, refSpace: XRReferenceSpace): Promise<void> {
    const tick = (_time: number, frame: XRFrame) => {
      if (!session) return;
      onXRFrame?.({ session: sess, frame, referenceSpace: refSpace });
      xrRafId = sess.requestAnimationFrame(tick);
    };
    xrRafId = sess.requestAnimationFrame(tick);
  }

  return {
    name: "xr",

    get isActive(): boolean {
      return session !== null;
    },

    get onXRFrame(): ((info: XRFrameInfo) => void) | null {
      return onXRFrame;
    },
    set onXRFrame(cb: ((info: XRFrameInfo) => void) | null) {
      onXRFrame = cb;
    },

    async requestSession(canvas, mode: XRSessionMode = "immersive-vr"): Promise<void> {
      if (session) return; // already active
      if (!isXRSupported()) {
        console.warn("[xr] WebXR is not available in this environment.");
        return;
      }

      const supported = await navigator.xr!.isSessionSupported(mode);
      if (!supported) {
        console.warn(`[xr] Session mode '${mode}' is not supported on this device.`);
        return;
      }

      const newSession = await navigator.xr!.requestSession(mode, {
        requiredFeatures: ["local-floor"]
      });

      newSession.addEventListener("end", () => {
        session = null;
        referenceSpace = null;
        xrRafId = 0;
      });

      // NOTE: Full WebGPU + WebXR integration requires XRGPUBinding (proposed API,
      // not yet widely available). The XRWebGLLayer approach is WebGL-specific and
      // incompatible with a WebGPU canvas. This scaffold sets up the session
      // lifecycle and reference space; the render-layer binding should be added
      // once XRGPUBinding is standardised and supported.

      referenceSpace = await newSession.requestReferenceSpace("local-floor");
      session = newSession;

      await startSessionLoop(session, referenceSpace);
    },

    async endSession(): Promise<void> {
      if (!session) return;
      if (xrRafId) {
        session.cancelAnimationFrame(xrRafId);
        xrRafId = 0;
      }
      await session.end();
      session = null;
      referenceSpace = null;
    },

    destroy(): void {
      void this.endSession();
    }
  };
}
