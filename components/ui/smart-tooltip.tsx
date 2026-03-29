"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { X } from "lucide-react";

interface SmartTooltipProps {
  /** The trigger element's display */
  children: React.ReactNode;
  /** Tooltip/modal content (rendered inside the popover) */
  content: React.ReactNode;
  /** Link href for the "Read more" CTA button */
  href: string;
  /** CTA button label */
  ctaLabel?: string;
  /** Header icon + label for the modal */
  headerIcon?: string;
  /** Header text shown in mobile modal */
  headerText?: string;
  /** Whether to show the tooltip (controlled externally, e.g. by data loading) */
  isReady?: boolean;
  /** CSS for the trigger element */
  triggerClassName?: string;
  /** Whether the tooltip is open (controlled mode) — if not provided, internal state is used */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

/**
 * SmartTooltip — a reusable component providing:
 * - Desktop: hover popover positioned above or below
 * - Mobile: tap opens a centered modal with backdrop
 *
 * Used by CitationTooltip (verses), StrongsTooltip, and DictionaryTooltip.
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
  const [position, setPosition] = useState<"above" | "below">("below");
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Desktop hover handlers
  function handleMouseEnter() {
    if (isTouchDevice) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow < 250 ? "above" : "below");
    }
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

      {/* Desktop: hover tooltip */}
      {isOpen && !isTouchDevice && (
        <div
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
          className={cn(
            "absolute z-50 w-80 max-w-[90vw] p-3.5 rounded-xl bg-card border border-border shadow-2xl animate-scale-in",
            position === "below" ? "top-full mt-1 left-0" : "bottom-full mb-1 left-0"
          )}
        >
          {content}
          <Link
            href={href}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            {ctaLabel}
          </Link>
        </div>
      )}

      {/* Mobile: centered modal with backdrop */}
      {isOpen && isTouchDevice && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
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
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gold flex items-center gap-1.5">
                {headerIcon} {displayHeader}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-4">{content}</div>

            {/* CTA */}
            <Link
              href={href}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gold text-gold-foreground text-sm font-medium hover:bg-gold/90 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      )}
    </span>
  );
}
