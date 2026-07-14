# AI Spec

This repository is intended to be extended by an autonomous coding agent.

## Build priorities

1. Create a browser-ready WebGPU app shell.
2. Add a modular rendering pipeline.
3. Add representation routing between meshlets, splats, point fields, and impostors.
4. Add mono/stereo/WebXR camera abstractions.
5. Add post-processing passes.
6. Add perception / memory / benchmark scaffolding.
7. Add validation and demo scenes.

## Safety rules

- Prefer incremental changes.
- Keep the project runnable after each milestone.
- Add tests or validation hooks whenever a feature is introduced.
- Keep all rendering systems modular.

## Expected outputs from the AI agent

- Source code changes
- Tests
- Documentation
- Demo scenes
- Benchmark or regression hooks

## Rendering philosophy

Do not assume one representation for all assets.
The runtime should decide per object and per view.
