import SwiftUI

/// Timeline slider for navigating through events
struct TimelineSliderView: View {
    let events: [HistoricalEvent]
    let selectedEventId: Int?
    let minYear: Int
    let maxYear: Int
    let onEventSelect: (Int) -> Void
    let onPrevious: () -> Void
    let onNext: () -> Void

    @State private var dragOffset: CGFloat = 0
    @GestureState private var isDragging = false

    private var selectedEvent: HistoricalEvent? {
        events.first { $0.id == selectedEventId }
    }

    private var selectedIndex: Int {
        events.firstIndex { $0.id == selectedEventId } ?? 0
    }

    private var tickMarks: [Int] {
        let range = maxYear - minYear
        let interval = range > 40 ? 10 : 5
        var ticks: [Int] = []
        var year = ((minYear / interval) + 1) * interval
        while year < maxYear {
            ticks.append(year)
            year += interval
        }
        return ticks
    }

    var body: some View {
        VStack(spacing: 0) {
            // Year indicator bubble
            if let event = selectedEvent, let year = event.gregorianYear {
                yearBubble(year: year)
                    .padding(.bottom, 8)
            }

            // Timeline controls
            HStack(spacing: 12) {
                // Previous button
                Button(action: onPrevious) {
                    Image(systemName: "chevron.left.circle.fill")
                        .font(.title2)
                        .foregroundColor(selectedIndex > 0 ? Color.amberAccent : .gray.opacity(0.5))
                }
                .disabled(selectedIndex <= 0)

                // Timeline track
                GeometryReader { geometry in
                    let trackWidth = geometry.size.width

                    ZStack(alignment: .leading) {
                        // Track background
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 4)

                        // Tick marks
                        ForEach(tickMarks, id: \.self) { tick in
                            tickMark(year: tick, trackWidth: trackWidth)
                        }

                        // Event dots
                        ForEach(events) { event in
                            eventDot(event: event, trackWidth: trackWidth)
                        }

                        // Selected indicator
                        if let selectedEvent = selectedEvent {
                            selectedIndicator(event: selectedEvent, trackWidth: trackWidth)
                        }
                    }
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                let position = value.location.x / trackWidth
                                let clampedPosition = max(0, min(1, position))
                                selectEventAtPosition(clampedPosition)
                            }
                    )
                }
                .frame(height: 60)

                // Next button
                Button(action: onNext) {
                    Image(systemName: "chevron.right.circle.fill")
                        .font(.title2)
                        .foregroundColor(selectedIndex < events.count - 1 ? Color.amberAccent : .gray.opacity(0.5))
                }
                .disabled(selectedIndex >= events.count - 1)
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 16)
        .background(
            LinearGradient(
                colors: [Color.backgroundPrimary.opacity(0), Color.backgroundPrimary],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }

    // MARK: - Subviews

    private func yearBubble(year: Int) -> some View {
        Text("\(year) CE")
            .font(.caption.weight(.bold))
            .foregroundColor(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.amberAccent)
            .cornerRadius(12)
    }

    private func tickMark(year: Int, trackWidth: CGFloat) -> some View {
        let position = normalizedPosition(for: year)

        return VStack(spacing: 4) {
            Rectangle()
                .fill(Color.gray.opacity(0.5))
                .frame(width: 1, height: 12)

            Text("\(year)")
                .font(.system(size: 9))
                .foregroundColor(.gray.opacity(0.7))
        }
        .position(x: position * trackWidth, y: 35)
    }

    private func eventDot(event: HistoricalEvent, trackWidth: CGFloat) -> some View {
        let isSelected = event.id == selectedEventId
        let position = normalizedEventPosition(event)

        return Circle()
            .fill(isSelected ? Color.amberAccent : Color.eraColor(event.era).opacity(0.7))
            .frame(width: isSelected ? 12 : 8, height: isSelected ? 12 : 8)
            .position(x: position * trackWidth, y: 2)
            .animation(.easeInOut(duration: 0.15), value: isSelected)
    }

    private func selectedIndicator(event: HistoricalEvent, trackWidth: CGFloat) -> some View {
        let position = normalizedEventPosition(event)

        return ZStack {
            Circle()
                .fill(Color.amberAccent)
                .frame(width: 24, height: 24)

            Circle()
                .fill(Color.white)
                .frame(width: 8, height: 8)
        }
        .shadow(color: Color.amberAccent.opacity(0.5), radius: 8)
        .position(x: position * trackWidth, y: 2)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: selectedEventId)
    }

    // MARK: - Helper Methods

    private func normalizedPosition(for year: Int) -> CGFloat {
        let range = CGFloat(maxYear - minYear)
        guard range > 0 else { return 0.5 }
        let position = CGFloat(year - minYear) / range
        return max(0.02, min(0.98, position)) // Clamp to avoid edge overflow
    }

    private func normalizedEventPosition(_ event: HistoricalEvent) -> CGFloat {
        guard let year = event.gregorianYear else { return 0.5 }
        return normalizedPosition(for: year)
    }

    private func selectEventAtPosition(_ position: Double) {
        guard !events.isEmpty else { return }

        // Find the event closest to this position
        var closestEvent = events[0]
        var closestDistance = abs(normalizedEventPosition(closestEvent) - position)

        for event in events {
            let eventPosition = normalizedEventPosition(event)
            let distance = abs(eventPosition - position)
            if distance < closestDistance {
                closestDistance = distance
                closestEvent = event
            }
        }

        if closestEvent.id != selectedEventId {
            onEventSelect(closestEvent.id)
        }
    }
}

#Preview {
    ZStack {
        Color.backgroundPrimary

        TimelineSliderView(
            events: [
                HistoricalEvent(id: 1, year: "571 CE", title: "Birth", description: "", locationName: "Mecca", coordinates: GeoCoordinates(lat: 0, lng: 0), era: .preProphethood, eventType: .birth),
                HistoricalEvent(id: 2, year: "610 CE", title: "Revelation", description: "", locationName: "Mecca", coordinates: GeoCoordinates(lat: 0, lng: 0), era: .meccan, eventType: .religious),
                HistoricalEvent(id: 3, year: "622 CE", title: "Hijra", description: "", locationName: "Medina", coordinates: GeoCoordinates(lat: 0, lng: 0), era: .medinan, eventType: .migration)
            ],
            selectedEventId: 2,
            minYear: 570,
            maxYear: 632,
            onEventSelect: { _ in },
            onPrevious: {},
            onNext: {}
        )
    }
    .preferredColorScheme(.dark)
}
