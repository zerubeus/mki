import React from 'react';
import './EventDetailsCard.css'; // We'll create this CSS file next

interface EventDetailsCardProps {
  title: string;
  year: string;
  location: string;
  category?: string;
  description: string;
}

const EventDetailsCard: React.FC<EventDetailsCardProps> = ({
  title,
  year,
  location,
  category,
  description,
}) => {
  return (
    <div className="event-details-card">
      <div className="event-card-header">
        <h1 className="event-title">{title}</h1>
        {category && <span className="event-category-tag">{category}</span>}
      </div>
      <div className="event-meta">
        <span className="event-year">Year: {year}</span>
        <span className="event-location">Location: {location}</span>
      </div>
      <p className="event-description">{description}</p>
    </div>
  );
};

export default EventDetailsCard; 