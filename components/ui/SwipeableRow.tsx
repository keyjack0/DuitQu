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
                  padding: 0,
                }
              : {
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }),
          },
        });
      }
      return child;
    });

  if (isDesktop) {
    return (
      <div className="swipe-desktop">
        <div className="swipe-content">{children}</div>
        <div className="swipe-actions">{styleActions("desktop")}</div>
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
    <div ref={rootRef} className="swipe-mobile">
      <div className="swipe-actions-layer">
        {styleActions("mobile")}
      </div>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="swipe-drag"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}