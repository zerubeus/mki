import React, { useEffect, useRef, useState } from "react";
import world400 from "../data/geojson/world_400.geojson?raw";
import { getGeoJsonForYear, getYearRange } from "../data/territoryManager";

interface GeoJSONFile {
  name: string;
  data: any;
  year?: number;
}

const MapTestInteractive: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(622);
  const [selectedFile, setSelectedFile] = useState<string>("internal");
  const [showInfo, setShowInfo] = useState<boolean>(true);
  const [territoryInfo, setTerritoryInfo] = useState<string[]>([]);
  
  // Get year range from internal data
  const yearRange = getYearRange();

  // Available GeoJSON files
  const geoJsonFiles: GeoJSONFile[] = [
    { name: "Internal Territories", data: null, year: selectedYear },
    { name: "World 400 CE", data: JSON.parse(world400), year: 400 },
  ];

  useEffect(() => {
    if (mapRef.current && window.L && !leafletMapRef.current) {
      // Create a map
      const map = window.L.map(mapRef.current, {
        attributionControl: true,
        zoomControl: true,
        minZoom: 2,
        maxZoom: 16,
      }).setView([25, 45], 4); // Center on Arabian Peninsula

      // Use Stamen Watercolor tiles for vintage/historical aesthetic
      window.L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg",
        {
          attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>. Hosted by <a href="https://stadiamaps.com/">Stadia Maps</a>.',
          maxZoom: 16,
          minZoom: 2,
        },
      ).addTo(map);

      leafletMapRef.current = map;
      setMapReady(true);
    }
  }, []);

  // Update map when year or file changes
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !window.L) return;

    // Remove existing GeoJSON layer
    if (geoJsonLayerRef.current) {
      leafletMapRef.current.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    let geoJsonData: any;
    const territories: string[] = [];

    if (selectedFile === "internal") {
      // Use internal territory data
      geoJsonData = getGeoJsonForYear(selectedYear);
      
      // Extract territory names for info panel
      if (geoJsonData.features) {
        geoJsonData.features.forEach((feature: any) => {
          if (feature.properties?.name) {
            territories.push(
              `${feature.properties.name} (${feature.properties.startYear}-${feature.properties.endYear})`
            );
          }
        });
      }
    } else {
      // Use external GeoJSON file
      const file = geoJsonFiles.find(f => f.name === selectedFile);
      if (file?.data) {
        geoJsonData = file.data;
        
        // Extract feature names
        if (geoJsonData.features) {
          geoJsonData.features.forEach((feature: any) => {
            if (feature.properties?.NAME || feature.properties?.name) {
              territories.push(feature.properties.NAME || feature.properties.name);
            }
          });
        }
      }
    }

    setTerritoryInfo(territories);

    // Add GeoJSON to map
    if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
      geoJsonLayerRef.current = window.L.geoJSON(geoJsonData, {
        style: (feature: any) => {
          // Different styling for different sources - vintage aesthetic
          if (selectedFile === "internal") {
            return {
              fillColor: feature?.properties?.color || "#B22222",
              weight: 2,
              opacity: 0.7,
              color: "#6B4423",  // Warm brown border for vintage look
              fillOpacity: 0.3,
            };
          } else {
            // Vintage earth-tone colors for external files
            const colors = ["#A0522D", "#CD853F", "#8B4513", "#D2691E", "#BC8F8F", "#6B4423"];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            return {
              fillColor: randomColor,
              weight: 1,
              opacity: 0.7,
              color: "#6B4423",
              fillOpacity: 0.3,
            };
          }
        },
        onEachFeature: (feature: any, layer: any) => {
          const name = feature.properties?.name || feature.properties?.NAME || "Unknown";
          const desc = feature.properties?.description || "";
          const years = feature.properties?.startYear 
            ? `(${feature.properties.startYear}-${feature.properties.endYear})` 
            : "";
          
          layer.bindTooltip(
            `<div class="font-semibold">${name} ${years}</div>
             ${desc ? `<div class="text-xs">${desc}</div>` : ""}`,
            { sticky: true }
          );
          
          // Click handler to show info
          layer.on('click', () => {
            console.log('Feature properties:', feature.properties);
          });
        },
      }).addTo(leafletMapRef.current);

      // Fit map to bounds if there are features
      try {
        const bounds = geoJsonLayerRef.current.getBounds();
        if (bounds.isValid()) {
          leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (e) {
        console.log("Could not fit bounds");
      }
    }
  }, [mapReady, selectedYear, selectedFile]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="bg-gray-100 p-4 rounded-lg space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* File Selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GeoJSON Source
            </label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="internal">Internal Territories</option>
              {geoJsonFiles.slice(1).map(file => (
                <option key={file.name} value={file.name}>
                  {file.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Slider (only for internal data) */}
          {selectedFile === "internal" && (
            <div className="flex-1 min-w-[300px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year: {selectedYear} CE
              </label>
              <input
                type="range"
                min={yearRange.min}
                max={yearRange.max}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{yearRange.min} CE</span>
                <span>{yearRange.max} CE</span>
              </div>
            </div>
          )}

          {/* Info Toggle */}
          <div className="flex items-end">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {showInfo ? "Hide" : "Show"} Info
            </button>
          </div>
        </div>

        {/* Territory Info Panel */}
        {showInfo && (
          <div className="bg-white p-3 rounded border border-gray-200">
            <h3 className="font-semibold text-sm mb-2">
              Visible Territories ({territoryInfo.length})
            </h3>
            {territoryInfo.length > 0 ? (
              <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                {territoryInfo.map((territory, idx) => (
                  <li key={idx} className="text-gray-600">
                    • {territory}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">No territories for this period</p>
            )}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-[600px] rounded-lg shadow-inner"
        style={{ background: "#f0f0f0" }}
      />

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Use the dropdown to switch between different GeoJSON sources</p>
        <p>• For internal territories, use the year slider to see different time periods</p>
        <p>• Hover over territories to see their names and details</p>
        <p>• The map will automatically zoom to show all visible territories</p>
      </div>
    </div>
  );
};

export default MapTestInteractive;