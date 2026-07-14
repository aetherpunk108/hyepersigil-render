import type { RuntimeModule } from "../core/contracts";
import { DEPTH_FORMAT, HDR_FORMAT } from "../core/renderer";

export interface PointfieldDrawResources {
  pipeline: GPURenderPipeline;
  vertexBuffer: GPUBuffer;
  vertexCount: number;
}

// Placeholder point-cloud / voxel-reservoir renderer.
// Real implementation will stream voxel reservoirs and apply LOD selection;
// this scaffold establishes the pipeline topology and shader interface.
const POINTFIELD_SHADER = /* wgsl */ `
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};

@vertex
fn vs_main(
  @location(0) position : vec3f,
  @location(1) color : vec3f
) -> VertexOut {
  var out : VertexOut;
  out.position = vec4f(position, 1.0);
  out.color = color;
  return out;
}

@fragment
fn fs_main(in : VertexOut) -> @location(0) vec4f {
  return vec4f(in.color, 1.0);
}
`;

const POINT_STRIDE = 24; // position(xyz) + color(rgb) = 6 * 4 bytes

export function createPointfieldDrawResources(device: GPUDevice): PointfieldDrawResources {
  const shader = device.createShaderModule({ label: "pointfield-placeholder-shader", code: POINTFIELD_SHADER });

  const pipeline = device.createRenderPipeline({
    label: "pointfield-placeholder",
    layout: "auto",
    vertex: {
      module: shader,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: POINT_STRIDE,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" },
            { shaderLocation: 1, offset: 12, format: "float32x3" }
          ]
        }
      ]
    },
    fragment: {
      module: shader,
      entryPoint: "fs_main",
      targets: [{ format: HDR_FORMAT }]
    },
    primitive: { topology: "point-list" },
    depthStencil: {
      format: DEPTH_FORMAT,
      depthWriteEnabled: true,
      depthCompare: "less"
    }
  });

  // 5×5 grid of placeholder points in a plane
  const rows = 5;
  const cols = 5;
  const points: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c / (cols - 1) - 0.5) * 0.8;
      const y = (r / (rows - 1) - 0.5) * 0.8;
      const z = -0.6;
      const cr = 0.2 + (c / (cols - 1)) * 0.6;
      const cg = 0.5;
      const cb = 0.2 + (r / (rows - 1)) * 0.6;
      points.push(x, y, z, cr, cg, cb);
    }
  }

  const data = new Float32Array(points);
  const vertexBuffer = device.createBuffer({
    label: "pointfield-placeholder-buffer",
    size: data.byteLength,
    usage: 0x20 | 0x8 // VERTEX | COPY_DST
  });
  device.queue.writeBuffer(vertexBuffer, 0, data);

  return { pipeline, vertexBuffer, vertexCount: rows * cols };
}

export function drawPointfieldPlaceholder(pass: GPURenderPassEncoder, resources: PointfieldDrawResources): void {
  pass.setPipeline(resources.pipeline);
  pass.setVertexBuffer(0, resources.vertexBuffer);
  pass.draw(resources.vertexCount);
}

export interface PointfieldModule extends RuntimeModule {}

export function createPointfieldModule(): PointfieldModule {
  return { name: "pointfield" };
}
