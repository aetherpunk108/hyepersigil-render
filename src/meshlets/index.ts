import type { RuntimeModule } from "../core/contracts";

export interface MeshletDrawResources {
  pipeline: GPURenderPipeline;
  vertexBuffer: GPUBuffer;
  vertexCount: number;
}

const VERTEX_STRIDE = 24;
const BUFFER_USAGE_VERTEX = 0x20;
const BUFFER_USAGE_COPY_DST = 0x8;

const SHADER = /* wgsl */ `
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};

@vertex
fn vs_main(@location(0) position : vec3f, @location(1) color : vec3f) -> VertexOut {
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

export function createMeshletDrawResources(device: GPUDevice, format: GPUTextureFormat): MeshletDrawResources {
  const shader = device.createShaderModule({ code: SHADER });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shader,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: VERTEX_STRIDE,
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
      targets: [{ format }]
    },
    primitive: {
      topology: "triangle-list"
    }
  });

  const data = new Float32Array([
    0.0, 0.55, 0.0, 0.9, 0.3, 0.2,
    -0.5, -0.45, 0.0, 0.2, 0.7, 1.0,
    0.5, -0.45, 0.0, 0.2, 1.0, 0.5
  ]);

  const vertexBuffer = device.createBuffer({
    label: "meshlet-placeholder-triangle",
    size: data.byteLength,
    usage: BUFFER_USAGE_VERTEX | BUFFER_USAGE_COPY_DST
  });
  device.queue.writeBuffer(vertexBuffer, 0, data);

  return {
    pipeline,
    vertexBuffer,
    vertexCount: 3
  };
}

export function drawMeshletPlaceholder(pass: GPURenderPassEncoder, resources: MeshletDrawResources): void {
  pass.setPipeline(resources.pipeline);
  pass.setVertexBuffer(0, resources.vertexBuffer);
  pass.draw(resources.vertexCount);
}

export interface MeshletsModule extends RuntimeModule {}

export function createMeshletsModule(): MeshletsModule {
  return { name: "meshlets" };
}
