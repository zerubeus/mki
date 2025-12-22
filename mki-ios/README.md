# MKI iOS - Must Know Islam

Native iOS app for Islamic knowledge, ported from the MKI web application.

## Features

- **Home Page**: Topic cards for navigating to different sections (Aqida, Seerah, Hadith, History)
- **Seerah Page**: Interactive map with timeline showing events from the Prophet's life (PBUH)
- **Multi-language**: Full Arabic (RTL) and English support
- **Dark Theme**: Modern dark design with amber accents

## Requirements

- iOS 17.0+
- Xcode 15.0+
- Swift 5.9+

## Dependencies

- [MapLibre Native](https://github.com/maplibre/maplibre-gl-native-distribution) - Custom map tiles (Stamen Watercolor)

## Setup

### Option 1: Using Swift Package Manager (Recommended)

1. Open Xcode
2. Create a new iOS App project (SwiftUI, iOS 17+)
3. Add the `MKI` folder to your project
4. Add MapLibre dependency:
   - File > Add Package Dependencies
   - URL: `https://github.com/maplibre/maplibre-gl-native-distribution`
   - Version: 6.0.0+

### Option 2: Using Package.swift

```bash
cd mki-ios
swift build
```

## Project Structure

```
MKI/
├── App/
│   └── MKIApp.swift              # App entry point
├── Features/
│   ├── Home/
│   │   ├── HomeView.swift        # Main home screen
│   │   └── TopicCardView.swift   # Topic card component
│   └── Seerah/
│       ├── SeerahView.swift      # Seerah page container
│       ├── SeerahViewModel.swift # State management
│       ├── SeerahMapView.swift   # MapKit implementation
│       ├── MapLibreMapView.swift # MapLibre implementation
│       ├── TimelineSliderView.swift
│       ├── EventCardView.swift
│       └── EventDetailsModalView.swift
├── Core/
│   ├── Models/
│   │   ├── HistoricalEvent.swift
│   │   ├── EventEra.swift
│   │   ├── Topic.swift
│   │   └── AppLocale.swift
│   ├── Services/
│   │   ├── DataService.swift
│   │   └── CSVParser.swift
│   ├── Localization/
│   │   └── Strings.swift
│   └── Extensions/
│       └── Color+Theme.swift
└── Resources/
    ├── Assets.xcassets/
    └── Data/
        ├── seera_events.csv
        └── world_500.geojson
```

## Architecture

The app uses **MVVM** architecture with iOS 17's `@Observable` macro:

- **Models**: Data structures (`HistoricalEvent`, `EventEra`, etc.)
- **ViewModels**: State management with `@Observable` (`SeerahViewModel`)
- **Views**: SwiftUI views with declarative UI
- **Services**: Data loading and parsing (`DataService`, `CSVParser`)

## Map Implementation

Two map implementations are provided:

1. **SeerahMapView.swift**: Uses Apple MapKit (simpler, works out of the box)
2. **MapLibreMapView.swift**: Uses MapLibre for custom Stamen Watercolor tiles

To use MapLibre, replace `SeerahMapView` with `MapLibreMapView` in `SeerahView.swift`.

## Color Theme

| Color | Hex | Usage |
|-------|-----|-------|
| BackgroundPrimary | #0f1319 | Main background |
| BackgroundSecondary | #1a1f2e | Cards, overlays |
| AmberAccent | #f59e0b | Primary accent |
| SkyBlue | #0ea5e9 | Pre-Prophethood era |
| Emerald | #10b981 | Medinan era |

## Data Sources

- **Events**: Bundled CSV from R2 storage
- **Territories**: GeoJSON boundaries for historical map

## Localization

The app supports:
- Arabic (default, RTL)
- English (LTR)

Strings are managed in `Core/Localization/Strings.swift` with type-safe accessors.

## License

Private - MKI Project
