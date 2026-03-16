import type { Feature, MultiPolygon, Position } from "geojson";
import swedenGeoJSON from "./sweden.json";

export const swedenFeature = swedenGeoJSON as unknown as Feature<MultiPolygon>;

function inRing(ring: Position[], lon: number, lat: number): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function inPolygon(rings: Position[][], lon: number, lat: number): boolean {
  if (!inRing(rings[0], lon, lat)) return false;
  for (let i = 1; i < rings.length; i++) {
    if (inRing(rings[i], lon, lat)) return false;
  }
  return true;
}

export function pointInSweden(lon: number, lat: number): boolean {
  return swedenFeature.geometry.coordinates.some((poly) => inPolygon(poly, lon, lat));
}
