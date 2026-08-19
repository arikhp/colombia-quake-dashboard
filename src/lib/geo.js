/**
 * A small equirectangular projection, scaled by cos(reference latitude).
 *
 * Over the ~7 degrees of latitude covered by the affected area this is visually
 * indistinguishable from a Mercator projection, and it stays invertible with
 * two lines of arithmetic, which the pan/zoom handling relies on.
 */
export function makeProjection(bbox, width, height, pad = 12) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const lat0 = (minLat + maxLat) / 2;
  const kx = Math.cos((lat0 * Math.PI) / 180);

  const spanX = (maxLon - minLon) * kx;
  const spanY = maxLat - minLat;
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);

  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  const project = (lon, lat) => [
    offsetX + (lon - minLon) * kx * scale,
    offsetY + (maxLat - lat) * scale,
  ];

  const invert = (x, y) => [
    minLon + (x - offsetX) / (kx * scale),
    maxLat - (y - offsetY) / scale,
  ];

  /** Kilometres per projected unit, for drawing true-distance rings. */
  const kmToUnits = (km) => (km / 111.195) * scale;

  return { project, invert, scale, kmToUnits, lat0 };
}

export const ringToPath = (ring, project) => {
  let d = '';
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = project(ring[i][0], ring[i][1]);
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
};

export const polygonPath = (rings, project) => rings.map((r) => `${ringToPath(r, project)}Z`).join('');

export const lineStringPath = (lines, project) => lines.map((l) => ringToPath(l, project)).join('');

const R_EARTH = 6371;
const toRad = (d) => (d * Math.PI) / 180;

export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(a));
}

/** Straight-line distance to the hypocentre, which is what shaking scales with. */
export function hypocentralKm(lat1, lon1, lat2, lon2, depthKm) {
  const surface = haversineKm(lat1, lon1, lat2, lon2);
  return Math.sqrt(surface * surface + depthKm * depthKm);
}

/** A five-pointed star, used for the epicentre marker. */
export function starPath(cx, cy, outer, inner) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
}

export function expandBbox([minLon, minLat, maxLon, maxLat], marginDeg) {
  return [minLon - marginDeg, minLat - marginDeg, maxLon + marginDeg, maxLat + marginDeg];
}
