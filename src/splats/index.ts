import type { RuntimeModule } from "../core/contracts";
import { DEPTH_FORMAT, HDR_FORMAT } from "../core/renderer";

export interface SplatDrawResources {
  pipeline: GPURenderPipeline;
  vertexBuffer: GPUBuffer;
  vertexCount: number;
}

// Placeholder Gaussian splat: a set of screen-space quads (triangle-strip pairs)
// rendered as colored ellipse approximations. Real splat rendering requires
// per-splat covariance sorting and alpha blending; this scaffold establishes
// the pipeline structure.
const SPLAT_SHADER = /* wgsl */ `
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
  @location(1) uv : vec2f,
};

@vertex
fn vs_main(
  @location(0) position : vec3f,
  @location(1) color : vec3f,
  @location(2) radius : f32
) -> VertexOut {
  var out : VertexOut;
  out.position = vec4f(position, 1.0);
  out.color = vec4f(color, 0.85);
  out.uv = position.xy / max(radius, 0.001);
  return out;
}

@fragment
fn fs_main(in : VertexOut) -> @location(0) vec4f {
  // Soft circular splat falloff
  let d2 = dot(in.uv, in.uv);
  if (d2 > 1.0) { discard; }
  let alpha = in.color.a * exp(-3.0 * d2);
  return vec4f(in.color.rgb * alpha, alpha);
}
`;

const SPLAT_STRIDE = 28;
const SPLAT_BUFFER_USAGE = 0x20 | 0x8; // VERTEX | COPY_DST

export function createSplatDrawResources(device: GPUDevice): SplatDrawResources {
  const shader = device.createShaderModule({ label: "splats-placeholder-shader", code: SPLAT_SHADER });

  const pipeline = device.createRenderPipeline({
    label: "splats-placeholder",
    layout: "auto",
    vertex: {
      module: shader,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: SPLAT_STRIDE,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" },
            { shaderLocation: 1, offset: 12, format: "float32x3" },
            { shaderLocation: 2, offset: 24, format: "float32" }
          ]
        }
      ]
    },
    fragment: {
      module: shader,
      entryPoint: "fs_main",
      targets: [
        {
          format: HDR_FORMAT,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
          }
        }
      ]
    },
    primitive: { topology: "point-list" },
    depthStencil: {
      format: DEPTH_FORMAT,
      depthWriteEnabled: false,
      depthCompare: "less-equal"
    }
  });

  // Two placeholder splat points: position, color, radius
  const data = new Float32Array([
    -0.25, 0.15, -0.5,   0.9, 0.6, 0.2,   0.18,
     0.30, -0.2, -0.3,   0.3, 0.8, 1.0,   0.14
  ]);

  const vertexBuffer = device.createBuffer({
    label: "splats-placeholder-buffer",
    size: data.byteLength,
    usage: SPLAT_BUFFER_USAGE
  });
  device.queue.writeBuffer(vertexBuffer, 0, data);

  return { pipeline, vertexBuffer, vertexCount: 2 };
}

export function drawSplatsPlaceholder(pass: GPURenderPassEncoder, resources: SplatDrawResources): void {
  pass.setPipeline(resources.pipeline);
  pass.setVertexBuffer(0, resources.vertexBuffer);
  pass.draw(resources.vertexCount);
}

export interface SplatsModule extends RuntimeModule {}

export function createSplatsModule(): SplatsModule {
  return { name: "splats" };
}
