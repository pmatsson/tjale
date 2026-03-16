import maplibregl from "maplibre-gl";
import type { ImageSource } from "maplibre-gl";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import type { Station } from "./api.ts";
import { drawOverlay, SWEDEN_BOUNDS } from "./interpolation.ts";
import { swedenFeature } from "./sweden.ts";
import { t } from "./i18n.ts";

interface MapController {
  updateMap(stations: Station[], opacityPct: number): void;
  updateOverlayOpacity(opacityPct: number): void;
  closePopups(): void;
}

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const SWEDEN_CENTER: [number, number] = [17.0, 63.0];
const IMAGE_COORDS: maplibregl.Coordinates = [
  [SWEDEN_BOUNDS.west, SWEDEN_BOUNDS.north],
  [SWEDEN_BOUNDS.east, SWEDEN_BOUNDS.north],
  [SWEDEN_BOUNDS.east, SWEDEN_BOUNDS.south],
  [SWEDEN_BOUNDS.west, SWEDEN_BOUNDS.south],
];

function worldMask(): Feature<Polygon> {
  // CCW exterior, CW holes (GeoJSON nonzero fill rule)
  const world: Position[] = [
    [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90],
  ];
  const holes = swedenFeature.geometry.coordinates.map(
    (poly) => [...poly[0]].reverse()
  );
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [world, ...holes] },
    properties: {},
  };
}

function popup(station: Station): string {
  const rows = [...station.temperatures]
    .sort((a, b) => a.depth - b.depth)
    .map((temp) =>
      `<tr>
        <td>${temp.depth} cm</td>
        <td class="${temp.value <= 0 ? "frozen" : "thawed"}">${temp.value.toFixed(2)} °C</td>
      </tr>`
    )
    .join("");

  const frostBadge = station.hasFrost
    ? `<div class="popup-frost-badge">${t("frostRange")}: ${station.frostTop > 0 ? station.frostTop.toFixed(0) : "0"} – ${station.frostBottom.toFixed(0)} cm</div>`
    : `<div class="popup-frost-badge no-frost">${t("noFrostFound")}</div>`;

  return `
    <div class="popup-content">
      <div class="popup-header${station.hasFrost ? "" : " no-frost"}">
        <h3>${station.stationName}</h3>
        <p class="popup-meta">${t("lastMeasured")}: ${station.sample.toLocaleString()}</p>
      </div>
      <div class="popup-body">
        ${frostBadge}
        <details>
          <summary>${t("temperatureProfile")}</summary>
          <div class="popup-table-wrap">
            <table class="popup-table">
              <thead><tr><th>${t("depth")}</th><th>°C</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  `;
}

function initLayers(map: maplibregl.Map) {
  map.addSource("world-mask", { type: "geojson", data: worldMask() });
  map.addLayer({
    id: "world-mask",
    type: "fill",
    source: "world-mask",
    paint: { "fill-color": "#f0f0f0", "fill-opacity": 1.0 },
  });

  map.addSource("sweden-border", {
    type: "geojson",
    data: swedenFeature as Feature<MultiPolygon>,
  });
  map.addLayer({
    id: "sweden-border",
    type: "line",
    source: "sweden-border",
    paint: { "line-color": "#444", "line-width": 1.5 },
  });
}

export function initMap(containerId: string): MapController {
  const map = new maplibregl.Map({
    container: containerId,
    style: STYLE_URL,
    center: SWEDEN_CENTER,
    zoom: 4.5,
    minZoom: 3,
    maxZoom: 14,
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");

  let layersReady = false;
  map.on("load", () => { initLayers(map); layersReady = true; });

  let markers: maplibregl.Marker[] = [];

  function renderMarkers(stations: Station[]) {
    markers.forEach((m) => m.remove());
    markers = [];

    for (const station of stations) {
      const el = document.createElement("div");
      el.className = "station-marker-anchor";
      const dot = document.createElement("div");
      dot.className = station.hasFrost ? "station-marker frost" : "station-marker";
      el.appendChild(dot);

      const p = new maplibregl.Popup({ maxWidth: "280px" });
      el.addEventListener("click", () => p.setHTML(popup(station)));

      markers.push(
        new maplibregl.Marker({ element: el })
          .setLngLat([station.lon, station.lat])
          .setPopup(p)
          .addTo(map)
      );
    }
  }

  function updateMap(stations: Station[], opacityPct: number) {
    if (!layersReady) {
      map.once("load", () => updateMap(stations, opacityPct));
      return;
    }

    const url = drawOverlay(
      stations.map((s) => ({ lat: s.lat, lon: s.lon, value: s.frostBottom }))
    ).toDataURL();

    const opacity = opacityPct / 100;

    if (map.getSource("interpolation")) {
      (map.getSource("interpolation") as ImageSource).updateImage({ url, coordinates: IMAGE_COORDS });
      map.setPaintProperty("interpolation", "raster-opacity", opacity);
    } else {
      map.addSource("interpolation", { type: "image", url, coordinates: IMAGE_COORDS });
      map.addLayer(
        { id: "interpolation", type: "raster", source: "interpolation",
          paint: { "raster-opacity": opacity } },
        "sweden-border"
      );
    }

    renderMarkers(stations);
  }

  function updateOverlayOpacity(opacityPct: number) {
    if (map.getLayer("interpolation")) {
      map.setPaintProperty("interpolation", "raster-opacity", opacityPct / 100);
    }
  }

  function closePopups() {
    markers.forEach((m) => {
      if (m.getPopup()?.isOpen()) m.togglePopup();
    });
  }

  return { updateMap, updateOverlayOpacity, closePopups };
}
