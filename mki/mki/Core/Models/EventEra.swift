import SwiftUI

/// Era classification for historical events
enum EventEra: String, Codable, CaseIterable, Hashable {
    case preProphethood = "Pre-Prophethood"
    case meccan = "Meccan"
    case medinan = "Medinan"

    /// Color associated with this era
    var color: Color {
        switch self {
        case .preProphethood:
            return Color("SkyBlue")
        case .meccan:
            return Color("AmberAccent")
        case .medinan:
            return Color("Emerald")
        }
    }

    /// Fallback color using system colors
    var systemColor: Color {
        switch self {
        case .preProphethood:
            return .cyan
        case .meccan:
            return .orange
        case .medinan:
            return .green
        }
    }

    /// Localized name key for this era
    var localizedNameKey: String {
        switch self {
        case .preProphethood:
            return "era.preProphethood"
        case .meccan:
            return "era.meccan"
        case .medinan:
            return "era.medinan"
        }
    }

    /// Arabic name
    var arabicName: String {
        switch self {
        case .preProphethood:
            return "ما قبل النبوة"
        case .meccan:
            return "العهد المكي"
        case .medinan:
            return "العهد المدني"
        }
    }

    /// English name
    var englishName: String {
        switch self {
        case .preProphethood:
            return "Pre-Prophethood"
        case .meccan:
            return "Meccan Period"
        case .medinan:
            return "Medinan Period"
        }
    }
}

/// Type classification for historical events
enum EventType: String, Codable, CaseIterable, Hashable {
    case birth = "Birth"
    case marriage = "Marriage"
    case religious = "Religious"
    case battle = "Battle"
    case treaty = "Treaty"
    case death = "Death"
    case migration = "Migration"
    case personal = "Personal"

    /// SF Symbol name for this event type
    var symbolName: String {
        switch self {
        case .birth:
            return "star.fill"
        case .marriage:
            return "heart.fill"
        case .religious:
            return "moon.stars.fill"
        case .battle:
            return "shield.fill"
        case .treaty:
            return "doc.text.fill"
        case .death:
            return "leaf.fill"
        case .migration:
            return "arrow.right.circle.fill"
        case .personal:
            return "person.fill"
        }
    }
}
