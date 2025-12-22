import SwiftUI

/// Main home screen with topic cards
struct HomeView: View {
    @Binding var appLocale: AppLocale
    @Environment(\.appLocale) private var locale

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                HomeHeaderView(appLocale: $appLocale)

                // Topics Grid
                LazyVGrid(
                    columns: [
                        GridItem(.flexible(), spacing: 16),
                        GridItem(.flexible(), spacing: 16)
                    ],
                    spacing: 16
                ) {
                    ForEach(Topic.all) { topic in
                        TopicCardView(topic: topic, appLocale: locale)
                    }
                }
                .padding(.horizontal)

                // Welcome Section
                WelcomeSectionView(appLocale: locale)
                    .padding(.horizontal)

                Spacer(minLength: 40)
            }
            .padding(.top)
        }
        .background(Color.backgroundPrimary)
        .navigationBarHidden(true)
    }
}

// MARK: - Header View

struct HomeHeaderView: View {
    @Binding var appLocale: AppLocale

    var body: some View {
        VStack(spacing: 8) {
            // Language Selector
            HStack {
                Spacer()
                Menu {
                    ForEach(AppLocale.allCases, id: \.self) { locale in
                        Button(locale.displayName) {
                            withAnimation {
                                appLocale = locale
                            }
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(appLocale.displayName)
                            .font(.subheadline)
                        Image(systemName: "chevron.down")
                            .font(.caption)
                    }
                    .foregroundColor(Color.amberAccent)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.backgroundSecondary)
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.borderGray, lineWidth: 1)
                    )
                }
            }
            .padding(.horizontal)

            // Title
            VStack(spacing: 4) {
                Text(Strings.App.title(appLocale))
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)

                Text(Strings.App.subtitle(appLocale))
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
            .padding(.top, 20)
        }
    }
}

// MARK: - Welcome Section

struct WelcomeSectionView: View {
    let appLocale: AppLocale

    private var title: String {
        Strings.Welcome.title(appLocale)
    }

    private var description: String {
        Strings.Welcome.description(appLocale)
    }

    private var features: [(String, String)] {
        [
            ("📚", Strings.Welcome.feature1(appLocale)),
            ("🎓", Strings.Welcome.feature2(appLocale)),
            ("🌍", Strings.Welcome.feature3(appLocale))
        ]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title)
                .font(.title3.weight(.semibold))
                .foregroundColor(.white)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text(description)
                .font(.body)
                .foregroundColor(.gray)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)

            VStack(alignment: .leading, spacing: 12) {
                ForEach(features, id: \.1) { icon, text in
                    featureRow(icon: icon, text: text)
                }
            }
            .padding(.top, 8)
        }
        .padding(20)
        .cardStyle()
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func featureRow(icon: String, text: String) -> some View {
        Text("\(icon) \(text)")
            .foregroundColor(.white)
            .multilineTextAlignment(.leading)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    HomeView(appLocale: .constant(.arabic))
        .preferredColorScheme(.dark)
}
