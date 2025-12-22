import SwiftUI

/// Supported app locales
enum AppLocale: String, CaseIterable {
    case arabic = "ar"
    case english = "en"
    case french = "fr"

    /// The Locale for this app locale
    var locale: Locale {
        Locale(identifier: rawValue)
    }

    /// Layout direction for this locale
    var layoutDirection: LayoutDirection {
        isRTL ? .rightToLeft : .leftToRight
    }

    /// Display name of this locale
    var displayName: String {
        switch self {
        case .arabic:
            return "العربية"
        case .english:
            return "English"
        case .french:
            return "Français"
        }
    }

    /// Whether this locale uses RTL
    var isRTL: Bool {
        self == .arabic
    }
}

// MARK: - Environment Key

struct AppLocaleKey: EnvironmentKey {
    static let defaultValue: AppLocale = .arabic
}

extension EnvironmentValues {
    var appLocale: AppLocale {
        get { self[AppLocaleKey.self] }
        set { self[AppLocaleKey.self] = newValue }
    }
}
