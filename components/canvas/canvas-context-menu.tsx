"use client";

import { memo, useCallback, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useDiagramStore, NODE_COLORS, ICON_OPTIONS, type DiagramNode, type NodeColorId, type IconName } from "@/lib/store";
import {
  Copy,
  ClipboardPaste,
  Trash2,
  Layers,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Type,
  Square,
  Circle,
  Code2,
  Box,
  ChevronRight,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { NodeIcon } from "./node-icon";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  nodeId?: string;
}

function MenuItem({
  onClick,
  label,
  shortcut,
  icon: Icon,
  destructive,
  children,
}: {
  onClick?: () => void;
  label: string;
  shortcut?: string;
  icon?: React.ElementType;
  destructive?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-sm rounded-md transition-colors ${
        destructive
          ? "text-destructive hover:bg-destructive/8"
          : "text-foreground hover:bg-accent"
      }`}
    >
      {Icon && <Icon size={14} strokeWidth={1.6} className="shrink-0 opacity-60" />}
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="text-[11px] text-muted-foreground/60 font-mono">{shortcut}</span>
      )}
      {children}
    </button>
  );
}

function MenuDivider() {
  return <div className="h-px bg-border mx-1 my-1" />;
}

function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
      {children}
    </div>
  );
}

function CanvasContextMenuComponent({ x, y, onClose, nodeId }: ContextMenuProps) {
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useDiagramStore((s) => s.addNode);
  const deleteSelected = useDiagramStore((s) => s.deleteSelected);
  const duplicateSelected = useDiagramStore((s) => s.duplicateSelected);
  const copyNodes = useDiagramStore((s) => s.copyNodes);
  const pasteNodes = useDiagramStore((s) => s.pasteNodes);
  const setNodeColor = useDiagramStore((s) => s.setNodeColor);
  const selectAll = useDiagramStore((s) => s.selectAll);
  const alignNodes = useDiagramStore((s) => s.alignNodes);
  const bringToFront = useDiagramStore((s) => s.bringToFront);
  const sendToBack = useDiagramStore((s) => s.sendToBack);
  const bringForward = useDiagramStore((s) => s.bringForward);
  const sendBackward = useDiagramStore((s) => s.sendBackward);
  const nodes = useDiagramStore((s) => s.nodes);
  const clipboardRef = useRef<DiagramNode[]>([]);
  const [showIcons, setShowIcons] = useState(false);

  const selectedCount = nodes.filter((n) => n.selected).length;
  const flowPosition = screenToFlowPosition({ x, y });

  const handleAddNode = useCallback(
    (type: "text" | "rectangle" | "circle" | "code") => {
      addNode(type, flowPosition);
      onClose();
    },
    [addNode, flowPosition, onClose]
  );

  const handleAddIcon = useCallback(
    (iconName: IconName) => {
      addNode("icon", flowPosition, iconName);
      onClose();
    },
    [addNode, flowPosition, onClose]
  );

  const handleCopy = useCallback(() => {
    clipboardRef.current = copyNodes();
    onClose();
  }, [copyNodes, onClose]);

  const handlePaste = useCallback(() => {
    pasteNodes(clipboardRef.current, { x: 30, y: 30 });
    onClose();
  }, [pasteNodes, onClose]);

  const handleDuplicate = useCallback(() => {
    duplicateSelected();
    onClose();
  }, [duplicateSelected, onClose]);

  const handleDelete = useCallback(() => {
    deleteSelected();
    onClose();
  }, [deleteSelected, onClose]);

  const handleSelectAll = useCallback(() => {
    selectAll();
    onClose();
  }, [selectAll, onClose]);

  const handleColorChange = useCallback(
    (colorId: NodeColorId) => {
      if (nodeId) {
        setNodeColor(nodeId, colorId);
      } else {
        const selected = nodes.filter((n) => n.selected);
        selected.forEach((n) => setNodeColor(n.id, colorId));
      }
      onClose();
    },
    [nodeId, nodes, setNodeColor, onClose]
  );

  const handleAlign = useCallback(
    (dir: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      alignNodes(dir);
      onClose();
    },
    [alignNodes, onClose]
  );

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.min(x, window.innerWidth - 240),
    top: Math.min(y, window.innerHeight - 400),
    zIndex: 100,
  };

  return (
    <>
      <div className="fixed inset-0 z-[99]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />

      <div
        className="w-56 bg-card/98 backdrop-blur-xl border border-border rounded-xl shadow-xl shadow-foreground/[0.06] py-1.5 animate-in fade-in zoom-in-95 duration-100"
        style={menuStyle}
      >
        {nodeId || selectedCount > 0 ? (
          <>
            <MenuItem onClick={handleCopy} label="Copy" shortcut="Ctrl+C" icon={Copy} />
            <MenuItem onClick={handleDuplicate} label="Duplicate" shortcut="Ctrl+D" icon={Layers} />
            <MenuDivider />

            <MenuLabel>Layer</MenuLabel>
            <MenuItem onClick={() => { bringToFront(); onClose(); }} label="Bring to Front" shortcut="]" icon={ArrowUpToLine} />
            <MenuItem onClick={() => { bringForward(); onClose(); }} label="Bring Forward" icon={ArrowUp} />
            <MenuItem onClick={() => { sendBackward(); onClose(); }} label="Send Backward" icon={ArrowDown} />
            <MenuItem onClick={() => { sendToBack(); onClose(); }} label="Send to Back" shortcut="[" icon={ArrowDownToLine} />
            <MenuDivider />

            <MenuLabel>Color</MenuLabel>
            <div className="flex items-center gap-1.5 px-3 py-1">
              {NODE_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleColorChange(color.id)}
                  className="w-5 h-5 rounded-full border border-foreground/10 hover:scale-125 transition-transform"
                  style={{ background: color.bg, borderColor: color.border }}
                  title={color.id}
                />
              ))}
            </div>

            {selectedCount >= 2 && (
              <>
                <MenuDivider />
                <MenuLabel>Align</MenuLabel>
                <div className="flex items-center gap-0.5 px-2 py-1">
                  {[
                    { dir: "left" as const, icon: AlignHorizontalJustifyStart },
                    { dir: "center" as const, icon: AlignHorizontalJustifyCenter },
                    { dir: "right" as const, icon: AlignHorizontalJustifyEnd },
                    { dir: "top" as const, icon: AlignVerticalJustifyStart },
                    { dir: "middle" as const, icon: AlignVerticalJustifyCenter },
                    { dir: "bottom" as const, icon: AlignVerticalJustifyEnd },
                  ].map(({ dir, icon: AlignIcon }) => (
                    <button
                      key={dir}
                      onClick={() => handleAlign(dir)}
                      className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title={`Align ${dir}`}
                    >
                      <AlignIcon size={14} strokeWidth={1.6} />
                    </button>
                  ))}
                </div>
              </>
            )}

            <MenuDivider />
            <MenuItem onClick={handleDelete} label="Delete" shortcut="Del" icon={Trash2} destructive />
          </>
        ) : (
          <>
            <MenuLabel>Add node</MenuLabel>
            <MenuItem onClick={() => handleAddNode("text")} label="Text" shortcut="T" icon={Type} />
            <MenuItem onClick={() => handleAddNode("rectangle")} label="Rectangle" shortcut="R" icon={Square} />
            <MenuItem onClick={() => handleAddNode("circle")} label="Circle" shortcut="C" icon={Circle} />
            <MenuItem onClick={() => handleAddNode("code")} label="Code Block" shortcut="K" icon={Code2} />

            {/* Icon submenu */}
            <div className="relative">
              <button
                onClick={() => setShowIcons(!showIcons)}
                className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm rounded-md transition-colors text-foreground hover:bg-accent"
              >
                <Box size={14} strokeWidth={1.6} className="shrink-0 opacity-60" />
                <span className="flex-1 text-left">Icon Node</span>
                <ChevronRight size={12} className="opacity-40" />
              </button>

              {showIcons && (
                <div className="absolute left-full top-0 ml-1 w-52 bg-card/98 backdrop-blur-xl border border-border rounded-xl shadow-xl shadow-foreground/[0.06] p-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="grid grid-cols-5 gap-0.5">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon.id}
                        onClick={() => handleAddIcon(icon.id)}
                        className="flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg hover:bg-accent transition-colors"
                        title={icon.label}
                      >
                        <NodeIcon name={icon.id} size={16} strokeWidth={1.5} />
                        <span className="text-[8px] text-muted-foreground/50 truncate max-w-full">
                          {icon.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <MenuDivider />
            <MenuItem onClick={handlePaste} label="Paste" shortcut="Ctrl+V" icon={ClipboardPaste} />
            <MenuItem onClick={handleSelectAll} label="Select All" shortcut="Ctrl+A" />
          </>
        )}
      </div>
    </>
  );
}

export const CanvasContextMenu = memo(CanvasContextMenuComponent);
