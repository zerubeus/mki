import React, { useState, useRef, useCallback, useEffect } from "react";
import type { HistoricalEvent, EventEra } from "../types";

interface EventBottomSheetProps {
  event: HistoricalEvent | null;
  onClose: () => void;
  locale?: "ar" | "en";
}

type SheetState = "minimized" | "half" | "full";

const EventBottomSheet: React.FC<EventBottomSheetProps> = ({
  event,
  onClose,
  locale = "en",
}) => {
  const [sheetState, setSheetState] = useState<SheetState>("half");
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartState = useRef<SheetState>("half");

  const isRTL = locale === "ar";

  // Reset to half state when event changes
  useEffect(() => {
    if (event) {
      setSheetState("half");
      setDragOffset(0);
    }
  }, [event?.id]);

  // Sheet heights as percentage of viewport (adjusted for timeline at bottom)
  const getSheetHeight = (state: SheetState): number => {
    switch (state) {
      case "minimized":
        return 12; // Just title bar visible
      case "half":
        return 28; // Title + some description
      case "full":
        return 55; // Full content with scroll
    }
  };

  const currentHeight = getSheetHeight(sheetState);

  // Helper function for era badge colors
  const getEraBadgeColors = (era: EventEra): string => {
    switch (era) {
      case "Pre-Prophethood":
        return "bg-sky-500/20 text-sky-300 border-sky-500/30";
      case "Meccan":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Medinan":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const handleDragStart = useCallback(
    (clientY: number) => {
      setIsDragging(true);
      dragStartY.current = clientY;
      dragStartState.current = sheetState;
    },
    [sheetState]
  );

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;

      const deltaY = dragStartY.current - clientY;
      const viewportHeight = window.innerHeight;
      const deltaPercent = (deltaY / viewportHeight) * 100;

      setDragOffset(deltaPercent);
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    const startHeight = getSheetHeight(dragStartState.current);
    const currentDragHeight = startHeight + dragOffset;

    // Determine which state to snap to based on drag position
    if (currentDragHeight < 20) {
      // Dragged below minimized threshold - close or minimize
      if (dragOffset < -10) {
        onClose();
      } else {
        setSheetState("minimized");
      }
    } else if (currentDragHeight < 50) {
      // Between minimized and half
      if (dragOffset > 5) {
        setSheetState("half");
      } else if (dragOffset < -5) {
        setSheetState("minimized");
      } else {
        setSheetState(dragStartState.current);
      }
    } else {
      // Above half threshold
      if (dragOffset > 10) {
        setSheetState("full");
      } else if (dragOffset < -10) {
        setSheetState("half");
      } else {
        setSheetState(dragStartState.current);
      }
    }

    setDragOffset(0);
  }, [isDragging, dragOffset, onClose]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse handlers for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Quick action buttons
  const handleExpand = () => {
    if (sheetState === "minimized") {
      setSheetState("half");
    } else if (sheetState === "half") {
      setSheetState("full");
    }
  };

  const handleCollapse = () => {
    if (sheetState === "full") {
      setSheetState("half");
    } else if (sheetState === "half") {
      setSheetState("minimized");
    }
  };

  if (!event) return null;

  const displayHeight = Math.max(10, Math.min(75, currentHeight + dragOffset));

  // Bottom offset to sit above the timeline slider (bottom-16 = 64px + some extra space)
  const bottomOffset = 140; // px - accounts for timeline slider height

  return (
    <div
      ref={sheetRef}
      className={`absolute left-0 right-0 z-[600] transition-all ${
        isDragging ? "duration-0" : "duration-300 ease-out"
      }`}
      style={{
        height: `${displayHeight}vh`,
        maxHeight: "70vh",
        bottom: `${bottomOffset}px`,
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="h-full bg-[#1a1f2e]/98 backdrop-blur-md rounded-t-2xl shadow-2xl border-t border-x border-gray-700/50 flex flex-col overflow-hidden">
        {/* Drag Handle Area */}
        <div
          className="flex-shrink-0 pt-3 pb-2 px-4 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          {/* Visual drag indicator */}
          <div className="w-12 h-1.5 bg-gray-500/60 rounded-full mx-auto mb-3" />

          {/* Title row - always visible */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0" onClick={handleExpand}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white leading-tight">
                  {event.title}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getEraBadgeColors(
                    event.era
                  )}`}
                >
                  {event.era}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {event.year} • {event.locationName}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {sheetState !== "minimized" && (
                <button
                  onClick={handleCollapse}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors"
                  aria-label="Collapse"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              )}
              {sheetState !== "full" && (
                <button
                  onClick={handleExpand}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors"
                  aria-label="Expand"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        {sheetState !== "minimized" && (
          <div className="flex-1 overflow-y-auto px-4 pb-4 overscroll-contain">
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </div>

            {/* Additional info section when fully expanded */}
            {sheetState === "full" && event.coordinates && (
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="text-xs text-gray-500">
                  {isRTL ? "الإحداثيات" : "Coordinates"}:{" "}
                  {event.coordinates.lat.toFixed(4)},{" "}
                  {event.coordinates.lng.toFixed(4)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Minimized state hint */}
        {sheetState === "minimized" && (
          <div
            className="px-4 pb-3 text-xs text-gray-500 cursor-pointer"
            onClick={handleExpand}
          >
            {isRTL ? "اسحب لأعلى للمزيد" : "Swipe up for details"}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventBottomSheet;
