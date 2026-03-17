"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { MousePointerClick, ArrowRight } from "lucide-react";

function EmptyStateComponent() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className="flex flex-col items-center gap-5 text-center max-w-md px-6"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/80 border border-border/60"
        >
          <MousePointerClick
            size={26}
            strokeWidth={1.4}
            className="text-muted-foreground/60"
          />
        </motion.div>

        {/* Copy */}
        <div className="space-y-2.5">
          <h3 className="text-lg font-medium text-foreground text-balance">
            Start building your diagram
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
            Double-click the canvas to create a text node, use the toolbar above to add
            different shapes, or right-click for more options.
          </p>
        </div>

        {/* Keyboard shortcuts */}
        <div className="flex flex-col items-center gap-2.5 mt-1">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { key: "T", label: "Text" },
              { key: "R", label: "Rectangle" },
              { key: "C", label: "Circle" },
              { key: "K", label: "Code" },
              { key: "I", label: "Icon" },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/70"
              >
                <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md bg-muted/80 border border-border/60 text-[11px] font-mono font-medium text-muted-foreground">
                  {item.key}
                </kbd>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/40 flex items-center gap-1.5">
            Drag between handles to connect
            <ArrowRight size={10} />
            Right-click for context menu
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export const EmptyState = memo(EmptyStateComponent);
