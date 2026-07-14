# hyepersigil-render

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

## Browser scaffold (phase 1)

This branch includes the first real browser runtime layer:
- `index.html` shell + `src/main.ts` entrypoint
- WebGPU initialization with graceful failure messaging
- scene/camera/update loop scaffold
- modular runtime stubs for `meshlets`, `splats`, `pointfield`, `impostors`, `postfx`, `xr`, `mcp`, `visibility`, `debug`
- baseline render path that clears the canvas every frame

### Local run

```bash
npm install
npm run dev
```

Then open the local Vite URL in a WebGPU-capable browser.

For project organization details, see `docs/browser-scaffold.md`.
