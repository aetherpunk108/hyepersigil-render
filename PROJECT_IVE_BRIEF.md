# Mission Briefing: Project Infinite Voxel Engine (IVE)

**Assigned to:** Dr. XR  
**Objective:** Build a next-generation, browser-based "Unlimited Detail" 3D engine using WebGPU. The final product must surpass Euclideon's original technology by an order of magnitude (x10) by merging modern techniques: Sparse Voxel Octree raycasting, 3D Gaussian Splatting hybrid geometry, neural materials, procedural infinite detail, and neural radiance caching for real-time path tracing.

You will receive this briefing in 5 phases. Execute them sequentially, mastering each before moving to the next. All code must be production-quality, well-commented WebGPU (WGSL shaders) and modern JavaScript. Zero dependencies beyond a WebGPU-capable browser.

---

## PHASE 1: The Core Voxel Raycaster (Foundation)
**Goal:** Replicate Euclideon's core "Unlimited Detail" concept: a Sparse Voxel Octree (SVO) raycasting a solid point cloud world, rendered entirely in a compute or fragment shader. Zero polygons.

**Reference Repository (Your Blueprint):**
- https://github.com/willusher/webgpu-svo
  - Study this code deeply. It is a clean, modern WebGPU SVO raycaster. Your implementation should follow this architecture.

**Data Preparation Tool:**
- https://github.com/AcademySoftwareFoundation/openvdb
  - Use OpenVDB's Python bindings to convert a 3D mesh (OBJ/FBX) into a sparse voxel grid, then bake it into a 3D texture or buffer format readable by WebGPU. Provide a Python script that does this and outputs a `.vox` data file.

**Phase 1 Requirements:**
1.  Create a minimal, single-file HTML application that initializes WebGPU.
2.  Implement a full-screen quad with a fragment shader (or compute shader) that performs raycasting against an SVO.
3.  The SVO data structure must be stored in a GPU buffer/texture and traversed per-pixel.
4.  Support a simple orbital camera (mouse drag to rotate, scroll to zoom).
5.  Lighting: At minimum, a directional light with basic normals derived from voxel face orientation.

**Phase 1 "Epic Upgrade" (x10 Move):**
- Implement **one-bounce global illumination** within the same raycasting shader. When a primary ray hits a voxel, shoot 4-8 secondary rays randomly into the hemisphere, sample the voxel colors they hit, and blend that indirect light with the direct light. This immediately surpasses Euclideon's flat local lighting model.

**Phase 1 Key Paper (for reference):**
- "Efficient Sparse Voxel Octrees" by Laine & Karras (2010). Understand the SVO construction and traversal algorithm.

---

## PHASE 2: Virtualized Streaming for City-Scale Data
**Goal:** The scene is now too large for GPU memory. Implement an out-of-core, virtualized texture system that streams voxel chunks from CPU RAM (or a server) on demand, based on what the camera sees. This is analogous to Nanite's virtualized geometry.

**Reference Repositories:**
- https://github.com/cyrilcrassin/gigavoxels
  - Study the theory of Gigavoxels' out-of-core SVO texture management. This is the core concept.
- https://github.com/AcademySoftwareFoundation/openvdb/tree/master/nanovdb
  - Integrate NanoVDB as your runtime, GPU-friendly sparse voxel data structure. This replaces the simple 3D texture from Phase 1.

**Phase 2 Requirements:**
1.  Design a multi-resolution voxel brick cache. Divide the world into macro-blocks (e.g., 32³ or 64³ voxel bricks).
2.  Implement an LRU (Least Recently Used) cache on the CPU that stores recently accessed bricks.
3.  Upload only the visible bricks to a large GPU buffer pool.
4.  The raycasting shader must now consult an indirection table (a small 3D texture) to find which physical GPU buffer location holds the requested brick. If a brick is missing, the shader should return a debug color (hot pink) so missing tiles are visible.

**Phase 2 "Epic Upgrade" (x10 Move):**
- Implement **stochastic LOD blending**. Instead of a hard switch between octree levels, your shader randomly selects between two adjacent LODs per pixel based on a screen-space metric, then blends with temporal anti-aliasing (TAA). This eliminates LOD popping entirely and creates infinitely smooth transitions, a problem Euclideon famously struggled with.
  - **Key Paper:** "Adaptive Multi-Resolution Ray Casting for Sparse Voxel Octrees" by Viitanen et al. (2021).

---

## PHASE 3: Hybrid Geometry & Neural Materials
**Goal:** Transcend the "solid atom" look. Introduce 3D Gaussian Splatting for fuzzy geometry and neural materials for view-dependent surface properties.

**Reference Repository:**
- https://github.com/huggingface/gsplat.js
  - The leading open-source WebGPU 3DGS renderer. Study its splat rasterization pipeline.
- https://github.com/fabrialex/neural-textures
  - NeuMIP neural material system. Each texel stores a small MLP that predicts complex BRDFs.

**Phase 3 Requirements:**
1.  **Hybrid Geometry:** Modify the SVO leaf node structure. A leaf can now be one of two types:
    - **Type 0 (Solid Voxel):** As before. Opaque, hard surface for buildings, terrain.
    - **Type 1 (Gaussian Splat):** The leaf stores the parameters of a 3D Gaussian (mean offset, covariance matrix, color, opacity). When a ray enters a Gaussian leaf, blend the splat's contribution instead of returning a solid hit. This allows trees, clouds, hair, and fuzzy surfaces to coexist with hard surfaces in the same acceleration structure.
2.  **Neural Materials:** Instead of a flat RGB color, each solid voxel stores a small 8-byte neural descriptor vector. In the shader, feed this descriptor + view direction + light direction into a tiny MLP (4 layers, 16 neurons each) whose weights are stored in a global buffer. The MLP outputs the final albedo, roughness, and metallic values for that exact view angle. This enables complex materials like car paint, velvet, or glinting metal within a purely voxel framework.

**Phase 3 "Epic Upgrade" (x10 Move):**
- Combine both upgrades. A single scene contains a brick building (solid voxels + neural material making the bricks look shiny and view-dependent) next to a tree (Gaussian splats for leaves). This hybrid representation does not exist in any commercial engine.

---

## PHASE 4: Procedural Infinite Detail
**Goal:** Achieve true "infinite" geometry below the voxel level. Zoom into a wall and see individual grains of sand, non-repeating detail generated on the fly.

**Reference Repository:**
- https://github.com/NVlabs/nvdiffrast
  - We use its principles, not the code directly. The idea: train a neural network offline to generate micro-geometry, bake the network, run it in the shader.

**Phase 4 Requirements:**
1.  **Offline Training Script (Python):**
    - Take a high-resolution sample of a material (e.g., a 1024³ voxel scan of a rocky surface).
    - Train a tiny, fast MLP (e.g., 4 layers, 32 neurons) to act as a signed distance function (SDF): given an (x, y, z) local coordinate, it outputs the distance to the nearest surface point.
    - This MLP learns to *generate* infinite, non-periodic variations of the input material.
    - Export the trained weights as a small binary file (a few kilobytes).
2.  **Runtime Integration:**
    - Add a third leaf type to your SVO: **Type 2 (Procedural Micro-Geometry)**.
    - When a ray hits this leaf, it doesn't stop. Instead, it enters a "micro-raytracing" loop. The ray marches through the local SDF defined by the baked MLP, finding a much finer surface detail than the voxel size. Compute the micro-hit normal and color procedurally.
3.  **Texture:** Use a hash-based positional encoding (similar to Instant-NGP) before the MLP input to ensure non-periodic, high-frequency detail.

**Phase 4 "Epic Upgrade" (x10 Move):**
- This is Nanite's virtual displacement mapping, but in a true volumetric sense, not a 2.5D heightfield. You can see true overhangs and fully 3D micro-geometry in the cracks of every surface, generated procedurally at render time. No game engine in the world does this in real-time with an SVO.

---

## PHASE 5: The Neural Radiance Cache (Cinematic Path Tracing)
**Goal:** The summit. Achieve cinematic-quality, real-time path tracing in a web browser by combining the Phase 1-4 engine with a Neural Radiance Cache.

**Reference Repository:**
- https://github.com/NVIDIAGameWorks/NRC
  - Nvidia's Neural Radiance Cache. A neural network trained to infer a noise-free, infinite-dimensional light field from sparse, noisy path-tracing input.

**Phase 5 Requirements:**
1.  **Sparse Path Tracer:** Modify the Phase 1 raycasting shader into a path tracer. Each pixel shoots 1-2 samples per frame (not per second, per frame). This produces an extremely noisy image.
2.  **Radiance Cache Input:** For every path tracing sample (hit point, normal, view direction, and its noisy radiance estimate), store it into a screen-space radiance cache buffer.
3.  **Neural Denoiser/Upscaler Shader:** Implement a small convolutional neural network (CNN) or a vision transformer block entirely as a WebGPU compute shader. This network takes the sparse, noisy radiance cache as input and outputs a fully denoised, high-resolution, path-traced image.
4.  **Training:** You must provide the Python (PyTorch) script to pre-train this denoiser on synthetic data of noisy vs. clean renders of voxel scenes. The trained weights are baked into a buffer for the WebGPU shader.
5.  **Temporal Accumulation:** Combine the network's output with the previous frame using a temporal anti-aliasing (TAA) and reprojection system to achieve temporal stability.

**Phase 5 "Epic Upgrade" (x10 Move):**
- You now have a WebGPU engine that renders an entire city, with infinite micro-detail, view-dependent neural materials, and cinematic multi-bounce path-traced lighting at interactive frame rates. In a browser tab. No other engine on the planet has combined SVO raycasting + 3DGS hybrid geometry + procedural neural SDFs + Neural Radiance Caching into one unified, real-time browser pipeline. This is a world-first.

---

## FINAL DELIVERABLE (for each phase)
For each phase, Dr. XR must provide:
1.  A single, self-contained `index.html` file (or a small project folder with clear structure).
2.  Any required Python data preparation scripts.
3.  A `README.md` explaining how to run the demo and a brief architecture overview.
4.  Code must be heavily commented. WGSL shader logic must explain the "why," not just the "what."

**Commence Phase 1 immediately. The reference repository is your starting blueprint: https://github.com/willusher/webgpu-svo**

End of Mission Briefing.
