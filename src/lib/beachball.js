/**
 * Focal mechanism ("beachball") rendering from a moment tensor.
 *
 * The tensor comes from USGS in spherical coordinates (r = up, theta = south,
 * phi = east). For a ray leaving the source in direction l, the far-field
 * P-wave radial amplitude is u = l . M . l. Shading the lower focal hemisphere
 * by sign(u) gives the familiar diagram: dark quadrants radiate compression
 * outward and contain the tension (T) axis.
 *
 * Projection is equal-angle (Wulff), lower hemisphere: a ray with plunge p
 * measured down from horizontal plots at radius tan((90 - p) / 2), so a
 * vertical ray sits at the centre and a horizontal ray on the rim.
 */

const D2R = Math.PI / 180;

/** Radial P-wave amplitude for a unit direction given in (r, theta, phi). */
export function radialAmplitude(t, lr, lt, lp) {
  return (
    t['tensor-mrr'] * lr * lr +
    t['tensor-mtt'] * lt * lt +
    t['tensor-mpp'] * lp * lp +
    2 * (t['tensor-mrt'] * lr * lt + t['tensor-mrp'] * lr * lp + t['tensor-mtp'] * lt * lp)
  );
}

/**
 * Unit direction, in the tensor's (r, theta, phi) basis, of a downgoing ray
 * with the given azimuth (clockwise from north) and plunge (down from horizontal).
 */
export function rayToSpherical(azimuthDeg, plungeDeg) {
  const az = azimuthDeg * D2R;
  const pl = plungeDeg * D2R;
  const north = Math.cos(pl) * Math.cos(az);
  const east = Math.cos(pl) * Math.sin(az);
  const down = Math.sin(pl);
  // r points up, theta points south.
  return [-down, -north, east];
}

/** Position of an (azimuth, plunge) direction on a unit-radius plot. */
export function projectAxis(azimuthDeg, plungeDeg) {
  const r = Math.tan((90 - plungeDeg) * 0.5 * D2R);
  const az = azimuthDeg * D2R;
  return [r * Math.sin(az), r * Math.cos(az)]; // x east, y north
}

/**
 * Paints the mechanism into a canvas by sampling the amplitude sign.
 *
 * Sampling per pixel rather than deriving the nodal curves analytically keeps
 * this correct for any tensor, including the non-double-couple component
 * (this event is 87% double couple, so the quadrants are close to but not
 * exactly great circles).
 */
export function drawBeachball(canvas, tensor, options = {}) {
  const {
    size = 200,
    dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
    fill = '#ff5252',
    empty = '#0e141d',
    rim = '#e8eef6',
  } = options;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const px = size * dpr;
  const c = px / 2;
  const radius = c - 1.5 * dpr;
  const img = ctx.createImageData(px, px);
  const data = img.data;

  const rgb = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [fr, fg, fb] = rgb(fill);
  const [er, eg, eb] = rgb(empty);

  for (let j = 0; j < px; j++) {
    for (let i = 0; i < px; i++) {
      const x = (i + 0.5 - c) / radius; // east
      const y = (c - (j + 0.5)) / radius; // north
      const r = Math.hypot(x, y);
      const idx = (j * px + i) * 4;
      if (r > 1) continue; // leave transparent outside the focal sphere

      const plunge = 90 - 2 * (Math.atan(r) / D2R);
      const azimuth = (Math.atan2(x, y) / D2R + 360) % 360;
      const [lr, lt, lp] = rayToSpherical(azimuth, plunge);
      const u = radialAmplitude(tensor, lr, lt, lp);

      const compressional = u >= 0;
      data[idx] = compressional ? fr : er;
      data[idx + 1] = compressional ? fg : eg;
      data[idx + 2] = compressional ? fb : eb;
      // Feather the rim so the circle does not alias badly.
      data[idx + 3] = r > 0.985 ? Math.round(255 * ((1 - r) / 0.015)) : 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  ctx.strokeStyle = rim;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 1.25 * dpr;
  ctx.beginPath();
  ctx.arc(c, c, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * Where the principal axes land on the plot, in fractions of the radius from
 * the centre, so they can be positioned with SVG/DOM on top of the canvas.
 */
export function axisMarkers(axes) {
  return Object.entries(axes).map(([key, a]) => {
    const [x, y] = projectAxis(a.azimuth, a.plunge);
    return { key: key.toUpperCase(), x, y, ...a };
  });
}

/**
 * Plain-language slip description for one nodal plane.
 *
 * Classified on the rake: pure strike-slip has slip along the fault trace
 * (rake near 0 or 180), pure dip-slip has it up or down the dip (rake near
 * +/-90). Anything between is oblique, which is what both planes are here.
 */
export function faultingStyle(rake) {
  const r = ((((rake % 360) + 360) % 360) + 180) % 360 - 180; // fold to (-180, 180]
  const a = Math.abs(r);
  const vertical = r > 0 ? 'reverse' : 'normal';
  if (a <= 30 || a >= 150) return 'strike-slip';
  if (a >= 70 && a <= 110) return vertical;
  return `oblique strike-slip (${vertical} component)`;
}
