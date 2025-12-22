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
                    .foregroundColor(.amberAccent)
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
                Text(appLocale == .arabic ? "اعرف دينك" : "Know Your Religion")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)

                Text(appLocale == .arabic ? "معرفة إسلامية شاملة" : "Comprehensive Islamic Knowledge")
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
        appLocale == .arabic
            ? "مرحباً بك في موقع المعرفة الإسلامية"
            : "Welcome to the Islamic Knowledge Website"
    }

    private var description: String {
        appLocale == .arabic
            ? "هذا الموقع يهدف إلى تقديم المعرفة الإسلامية الصحيحة والموثقة من الكتاب والسنة."
            : "This website aims to provide authentic and documented Islamic knowledge from the Quran and Sunnah."
    }

    private var features: [(String, String)] {
        if appLocale == .arabic {
            return [
                ("📚", "محتوى معتمد من الكتاب والسنة"),
                ("🎓", "شرح مبسط ومفهوم للجميع"),
                ("🌍", "متاح بعدة لغات")
            ]
        } else {
            return [
                ("📚", "Content based on Quran and Sunnah"),
                ("🎓", "Simple explanations for everyone"),
                ("🌍", "Available in multiple languages")
            ]
        }
    }

    var body: some View {
        VStack(alignment: appLocale.isRTL ? .trailing : .leading, spacing: 16) {
            Text(title)
                .font(.title3.weight(.semibold))
                .foregroundColor(.white)
                .multilineTextAlignment(appLocale.isRTL ? .trailing : .leading)

            Text(description)
                .font(.body)
                .foregroundColor(.gray)
                .multilineTextAlignment(appLocale.isRTL ? .trailing : .leading)

            VStack(alignment: appLocale.isRTL ? .trailing : .leading, spacing: 12) {
                ForEach(features, id: \.1) { icon, text in
                    HStack(spacing: 12) {
                        if !appLocale.isRTL {
                            Text(icon)
                            Text(text)
                                .foregroundColor(.white)
                            Spacer()
                        } else {
                            Spacer()
                            Text(text)
                                .foregroundColor(.white)
                            Text(icon)
                        }
                    }
                }
            }
            .padding(.top, 8)
        }
        .padding(20)
        .cardStyle()
    }
}

#Preview {
    HomeView(appLocale: .constant(.arabic))
        .preferredColorScheme(.dark)
}
