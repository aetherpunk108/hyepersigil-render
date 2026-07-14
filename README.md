# hypersigil-render

A browser-native visual runtime for futuristic rendering in WebGPU + WebXR.

## Vision

This project combines:
- Nanite-style meshlet rendering and culling
- Gaussian splat rendering
- dense point / voxel reservoir support
- billboard impostor fallbacks
- mono, stereo, and WebXR-compatible rendering
- modular post-processing
- perception / memory / benchmark scaffolding for AI-driven improvement

## Goals

- Browser-first
- WebGPU-first
- Modular and extensible
- Friendly to autonomous coding agents
- Designed for hybrid rendering and future self-upgrade workflows

## Initial scope

This repository starts as a scaffold for:
- rendering architecture
- AI ingestion docs
- module layout
- validation and benchmark plans
- future browser demo implementation

## Browser scaffold (phase 2 baseline)

This branch includes:
- `index.html` shell + `src/main.ts` entrypoint
- WebGPU initialization with graceful failure messaging
- scene object model (`transform`, `bounds`, `materialTags`)
- mono camera + stereo-ready view structs (XR wiring still stubbed)
- representation router v1 + visibility pass outputs per view
- frame graph scaffold (`clear -> meshlets placeholder -> postfx placeholder`)
- minimal meshlets placeholder draw path with single test geometry
- debug overlay for active representation counts, frame timing, and fallback reason

### Local run

```bash
npm install
npm run dev
```

Then open the local Vite URL in a WebGPU-capable browser.

### Validation commands

```bash
npm test
npm run build
npm run smoke:browser
```

For module contract details and extension guidance, see `docs/browser-scaffold.md`.
