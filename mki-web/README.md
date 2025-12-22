
# Islamic Knowledge Website (اعرف دينك)

A modern, multilingual Islamic knowledge platform built with Astro and React, featuring an interactive Seerah journey with historical maps and timelines.

## About This Project

This website provides authentic Islamic knowledge from the Quran and Sunnah in a modern, accessible format. It features:

- **Multilingual Support**: Arabic (default), English, and French with proper RTL support
- **Interactive Seerah Journey**: Explore the Prophet's life through an interactive map and timeline
- **Four Main Topics**: Creed (العقيدة), Worship (العبادات), Biography (السيرة), and History (التاريخ)
- **Modern Design**: Glassmorphism effects, gradient backgrounds, and smooth animations
- **Responsive Layout**: Optimized for mobile, tablet, and desktop devices

## Technology Stack

- **Framework**: Astro v5.8.0 with React integration
- **Styling**: Tailwind CSS v4 with custom gradients and animations
- **Maps**: Leaflet for interactive geographical displays
- **Typography**: Cairo font for enhanced Arabic support
- **Build Tool**: Vite with TypeScript support

## Getting Started on Replit

This project is optimized for Replit deployment. Follow these steps:

### 1. Development

The project is already configured to run on Replit. Simply:

1. Click the **Run** button at the top of the screen
2. The development server will start on port 4321
3. Access your app through the Replit preview window

### 2. Local Development Commands

If you need to run specific commands:

```bash
# Install dependencies (auto-handled by Replit)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 3. Deploying on Replit

To deploy your Islamic knowledge website:

1. **Click the Deploy button** in the top-right corner of your Repl
2. **Choose "Static" deployment** since this is a static Astro site
3. **Configure deployment settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - The deployment is already configured in `.replit` file
4. **Click "Deploy"** to publish your site

Your website will be available at `https://your-repl-name.replit.app`

## Project Structure

```
src/
├── components/          # React components
│   ├── HomePage.tsx     # Main homepage component
│   ├── SeerahJourney.tsx # Interactive Seerah experience
│   ├── InteractiveMap.tsx # Historical map component
│   └── Timeline.tsx     # Timeline navigation
├── data/               # Historical data and events
├── i18n/               # Translation files and utilities
├── layouts/            # Astro layout components
├── pages/              # Route pages (Arabic & English)
│   ├── en/             # English pages
│   └── [arabic pages]  # Arabic pages (default)
└── styles/             # Global CSS styles
```

## Features

### Interactive Seerah Journey
- Historical timeline of Prophet Muhammad's life (ﷺ)
- Interactive map showing important locations
- Detailed event descriptions in multiple languages
- Smooth navigation between events

### Multilingual Support
- Default Arabic with RTL layout support
- English and French translations
- URL routing: `/` (Arabic), `/en/` (English), `/fr/` (French)

### Modern Islamic Design
- Islamic color palette with deep blues and gold accents
- Glassmorphism card effects
- Smooth animations optimized for 60fps
- Typography designed for Arabic text readability

## Customization

To add new content or modify existing features:

1. **Add new events**: Edit `src/data/seerahEvents.ts`
2. **Update translations**: Modify `src/i18n/translations.ts`
3. **Customize styling**: Update Tailwind classes or `src/styles/global.css`
4. **Add new pages**: Create new `.astro` files in `src/pages/`

## Support

This project is designed to run seamlessly on Replit with automatic dependency management and optimized configuration for the Replit environment.

---

*May Allah bless this effort to spread Islamic knowledge* 🤲
