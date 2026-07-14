# Browser scaffold layout

This scaffold is intentionally small and modular.

## Entry path

- `index.html` creates a full-screen canvas and runtime status banner.
- `src/main.ts` starts the app and reports WebGPU availability/failures.

## Core runtime

- `src/core/webgpu.ts` handles WebGPU adapter/device/context setup.
- `src/core/config.ts` defines runtime config + representation-routing placeholders.
- `src/core/runtime.ts` wires scene, camera, module stubs, and animation loop.
- `src/core/renderer.ts` provides the baseline clear-only render path.

## Expansion stubs

Each module currently exports lightweight interfaces and creation hooks:

- `src/meshlets`
- `src/splats`
- `src/pointfield`
- `src/impostors`
- `src/postfx`
- `src/xr`
- `src/mcp`
- `src/visibility`
- `src/debug`

These are intentionally minimal so future feature work can extend isolated modules without rewriting bootstrap code.
