"use client";

import { memo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; label: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Create Nodes",
    shortcuts: [
      { keys: ["T"], label: "Add Text node" },
      { keys: ["R"], label: "Add Rectangle node" },
      { keys: ["C"], label: "Add Circle node" },
      { keys: ["K"], label: "Add Code block" },
      { keys: ["I"], label: "Add Icon node" },
      { keys: ["Double-click"], label: "Add Text at cursor" },
    ],
  },
  {
    title: "Edit",
    shortcuts: [
      { keys: ["Ctrl", "C"], label: "Copy selected" },
      { keys: ["Ctrl", "V"], label: "Paste" },
      { keys: ["Ctrl", "D"], label: "Duplicate selected" },
      { keys: ["Ctrl", "A"], label: "Select all" },
      { keys: ["Del"], label: "Delete selected" },
      { keys: ["Ctrl", "Z"], label: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], label: "Redo" },
    ],
  },
  {
    title: "File",
    shortcuts: [
      { keys: ["Ctrl", "S"], label: "Save diagram file" },
      { keys: ["Ctrl", "O"], label: "Open diagram file" },
    ],
  },
  {
    title: "Move Nodes",
    shortcuts: [
      { keys: ["\u2191"], label: "Nudge up (5px)" },
      { keys: ["\u2193"], label: "Nudge down (5px)" },
      { keys: ["\u2190"], label: "Nudge left (5px)" },
      { keys: ["\u2192"], label: "Nudge right (5px)" },
      { keys: ["Shift", "\u2191 \u2193 \u2190 \u2192"], label: "Nudge (20px)" },
    ],
  },
  {
    title: "Layers",
    shortcuts: [
      { keys: ["]"], label: "Bring forward" },
      { keys: ["Shift", "]"], label: "Bring to front" },
      { keys: ["["], label: "Send backward" },
      { keys: ["Shift", "["], label: "Send to back" },
    ],
  },
  {
    title: "View",
    shortcuts: [
      { keys: ["F"], label: "Fit to view" },
      { keys: ["G"], label: "Toggle snap to grid" },
      { keys: ["Ctrl", "+"], label: "Zoom in" },
      { keys: ["Ctrl", "-"], label: "Zoom out" },
      { keys: ["Scroll"], label: "Pan canvas" },
      { keys: ["?"], label: "Toggle this panel" },
    ],
  },
  {
    title: "Connect & Interact",
    shortcuts: [
      { keys: ["Drag handle"], label: "Create connection" },
      { keys: ["Right-click"], label: "Context menu" },
      { keys: ["Double-click node"], label: "Edit text" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-md bg-muted/80 border border-border/60 text-[11px] font-mono font-medium text-foreground/80 leading-none">
      {children}
    </kbd>
  );
}

function ShortcutsPanelComponent({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute top-16 right-4 z-[60] w-[420px] max-h-[calc(100vh-96px)] overflow-y-auto bg-card/98 backdrop-blur-xl border border-border/80 rounded-2xl shadow-xl shadow-foreground/[0.06]"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 bg-card/98 backdrop-blur-xl border-b border-border/60 rounded-t-2xl">
        <h3 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h3>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-3 space-y-4">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title}>
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold mb-2">
              {group.title}
            </h4>
            <div className="space-y-1">
              {group.shortcuts.map((shortcut, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 group"
                >
                  <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors">
                    {shortcut.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, j) => (
                      <span key={j} className="flex items-center gap-1">
                        {j > 0 && (
                          <span className="text-[10px] text-muted-foreground/30">+</span>
                        )}
                        <Kbd>{key}</Kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/50">
        <p className="text-[11px] text-muted-foreground/40 text-center">
          Press <Kbd>?</Kbd> to toggle this panel
        </p>
      </div>
    </motion.div>
  );
}

export const ShortcutsPanel = memo(ShortcutsPanelComponent);
