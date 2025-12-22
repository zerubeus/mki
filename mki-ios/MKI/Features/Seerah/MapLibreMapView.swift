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

    // Stamen Watercolor tiles via Stadia Maps
    private let styleURL = URL(string: "https://tiles.stadiamaps.com/styles/stamen_watercolor.json")!

    func makeUIView(context: Context) -> MLNMapView {
        let mapView = MLNMapView(frame: .zero, styleURL: styleURL)
        mapView.delegate = context.coordinator
        mapView.setCenter(center, zoomLevel: zoom, animated: false)
        mapView.showsUserLocation = false
        mapView.logoView.isHidden = true
        mapView.attributionButton.isHidden = true

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
        addGeoJSONLayer(to: mapView, style: style)
        addMeccaMarker(to: mapView)
    }

    func mapView(_ mapView: MLNMapView, didSelect annotation: MLNAnnotation) {
        if let eventAnnotation = annotation as? EventAnnotation {
            onMarkerTap(eventAnnotation.eventId)
        }
    }

    func mapView(_ mapView: MLNMapView, viewFor annotation: MLNAnnotation) -> MLNAnnotationView? {
        guard let eventAnnotation = annotation as? EventAnnotation else {
            // Default Mecca marker
            if annotation.title == "Mecca" {
                let view = MLNAnnotationView(annotation: annotation, reuseIdentifier: "mecca")
                view.frame = CGRect(x: 0, y: 0, width: 48, height: 48)

                let imageView = UIImageView(image: UIImage(systemName: "building.2.fill"))
                imageView.tintColor = UIColor(Color.amberAccent)
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

    private func addGeoJSONLayer(to mapView: MLNMapView, style: MLNStyle) {
        guard !hasAddedGeoJSON, let geoJSONData = geoJSONData else { return }

        do {
            let shape = try MLNShape(data: geoJSONData, encoding: String.Encoding.utf8.rawValue)

            let source = MLNShapeSource(identifier: "territories", shape: shape)
            style.addSource(source)

            // Fill layer
            let fillLayer = MLNFillStyleLayer(identifier: "territories-fill", source: source)
            fillLayer.fillColor = NSExpression(forConstantValue: UIColor.brown.withAlphaComponent(0.2))
            fillLayer.fillOpacity = NSExpression(forConstantValue: 0.5)

            // Border layer
            let borderLayer = MLNLineStyleLayer(identifier: "territories-border", source: source)
            borderLayer.lineColor = NSExpression(forConstantValue: UIColor.brown.withAlphaComponent(0.5))
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
