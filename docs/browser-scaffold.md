# Browser scaffold layout

This scaffold is intentionally small and modular.

## Entry path

- `index.html` creates a full-screen canvas and runtime status banner.
- `src/main.ts` starts the app and reports WebGPU availability/failures.

## Core runtime

- `src/core/webgpu.ts` handles WebGPU adapter/device/context setup.
- `src/core/config.ts` defines runtime config + representation-routing defaults.
- `src/core/runtime.ts` wires scene, camera, visibility routing, frame graph execution, and debug overlay updates.
- `src/core/renderer.ts` runs ordered passes (`clear -> meshlets placeholder -> postfx placeholder`) through a frame graph.

## Module contracts (current)

- `src/scene/scene.ts`
  - `SceneObject` contains `transform`, `bounds`, and `materialTags`.
  - `SceneState` owns runtime object instances and per-frame updates.
- `src/camera/camera.ts`
  - `CameraState` supports mono now and stereo-ready fields.
  - `buildViewStates` returns per-view structs used by visibility and rendering.
- `src/visibility/index.ts`
  - `runVisibilityPass` accepts frustum-aware view input and returns per-view visible outputs.
  - `routeRepresentationV1` chooses meshlets/splats/pointfield/impostors by tags + distance thresholds.
- `src/meshlets/index.ts`
  - provides placeholder pipeline resources and one test draw call.
- `src/postfx/frame-graph.ts` + `src/postfx/index.ts`
  - registers and executes named passes in deterministic order.
- `src/debug/index.ts`
  - overlay summarizes per-frame representation counts, frame timing, and fallback reasons.
- `src/xr/index.ts`
  - remains a runtime stub; camera/view interfaces are already stereo-ready for future XR wiring.

## Smoke validation

- `npm run smoke:browser` checks:
  - browser boot path can serve runtime shell over Vite,
  - runtime HTML includes required canvas/status roots,
  - WebGPU unavailable messaging path is still present.

## How to extend safely (x10 upgrade path)

1. Keep scene object contracts representation-agnostic; add metadata fields rather than representation-specific fields.
2. Add new representation routers behind `routeRepresentationV1` rather than replacing v1 behavior in-place.
3. Add visibility outputs as additive fields so existing render and debug paths remain compatible.
4. Register new render/postfx passes via the frame graph and preserve deterministic ordering.
5. Keep camera view structs backward-compatible (`viewId`, `eye`, `frustum`) before adding XR projection details.
6. Expand debug overlay keys additively to preserve external parsing and future telemetry hooks.
7. Keep smoke validation green whenever runtime bootstrap, WebGPU gating, or shell markup changes.
