"use client";

import { memo, useCallback, useRef, useState, useEffect } from "react";
import { Handle, Position, type NodeProps, NodeResizeControl } from "@xyflow/react";
import { useDiagramStore, NODE_COLORS, type DiagramNodeData, type NodeColorId } from "@/lib/store";
import { NodeIcon } from "./node-icon";

function DiagramNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as DiagramNodeData;
  const updateNodeData = useDiagramStore((s) => s.updateNodeData);
  const pushHistory = useDiagramStore((s) => s.pushHistory);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const colorId = (nodeData.colorId || "default") as NodeColorId;
  const colorDef = NODE_COLORS.find((c) => c.id === colorId) || NODE_COLORS[0];
  const isCircle = nodeData.nodeType === "circle";
  const isCode = nodeData.nodeType === "code";
  const isIcon = nodeData.nodeType === "icon";
  const isText = nodeData.nodeType === "text";

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = useCallback(() => setIsEditing(false), []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { label: e.target.value });
    },
    [id, updateNodeData]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
    if (e.key === "Escape") setIsEditing(false);
    e.stopPropagation();
  }, []);

  const handleEditStart = useCallback(() => pushHistory(), [pushHistory]);

  const handleClasses =
    "!w-2.5 !h-2.5 !bg-foreground/20 !border-[1.5px] !border-card hover:!bg-foreground/50 transition-all !rounded-full !min-w-0 !min-h-0";

  const borderRadius = isCircle ? "50%" : isCode ? "10px" : "12px";
  const borderWidth = isText ? 1 : 1.5;

  const renderContent = () => {
    const fontStyle = isCode
      ? { fontFamily: "var(--font-geist-mono, ui-monospace, monospace)" }
      : {};

    if (isIcon) {
      return (
        <div className="flex flex-col items-center justify-center gap-1.5 w-full h-full select-none">
          <NodeIcon
            name={nodeData.iconName || "server"}
            size={32}
            color={colorDef.text}
            strokeWidth={1.4}
          />
          {isEditing ? (
            <textarea
              ref={inputRef}
              value={nodeData.label}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onFocus={handleEditStart}
              className="w-full bg-transparent resize-none border-none outline-none text-[11px] leading-tight text-center p-0"
              style={{ color: colorDef.text }}
              rows={1}
            />
          ) : (
            <span
              className="text-[11px] font-medium leading-tight text-center truncate max-w-full px-1"
              style={{ color: colorDef.text }}
            >
              {nodeData.label || (
                <span className="italic opacity-35">Label</span>
              )}
            </span>
          )}
        </div>
      );
    }

    if (isEditing) {
      return (
        <textarea
          ref={inputRef}
          value={nodeData.label}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={handleEditStart}
          className="w-full h-full bg-transparent resize-none border-none outline-none text-sm leading-relaxed p-0"
          style={{ ...fontStyle, color: colorDef.text }}
        />
      );
    }

    return (
      <div
        className="w-full h-full overflow-hidden text-sm leading-relaxed whitespace-pre-wrap break-words select-none"
        style={{ ...fontStyle, color: colorDef.text }}
      >
        {nodeData.label || (
          <span className="italic" style={{ color: colorDef.text, opacity: 0.35 }}>
            {isCode ? "// write code..." : "Double click to edit"}
          </span>
        )}
      </div>
    );
  };

  // Resize control style -- small triangle in bottom-right corner
  const controlStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
  };

  return (
    <div
      className="relative group w-full h-full"
      style={{
        borderRadius,
        background: colorDef.bg,
        border: `${borderWidth}px solid ${selected ? "hsl(220 15% 15%)" : colorDef.border}`,
        boxShadow: selected
          ? "0 0 0 2px hsl(220 15% 15% / 0.12), 0 2px 8px hsl(220 15% 15% / 0.06)"
          : "0 1px 3px hsl(220 15% 15% / 0.04), 0 1px 2px hsl(220 15% 15% / 0.02)",
        transition: "box-shadow 0.15s ease, border-color 0.15s ease",
        cursor: isEditing ? "text" : "grab",
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* React Flow's built-in resize control */}
      <NodeResizeControl
        style={controlStyle}
        minWidth={isIcon ? 60 : 80}
        minHeight={isIcon ? 60 : 40}
        keepAspectRatio={isCircle}
        onResizeStart={() => pushHistory()}
      >
        {/* Resize indicator triangle */}
        <svg
          className="absolute bottom-0.5 right-0.5 opacity-0 group-hover:opacity-40 transition-opacity"
          style={{ color: colorDef.text }}
          width="10"
          height="10"
          viewBox="0 0 10 10"
        >
          <path d="M 10 0 L 10 10 L 0 10" fill="currentColor" />
        </svg>
      </NodeResizeControl>

      {/* Connection handles on all 4 sides */}
      <Handle type="source" position={Position.Top} id="top" className={handleClasses} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={handleClasses} />
      <Handle type="source" position={Position.Left} id="left" className={handleClasses} />
      <Handle type="source" position={Position.Right} id="right" className={handleClasses} />

      {/* Content */}
      <div
        className="w-full h-full overflow-hidden"
        style={{
          padding: isCircle ? "20%" : isIcon ? "8px 6px" : "12px 16px",
          display: "flex",
          alignItems: isCircle || isIcon ? "center" : "flex-start",
          justifyContent: isCircle || isIcon ? "center" : "flex-start",
          textAlign: isCircle || isIcon ? "center" : "left",
        }}
      >
        {renderContent()}
      </div>

      {/* Code badge */}
      {isCode && (
        <div
          className="absolute top-2 right-3 text-[9px] font-mono uppercase tracking-widest select-none pointer-events-none"
          style={{ color: colorDef.text, opacity: 0.25 }}
        >
          {"</>"}
        </div>
      )}
    </div>
  );
}

export const DiagramNodeMemo = memo(DiagramNodeComponent);
