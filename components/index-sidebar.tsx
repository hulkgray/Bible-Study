"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndexSidebarProps {
  /** Whether the sidebar is currently open */
  isOpen: boolean;
  /** Callback to close the sidebar */
  onClose: () => void;
  /** Title shown in the sidebar header */
  title: string;
  /** Optional icon element to show next to the title */
  icon?: ReactNode;
  /** The scrollable content body */
  children: ReactNode;
  /** Optional header content rendered between title bar and body (e.g. toggle tabs) */
  headerContent?: ReactNode;
  /** Width class override (default: w-80) */
  widthClass?: string;
}

/**
 * IndexSidebar — a reusable slide-in sidebar panel used by:
 * - Bible book/chapter index
 * - Library book chapter index
 * - Dictionary letter index
 *
 * Handles: fixed positioning, backdrop on mobile, close button, scroll container.
 * Consumers provide their own body content via children.
 */
export function IndexSidebar({
  isOpen,
  onClose,
  title,
  icon,
  children,
  headerContent,
  widthClass = "w-80",
}: IndexSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full z-50 max-w-[85vw] bg-[#0c0a09] border-r border-border shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          "flex flex-col",
          widthClass,
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="font-semibold text-sm">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Optional header content (tabs, filters, etc.) */}
        {headerContent && (
          <div className="border-b border-border shrink-0">
            {headerContent}
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
}
