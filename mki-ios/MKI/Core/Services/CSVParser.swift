import Foundation

/// Parses CSV data into structured models
enum CSVParser {

    /// Parse events from CSV string
    /// - Parameter csvString: The raw CSV content
    /// - Returns: Array of HistoricalEvent
    nonisolated static func parseEvents(from csvString: String) throws -> [HistoricalEvent] {
        var events: [HistoricalEvent] = []

        // Split into lines and get headers
        let lines = csvString.components(separatedBy: .newlines)
            .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }

        guard lines.count > 1 else {
            throw CSVParserError.emptyFile
        }

        // Parse header row
        let headers = parseCSVLine(lines[0])
        let headerMap = Dictionary(uniqueKeysWithValues: headers.enumerated().map { ($1.lowercased(), $0) })

        // Required columns (support multiple naming conventions)
        guard let idIdx = headerMap["event_id"] ?? headerMap["id"],
              let yearIdx = headerMap["gregorian_year"] ?? headerMap["year"],
              let titleIdx = headerMap["title"],
              let descIdx = headerMap["details"] ?? headerMap["description"],
              let locationIdx = headerMap["location_name"] ?? headerMap["locationname"],
              let coordIdx = headerMap["geo_coordinates"] ?? headerMap["coordinates"] else {
            throw CSVParserError.missingColumns
        }

        // Optional columns
        let eraIdx = headerMap["era"]
        let typeIdx = headerMap["event_type"] ?? headerMap["eventtype"]

        // Parse each data row
        for i in 1..<lines.count {
            let values = parseCSVLine(lines[i])

            // Ensure we have enough columns for required fields
            let requiredMaxIdx = max(idIdx, yearIdx, titleIdx, descIdx, locationIdx, coordIdx)
            guard values.count > requiredMaxIdx else {
                continue // Skip malformed rows
            }

            guard let id = Int(values[idIdx]) else { continue }

            // Parse coordinates
            let coordString = values[coordIdx]
            let coords = coordString.components(separatedBy: ",").compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
            let coordinates: GeoCoordinates
            if coords.count >= 2 {
                coordinates = GeoCoordinates(lat: coords[0], lng: coords[1])
            } else {
                // Default to Mecca if parsing fails
                coordinates = GeoCoordinates(lat: 21.4225, lng: 39.8262)
            }

            // Parse era (optional column, infer from year if not present)
            let eraString = eraIdx.flatMap { values.count > $0 ? values[$0] : nil } ?? ""
            let yearString = values[yearIdx]
            let era = parseEra(from: eraString, year: yearString)

            // Parse event type (optional column, default to personal)
            let typeString = typeIdx.flatMap { values.count > $0 ? values[$0] : nil } ?? ""
            let eventType = EventType(rawValue: typeString) ?? .personal

            let event = HistoricalEvent(
                id: id,
                year: yearString,
                title: values[titleIdx],
                description: values[descIdx],
                locationName: values[locationIdx],
                coordinates: coordinates,
                era: era,
                eventType: eventType
            )
            events.append(event)
        }

        return events
    }

    /// Parse a single CSV line, handling quoted fields
    nonisolated private static func parseCSVLine(_ line: String) -> [String] {
        var result: [String] = []
        var current = ""
        var inQuotes = false

        for char in line {
            if char == "\"" {
                inQuotes.toggle()
            } else if char == "," && !inQuotes {
                result.append(current.trimmingCharacters(in: .whitespaces))
                current = ""
            } else {
                current.append(char)
            }
        }
        result.append(current.trimmingCharacters(in: .whitespaces))

        return result
    }

    /// Parse era from string, falling back to year-based detection
    nonisolated private static func parseEra(from string: String, year: String) -> EventEra {
        // Try direct match first
        if let era = EventEra(rawValue: string) {
            return era
        }

        // Fall back to year-based detection
        if let gregorianYear = extractYear(from: year) {
            if gregorianYear < 610 {
                return .preProphethood
            } else if gregorianYear <= 622 {
                return .meccan
            } else {
                return .medinan
            }
        }

        return .meccan // Default
    }

    /// Extract the first 4-digit year from a string
    nonisolated private static func extractYear(from string: String) -> Int? {
        let pattern = #"(\d{3,4})"#
        guard let range = string.range(of: pattern, options: .regularExpression) else { return nil }
        return Int(string[range])
    }
}

enum CSVParserError: Error {
    case emptyFile
    case missingColumns
    case parseError(String)
}
