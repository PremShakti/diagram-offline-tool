"use client";

import { useCallback, useRef, useMemo, useEffect, useState, type ComponentType } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  ConnectionMode,
  type ReactFlowInstance,
  useReactFlow,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "@xyflow/react/dist/base.css";
import { motion, AnimatePresence } from "framer-motion";
import { FileUp } from "lucide-react";
import { useDiagramStore, type DiagramNode } from "@/lib/store";
import { DiagramNodeMemo } from "./diagram-node";
import { Toolbar } from "./toolbar";
import { EmptyState } from "./empty-state";
import { CanvasContextMenu } from "./canvas-context-menu";
import { StatusBar } from "./status-bar";
import { ShortcutsPanel } from "./shortcuts-panel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, ComponentType<any>> = {
  diagram: DiagramNodeMemo,
};

const defaultEdgeOptions = {
  type: "smoothstep",
  animated: false,
  style: { strokeWidth: 1.5, stroke: "hsl(220 15% 55%)" },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "hsl(220 15% 55%)",
    width: 20,
    height: 20,
  },
};

function CanvasKeyboardHandler() {
  const deleteSelected = useDiagramStore((s) => s.deleteSelected);
  const undo = useDiagramStore((s) => s.undo);
  const redo = useDiagramStore((s) => s.redo);
  const selectAll = useDiagramStore((s) => s.selectAll);
  const copyNodes = useDiagramStore((s) => s.copyNodes);
  const pasteNodes = useDiagramStore((s) => s.pasteNodes);
  const moveSelectedNodes = useDiagramStore((s) => s.moveSelectedNodes);
  const addNode = useDiagramStore((s) => s.addNode);
  const toggleSnapToGrid = useDiagramStore((s) => s.toggleSnapToGrid);
  const duplicateSelected = useDiagramStore((s) => s.duplicateSelected);
  const bringToFront = useDiagramStore((s) => s.bringToFront);
  const sendToBack = useDiagramStore((s) => s.sendToBack);
  const bringForward = useDiagramStore((s) => s.bringForward);
  const sendBackward = useDiagramStore((s) => s.sendBackward);
  const toggleShortcuts = useDiagramStore((s) => s.toggleShortcuts);
  const exportDiagramFile = useDiagramStore((s) => s.exportDiagramFile);
  const importDiagramFile = useDiagramStore((s) => s.importDiagramFile);
  const { fitView } = useReactFlow();

  const clipboardRef = useRef<DiagramNode[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      const isCmd = e.metaKey || e.ctrlKey;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
        return;
      }

      if (isCmd && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (isCmd && e.key === "a") {
        e.preventDefault();
        selectAll();
        return;
      }

      if (isCmd && e.key === "c") {
        e.preventDefault();
        clipboardRef.current = copyNodes();
        return;
      }

      if (isCmd && e.key === "v") {
        e.preventDefault();
        pasteNodes(clipboardRef.current);
        return;
      }

      if (isCmd && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      if (isCmd && e.key === "s") {
        e.preventDefault();
        exportDiagramFile();
        return;
      }

      if (isCmd && e.key === "o") {
        e.preventDefault();
        importDiagramFile();
        return;
      }

      // Shortcuts panel
      if (e.key === "?") {
        e.preventDefault();
        toggleShortcuts();
        return;
      }

      // Layer shortcuts
      if (e.key === "]") {
        e.preventDefault();
        if (e.shiftKey) bringToFront();
        else bringForward();
        return;
      }
      if (e.key === "[") {
        e.preventDefault();
        if (e.shiftKey) sendToBack();
        else sendBackward();
        return;
      }

      const MOVE_STEP = e.shiftKey ? 20 : 5;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelectedNodes(0, -MOVE_STEP);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelectedNodes(0, MOVE_STEP);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveSelectedNodes(-MOVE_STEP, 0);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveSelectedNodes(MOVE_STEP, 0);
        return;
      }

      if (!isCmd) {
        const centerX = window.innerWidth / 2 - 90 + Math.random() * 60 - 30;
        const centerY = window.innerHeight / 2 - 50 + Math.random() * 60 - 30;
        if (e.key === "t" || e.key === "T") {
          addNode("text", { x: centerX, y: centerY });
          return;
        }
        if (e.key === "r" || e.key === "R") {
          addNode("rectangle", { x: centerX, y: centerY });
          return;
        }
        if (e.key === "c" || e.key === "C") {
          addNode("circle", { x: centerX, y: centerY });
          return;
        }
        if (e.key === "k" || e.key === "K") {
          addNode("code", { x: centerX, y: centerY });
          return;
        }
        if (e.key === "i" || e.key === "I") {
          addNode("icon", { x: centerX, y: centerY });
          return;
        }
        if (e.key === "g" || e.key === "G") {
          toggleSnapToGrid();
          return;
        }
        if (e.key === "f" || e.key === "F") {
          fitView({ duration: 300, padding: 0.2 });
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    deleteSelected,
    undo,
    redo,
    selectAll,
    copyNodes,
    pasteNodes,
    moveSelectedNodes,
    addNode,
    toggleSnapToGrid,
    fitView,
    duplicateSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    toggleShortcuts,
    exportDiagramFile,
    importDiagramFile,
  ]);

  return null;
}

export function DiagramCanvas() {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const showShortcuts = useDiagramStore((s) => s.showShortcuts);
  const toggleShortcuts = useDiagramStore((s) => s.toggleShortcuts);
  const loadDiagramData = useDiagramStore((s) => s.loadDiagramData);
  const [isDragOver, setIsDragOver] = useState(false);
  const onNodesChange = useDiagramStore((s) => s.onNodesChange);
  const onEdgesChange = useDiagramStore((s) => s.onEdgesChange);
  const onConnect = useDiagramStore((s) => s.onConnect);
  const addNode = useDiagramStore((s) => s.addNode);
  const snapToGrid = useDiagramStore((s) => s.snapToGrid);
  const gridSize = useDiagramStore((s) => s.gridSize);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string;
  } | null>(null);

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!rfInstance) return;
      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode("text", position);
    },
    [rfInstance, addNode]
  );

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: DiagramNode) => {
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
    },
    []
  );

  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.nodes && Array.isArray(parsed.nodes)) {
          loadDiagramData(parsed);
        }
      } catch {
        // invalid file
      }
    };
    reader.readAsText(file);
  }, [loadDiagramData]);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  const isEmpty = nodes.length === 0;

  return (
    <div
      className="w-full h-screen bg-background relative diagram-canvas"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag
        panOnScroll
        panOnDrag={[1, 2]}
        selectNodesOnDrag={false}
        fitView={nodes.length > 0}
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={4}
        proOptions={proOptions}
        deleteKeyCode={null}
        className="diagram-flow"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={gridSize}
          size={1}
          color="hsl(220 12% 85%)"
        />
        <Controls
          showInteractive={false}
          className="!bg-card/97 !backdrop-blur-xl !border !border-border/80 !rounded-xl !shadow-lg !shadow-foreground/[0.04] [&>button]:!bg-transparent [&>button]:!border-border/40 [&>button]:!text-muted-foreground [&>button:hover]:!text-foreground [&>button]:!rounded-lg [&>button]:!w-7 [&>button]:!h-7"
          position="bottom-right"
        />
        <MiniMap
          maskColor="hsl(0 0% 98.5% / 0.9)"
          className="!bg-card/97 !backdrop-blur-xl !border !border-border/80 !rounded-xl !shadow-lg !shadow-foreground/[0.04]"
          nodeColor="hsl(220 15% 15% / 0.1)"
          position="bottom-left"
          pannable
          zoomable
          style={{ width: 160, height: 110 }}
        />
        <Toolbar />
        <CanvasKeyboardHandler />
        <StatusBar />
      </ReactFlow>

      {/* Empty state overlay */}
      <AnimatePresence>
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyState />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <CanvasContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            nodeId={contextMenu.nodeId}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Shortcuts panel */}
      <AnimatePresence>
        {showShortcuts && (
          <ShortcutsPanel onClose={toggleShortcuts} />
        )}
      </AnimatePresence>

      {/* File drop overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none"
          >
            <div className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl border-2 border-dashed border-foreground/20 bg-card/90">
              <FileUp size={32} strokeWidth={1.4} className="text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">Drop diagram file to open</p>
              <p className="text-xs text-muted-foreground/50">.diagram.json or .json</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
