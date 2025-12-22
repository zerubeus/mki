import SwiftUI

/// Compact event card overlay shown on the map
struct EventCardView: View {
    let event: HistoricalEvent
    let appLocale: AppLocale
    let onTap: () -> Void
    let onDismiss: () -> Void
    private let closeButtonInset: CGFloat = 28

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                // Title
                Text(event.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.trailing, closeButtonInset)

                // Metadata row
                HStack(spacing: 8) {
                    // Era badge
                    eraBadge

                    // Year
                    yearView

                    // Location
                    locationView
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(16)
            .glassMorphism()
        }
        .buttonStyle(PlainButtonStyle())
        .overlay(alignment: .topTrailing) {
            closeButton
        }
    }

    private var yearView: some View {
        HStack(spacing: 4) {
            Image(systemName: "calendar")
                .font(.caption2)
            Text(event.year)
                .font(.caption)
        }
        .foregroundColor(.gray)
    }

    private var locationView: some View {
        HStack(spacing: 4) {
            Image(systemName: "mappin")
                .font(.caption2)
            Text(event.locationName)
                .font(.caption)
                .lineLimit(1)
        }
        .foregroundColor(.gray)
    }

    private var closeButton: some View {
        Button(action: onDismiss) {
            Image(systemName: "xmark")
                .font(.caption.weight(.bold))
                .foregroundColor(.white)
                .padding(6)
                .background(
                    Circle()
                        .fill(.ultraThinMaterial)
                )
                .overlay(
                    Circle()
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                )
        }
        .buttonStyle(PlainButtonStyle())
        .padding(8)
    }

    private var eraBadge: some View {
        Text(appLocale == .arabic ? event.era.arabicName : event.era.englishName)
            .font(.caption2.weight(.medium))
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color.eraColor(event.era).opacity(0.8))
            .cornerRadius(4)
    }
}

#Preview {
    ZStack {
        Color.backgroundPrimary

        EventCardView(
            event: HistoricalEvent(
                id: 1,
                year: "571 CE",
                title: "ولادة النبي محمد صلى الله عليه وسلم",
                description: "Birth of the Prophet Muhammad",
                locationName: "مكة المكرمة",
                coordinates: GeoCoordinates(lat: 21.4225, lng: 39.8262),
                era: .preProphethood,
                eventType: .birth
            ),
            appLocale: .arabic,
            onTap: {},
            onDismiss: {}
        )
        .padding()
    }
    .preferredColorScheme(.dark)
}
