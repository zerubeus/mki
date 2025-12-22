import SwiftUI

/// Compact event card overlay shown on the map
struct EventCardView: View {
    let event: HistoricalEvent
    let appLocale: AppLocale
    let onTap: () -> Void
    let onDismiss: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Era badge
                eraBadge

                // Content
                VStack(alignment: appLocale.isRTL ? .trailing : .leading, spacing: 4) {
                    Text(event.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.white)
                        .lineLimit(2)
                        .multilineTextAlignment(appLocale.isRTL ? .trailing : .leading)

                    HStack(spacing: 8) {
                        // Year
                        HStack(spacing: 4) {
                            Image(systemName: "calendar")
                                .font(.caption2)
                            Text(event.year)
                                .font(.caption)
                        }
                        .foregroundColor(.gray)

                        // Location
                        HStack(spacing: 4) {
                            Image(systemName: "mappin")
                                .font(.caption2)
                            Text(event.locationName)
                                .font(.caption)
                                .lineLimit(1)
                        }
                        .foregroundColor(.gray)
                    }
                }

                Spacer()

                // Chevron
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding(16)
            .glassMorphism()
        }
        .buttonStyle(PlainButtonStyle())
        .overlay(
            // Close button
            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .font(.caption.weight(.bold))
                    .foregroundColor(.gray)
                    .padding(8)
                    .background(Color.backgroundTertiary)
                    .clipShape(Circle())
            }
            .offset(x: 8, y: -8),
            alignment: .topTrailing
        )
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
