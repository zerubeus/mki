import React, { useMemo, useRef, useCallback } from "react";
import type { HistoricalEvent } from "../types";

interface TimelineSliderProps {
  events: HistoricalEvent[];
  selectedEventId: number | null;
  onEventSelect: (eventId: number) => void;
  locale?: "ar" | "en";
}

interface EventPosition {
  event: HistoricalEvent;
  yearValue: number;
  positionValue: number;
}

const getEventYearValue = (event: HistoricalEvent): number | null => {
  const match = event.year.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

const TimelineSlider: React.FC<TimelineSliderProps> = ({
  events,
  selectedEventId,
  onEventSelect,
  locale = "en",
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Build event positions so multiple events in the same year remain selectable
  const { eventPositions, minYear, maxYear } = useMemo(() => {
    const fallbackMinYear = 570;
    const fallbackMaxYear = 632;
    if (events.length === 0) {
      return { eventPositions: [], minYear: fallbackMinYear, maxYear: fallbackMaxYear };
    }

    const yearCounts = new Map<number, number>();
    const yearValues: number[] = [];

    events.forEach((event) => {
      const yearValue = getEventYearValue(event);
      if (yearValue !== null) {
        yearValues.push(yearValue);
        yearCounts.set(yearValue, (yearCounts.get(yearValue) ?? 0) + 1);
      }
    });

    const minYearValue = yearValues.length > 0 ? Math.min(...yearValues) : fallbackMinYear;
    const maxYearValue = yearValues.length > 0 ? Math.max(...yearValues) : fallbackMaxYear;
    const yearOffsets = new Map<number, number>();

    const positions: EventPosition[] = events.map((event) => {
      const yearValue = getEventYearValue(event) ?? minYearValue;
      const count = yearCounts.get(yearValue) ?? 1;
      const index = yearOffsets.get(yearValue) ?? 0;
      yearOffsets.set(yearValue, index + 1);
      const offset = count > 1 ? (index + 1) / (count + 1) : 0.5;
      return {
        event,
        yearValue,
        positionValue: yearValue + offset,
      };
    });

    return { eventPositions: positions, minYear: minYearValue, maxYear: maxYearValue };
  }, [events]);

  // Generate tick marks for the timeline based on dataset range
  const tickMarks = useMemo(() => {
    const ticks: number[] = [];
    const start = Math.floor(minYear / 10) * 10;
    const end = Math.ceil(maxYear / 10) * 10;
    for (let i = start; i <= end; i += 10) {
      ticks.push(i);
    }
    return ticks;
  }, [minYear, maxYear]);

  // Calculate position percentage with clamping to keep elements visible
  const getPositionPercent = useCallback((value: number) => {
    const range = tickMarks[tickMarks.length - 1] - tickMarks[0];
    const percent = ((value - tickMarks[0]) / range) * 100;
    // Clamp between 2% and 98% to prevent overflow at edges
    return Math.max(2, Math.min(98, percent));
  }, [tickMarks]);

  const selectedPosition = useMemo(() => {
    if (!eventPositions.length) return null;
    return (
      eventPositions.find((entry) => entry.event.id === selectedEventId) ?? eventPositions[0]
    );
  }, [eventPositions, selectedEventId]);

  // Find nearest event based on slider position
  const getNearestEvent = useCallback((clientX: number) => {
    if (!trackRef.current || eventPositions.length === 0) return null;

    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const range = tickMarks[tickMarks.length - 1] - tickMarks[0];
    const targetValue = tickMarks[0] + percent * range;

    let nearest = eventPositions[0];
    let minDiff = Math.abs(targetValue - nearest.positionValue);
    for (const entry of eventPositions) {
      const diff = Math.abs(targetValue - entry.positionValue);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = entry;
      }
    }

    return nearest.event;
  }, [eventPositions, tickMarks]);

  // Handle click on track
  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const nearestEvent = getNearestEvent(e.clientX);
    if (nearestEvent) onEventSelect(nearestEvent.id);
  }, [getNearestEvent, onEventSelect]);

  // Handle mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nearestEvent = getNearestEvent(moveEvent.clientX);
      if (nearestEvent) onEventSelect(nearestEvent.id);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getNearestEvent, onEventSelect]);

  // Handle touch drag
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const touch = moveEvent.touches[0];
      const nearestEvent = getNearestEvent(touch.clientX);
      if (nearestEvent) onEventSelect(nearestEvent.id);
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [getNearestEvent, onEventSelect]);

  const currentPos = selectedPosition
    ? getPositionPercent(selectedPosition.positionValue)
    : 50;

  return (
    <div className="absolute bottom-16 left-0 right-0 z-[1000]">
      {/* Gradient background for timeline area */}
      <div className="absolute -bottom-16 left-0 right-0 h-40 bg-gradient-to-t from-[#0f1319] via-[#0f1319]/80 to-transparent pointer-events-none" />

      {/* Year indicator bubble */}
      <div className="relative h-10 mx-8 pointer-events-none">
        <div
          className="absolute transform -translate-x-1/2 bottom-0"
          style={{ left: `${currentPos}%` }}
        >
          <div className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-base font-bold shadow-lg border border-amber-500">
            {selectedPosition ? selectedPosition.yearValue : minYear}
          </div>
        </div>
      </div>

      {/* Timeline track - now interactive */}
      <div
        ref={trackRef}
        className="relative h-14 mx-8 cursor-pointer select-none"
        onClick={handleTrackClick}
      >
        {/* Background track line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-400/40" />

        {/* Event markers (small dots) */}
        {eventPositions.map((entry) => {
          const pos = getPositionPercent(entry.positionValue);
          const isSelected = entry.event.id === selectedEventId;
          return (
            <div
              key={`event-${entry.event.id}`}
              className={`absolute rounded-full pointer-events-none ${isSelected ? "w-2 h-2 bg-amber-400" : "w-1.5 h-1.5 bg-amber-500/60"}`}
              style={{ left: `${pos}%`, top: '17px', transform: 'translateX(-50%)' }}
            />
          );
        })}

        {/* Tick marks and labels */}
        {tickMarks.map((tick) => {
          const pos = getPositionPercent(tick);
          const isInRange = tick >= minYear - 50 && tick <= maxYear + 50;
          return (
            <div
              key={tick}
              className="absolute transform -translate-x-1/2 pointer-events-none"
              style={{ left: `${pos}%` }}
            >
              {/* Tick line */}
              <div
                className={`w-px h-4 mx-auto ${isInRange ? 'bg-gray-300/70' : 'bg-gray-500/40'}`}
                style={{ marginTop: '12px' }}
              />
              {/* Tick label */}
              <div className={`text-xs mt-1 whitespace-nowrap ${isInRange ? 'text-gray-200' : 'text-gray-500'}`}>
                {tick}
              </div>
            </div>
          );
        })}

        {/* Current position indicator (draggable circle) */}
        <div
          className="absolute transform -translate-x-1/2 z-10"
          style={{ left: `${currentPos}%`, top: '12px' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-6 h-6 bg-amber-600 rounded-full border-2 border-white shadow-xl cursor-grab active:cursor-grabbing flex items-center justify-center hover:scale-110 transition-transform">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;
