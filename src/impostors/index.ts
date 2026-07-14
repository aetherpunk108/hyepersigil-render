import type { RuntimeModule } from "../core/contracts";
import { DEPTH_FORMAT, HDR_FORMAT } from "../core/renderer";

export interface ImpostorDrawResources {
  pipeline: GPURenderPipeline;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  indexCount: number;
}

// Placeholder impostor renderer using camera-facing quads (billboards).
// Real implementation will generate per-object pre-rendered depth impostors
// with multi-view capture; this scaffold provides the pipeline structure.
const IMPOSTOR_SHADER = /* wgsl */ `
struct VertexIn {
  @location(0) position : vec3f,
  @location(1) uv : vec2f,
  @location(2) color : vec3f,
};

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
  @location(1) color : vec3f,
};

@vertex
fn vs_main(in : VertexIn) -> VertexOut {
  var out : VertexOut;
  out.position = vec4f(in.position, 1.0);
  out.uv = in.uv;
  out.color = in.color;
  return out;
}

@fragment
fn fs_main(in : VertexOut) -> @location(0) vec4f {
  // Soft circular billboard mask
  let uv = in.uv * 2.0 - 1.0;
  let d2 = dot(uv, uv);
  if (d2 > 1.0) { discard; }
  let shade = 0.6 + 0.4 * (1.0 - d2);
  return vec4f(in.color * shade, 1.0);
}
`;

// Vertex layout: position(xyz) + uv(xy) + color(rgb) = 8 * 4 = 32 bytes
const IMPOSTOR_STRIDE = 32;

function buildQuad(cx: number, cy: number, cz: number, size: number, r: number, g: number, b: number): Float32Array {
  const h = size * 0.5;
  // 4 vertices: top-left, top-right, bottom-left, bottom-right
  return new Float32Array([
    cx - h, cy + h, cz,  0, 1,  r, g, b,
    cx + h, cy + h, cz,  1, 1,  r, g, b,
    cx - h, cy - h, cz,  0, 0,  r, g, b,
    cx + h, cy - h, cz,  1, 0,  r, g, b
  ]);
}

export function createImpostorDrawResources(device: GPUDevice): ImpostorDrawResources {
  const shader = device.createShaderModule({ label: "impostors-placeholder-shader", code: IMPOSTOR_SHADER });

  const pipeline = device.createRenderPipeline({
    label: "impostors-placeholder",
    layout: "auto",
    vertex: {
      module: shader,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: IMPOSTOR_STRIDE,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" },
            { shaderLocation: 1, offset: 12, format: "float32x2" },
            { shaderLocation: 2, offset: 20, format: "float32x3" }
          ]
        }
      ]
    },
    fragment: {
      module: shader,
      entryPoint: "fs_main",
      targets: [{ format: HDR_FORMAT }]
    },
    primitive: { topology: "triangle-strip", stripIndexFormat: "uint16" },
    depthStencil: {
      format: DEPTH_FORMAT,
      depthWriteEnabled: true,
      depthCompare: "less"
    }
  });

  // Two placeholder impostor quads at different positions
  const quad0 = buildQuad(-0.6, 0.0, -0.8, 0.35, 0.8, 0.4, 0.2);
  const quad1 = buildQuad(0.6, 0.1, -0.9, 0.28, 0.3, 0.5, 0.9);
  const vertexData = new Float32Array([...quad0, ...quad1]);

  const vertexBuffer = device.createBuffer({
    label: "impostors-placeholder-vbuf",
    size: vertexData.byteLength,
    usage: 0x20 | 0x8 // VERTEX | COPY_DST
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  // Two quads, each as a triangle strip: 4 vertices each, with a strip-restart index (0xFFFF) between them
  const indexData = new Uint16Array([0, 1, 2, 3, 0xffff, 4, 5, 6, 7]);
  const indexBuffer = device.createBuffer({
    label: "impostors-placeholder-ibuf",
    size: indexData.byteLength,
    usage: 0x10 | 0x8 // INDEX | COPY_DST
  });
  device.queue.writeBuffer(indexBuffer, 0, indexData);

  return { pipeline, vertexBuffer, indexBuffer, indexCount: indexData.length };
}

export function drawImpostorsPlaceholder(pass: GPURenderPassEncoder, resources: ImpostorDrawResources): void {
  pass.setPipeline(resources.pipeline);
  pass.setVertexBuffer(0, resources.vertexBuffer);
  pass.setIndexBuffer(resources.indexBuffer, "uint16");
  pass.drawIndexed(resources.indexCount);
}

export interface ImpostorsModule extends RuntimeModule {}

export function createImpostorsModule(): ImpostorsModule {
  return { name: "impostors" };
}
