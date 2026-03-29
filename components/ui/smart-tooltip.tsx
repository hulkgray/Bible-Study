"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { X } from "lucide-react";

interface SmartTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  href: string;
  ctaLabel?: string;
  headerIcon?: string;
  headerText?: string;
  triggerClassName?: string;
}

/**
 * SmartTooltip — reusable hover (desktop) / tap (mobile) tooltip.
 * Uses React Portal to avoid HTML nesting violations (<div> inside <p>).
 */
export function SmartTooltip({
  children,
  content,
  href,
  ctaLabel = "Read more →",
  headerIcon = "📖",
  headerText,
  triggerClassName,
}: SmartTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Position the tooltip relative to the trigger element
  function updatePosition() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const isAbove = spaceBelow < 280;

    setTooltipStyle({
      position: "fixed",
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)),
      top: isAbove ? undefined : rect.bottom + 4,
      bottom: isAbove ? window.innerHeight - rect.top + 4 : undefined,
      zIndex: 9999,
    });
  }

  function handleMouseEnter() {
    if (isTouchDevice) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePosition();
    setIsOpen(true);
  }

  function handleMouseLeave() {
    if (isTouchDevice) return;
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  }

  function handleTooltipEnter() {
    if (isTouchDevice) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  function handleTooltipLeave() {
    if (isTouchDevice) return;
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  }

  function handleClick(e: React.MouseEvent) {
    if (isTouchDevice) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Lock body scroll on mobile modal
  useEffect(() => {
    if (isTouchDevice && isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isTouchDevice, isOpen]);

  const displayHeader = headerText || (typeof children === "string" ? children : "");

  // Desktop tooltip — rendered via portal to document.body
  const desktopTooltip =
    isOpen && !isTouchDevice && mounted
      ? createPortal(
          <div
            ref={tooltipRef}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
            style={tooltipStyle}
            className="w-80 max-w-[90vw] p-3.5 rounded-xl bg-card border border-border shadow-2xl animate-scale-in"
          >
            {content}
            <Link
              href={href}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {ctaLabel}
            </Link>
          </div>,
          document.body
        )
      : null;

  // Mobile modal — rendered via portal to document.body
  const mobileModal =
    isOpen && isTouchDevice && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative z-10 w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl animate-scale-in p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gold flex items-center gap-1.5">
                  {headerIcon} {displayHeader}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="mb-4">{content}</div>
              <Link
                href={href}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gold text-gold-foreground text-sm font-medium hover:bg-gold/90 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {ctaLabel}
              </Link>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <span className="relative inline">
      <span
        ref={triggerRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn("cursor-pointer", triggerClassName)}
      >
        {children}
      </span>
      {desktopTooltip}
      {mobileModal}
    </span>
  );
}
