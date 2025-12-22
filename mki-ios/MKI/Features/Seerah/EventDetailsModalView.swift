import SwiftUI

/// Modal view showing full event details
struct EventDetailsModalView: View {
    let event: HistoricalEvent
    let appLocale: AppLocale

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: appLocale.isRTL ? .trailing : .leading, spacing: 20) {
                    // Era Badge
                    HStack {
                        if !appLocale.isRTL { Spacer() }
                        Text(appLocale == .arabic ? event.era.arabicName : event.era.englishName)
                            .font(.caption.weight(.semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.eraColor(event.era))
                            .cornerRadius(6)
                        if appLocale.isRTL { Spacer() }
                    }

                    // Title
                    Text(event.title)
                        .font(.title2.weight(.bold))
                        .foregroundColor(.white)
                        .multilineTextAlignment(appLocale.isRTL ? .trailing : .leading)

                    // Metadata
                    VStack(spacing: 12) {
                        metadataRow(
                            icon: "calendar",
                            label: appLocale == .arabic ? "التاريخ" : "Date",
                            value: event.year
                        )

                        metadataRow(
                            icon: "mappin.circle.fill",
                            label: appLocale == .arabic ? "الموقع" : "Location",
                            value: event.locationName
                        )

                        metadataRow(
                            icon: event.eventType.symbolName,
                            label: appLocale == .arabic ? "النوع" : "Type",
                            value: event.eventType.rawValue
                        )
                    }
                    .padding()
                    .cardStyle()

                    // Description
                    VStack(alignment: appLocale.isRTL ? .trailing : .leading, spacing: 8) {
                        Text(appLocale == .arabic ? "التفاصيل" : "Details")
                            .font(.headline)
                            .foregroundColor(.amberAccent)

                        Text(event.description)
                            .font(.body)
                            .foregroundColor(.white.opacity(0.9))
                            .lineSpacing(6)
                            .multilineTextAlignment(appLocale.isRTL ? .trailing : .leading)
                    }
                    .padding()
                    .cardStyle()
                }
                .padding()
            }
            .background(Color.backgroundPrimary)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.gray)
                    }
                }
            }
        }
        .presentationDragIndicator(.visible)
        .presentationDetents([.medium, .large])
    }

    private func metadataRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            if appLocale.isRTL {
                Spacer()
                Text(value)
                    .foregroundColor(.white)
                Text(label)
                    .foregroundColor(.gray)
                Image(systemName: icon)
                    .foregroundColor(.amberAccent)
                    .frame(width: 24)
            } else {
                Image(systemName: icon)
                    .foregroundColor(.amberAccent)
                    .frame(width: 24)
                Text(label)
                    .foregroundColor(.gray)
                Text(value)
                    .foregroundColor(.white)
                Spacer()
            }
        }
        .font(.subheadline)
    }
}

#Preview {
    EventDetailsModalView(
        event: HistoricalEvent(
            id: 1,
            year: "571 CE",
            title: "ولادة النبي محمد صلى الله عليه وسلم",
            description: "اختلف أهل السير والتاريخ في تحديد يوم وشهر ولادته صلى الله عليه وسلم واتفقوا على أن ميلاده صلى الله عليه وسلم كان يوم الاثنين من عام الفيل.",
            locationName: "مكة المكرمة",
            coordinates: GeoCoordinates(lat: 21.4225, lng: 39.8262),
            era: .preProphethood,
            eventType: .birth
        ),
        appLocale: .arabic
    )
    .preferredColorScheme(.dark)
}
