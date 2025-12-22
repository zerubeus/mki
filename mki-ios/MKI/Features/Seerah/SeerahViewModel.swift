import Foundation
import Observation
import CoreLocation

/// ViewModel for the Seerah page
@Observable
class SeerahViewModel {
    // MARK: - Data

    var events: [HistoricalEvent] = []
    var geoJSONData: Data?
    var isLoading = true
    var error: Error?

    // MARK: - Selection State

    var selectedEventId: Int?

    // MARK: - UI State

    var showEventCard = true
    var showDetailsModal = false

    // MARK: - Map State

    var mapCenter: CLLocationCoordinate2D = CLLocationCoordinate2D(latitude: 24.7, longitude: 39.5)
    var mapZoom: Double = 6.0

    // MARK: - Constants

    private let eventZoom: Double = 9.0
    private let meccaCoordinates = CLLocationCoordinate2D(latitude: 21.4225, longitude: 39.8262)

    // MARK: - Computed Properties

    /// Events sorted chronologically
    var sortedEvents: [HistoricalEvent] {
        events.sorted { event1, event2 in
            let year1 = event1.gregorianYear ?? 0
            let year2 = event2.gregorianYear ?? 0
            if year1 != year2 { return year1 < year2 }
            return event1.id < event2.id
        }
    }

    /// Currently selected event
    var selectedEvent: HistoricalEvent? {
        events.first { $0.id == selectedEventId }
    }

    /// Minimum year in the dataset
    var minYear: Int {
        sortedEvents.compactMap { $0.gregorianYear }.min() ?? 570
    }

    /// Maximum year in the dataset
    var maxYear: Int {
        sortedEvents.compactMap { $0.gregorianYear }.max() ?? 632
    }

    /// Index of the currently selected event
    var selectedEventIndex: Int? {
        guard let selectedEventId else { return nil }
        return sortedEvents.firstIndex { $0.id == selectedEventId }
    }

    // MARK: - Actions

    /// Load all data from bundled resources
    func loadData(locale: AppLocale) async {
        isLoading = true
        error = nil

        do {
            async let eventsTask = DataService.shared.loadSeerahEvents(locale: locale)
            async let geoJSONTask = DataService.shared.loadGeoJSON()

            let (loadedEvents, loadedGeoJSON) = try await (eventsTask, geoJSONTask)

            events = loadedEvents
            geoJSONData = loadedGeoJSON

            // Select first event by default
            if let first = sortedEvents.first {
                selectEvent(first.id)
            }

            isLoading = false
        } catch {
            self.error = error
            isLoading = false
        }
    }

    /// Select an event and update map position
    func selectEvent(_ eventId: Int) {
        selectedEventId = eventId
        showEventCard = true

        if let event = events.first(where: { $0.id == eventId }) {
            mapCenter = event.coordinates.clLocation
            mapZoom = eventZoom
        }
    }

    /// Select the previous event in the timeline
    func selectPreviousEvent() {
        guard let currentIndex = selectedEventIndex, currentIndex > 0 else { return }
        let previousEvent = sortedEvents[currentIndex - 1]
        selectEvent(previousEvent.id)
    }

    /// Select the next event in the timeline
    func selectNextEvent() {
        guard let currentIndex = selectedEventIndex,
              currentIndex < sortedEvents.count - 1 else { return }
        let nextEvent = sortedEvents[currentIndex + 1]
        selectEvent(nextEvent.id)
    }

    /// Select event by normalized position (0-1)
    func selectEventAtPosition(_ position: Double) {
        let index = Int(position * Double(sortedEvents.count - 1))
        let clampedIndex = max(0, min(index, sortedEvents.count - 1))
        selectEvent(sortedEvents[clampedIndex].id)
    }

    /// Dismiss the event card overlay
    func dismissEventCard() {
        showEventCard = false
    }

    /// Show the details modal
    func showDetails() {
        showDetailsModal = true
    }

    /// Hide the details modal
    func hideDetails() {
        showDetailsModal = false
    }
}
