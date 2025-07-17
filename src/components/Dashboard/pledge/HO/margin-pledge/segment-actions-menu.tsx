import React from "react";
import { Button } from "@/components/ui/button";

interface SegmentActionsMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onApplyAll: (segment: string) => void;
  onApplyNone: (segment: string) => void;
  selectedSegment: string;
}

export function SegmentActionsMenu({
  position,
  onClose,
  onApplyAll,
  onApplyNone,
  selectedSegment
}: SegmentActionsMenuProps) {
  // ✅ Ensure useEffect is always called
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".segment-actions-menu")) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // ✅ Conditionally render, but useEffect always runs
  if (!position) return null;

  return (
    <div
      className="segment-actions-menu absolute z-50 bg-white rounded-md shadow-md border border-gray-200 p-2 flex flex-col gap-1 w-48"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="justify-start text-sm"
        onClick={() => onApplyAll(selectedSegment)}
      >
        Apply to all selected
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start text-sm"
        onClick={() => onApplyNone(selectedSegment)}
      >
        Apply to empty fields only
      </Button>
    </div>
  );
}
