import SwiftUI

extension Color {
    // MARK: - Background Colors

    /// Primary background color (#0f1319)
    static let backgroundPrimary = Color(red: 15/255, green: 19/255, blue: 25/255)

    /// Secondary background color (#1a1f2e)
    static let backgroundSecondary = Color(red: 26/255, green: 31/255, blue: 46/255)

    /// Tertiary background color (#252b3b)
    static let backgroundTertiary = Color(red: 37/255, green: 43/255, blue: 59/255)

    // MARK: - Accent Colors

    /// Amber accent color (#f59e0b)
    static let amberAccent = Color(red: 245/255, green: 158/255, blue: 11/255)

    /// Sky blue color (#0ea5e9)
    static let skyBlue = Color(red: 14/255, green: 165/255, blue: 233/255)

    /// Emerald color (#10b981)
    static let emerald = Color(red: 16/255, green: 185/255, blue: 129/255)

    // MARK: - Border Colors

    /// Border color with opacity
    static let borderGray = Color.gray.opacity(0.5)

    // MARK: - Era Colors

    /// Color for the specified era
    static func eraColor(_ era: EventEra) -> Color {
        switch era {
        case .preProphethood:
            return .skyBlue
        case .meccan:
            return .amberAccent
        case .medinan:
            return .emerald
        }
    }
}

// MARK: - View Modifiers

extension View {
    /// Apply glass morphism effect
    func glassMorphism(cornerRadius: CGFloat = 16) -> some View {
        self
            .background(.ultraThinMaterial)
            .background(Color.backgroundSecondary.opacity(0.8))
            .cornerRadius(cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(Color.borderGray, lineWidth: 1)
            )
    }

    /// Apply card style
    func cardStyle(cornerRadius: CGFloat = 16) -> some View {
        self
            .background(Color.backgroundSecondary)
            .cornerRadius(cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(Color.borderGray, lineWidth: 1)
            )
    }
}
