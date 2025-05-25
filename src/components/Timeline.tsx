import React from 'react';
import type { HistoricalEvent } from '../types'; // Adjusted path
import TimelineItem from './TimelineItem'; // To be created
import './Timeline.css';

interface TimelineProps {
  events: HistoricalEvent[];
  selectedEventId: number | null;
  onEventSelect: (eventId: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ events, selectedEventId, onEventSelect }) => {
  return (
    <div className="px-4 py-2 bg-white shadow-inner rounded-lg">
      <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Timeline of Events</h3>
      <div className="timeline-container">
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