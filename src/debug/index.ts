import type { Representation, RuntimeModule } from "../core/contracts";

export interface DebugOverlayStats {
  frameMs: number;
  representationCounts: Record<Representation, number>;
  fallbackReasons: string[];
}

export interface DebugOverlay {
  update(stats: DebugOverlayStats): void;
  destroy(): void;
}

function formatCounts(counts: Record<Representation, number>): string {
  return `meshlets:${counts.meshlets} splats:${counts.splats} pointfield:${counts.pointfield} impostors:${counts.impostors}`;
}

export function createDebugOverlay(enabled: boolean): DebugOverlay {
  if (!enabled) {
    return { update() {}, destroy() {} };
  }

  const panel = document.createElement("aside");
  panel.id = "debug-overlay";
  panel.setAttribute("aria-live", "polite");
  document.body.append(panel);

  return {
    update(stats) {
      const reason = stats.fallbackReasons[0] ?? "none";
      panel.textContent = `frame ${stats.frameMs.toFixed(2)}ms | ${formatCounts(stats.representationCounts)} | fallback ${reason}`;
    },
    destroy() {
      panel.remove();
    }
  };
}

export interface DebugModule extends RuntimeModule {}

export function createDebugModule(): DebugModule {
  return { name: "debug" };
}
