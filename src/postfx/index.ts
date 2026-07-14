import type { RuntimeModule } from "../core/contracts";

// ---------------------------------------------------------------------------
// PostFX resources: ACES tone mapping + gamma correction
// ---------------------------------------------------------------------------

// Fullscreen triangle trick: 3 vertices with no vertex buffer, positions
// generated purely from vertex_index covering the entire clip space.
const TONEMAP_SHADER = /* wgsl */ `
@vertex
fn vs_main(@builtin(vertex_index) idx : u32) -> @builtin(position) vec4f {
  // Generates a triangle that covers the full screen:
  //   idx=0 → (-1, -1)  idx=1 → (3, -1)  idx=2 → (-1, 3)
  let x = f32((idx & 1u) << 2u) - 1.0;
  let y = f32((idx & 2u) << 1u) - 1.0;
  return vec4f(x, y, 0.0, 1.0);
}

@group(0) @binding(0) var hdrSampler : sampler;
@group(0) @binding(1) var hdrTexture : texture_2d<f32>;

// ACES fitted tone mapping (Narkowicz 2015 approximation)
fn aces(x : vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3f(0.0), vec3f(1.0));
}

@fragment
fn fs_main(@builtin(position) pos : vec4f) -> @location(0) vec4f {
  let dims = vec2f(textureDimensions(hdrTexture, 0));
  let uv = pos.xy / dims;
  let hdr = textureSample(hdrTexture, hdrSampler, uv).rgb;
  let ldr = aces(hdr);
  // sRGB gamma (approximate 2.2 power curve)
  let gamma = pow(max(ldr, vec3f(0.0)), vec3f(1.0 / 2.2));
  return vec4f(gamma, 1.0);
}
`;

export interface PostFXResources {
  /** Draw the HDR-to-LDR tone-mapping blit into an active render pass. */
  drawToneMap(pass: GPURenderPassEncoder, hdrView: GPUTextureView): void;
  /** Invalidate the cached bind group (call after HDR texture resize). */
  invalidate(): void;
}

export function createPostFXResources(device: GPUDevice, swapFormat: GPUTextureFormat): PostFXResources {
  const shader = device.createShaderModule({ label: "postfx-tonemap-shader", code: TONEMAP_SHADER });

  const bindGroupLayout = device.createBindGroupLayout({
    label: "postfx-tonemap-bgl",
    entries: [
      { binding: 0, visibility: 0x2 /* FRAGMENT */, sampler: { type: "filtering" } },
      { binding: 1, visibility: 0x2 /* FRAGMENT */, texture: { sampleType: "float" } }
    ]
  });

  const pipeline = device.createRenderPipeline({
    label: "postfx-tonemap-pipeline",
    layout: device.createPipelineLayout({
      label: "postfx-tonemap-layout",
      bindGroupLayouts: [bindGroupLayout]
    }),
    vertex: { module: shader, entryPoint: "vs_main" },
    fragment: {
      module: shader,
      entryPoint: "fs_main",
      targets: [{ format: swapFormat }]
    },
    primitive: { topology: "triangle-list" }
  });

  const sampler = device.createSampler({ label: "postfx-tonemap-sampler", magFilter: "linear", minFilter: "linear" });

  // Cached bind group — recreated only when the HDR view changes (i.e. canvas resize)
  let cachedBindGroup: GPUBindGroup | null = null;

  return {
    invalidate() {
      cachedBindGroup = null;
    },
    drawToneMap(pass, hdrView) {
      if (!cachedBindGroup) {
        cachedBindGroup = device.createBindGroup({
          label: "postfx-tonemap-bg",
          layout: bindGroupLayout,
          entries: [
            { binding: 0, resource: sampler },
            { binding: 1, resource: hdrView }
          ]
        });
      }
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, cachedBindGroup);
      pass.draw(3); // fullscreen triangle
    }
  };
}

// ---------------------------------------------------------------------------
// Runtime module shell (no per-frame GPU work — rendering is driven by
// createFrameRenderer via createPostFXResources above)
// ---------------------------------------------------------------------------

export interface PostFXModule extends RuntimeModule {}

export function createPostFXModule(): PostFXModule {
  return { name: "postfx" };
}
