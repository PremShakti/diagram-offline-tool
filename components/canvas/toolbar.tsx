"use client";

import { memo, useCallback, useState, useRef, useEffect } from "react";
import { useReactFlow, getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng } from "html-to-image";
import { useDiagramStore, ICON_OPTIONS, type IconName } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type,
  Square,
  Circle,
  Code2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Undo2,
  Redo2,
  Trash2,
  Download,
  RotateCcw,
  Layers,
  Box,
  HelpCircle,
  FileDown,
  FileUp,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NodeIcon } from "./node-icon";

function ToolbarButton({
  onClick,
  title,
  shortcut,
  active,
  variant,
  disabled,
  children,
}: {
  onClick: () => void;
  title: string;
  shortcut?: string;
  active?: boolean;
  variant?: "default" | "destructive";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className={`
              flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150
              ${disabled ? "opacity-30 cursor-not-allowed" : ""}
              ${
                active
                  ? "bg-foreground text-card shadow-sm"
                  : variant === "destructive"
                    ? "text-muted-foreground hover:text-destructive hover:bg-destructive/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }
            `}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="text-xs">
          <p>
            {title}
            {shortcut && (
              <span className="ml-1.5 text-muted-foreground">{shortcut}</span>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border/60 mx-0.5" />;
}

function IconPicker({ onSelect, onClose }: { onSelect: (icon: IconName) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className="absolute top-full mt-2 left-0 bg-card/98 backdrop-blur-xl border border-border/80 rounded-xl shadow-xl shadow-foreground/[0.06] p-2 z-50"
      style={{ width: 240 }}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium px-1 pb-1.5">
        Icons
      </div>
      <div className="grid grid-cols-5 gap-1">
        {ICON_OPTIONS.map((icon) => (
          <button
            key={icon.id}
            onClick={() => onSelect(icon.id)}
            className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg hover:bg-accent transition-colors"
            title={icon.label}
          >
            <NodeIcon name={icon.id} size={18} strokeWidth={1.5} />
            <span className="text-[9px] text-muted-foreground/60 truncate max-w-full">
              {icon.label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function NodeAdder() {
  const addNode = useDiagramStore((s) => s.addNode);
  const [showIcons, setShowIcons] = useState(false);

  const handleAddNode = useCallback(
    (type: "text" | "rectangle" | "circle" | "code") => {
      const centerX = window.innerWidth / 2 - 90;
      const centerY = window.innerHeight / 2 - 50;
      addNode(type, {
        x: centerX + Math.random() * 80 - 40,
        y: centerY + Math.random() * 80 - 40,
      });
    },
    [addNode]
  );

  const handleAddIcon = useCallback(
    (iconName: IconName) => {
      const centerX = window.innerWidth / 2 - 50;
      const centerY = window.innerHeight / 2 - 55;
      addNode("icon", {
        x: centerX + Math.random() * 80 - 40,
        y: centerY + Math.random() * 80 - 40,
      }, iconName);
      setShowIcons(false);
    },
    [addNode]
  );

  const nodeTypes = [
    { type: "text" as const, label: "Text", shortcut: "T", icon: Type },
    { type: "rectangle" as const, label: "Rectangle", shortcut: "R", icon: Square },
    { type: "circle" as const, label: "Circle", shortcut: "C", icon: Circle },
    { type: "code" as const, label: "Code Block", shortcut: "K", icon: Code2 },
  ];

  return (
    <div className="relative flex items-center">
      {nodeTypes.map(({ type, label, shortcut, icon: Icon }) => (
        <ToolbarButton
          key={type}
          onClick={() => handleAddNode(type)}
          title={`Add ${label}`}
          shortcut={shortcut}
        >
          <Icon size={15} strokeWidth={1.8} />
        </ToolbarButton>
      ))}
      <ToolbarButton
        onClick={() => setShowIcons(!showIcons)}
        title="Add Icon Node"
        shortcut="I"
        active={showIcons}
      >
        <Box size={15} strokeWidth={1.8} />
      </ToolbarButton>

      <AnimatePresence>
        {showIcons && (
          <IconPicker onSelect={handleAddIcon} onClose={() => setShowIcons(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolbarComponent() {
  const { zoomIn, zoomOut, fitView, getNodes } = useReactFlow();
  const deleteSelected = useDiagramStore((s) => s.deleteSelected);
  const duplicateSelected = useDiagramStore((s) => s.duplicateSelected);
  const undo = useDiagramStore((s) => s.undo);
  const redo = useDiagramStore((s) => s.redo);
  const snapToGrid = useDiagramStore((s) => s.snapToGrid);
  const toggleSnapToGrid = useDiagramStore((s) => s.toggleSnapToGrid);
  const clearCanvas = useDiagramStore((s) => s.clearCanvas);
  const past = useDiagramStore((s) => s.past);
  const future = useDiagramStore((s) => s.future);
  const nodes = useDiagramStore((s) => s.nodes);
  const showShortcuts = useDiagramStore((s) => s.showShortcuts);
  const toggleShortcuts = useDiagramStore((s) => s.toggleShortcuts);
  const exportDiagramFile = useDiagramStore((s) => s.exportDiagramFile);
  const importDiagramFile = useDiagramStore((s) => s.importDiagramFile);

  const selectedCount = nodes.filter((n) => n.selected).length;

  // PNG export using html-to-image — captures the full viewport DOM including edges, arrows, icons
  const handleExportPNG = useCallback(() => {
    const allNodes = getNodes();
    if (allNodes.length === 0) return;

    const nodesBounds = getNodesBounds(allNodes);
    const imageWidth = 2048;
    const imageHeight = Math.max(
      1,
      Math.round(imageWidth * (nodesBounds.height / nodesBounds.width))
    );
    const padding = 0.25;
    const viewport = getViewportForBounds(
      nodesBounds,
      imageWidth,
      imageHeight,
      0.5,
      2,
      padding,
    );

    const flowEl = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!flowEl) return;

    toPng(flowEl, {
      backgroundColor: "#fbfbfb",
      width: imageWidth,
      height: imageHeight,
      style: {
        width: String(imageWidth),
        height: String(imageHeight),
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = `diagram-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }).catch((err) => {
      console.error("Export failed:", err);
    });
  }, [getNodes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 bg-card/97 backdrop-blur-xl border border-border/80 rounded-2xl px-1.5 py-1 shadow-lg shadow-foreground/[0.04]"
    >
      {/* Node creation */}
      <NodeAdder />

      <Divider />

      {/* Zoom controls */}
      <ToolbarButton onClick={() => zoomIn({ duration: 200 })} title="Zoom In" shortcut="Ctrl +">
        <ZoomIn size={15} strokeWidth={1.8} />
      </ToolbarButton>
      <ToolbarButton onClick={() => zoomOut({ duration: 200 })} title="Zoom Out" shortcut="Ctrl -">
        <ZoomOut size={15} strokeWidth={1.8} />
      </ToolbarButton>
      <ToolbarButton onClick={() => fitView({ duration: 300, padding: 0.2 })} title="Fit View" shortcut="F">
        <Maximize size={15} strokeWidth={1.8} />
      </ToolbarButton>

      <Divider />

      {/* Grid toggle */}
      <ToolbarButton onClick={toggleSnapToGrid} title="Snap to Grid" shortcut="G" active={snapToGrid}>
        <Grid3X3 size={15} strokeWidth={1.8} />
      </ToolbarButton>

      <Divider />

      {/* Undo/Redo */}
      <ToolbarButton onClick={undo} title="Undo" shortcut="Ctrl Z" disabled={past.length === 0}>
        <Undo2 size={15} strokeWidth={1.8} />
      </ToolbarButton>
      <ToolbarButton onClick={redo} title="Redo" shortcut="Ctrl Shift Z" disabled={future.length === 0}>
        <Redo2 size={15} strokeWidth={1.8} />
      </ToolbarButton>

      <Divider />

      {/* Selection actions */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-0.5 overflow-hidden"
          >
            <ToolbarButton onClick={duplicateSelected} title="Duplicate Selected" shortcut="Ctrl D">
              <Layers size={15} strokeWidth={1.8} />
            </ToolbarButton>
            <ToolbarButton onClick={deleteSelected} title="Delete Selected" shortcut="Del" variant="destructive">
              <Trash2 size={15} strokeWidth={1.8} />
            </ToolbarButton>
            <Divider />
          </motion.div>
        )}
      </AnimatePresence>

      {/* File save / open */}
      <ToolbarButton onClick={exportDiagramFile} title="Save Diagram File" shortcut="Ctrl S" disabled={nodes.length === 0}>
        <FileDown size={15} strokeWidth={1.8} />
      </ToolbarButton>
      <ToolbarButton onClick={importDiagramFile} title="Open Diagram File" shortcut="Ctrl O">
        <FileUp size={15} strokeWidth={1.8} />
      </ToolbarButton>

      <Divider />

      {/* Export image / clear */}
      <ToolbarButton onClick={handleExportPNG} title="Export as PNG" disabled={nodes.length === 0}>
        <Download size={15} strokeWidth={1.8} />
      </ToolbarButton>
      <ToolbarButton onClick={clearCanvas} title="Clear Canvas" disabled={nodes.length === 0}>
        <RotateCcw size={15} strokeWidth={1.8} />
      </ToolbarButton>

      {/* Node count badge */}
      <AnimatePresence>
        {nodes.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center justify-center min-w-[24px] h-6 px-1.5 ml-0.5 rounded-lg bg-accent text-[11px] font-medium text-muted-foreground tabular-nums"
          >
            {nodes.length}
          </motion.div>
        )}
      </AnimatePresence>

      <Divider />

      {/* Help / shortcuts */}
      <ToolbarButton onClick={toggleShortcuts} title="Keyboard Shortcuts" shortcut="?" active={showShortcuts}>
        <HelpCircle size={15} strokeWidth={1.8} />
      </ToolbarButton>
    </motion.div>
  );
}

export const Toolbar = memo(ToolbarComponent);
