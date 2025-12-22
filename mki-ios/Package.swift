// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MKI",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "MKI",
            targets: ["MKI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/maplibre/maplibre-gl-native-distribution", from: "6.0.0"),
    ],
    targets: [
        .target(
            name: "MKI",
            dependencies: [
                .product(name: "MapLibre", package: "maplibre-gl-native-distribution"),
            ],
            path: "MKI"
        ),
    ]
)
