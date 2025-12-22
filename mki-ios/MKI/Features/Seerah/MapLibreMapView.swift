import SwiftUI
import MapLibre
import CoreLocation

/// MapLibre-based map view for the Seerah page
/// This wraps the MapLibre Native SDK for custom tile styles
struct MapLibreMapView: UIViewRepresentable {
    @Binding var center: CLLocationCoordinate2D
    @Binding var zoom: Double
    let events: [HistoricalEvent]
    let selectedEventId: Int?
    let geoJSONData: Data?
    let onMarkerTap: (Int) -> Void

    func makeUIView(context: Context) -> MLNMapView {
        // Try to load bundled style, otherwise use MapLibre demo
        var styleURL: URL

        if let bundledStyle = Bundle.main.url(forResource: "map_style", withExtension: "json") {
            styleURL = bundledStyle
            print("🗺️ Using bundled map_style.json: \(bundledStyle)")
        } else {
            // Fallback to MapLibre's demo tiles
            styleURL = URL(string: "https://demotiles.maplibre.org/style.json")!
            print("🗺️ Using MapLibre demo tiles (bundled style not found)")
        }

        let mapView = MLNMapView(frame: .zero, styleURL: styleURL)
        mapView.delegate = context.coordinator
        mapView.setCenter(center, zoomLevel: zoom, animated: false)
        mapView.showsUserLocation = false
        mapView.logoView.isHidden = true
        mapView.attributionButton.isHidden = true

        print("🗺️ MapView created with style URL: \(styleURL)")
        return mapView
    }

    func updateUIView(_ mapView: MLNMapView, context: Context) {
        // Update center if changed externally
        if mapView.centerCoordinate.latitude != center.latitude ||
           mapView.centerCoordinate.longitude != center.longitude {
            mapView.setCenter(center, zoomLevel: zoom, animated: true)
        }

        // Update annotations
        context.coordinator.updateAnnotations(
            mapView: mapView,
            events: events,
            selectedId: selectedEventId
        )
    }

    func makeCoordinator() -> MapLibreCoordinator {
        MapLibreCoordinator(
            onMarkerTap: onMarkerTap,
            geoJSONData: geoJSONData
        )
    }
}

// MARK: - Coordinator

class MapLibreCoordinator: NSObject, MLNMapViewDelegate {
    let onMarkerTap: (Int) -> Void
    let geoJSONData: Data?

    private var hasAddedGeoJSON = false
    private var eventAnnotations: [Int: MLNPointAnnotation] = [:]

    init(onMarkerTap: @escaping (Int) -> Void, geoJSONData: Data?) {
        self.onMarkerTap = onMarkerTap
        self.geoJSONData = geoJSONData
        super.init()
    }

    // MARK: - MLNMapViewDelegate

    func mapView(_ mapView: MLNMapView, didFinishLoading style: MLNStyle) {
        print("✅ MapLibre style loaded: \(style.name ?? "unknown")")
        print("📍 Style URL: \(mapView.styleURL?.absoluteString ?? "none")")
        addGeoJSONLayer(to: mapView, style: style)
        addMeccaMarker(to: mapView)
    }

    func mapViewDidFailLoadingMap(_ mapView: MLNMapView, withError error: Error) {
        print("❌ MapLibre failed to load: \(error.localizedDescription)")
    }

    func mapView(_ mapView: MLNMapView, didFailToLoadImage imageName: String) -> UIImage? {
        print("⚠️ MapLibre failed to load image: \(imageName)")
        return nil
    }

    func mapView(_ mapView: MLNMapView, didSelect annotation: MLNAnnotation) {
        if let eventAnnotation = annotation as? EventAnnotation {
            onMarkerTap(eventAnnotation.eventId)
        }
    }

    func mapView(_ mapView: MLNMapView, viewFor annotation: MLNAnnotation) -> MLNAnnotationView? {
        guard let eventAnnotation = annotation as? EventAnnotation else {
            // Default Mecca marker - use Kaaba SVG from assets
            if annotation.title == "Mecca" {
                let view = MLNAnnotationView(annotation: annotation, reuseIdentifier: "mecca")
                view.frame = CGRect(x: 0, y: 0, width: 48, height: 48)

                let imageView = UIImageView(image: UIImage(named: "kaaba"))
                imageView.frame = view.bounds
                imageView.contentMode = .scaleAspectFit
                view.addSubview(imageView)

                return view
            }
            return nil
        }

        let identifier = eventAnnotation.isSelected ? "selected-event" : "event-\(eventAnnotation.era.rawValue)"
        var view = mapView.dequeueReusableAnnotationView(withIdentifier: identifier)

        if view == nil {
            view = EventAnnotationView(annotation: eventAnnotation, reuseIdentifier: identifier)
        }

        (view as? EventAnnotationView)?.configure(
            era: eventAnnotation.era,
            isSelected: eventAnnotation.isSelected
        )

        return view
    }

    // MARK: - Annotations

    func updateAnnotations(mapView: MLNMapView, events: [HistoricalEvent], selectedId: Int?) {
        // Remove old event annotations
        let existingAnnotations = mapView.annotations?.compactMap { $0 as? EventAnnotation } ?? []
        mapView.removeAnnotations(existingAnnotations)

        // Add new annotations
        for event in events {
            let annotation = EventAnnotation(event: event, isSelected: event.id == selectedId)
            mapView.addAnnotation(annotation)
        }
    }

    // MARK: - GeoJSON Layer

    // Vintage color palette for regions (muted, historical feel)
    private let regionColors: [UIColor] = [
        UIColor(red: 0.90, green: 0.72, blue: 0.69, alpha: 1.0), // Dusty rose
        UIColor(red: 0.96, green: 0.80, blue: 0.80, alpha: 1.0), // Light pink
        UIColor(red: 0.99, green: 0.90, blue: 0.80, alpha: 1.0), // Peach
        UIColor(red: 1.00, green: 0.95, blue: 0.80, alpha: 1.0), // Light yellow
        UIColor(red: 0.85, green: 0.92, blue: 0.83, alpha: 1.0), // Light green
        UIColor(red: 0.82, green: 0.88, blue: 0.89, alpha: 1.0), // Light teal
        UIColor(red: 0.79, green: 0.85, blue: 0.97, alpha: 1.0), // Light blue
        UIColor(red: 0.85, green: 0.82, blue: 0.91, alpha: 1.0), // Light purple
        UIColor(red: 0.92, green: 0.82, blue: 0.86, alpha: 1.0), // Pink lavender
        UIColor(red: 0.87, green: 0.49, blue: 0.42, alpha: 1.0), // Salmon
        UIColor(red: 0.90, green: 0.57, blue: 0.22, alpha: 1.0), // Orange
        UIColor(red: 0.95, green: 0.76, blue: 0.20, alpha: 1.0), // Gold
        UIColor(red: 0.42, green: 0.66, blue: 0.31, alpha: 1.0), // Forest green
        UIColor(red: 0.27, green: 0.51, blue: 0.56, alpha: 1.0), // Teal
        UIColor(red: 0.24, green: 0.52, blue: 0.78, alpha: 1.0), // Blue
    ]

    private func addGeoJSONLayer(to mapView: MLNMapView, style: MLNStyle) {
        guard !hasAddedGeoJSON, let geoJSONData = geoJSONData else { return }

        do {
            let shape = try MLNShape(data: geoJSONData, encoding: String.Encoding.utf8.rawValue)

            let source = MLNShapeSource(identifier: "territories", shape: shape)
            style.addSource(source)

            // Fill layer with vintage colors
            let fillLayer = MLNFillStyleLayer(identifier: "territories-fill", source: source)
            // Use a warm brown/sepia base color for all regions
            fillLayer.fillColor = NSExpression(forConstantValue: UIColor(red: 0.85, green: 0.75, blue: 0.65, alpha: 1.0))
            fillLayer.fillOpacity = NSExpression(forConstantValue: 0.4)

            // Border layer with vintage brown
            let borderLayer = MLNLineStyleLayer(identifier: "territories-border", source: source)
            borderLayer.lineColor = NSExpression(forConstantValue: UIColor(red: 0.55, green: 0.27, blue: 0.07, alpha: 0.7)) // Saddle brown
            borderLayer.lineWidth = NSExpression(forConstantValue: 1.5)

            style.addLayer(fillLayer)
            style.addLayer(borderLayer)

            hasAddedGeoJSON = true
        } catch {
            print("Failed to add GeoJSON layer: \(error)")
        }
    }

    private func addMeccaMarker(to mapView: MLNMapView) {
        let meccaAnnotation = MLNPointAnnotation()
        meccaAnnotation.coordinate = CLLocationCoordinate2D(latitude: 21.4225, longitude: 39.8262)
        meccaAnnotation.title = "Mecca"
        meccaAnnotation.subtitle = "مكة المكرمة"
        mapView.addAnnotation(meccaAnnotation)
    }
}

// MARK: - Event Annotation

class EventAnnotation: NSObject, MLNAnnotation {
    let eventId: Int
    let era: EventEra
    var isSelected: Bool
    var coordinate: CLLocationCoordinate2D
    var title: String?
    var subtitle: String?

    init(event: HistoricalEvent, isSelected: Bool) {
        self.eventId = event.id
        self.era = event.era
        self.isSelected = isSelected
        self.coordinate = event.coordinates.clLocation
        self.title = event.title
        self.subtitle = event.locationName
        super.init()
    }
}

// MARK: - Event Annotation View

class EventAnnotationView: MLNAnnotationView {
    private let circleView = UIView()
    private let innerDot = UIView()

    override init(annotation: MLNAnnotation?, reuseIdentifier: String?) {
        super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)
        setupViews()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupViews()
    }

    private func setupViews() {
        frame = CGRect(x: 0, y: 0, width: 28, height: 28)

        circleView.frame = bounds
        circleView.layer.cornerRadius = 14
        addSubview(circleView)

        innerDot.frame = CGRect(x: 11, y: 11, width: 6, height: 6)
        innerDot.layer.cornerRadius = 3
        innerDot.backgroundColor = .white
        innerDot.isHidden = true
        addSubview(innerDot)
    }

    func configure(era: EventEra, isSelected: Bool) {
        let color = UIColor(Color.eraColor(era))

        if isSelected {
            circleView.frame = CGRect(x: 4, y: 4, width: 20, height: 20)
            circleView.layer.cornerRadius = 10
            circleView.backgroundColor = color
            circleView.layer.borderWidth = 2
            circleView.layer.borderColor = UIColor.white.cgColor
            innerDot.isHidden = false

            layer.shadowColor = color.cgColor
            layer.shadowRadius = 8
            layer.shadowOpacity = 0.5
            layer.shadowOffset = .zero
        } else {
            circleView.frame = CGRect(x: 8, y: 8, width: 12, height: 12)
            circleView.layer.cornerRadius = 6
            circleView.backgroundColor = color.withAlphaComponent(0.8)
            circleView.layer.borderWidth = 0
            innerDot.isHidden = true

            layer.shadowColor = color.cgColor
            layer.shadowRadius = 4
            layer.shadowOpacity = 0.3
            layer.shadowOffset = .zero
        }
    }
}
