"use client";

import { Children, Fragment, cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent, ReactElement, ReactNode } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const OPEN_OFFSET = 100;
const SNAP_THRESHOLD = 40;

interface SwipeableRowProps {
  actions: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function flatten(node: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  Children.forEach(node, (child) => {
    if (isValidElement(child) && child.type === Fragment) {
      out.push(...flatten((child.props as { children?: ReactNode }).children));
    } else {
      out.push(child);
    }
  });
  return out;
}

export function SwipeableRow({ actions, children, isOpen, onOpenChange }: SwipeableRowProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number; open: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  const base = isOpen ? -OPEN_OFFSET : 0;
  const offset = dragging ? Math.max(-OPEN_OFFSET, Math.min(0, base + dragX)) : base;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: globalThis.PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onOpenChangeRef.current(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [isOpen]);

  const styleActions = (variant: "mobile" | "desktop") =>
    Children.toArray(flatten(actions)).map((child) => {
      if (isValidElement(child)) {
        const el = child as ReactElement<{ style?: CSSProperties }>;
        return cloneElement(el, {
          style: {
            ...(el.props.style ?? {}),
            ...(variant === "mobile"
              ? {
                  flex: 1,
                  height: "100%",
                  borderRadius: 0,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }
              : {
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }),
          },
        });
      }
      return child;
    });

  if (isDesktop) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "12px 14px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>{children}</div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>{styleActions("desktop")}</div>
      </div>
    );
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    startRef.current = { x: e.clientX, y: e.clientY, open: isOpen };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dy) > Math.abs(dx)) return;
    setDragging(true);
    setDragX(dx);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const shouldOpen = start.open ? dx <= SNAP_THRESHOLD : dx < -SNAP_THRESHOLD;
    onOpenChangeRef.current(shouldOpen);
    setDragging(false);
    setDragX(0);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerCancel = () => {
    startRef.current = null;
    setDragging(false);
    setDragX(0);
  };

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "10px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: OPEN_OFFSET,
          display: "flex",
        }}
      >
        {styleActions("mobile")}
      </div>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
          background: "var(--bg-card)",
          touchAction: "pan-y",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}