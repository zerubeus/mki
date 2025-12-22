import SwiftUI

/// Custom button style for topic cards with press animation
struct TopicCardButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

/// A card view for a topic on the home screen
struct TopicCardView: View {
    let topic: Topic
    let appLocale: AppLocale

    var body: some View {
        if topic.isComingSoon {
            comingSoonCard
        } else {
            NavigationLink(destination: destinationView) {
                activeCard
            }
            .buttonStyle(TopicCardButtonStyle())
        }
    }

    // MARK: - Destination

    @ViewBuilder
    private var destinationView: some View {
        switch topic.id {
        case "seera":
            SeerahView()
        default:
            // Placeholder for other topics
            Text(Strings.Common.comingSoon(appLocale))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.backgroundPrimary)
        }
    }

    // MARK: - Active Card

    private var activeCard: some View {
        VStack(spacing: 12) {
            // Icon
            Image(topic.iconName)
                .resizable()
                .scaledToFit()
                .frame(width: 64, height: 64)

            // Title
            Text(topic.name(for: appLocale))
                .font(.headline)
                .foregroundColor(.white)

            // Description
            Text(topic.description(for: appLocale))
                .font(.caption)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .padding(.horizontal, 16)
        .background(Color.backgroundSecondary)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.borderGray, lineWidth: 1)
        )
    }

    // MARK: - Coming Soon Card

    private var comingSoonCard: some View {
        VStack(spacing: 12) {
            // Icon (grayscale)
            Image(topic.iconName)
                .resizable()
                .scaledToFit()
                .frame(width: 64, height: 64)
                .grayscale(0.8)
                .opacity(0.5)

            // Title
            Text(topic.name(for: appLocale))
                .font(.headline)
                .foregroundColor(.gray)

            // Description
            Text(topic.description(for: appLocale))
                .font(.caption)
                .foregroundColor(.gray.opacity(0.6))
                .multilineTextAlignment(.center)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .padding(.horizontal, 16)
        .background(Color.backgroundSecondary.opacity(0.5))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.borderGray.opacity(0.5), lineWidth: 1)
        )
        .overlay(
            // Coming Soon Banner
            Text(Strings.Common.comingSoon(appLocale))
                .font(.caption2.weight(.bold))
                .foregroundColor(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    LinearGradient(
                        colors: [.green.opacity(0.8), .teal.opacity(0.8)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(4)
                .offset(y: -8),
            alignment: .top
        )
    }
}

#Preview {
    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
        ForEach(Topic.all) { topic in
            TopicCardView(topic: topic, appLocale: .arabic)
        }
    }
    .padding()
    .background(Color.backgroundPrimary)
    .preferredColorScheme(.dark)
}
