import Foundation

/// Parses CSV data into structured models
enum CSVParser {

    /// Parse events from CSV string
    /// - Parameter csvString: The raw CSV content
    /// - Returns: Array of HistoricalEvent
    static func parseEvents(from csvString: String) throws -> [HistoricalEvent] {
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

        // Required columns
        guard let idIdx = headerMap["id"],
              let yearIdx = headerMap["year"],
              let titleIdx = headerMap["title"],
              let descIdx = headerMap["description"],
              let locationIdx = headerMap["location_name"] ?? headerMap["locationname"],
              let coordIdx = headerMap["coordinates"],
              let eraIdx = headerMap["era"],
              let typeIdx = headerMap["event_type"] ?? headerMap["eventtype"] else {
            throw CSVParserError.missingColumns
        }

        // Parse each data row
        for i in 1..<lines.count {
            let values = parseCSVLine(lines[i])
            guard values.count > max(idIdx, yearIdx, titleIdx, descIdx, locationIdx, coordIdx, eraIdx, typeIdx) else {
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

            // Parse era
            let eraString = values[eraIdx]
            let era = parseEra(from: eraString, year: values[yearIdx])

            // Parse event type
            let typeString = values[typeIdx]
            let eventType = EventType(rawValue: typeString) ?? .personal

            let event = HistoricalEvent(
                id: id,
                year: values[yearIdx],
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
    private static func parseCSVLine(_ line: String) -> [String] {
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
    private static func parseEra(from string: String, year: String) -> EventEra {
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
    private static func extractYear(from string: String) -> Int? {
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
