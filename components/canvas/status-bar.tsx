"use client";

import { memo } from "react";
import { useViewport } from "@xyflow/react";
import { useDiagramStore } from "@/lib/store";
import { motion } from "framer-motion";

function StatusBarComponent() {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const snapToGrid = useDiagramStore((s) => s.snapToGrid);
  const selectedCount = nodes.filter((n) => n.selected).length;
  const viewport = useViewport();
  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-3.5 py-1.5 bg-card/90 backdrop-blur-xl border border-border/60 rounded-full shadow-sm text-[11px] text-muted-foreground/60 font-mono tabular-nums select-none"
    >
      <span>{zoomPercent}%</span>
      <span className="w-px h-3 bg-border/50" />
      <span>
        {nodes.length} node{nodes.length !== 1 ? "s" : ""}
      </span>
      {edges.length > 0 && (
        <>
          <span className="w-px h-3 bg-border/50" />
          <span>
            {edges.length} edge{edges.length !== 1 ? "s" : ""}
          </span>
        </>
      )}
      {selectedCount > 0 && (
        <>
          <span className="w-px h-3 bg-border/50" />
          <span className="text-foreground/50">
            {selectedCount} selected
          </span>
        </>
      )}
      {snapToGrid && (
        <>
          <span className="w-px h-3 bg-border/50" />
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-foreground/25" />
            grid
          </span>
        </>
      )}
    </motion.div>
  );
}

export const StatusBar = memo(StatusBarComponent);
