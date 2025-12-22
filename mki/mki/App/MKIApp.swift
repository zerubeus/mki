import SwiftUI

@main
struct MKIApp: App {
    @State private var appLocale: AppLocale = .arabic

    var body: some Scene {
        WindowGroup {
            ContentView(appLocale: $appLocale)
                .environment(\.locale, appLocale.locale)
                .environment(\.layoutDirection, appLocale.layoutDirection)
                .environment(\.appLocale, appLocale)
                .preferredColorScheme(.dark)
        }
    }
}

/// Root content view with navigation
struct ContentView: View {
    @Binding var appLocale: AppLocale

    var body: some View {
        NavigationStack {
            HomeView(appLocale: $appLocale)
        }
    }
}
