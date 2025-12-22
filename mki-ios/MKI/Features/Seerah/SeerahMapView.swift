import SwiftUI
import MapKit

/// Map view for the Seerah page
/// Note: This is a MapKit implementation. For MapLibre, replace with UIViewRepresentable wrapper.
struct SeerahMapView: View {
    @Binding var center: CLLocationCoordinate2D
    @Binding var zoom: Double
    let events: [HistoricalEvent]
    let selectedEventId: Int?
    let geoJSONData: Data?
    let onMarkerTap: (Int) -> Void

    @State private var cameraPosition: MapCameraPosition = .automatic

    private var selectedEvent: HistoricalEvent? {
        events.first { $0.id == selectedEventId }
    }

    var body: some View {
        Map(position: $cameraPosition) {
            // Event markers
            ForEach(events) { event in
                Annotation(
                    event.title,
                    coordinate: event.coordinates.clLocation,
                    anchor: .bottom
                ) {
                    eventMarker(for: event)
                        .onTapGesture {
                            onMarkerTap(event.id)
                        }
                }
            }

            // Mecca marker (always visible)
            Annotation(
                "مكة المكرمة",
                coordinate: CLLocationCoordinate2D(latitude: 21.4225, longitude: 39.8262),
                anchor: .center
            ) {
                meccaMarker
            }
        }
        .mapStyle(.imagery(elevation: .realistic))
        .onChange(of: center) { _, newCenter in
            withAnimation(.easeInOut(duration: 0.5)) {
                cameraPosition = .camera(
                    MapCamera(
                        centerCoordinate: newCenter,
                        distance: zoomToDistance(zoom),
                        heading: 0,
                        pitch: 0
                    )
                )
            }
        }
        .onAppear {
            cameraPosition = .camera(
                MapCamera(
                    centerCoordinate: center,
                    distance: zoomToDistance(zoom),
                    heading: 0,
                    pitch: 0
                )
            )
        }
    }

    // MARK: - Markers

    private func eventMarker(for event: HistoricalEvent) -> some View {
        let isSelected = event.id == selectedEventId

        return ZStack {
            // Outer ring for selected
            if isSelected {
                Circle()
                    .stroke(Color.white, lineWidth: 2)
                    .frame(width: 28, height: 28)
            }

            // Main circle
            Circle()
                .fill(Color.eraColor(event.era))
                .frame(width: isSelected ? 20 : 12, height: isSelected ? 20 : 12)

            // Inner dot for selected
            if isSelected {
                Circle()
                    .fill(Color.white)
                    .frame(width: 6, height: 6)
            }
        }
        .shadow(color: Color.eraColor(event.era).opacity(0.5), radius: isSelected ? 8 : 4)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
    }

    private var meccaMarker: some View {
        ZStack {
            // Glow effect
            Circle()
                .fill(Color.amberAccent.opacity(0.3))
                .frame(width: 48, height: 48)

            // Kaaba icon
            Image(systemName: "building.2.fill")
                .font(.title)
                .foregroundColor(.amberAccent)
        }
    }

    // MARK: - Helpers

    /// Convert zoom level to MapKit camera distance
    private func zoomToDistance(_ zoom: Double) -> Double {
        // MapLibre zoom 6 ≈ 1,000,000m, zoom 9 ≈ 100,000m
        let baseDistance = 20_000_000.0
        return baseDistance / pow(2, zoom)
    }
}

#Preview {
    SeerahMapView(
        center: .constant(CLLocationCoordinate2D(latitude: 24.7, longitude: 39.5)),
        zoom: .constant(6),
        events: [
            HistoricalEvent(
                id: 1,
                year: "571 CE",
                title: "Birth of Prophet",
                description: "",
                locationName: "Mecca",
                coordinates: GeoCoordinates(lat: 21.4225, lng: 39.8262),
                era: .preProphethood,
                eventType: .birth
            )
        ],
        selectedEventId: 1,
        geoJSONData: nil,
        onMarkerTap: { _ in }
    )
}
