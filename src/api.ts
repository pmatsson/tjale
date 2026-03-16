const DATA_URL = import.meta.env.BASE_URL + "data.json";

const EXCLUDED_STATIONS = ["Moskosel"];

export interface Reading {
  sensorName: string;
  depth: number;
  value: number;
}

export interface Station {
  stationId: number;
  stationName: string;
  lat: number;
  lon: number;
  sample: Date;
  temperatures: Reading[];
  hasFrost: boolean;
  frostTop: number;    // shallowest frozen depth (cm), 0 = starts at surface
  frostBottom: number; // deepest frozen depth (cm)
}

function parseWGS84(wkt: string): { lat: number; lon: number } | null {
  const match = wkt.match(/POINT\s*(?:Z\s*)?\(\s*([-\d.]+)\s+([-\d.]+)/);
  if (!match) return null;
  return { lon: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

function frostLayer(temps: Reading[]): { hasFrost: boolean; top: number; bottom: number } {
  const sorted = [...temps].sort((a, b) => a.depth - b.depth);

  const frozenFrom = sorted.findIndex((t) => t.value <= 0);
  if (frozenFrom === -1) return { hasFrost: false, top: 0, bottom: 0 };

  const frozenTo = sorted.findLastIndex((t: Reading) => t.value <= 0);

  let top: number;
  if (frozenFrom === 0) {
    top = 0;
  } else {
    const warm = sorted[frozenFrom - 1];
    const cold = sorted[frozenFrom];
    const span = warm.value + Math.abs(cold.value);
    top = span === 0 ? cold.depth : warm.depth + (cold.depth - warm.depth) * (warm.value / span);
  }

  let bottom: number;
  if (frozenTo < sorted.length - 1) {
    const cold = sorted[frozenTo];
    const warm = sorted[frozenTo + 1];
    if (warm.value > 0) {
      const span = Math.abs(cold.value) + warm.value;
      bottom = cold.depth + (warm.depth - cold.depth) * (Math.abs(cold.value) / span);
    } else {
      bottom = cold.depth;
    }
  } else {
    bottom = sorted[frozenTo].depth;
  }

  return { hasFrost: true, top, bottom };
}

function parse(data: any): Station[] {
  const results: Station[] = [];
  const seen = new Set<number>();

  const items = data?.RESPONSE?.RESULT?.[0]?.FrostDepthObservation ?? [];

  for (const item of items) {
    const mp = item?.Measurepoint;
    const fd = item?.FrostDepth;
    if (!mp || !fd) continue;

    const stationId = parseInt(mp.Id) || 0;
    if (seen.has(stationId)) continue;
    seen.add(stationId);

    const name: string = mp.Name ?? "";
    if (EXCLUDED_STATIONS.some((ex) => name.includes(ex))) continue;

    const geo = parseWGS84(mp?.Geometry?.WGS84 ?? "");
    if (!geo) continue;

    const temperatures: Reading[] = (
      Array.isArray(fd.Temperature) ? fd.Temperature : [fd.Temperature]
    )
      .filter(Boolean)
      .map((t: any) => ({
        sensorName: t.SensorName ?? "",
        depth: parseInt(t.Depth) || 0,
        value: parseFloat(t.Value) || 0,
      }));

    const { hasFrost, top, bottom } = frostLayer(temperatures);

    results.push({
      stationId,
      stationName: name,
      lat: geo.lat,
      lon: geo.lon,
      sample: new Date(fd.Sample),
      temperatures,
      hasFrost,
      frostTop: top,
      frostBottom: bottom,
    });
  }

  return results;
}

export async function fetchFrostData(): Promise<Station[]> {
  const response = await fetch(DATA_URL);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  const error = data?.RESPONSE?.RESULT?.[0]?.ERROR;
  if (error) {
    throw new Error(error.MESSAGE ?? "API error");
  }

  return parse(data);
}
