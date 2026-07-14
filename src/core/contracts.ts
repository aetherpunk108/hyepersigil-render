export type Representation = "meshlets" | "splats" | "pointfield" | "impostors";

export interface RuntimeConfig {
  clearColor: { r: number; g: number; b: number; a: number };
  routing: RepresentationRoutingConfig;
  debug: { overlay: boolean };
}

export interface RepresentationRoutingConfig {
  defaultRepresentation: Representation;
  enabled: Record<Representation, boolean>;
  distanceThresholds: Record<Representation, number>;
}

export interface RuntimeModuleContext {
  now: number;
  deltaMs: number;
  config: RuntimeConfig;
}

export interface RuntimeModule {
  name: string;
  initialize?(): void | Promise<void>;
  update?(context: RuntimeModuleContext): void;
  destroy?(): void | Promise<void>;
}
