import React, { useMemo, useRef, useCallback } from "react";
import type { HistoricalEvent } from "../types";

interface TimelineSliderProps {
  events: HistoricalEvent[];
  currentYear: number;
  onYearChange: (year: number) => void;
  locale?: "ar" | "en";
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({
  events,
  currentYear,
  onYearChange,
  locale = "en",
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Extract unique years from events and get range
  const { years, minYear, maxYear } = useMemo(() => {
    const yearSet = new Set<number>();
    events.forEach((event) => {
      const match = event.year.match(/(\d+)/);
      if (match) {
        yearSet.add(parseInt(match[1]));
      }
    });
    const sortedYears = Array.from(yearSet).sort((a, b) => a - b);
    return {
      years: sortedYears,
      minYear: sortedYears[0] || 570,
      maxYear: sortedYears[sortedYears.length - 1] || 632,
    };
  }, [events]);

  // Generate tick marks for the timeline - extended range for broader context
  const tickMarks = useMemo(() => {
    const ticks: number[] = [];
    // Extended range: 0 CE to 800 CE for historical context
    const start = 0;
    const end = 800;
    for (let i = start; i <= end; i += 100) {
      ticks.push(i);
    }
    return ticks;
  }, []);

  // Calculate position percentage
  const getPositionPercent = useCallback((year: number) => {
    const range = tickMarks[tickMarks.length - 1] - tickMarks[0];
    return ((year - tickMarks[0]) / range) * 100;
  }, [tickMarks]);

  // Find nearest event year helper
  const findNearestYear = useCallback((targetYear: number) => {
    let nearestYear = years[0];
    let minDiff = Math.abs(targetYear - nearestYear);
    for (const year of years) {
      const diff = Math.abs(targetYear - year);
      if (diff < minDiff) {
        minDiff = diff;
        nearestYear = year;
      }
    }
    return nearestYear;
  }, [years]);

  // Calculate year from position
  const getYearFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return currentYear;

    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const range = tickMarks[tickMarks.length - 1] - tickMarks[0];
    const year = Math.round(tickMarks[0] + percent * range);

    return findNearestYear(year);
  }, [tickMarks, findNearestYear, currentYear]);

  // Handle click on track
  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const nearestYear = getYearFromPosition(e.clientX);
    onYearChange(nearestYear);
  }, [getYearFromPosition, onYearChange]);

  // Handle mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nearestYear = getYearFromPosition(moveEvent.clientX);
      onYearChange(nearestYear);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getYearFromPosition, onYearChange]);

  // Handle touch drag
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const touch = moveEvent.touches[0];
      const nearestYear = getYearFromPosition(touch.clientX);
      onYearChange(nearestYear);
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [getYearFromPosition, onYearChange]);

  const currentPos = getPositionPercent(currentYear);

  return (
    <div className="absolute bottom-16 left-0 right-0 z-[1000]">
      {/* Gradient background for timeline area */}
      <div className="absolute -bottom-16 left-0 right-0 h-40 bg-gradient-to-t from-[#0f1319] via-[#0f1319]/80 to-transparent pointer-events-none" />

      {/* Year indicator bubble */}
      <div className="relative h-10 mx-4 pointer-events-none">
        <div
          className="absolute transform -translate-x-1/2 bottom-0"
          style={{ left: `${currentPos}%` }}
        >
          <div className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-base font-bold shadow-lg border border-amber-500">
            {currentYear}
          </div>
        </div>
      </div>

      {/* Timeline track - now interactive */}
      <div
        ref={trackRef}
        className="relative h-14 mx-4 cursor-pointer select-none"
        onClick={handleTrackClick}
      >
        {/* Background track line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-400/40" />

        {/* Event year markers (small dots) */}
        {years.map((year) => {
          const pos = getPositionPercent(year);
          return (
            <div
              key={`event-${year}`}
              className="absolute w-1.5 h-1.5 bg-amber-500/60 rounded-full pointer-events-none"
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
