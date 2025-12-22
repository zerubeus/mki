import Foundation

/// Service for loading bundled data
actor DataService {
    static let shared = DataService()

    private var eventsCache: [AppLocale: [HistoricalEvent]] = [:]
    private var geoJSONCache: Data?

    private init() {}

    /// Load Seerah events from bundled CSV
    func loadSeerahEvents(locale: AppLocale) async throws -> [HistoricalEvent] {
        if let cached = eventsCache[locale] {
            return cached
        }

        let resourceName: String
        switch locale {
        case .french:
            resourceName = "seera_events_fr"
        case .arabic, .english:
            resourceName = "seera_events"
        }

        guard let url = Bundle.main.url(forResource: resourceName, withExtension: "csv") else {
            throw DataError.fileNotFound("\(resourceName).csv")
        }

        let csvString = try String(contentsOf: url, encoding: .utf8)
        let events = try CSVParser.parseEvents(from: csvString)

        eventsCache[locale] = events
        return events
    }

    /// Load GeoJSON data for map territories
    func loadGeoJSON() async throws -> Data {
        if let cached = geoJSONCache {
            return cached
        }

        guard let url = Bundle.main.url(forResource: "world_500", withExtension: "geojson") else {
            throw DataError.fileNotFound("world_500.geojson")
        }

        let data = try Data(contentsOf: url)
        geoJSONCache = data
        return data
    }

    /// Clear all cached data
    func clearCache() {
        eventsCache.removeAll()
        geoJSONCache = nil
    }
}

enum DataError: Error, LocalizedError {
    case fileNotFound(String)
    case parseError(String)
    case invalidData

    var errorDescription: String? {
        switch self {
        case .fileNotFound(let filename):
            return "File not found: \(filename)"
        case .parseError(let message):
            return "Parse error: \(message)"
        case .invalidData:
            return "Invalid data format"
        }
    }
}
