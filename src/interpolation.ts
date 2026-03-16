import { pointInSweden } from "./sweden.ts";

export interface DataPoint {
  lat: number;
  lon: number;
  value: number;
}

export const SWEDEN_BOUNDS = {
  north: 69.1,
  south: 55.3,
  west: 10.9,
  east: 24.2,
};

const GRID_WIDTH = 220;
const GRID_HEIGHT = 340;
const IDW_POWER = 2;
const IDW_SEARCH_RADIUS_DEG = 5.0;
const MAX_DEPTH_CM = 200;

function latToMerc(lat: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
}

function mercToLat(merc: number): number {
  return ((2 * Math.atan(Math.exp(merc)) - Math.PI / 2) * 180) / Math.PI;
}

const MERC_NORTH = latToMerc(SWEDEN_BOUNDS.north);
const MERC_SOUTH = latToMerc(SWEDEN_BOUNDS.south);

function pixelToLatLon(px: number, py: number): [number, number] {
  const merc = MERC_NORTH - (py / GRID_HEIGHT) * (MERC_NORTH - MERC_SOUTH);
  const lat = mercToLat(merc);
  const lon = SWEDEN_BOUNDS.west + (px / GRID_WIDTH) * (SWEDEN_BOUNDS.east - SWEDEN_BOUNDS.west);
  return [lat, lon];
}

let cachedMask: Uint8Array | null = null;

function swedenMask(): Uint8Array {
  if (cachedMask) return cachedMask;
  cachedMask = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const [lat, lon] = pixelToLatLon(x, y);
      cachedMask[y * GRID_WIDTH + x] = pointInSweden(lon, lat) ? 1 : 0;
    }
  }
  return cachedMask;
}

function dist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const cosLat = Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  const dx = (lon2 - lon1) * cosLat;
  const dy = lat2 - lat1;
  return Math.sqrt(dx * dx + dy * dy);
}

function idw(points: DataPoint[], lat: number, lon: number): number {
  let weightedSum = 0;
  let weightSum = 0;

  for (const p of points) {
    const d = dist(lat, lon, p.lat, p.lon);
    if (d < 0.001) return p.value;
    if (d > IDW_SEARCH_RADIUS_DEG) continue;
    const w = 1 / Math.pow(d, IDW_POWER);
    weightedSum += w * p.value;
    weightSum += w;
  }

  return weightSum === 0 ? -1 : weightedSum / weightSum;
}

function depthToColor(depth: number): [number, number, number, number] {
  if (depth <= 0) return [0, 0, 0, 0];

  const stops: [number, [number, number, number, number]][] = [
    [1,   [ 60, 200,  80,  60]],  // green
    [10,  [ 80, 220, 160, 120]],  // green-cyan
    [30,  [ 40, 180, 220, 160]],  // cyan
    [60,  [ 30, 100, 220, 190]],  // blue
    [100, [200,  40,  40, 210]],  // red
    [150, [160,  20, 140, 230]],  // red-purple
    [200, [100,   0, 180, 245]],  // purple
  ];

  const clamped = Math.min(depth, MAX_DEPTH_CM);

  if (clamped <= stops[0][0]) {
    const t = clamped / stops[0][0];
    return stops[0][1].map((v) => Math.round(v * t)) as [number, number, number, number];
  }

  for (let i = 1; i < stops.length; i++) {
    const [d0, c0] = stops[i - 1];
    const [d1, c1] = stops[i];
    if (clamped <= d1) {
      const t = (clamped - d0) / (d1 - d0);
      return [
        Math.round(c0[0] + t * (c1[0] - c0[0])),
        Math.round(c0[1] + t * (c1[1] - c0[1])),
        Math.round(c0[2] + t * (c1[2] - c0[2])),
        Math.round(c0[3] + t * (c1[3] - c0[3])),
      ];
    }
  }

  return stops[stops.length - 1][1];
}

export function drawOverlay(points: DataPoint[]): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = GRID_WIDTH;
  canvas.height = GRID_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(GRID_WIDTH, GRID_HEIGHT);
  const data = imageData.data;

  const mask = swedenMask();

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const idx = y * GRID_WIDTH + x;
      if (!mask[idx]) continue;

      const [lat, lon] = pixelToLatLon(x, y);
      const depth = idw(points, lat, lon);
      const [r, g, b, a] = depthToColor(depth);
      const px = idx * 4;
      data[px] = r;
      data[px + 1] = g;
      data[px + 2] = b;
      data[px + 3] = a;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
