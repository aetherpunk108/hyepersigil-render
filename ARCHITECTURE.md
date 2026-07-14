# Architecture

This repository will evolve into a browser-native hybrid visual runtime built around:
- WebGPU rendering
- WebXR stereo support
- Nanite-style meshlet rendering
- Gaussian splats
- dense point / voxel reservoirs
- impostor fallbacks
- perception / memory / benchmarking for AI-assisted improvement

## Planned modules

- `src/core/` - app bootstrap and render loop
- `src/scene/` - scene definitions and asset routing
- `src/camera/` - mono / stereo / XR camera handling
- `src/visibility/` - culling, LOD, and representation selection
- `src/meshlets/` - meshlet preprocessing and rendering
- `src/splats/` - splat rendering and sorting
- `src/pointfield/` - dense point / voxel rendering
- `src/impostors/` - billboard fallback rendering
- `src/postfx/` - tone mapping, exposure, gamma, bloom, grading
- `src/xr/` - WebXR session and stereo view management
- `src/mcp/` - perception, memory, regression, and tuning hooks
- `src/debug/` - stats, overlays, and developer controls

## Design principle

Prefer representation-agnostic scene routing:
- close hard-surface geometry -> meshlets
- dense photoreal capture -> splats
- ultra-dense scan data -> point/voxel reservoir
- far/small objects -> impostors
