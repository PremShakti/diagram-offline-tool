"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { DiagramCanvas } from "@/components/canvas/diagram-canvas";

export default function Page() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <ReactFlowProvider>
        <DiagramCanvas />
      </ReactFlowProvider>
    </main>
  );
}
