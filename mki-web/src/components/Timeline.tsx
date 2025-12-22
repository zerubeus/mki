import React from "react";
import type { HistoricalEvent } from "../types/index.ts"; // Adjusted path
import TimelineItem from "./TimelineItem.tsx"; // Added .tsx extension

interface TimelineProps {
  events: HistoricalEvent[];
  selectedEventId: number | null;
  onEventSelect: (eventId: number) => void;
  title?: string;
}

const Timeline: React.FC<TimelineProps> = ({
  events,
  selectedEventId,
  onEventSelect,
  title = "Timeline of Events",
}) => {
  return (
    <div className="px-4 py-2 bg-white/90 backdrop-blur-sm shadow-inner rounded-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        {title}
      </h3>
      <div
        className="flex overflow-x-auto py-4 items-start scroll-smooth gap-0"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#9ca3af #f3f4f6",
        }}
      >
        {events.map((event, index) => (
          <TimelineItem
            key={event.id}
            event={event}
            isSelected={event.id === selectedEventId}
            onSelect={onEventSelect}
            isFirst={index === 0}
            isLast={index === events.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default Timeline;
