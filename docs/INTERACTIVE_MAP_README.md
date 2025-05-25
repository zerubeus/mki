# Interactive Historical Map System

## Overview

This is a comprehensive interactive historical map system built with Astro and React that allows users to explore territorial changes through time. The system is designed to be similar to professional historical mapping applications.

## Features

### 🗺️ Interactive Map
- **SVG-based map rendering** with smooth hover effects
- **Dynamic territory coloring** based on selected time period
- **Hover tooltips** showing territory information
- **Territory labels** with name and date ranges
- **Responsive design** that works on all devices

### ⏰ Timeline Control
- **Interactive slider** to navigate through years (749-1821 CE)
- **Major tick marks** for century navigation
- **Quick jump buttons** for important historical events
- **Playback controls** for step-by-step navigation
- **Real-time year display** with visual indicators

### 📊 Data Structure
- **Flexible territory definitions** with start/end years
- **Color-coded empires and kingdoms**
- **Regional mapping** to SVG paths
- **Historical descriptions** for context

## File Structure

```
src/
├── components/
│   ├── InteractiveMap.astro       # Main container component
│   ├── MapViewer.tsx              # React map component
│   ├── TimelineControl.tsx        # React timeline component
│   └── MapStyles.css              # Comprehensive styling
├── data/
│   └── historicalData.ts          # Territory and timeline data
└── pages/
    └── history.astro              # History page using the map
```

## Components

### InteractiveMap.astro
Main Astro component that combines the map viewer and timeline control.

### MapViewer.tsx
React component handling:
- SVG map rendering
- Territory visualization
- Hover interactions
- Year-based filtering

### TimelineControl.tsx
React component managing:
- Timeline slider functionality
- Year navigation
- Quick jump features
- Playback controls

## Data Structure

### Territory Interface
```typescript
interface Territory {
  id: string;           // Unique identifier
  name: string;         // Display name
  startYear: number;    // Start of control
  endYear: number;      // End of control
  color: string;        // Display color
  regions: string[];    // SVG path IDs
  description?: string; // Optional description
}
```

## Current Historical Entities

The system includes these pre-configured territories:

- **Candia (1205-1600)** - Venetian territories
- **Safavids (1501-1600)** - Persian Empire
- **Funj (1504-1821)** - Sudanese Sultanate
- **Ethiopia (1270-1859)** - Ethiopian Empire
- **Adal (1415-1577)** - Horn of Africa Sultanate
- **Oman (749-1691)** - Omani territories
- **Ottoman Empire (1299-1600)** - Turkish territories
- **Mamluk Sultanate (1250-1517)** - Egyptian territories

## Customization Guide

### Adding New Territories

1. **Update historicalData.ts**:
```typescript
{
  id: 'new-territory',
  name: 'New Territory',
  startYear: 1400,
  endYear: 1600,
  color: '#ff6b6b',
  regions: ['region-1', 'region-2'],
  description: 'Description of the territory'
}
```

2. **Add SVG regions** in MapViewer.tsx:
```typescript
const mapRegions = {
  'region-1': "M 100 100 L 200 100 L 200 200 L 100 200 Z",
  // ... existing regions
};
```

3. **Add label positioning**:
```typescript
const labelPositions = {
  'new-territory': { x: 150, y: 150 },
  // ... existing positions
};
```

### Modifying the Map

The current map is a simplified SVG representation. To improve it:

1. **Replace SVG paths** with more accurate geographical data
2. **Add more detailed coastlines** and geographical features
3. **Include cities and trade routes**
4. **Add elevation or terrain indicators**

### Extending Timeline Features

You can add more timeline functionality:

1. **Animation playback** - Auto-advance through years
2. **Speed controls** - Different playback speeds
3. **Bookmarks** - Save favorite time periods
4. **Historical events overlay** - Show major events on timeline

### Styling Customization

The `MapStyles.css` file contains all styling. Key areas to customize:

- **Color schemes** - Territory colors and UI theme
- **Typography** - Fonts and text sizing
- **Layout** - Component spacing and responsive breakpoints
- **Animations** - Transition effects and hover states

## Integration

### Using in Other Pages

```astro
---
import InteractiveMap from '../components/InteractiveMap.astro';
---

<Layout>
  <InteractiveMap />
</Layout>
```

### Passing Custom Data

You can extend the components to accept custom historical data:

```tsx
<MapViewer 
  selectedYear={1453} 
  customTerritories={myTerritories}
/>
```

## Performance Considerations

- **SVG optimization** - Keep path complexity reasonable
- **Data filtering** - Only load relevant territories per year
- **Event handling** - Debounce rapid timeline changes
- **Image optimization** - Use compressed backgrounds if adding raster images

## Future Enhancements

### Technical
- [ ] Add animation between time periods
- [ ] Implement territory transition effects
- [ ] Add export functionality (PNG, PDF)
- [ ] Include print-friendly styling

### Historical
- [ ] Add population data visualization
- [ ] Include trade route overlays
- [ ] Show cultural and religious boundaries
- [ ] Add economic indicators

### User Experience
- [ ] Multi-language support
- [ ] Accessibility improvements
- [ ] Mobile gesture controls
- [ ] Fullscreen mode

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- **Astro** - Static site generation
- **React** - Interactive components
- **TypeScript** - Type safety
- **CSS3** - Modern styling features

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The map system is now ready for customization and extension based on your specific historical research needs! 