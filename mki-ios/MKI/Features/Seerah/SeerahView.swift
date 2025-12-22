import SwiftUI

/// Main Seerah page with map and timeline
struct SeerahView: View {
    @State private var viewModel = SeerahViewModel()
    @Environment(\.appLocale) private var appLocale

    var body: some View {
        ZStack {
            // Background
            Color.backgroundPrimary.ignoresSafeArea()

            if viewModel.isLoading {
                loadingView
            } else if let error = viewModel.error {
                errorView(error)
            } else {
                mainContent
            }
        }
        .navigationTitle(Strings.Seerah.title(appLocale))
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(Color.backgroundPrimary, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .tint(Color.amberAccent)
        .task(id: appLocale) {
            await viewModel.loadData(locale: appLocale)
        }
        .sheet(isPresented: $viewModel.showDetailsModal) {
            if let event = viewModel.selectedEvent {
                EventDetailsModalView(event: event, appLocale: appLocale)
            }
        }
    }

    // MARK: - Main Content

    private var mainContent: some View {
        GeometryReader { geometry in
            ZStack {
                // Map - using MapLibre for vintage/historical style
                MapLibreMapView(
                    center: $viewModel.mapCenter,
                    zoom: $viewModel.mapZoom,
                    events: viewModel.sortedEvents,
                    selectedEventId: viewModel.selectedEventId,
                    geoJSONData: viewModel.geoJSONData,
                    onMarkerTap: { eventId in
                        viewModel.selectEvent(eventId)
                    }
                )
                .ignoresSafeArea()

                VStack {
                    // Event card overlay at top
                    if let event = viewModel.selectedEvent, viewModel.showEventCard {
                        EventCardView(
                            event: event,
                            appLocale: appLocale,
                            onTap: {
                                viewModel.showDetails()
                            },
                            onDismiss: {
                                viewModel.dismissEventCard()
                            }
                        )
                        .padding(.horizontal)
                        .padding(.top, 8)
                        .transition(.move(edge: .top).combined(with: .opacity))
                    }

                    Spacer()

                    // Timeline slider at bottom
                    TimelineSliderView(
                        events: viewModel.sortedEvents,
                        selectedEventId: viewModel.selectedEventId,
                        minYear: viewModel.minYear,
                        maxYear: viewModel.maxYear,
                        onEventSelect: { eventId in
                            viewModel.selectEvent(eventId)
                        },
                        onPrevious: {
                            viewModel.selectPreviousEvent()
                        },
                        onNext: {
                            viewModel.selectNextEvent()
                        }
                    )
                }
            }
        }
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: Color.amberAccent))
                .scaleEffect(1.5)

            Text(Strings.Common.loading(appLocale))
                .foregroundColor(.gray)
        }
    }

    // MARK: - Error View

    private func errorView(_ error: Error) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundColor(.red)

            Text(error.localizedDescription)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button {
                Task {
                    await viewModel.loadData(locale: appLocale)
                }
            } label: {
                Text(Strings.Common.retry(appLocale))
                    .foregroundColor(Color.amberAccent)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.backgroundSecondary)
                    .cornerRadius(8)
            }
        }
    }
}

#Preview {
    NavigationStack {
        SeerahView()
    }
    .preferredColorScheme(.dark)
}
