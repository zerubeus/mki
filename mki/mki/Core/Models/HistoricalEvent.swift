import Foundation
import CoreLocation

/// Represents a historical event in the Prophet's life
struct HistoricalEvent: Identifiable, Codable, Hashable {
    let id: Int
    let year: String
    let title: String
    let description: String
    let locationName: String
    let coordinates: GeoCoordinates
    let era: EventEra
    let eventType: EventType

    /// Extract the Gregorian year from the year string
    var gregorianYear: Int? {
        let pattern = #"(\d+)"#
        guard let range = year.range(of: pattern, options: .regularExpression) else { return nil }
        return Int(year[range])
    }
}

/// Geographic coordinates
struct GeoCoordinates: Codable, Hashable {
    let lat: Double
    let lng: Double

    var clLocation: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}
