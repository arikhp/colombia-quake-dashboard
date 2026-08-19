import React, { useCallback, useMemo, useRef, useState } from 'react';
import { makeProjection, polygonPath, lineStringPath, starPath, haversineKm } from '../lib/geo.js';
import { compact, int, mmiColor, roman, MMI_LABELS, MMI_SCALE, slug, dec, cot } from '../lib/format.js';

/**
 * Frame and bounding box are matched in aspect ratio so the projection does not
 * letterbox: at 900x720 with these bounds, less than 7% of the width is off-map.
 * The bounds cover the ShakeMap footprint plus every city that reported damage.
 */
const VIEW_W = 900;
const VIEW_H = 720;
const BBOX = [-79.0, 2.2, -72.8, 7.7];

const CALI = { lat: 3.4372, lon: -76.5225 };

const PRESETS = {
  region: { label: 'Affected region', center: [-76.2, 4.9], zoom: 1 },
  cali: { label: 'Cali', center: [CALI.lon, CALI.lat], zoom: 4 },
  epicenter: { label: 'Epicentre', center: [-76.2422, 4.8436], zoom: 3.4 },
  corridor: { label: 'Cali–Pereira corridor', center: [-76.1, 4.15], zoom: 2.3 },
};

export default function QuakeMap({ data, impact, height = VIEW_H }) {
  const { event, cities, mmiContours, departments, sequence } = data;

  const [layers, setLayers] = useState({
    contours: true,
    choropleth: true,
    cities: true,
    aftershocks: true,
    rings: true,
  });
  const [view, setView] = useState(PRESETS.region);
  const [hover, setHover] = useState(null);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef(null);
  const dragState = useRef(null);

  const proj = useMemo(() => makeProjection(BBOX, VIEW_W, VIEW_H, 10), []);

  const viewBox = useMemo(() => {
    const [cx, cy] = proj.project(view.center[0], view.center[1]);
    const w = VIEW_W / view.zoom;
    const h = VIEW_H / view.zoom;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }, [proj, view]);

  /** Keep strokes and glyphs a constant on-screen size while zooming. */
  const k = 1 / view.zoom;

  /**
   * Shade by the highest death figure reported at either department or city level:
   * Cali's official count is more recent than, and higher than, the last published
   * total for the department containing it.
   */
  const deathsByDept = useMemo(() => {
    const m = new Map();
    for (const d of impact.byDepartment) {
      const cityTotal = d.cities.reduce((a, c) => a + (c.deaths || 0), 0);
      m.set(slug(d.department), { ...d, shadeDeaths: Math.max(d.deaths || 0, cityTotal) });
    }
    return m;
  }, [impact]);

  const maxDeaths = useMemo(
    () => Math.max(...[...deathsByDept.values()].map((d) => d.shadeDeaths)),
    [deathsByDept]
  );

  const epicentre = proj.project(event.lon, event.lat);

  const toggle = (key) => setLayers((s) => ({ ...s, [key]: !s[key] }));

  const clientToUser = useCallback((clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.w,
      y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.h,
    };
  }, [viewBox]);

  const onPointerDown = (e) => {
    dragState.current = { x: e.clientX, y: e.clientY, center: view.center };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragState.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragState.current.x) / rect.width) * viewBox.w;
    const dy = ((e.clientY - dragState.current.y) / rect.height) * viewBox.h;
    const [cx, cy] = proj.project(dragState.current.center[0], dragState.current.center[1]);
    const [lon, lat] = proj.invert(cx - dx, cy - dy);
    setView((v) => ({ ...v, label: 'Custom view', center: [lon, lat] }));
  };

  const onPointerUp = () => {
    dragState.current = null;
    setDragging(false);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
    setView((v) => ({ ...v, label: 'Custom view', zoom: Math.min(14, Math.max(0.85, v.zoom * factor)) }));
  };

  const visibleCities = useMemo(() => {
    // At low zoom, drawing 120 labels is noise; show the significant ones.
    const minPop = view.zoom > 2.5 ? 0 : view.zoom > 1.5 ? 60000 : 130000;
    return cities.filter((c) => c.pop >= minPop || c.mmi >= 7.5);
  }, [cities, view.zoom]);

  const tip = hover && (
    <div className="map-tip" style={{ left: hover.px, top: hover.py }}>
      <div className="t-name">{hover.title}</div>
      {hover.rows.map(([label, value]) => (
        <div className="t-row" key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
      {hover.note && <div style={{ color: 'var(--dim)', marginTop: 4, fontSize: 11.5 }}>{hover.note}</div>}
    </div>
  );

  const showTip = (e, payload) => {
    const rect = svgRef.current.getBoundingClientRect();
    setHover({ ...payload, px: e.clientX - rect.left, py: e.clientY - rect.top });
  };

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 10 }}>
        <span className="lbl">View</span>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            type="button"
            className={`btn sm ${view.label === p.label ? 'on' : ''}`}
            onClick={() => setView(p)}
          >
            {p.label}
          </button>
        ))}
        <span className="sep" />
        <span className="lbl">Layers</span>
        {[
          ['contours', 'Intensity contours'],
          ['choropleth', 'Deaths by dept.'],
          ['cities', 'Cities'],
          ['aftershocks', 'Aftershocks'],
          ['rings', 'Distance rings'],
        ].map(([key, label]) => (
          <button key={key} type="button" className={`btn sm ${layers[key] ? 'on' : ''}`} onClick={() => toggle(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="map-frame" style={{ aspectRatio: `${VIEW_W} / ${height}` }}>
        {tip}
        <svg
          ref={svgRef}
          className={dragging ? 'dragging' : ''}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => {
            onPointerUp();
            setHover(null);
          }}
          onWheel={onWheel}
          role="img"
          aria-label="Map of shaking intensity and impact"
        >
          <defs>
            <radialGradient id="epiGlow">
              <stop offset="0%" stopColor="#ff5252" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ff5252" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Neutral backdrop: anything not covered by a department polygon is
              simply outside the mapped data, whether ocean or another country. */}
          <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="#080c12" />

          {/* Departments */}
          <g>
            {departments.map((d) => {
              const hit = deathsByDept.get(slug(d.name));
              // Small base so a department with a single death does not read as
              // heavily affected, and the two worst-hit ones stand out.
              const shade = hit && layers.choropleth ? 0.05 + 0.62 * (hit.shadeDeaths / maxDeaths) : 0;
              return (
                <path
                  key={d.id}
                  d={polygonPath(d.rings, proj.project)}
                  fill={shade ? `rgba(255, 82, 82, ${shade.toFixed(3)})` : '#141c27'}
                  stroke="#2b3a4d"
                  strokeWidth={0.7 * k}
                  onPointerMove={(e) =>
                    showTip(e, {
                      title: d.name,
                      rows: hit
                        ? [
                            ['Deaths', hit.shadeDeaths > hit.deaths ? `≥ ${int(hit.shadeDeaths)}` : int(hit.deaths)],
                            ['Injured', hit.injured ? int(hit.injured) : 'not reported'],
                          ]
                        : [['Reported deaths', 'none reported']],
                      note: hit?.note,
                    })
                  }
                />
              );
            })}
          </g>

          {/* ShakeMap intensity contours */}
          {layers.contours && (
            <g fill="none" strokeLinejoin="round">
              {mmiContours.map((c) => (
                <path
                  key={c.value}
                  d={lineStringPath(c.lines, proj.project)}
                  stroke={mmiColor(c.value)}
                  strokeWidth={(c.value >= 7 ? 1.9 : 1.2) * k}
                  opacity={c.value >= 6 ? 0.95 : 0.5}
                />
              ))}
            </g>
          )}

          {/* True-distance rings from the epicentre */}
          {layers.rings && (
            <g fill="none" stroke="#8fa3b8" strokeDasharray={`${4 * k} ${5 * k}`} opacity="0.3">
              {[100, 200, 300].map((km) => (
                <g key={km}>
                  <circle cx={epicentre[0]} cy={epicentre[1]} r={proj.kmToUnits(km)} strokeWidth={0.8 * k} />
                  <text
                    x={epicentre[0]}
                    y={epicentre[1] - proj.kmToUnits(km) - 3 * k}
                    fill="#8fa3b8"
                    fontSize={9 * k}
                    textAnchor="middle"
                    stroke="none"
                    opacity="0.8"
                  >
                    {km} km
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Catalogued aftershocks */}
          {layers.aftershocks && (
            <g>
              {sequence
                .filter((s) => s.mag < 7)
                .map((s) => {
                  const [x, y] = proj.project(s.lon, s.lat);
                  return (
                    <circle
                      key={s.id}
                      cx={x}
                      cy={y}
                      r={(3 + (s.mag - 4) * 3) * k}
                      fill="rgba(255,138,61,0.18)"
                      stroke="#ff8a3d"
                      strokeWidth={1.3 * k}
                      onPointerMove={(e) =>
                        showTip(e, {
                          title: `M${s.mag.toFixed(1)} aftershock`,
                          rows: [
                            ['Time', cot(s.time)],
                            ['Depth', `${dec(s.depth)} km`],
                            ['From mainshock', `${s.distanceFromMainshock} km`],
                          ],
                          note: s.place,
                        })
                      }
                    />
                  );
                })}
            </g>
          )}

          {/* Cities, sized by population and coloured by modelled intensity */}
          {layers.cities && (
            <g>
              {visibleCities.map((c) => {
                const [x, y] = proj.project(c.lon, c.lat);
                // Compressed power scale: Bogotá is 200x Ulloa by population but
                // only ~3x by radius, which keeps small towns visible.
                const r = (1.7 + 2.4 * (c.pop / 1e6) ** 0.35) * k;
                const isCali = c.name === 'Cali';
                const label = view.zoom > 1.4 ? c.pop > 90000 || isCali : c.pop > 380000;
                return (
                  <g key={c.name}>
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={mmiColor(c.mmi)}
                      fillOpacity="0.82"
                      stroke={isCali ? '#ffffff' : '#0a0e13'}
                      strokeWidth={(isCali ? 1.6 : 0.9) * k}
                      onPointerMove={(e) =>
                        showTip(e, {
                          title: c.name,
                          rows: [
                            ['Population', int(c.pop)],
                            ['Modelled intensity', `${roman(c.mmi)} · ${MMI_LABELS[Math.round(c.mmi)]}`],
                            ['MMI value', dec(c.mmi, 2)],
                            ['From epicentre', `${Math.round(haversineKm(event.lat, event.lon, c.lat, c.lon))} km`],
                          ],
                        })
                      }
                    />
                    {label && (
                      <text
                        x={x + r + 3 * k}
                        y={y + 3 * k}
                        fontSize={(isCali ? 12 : 10) * k}
                        fill={isCali ? '#ffffff' : '#c6d4e2'}
                        fontWeight={isCali ? 700 : 500}
                        stroke="#070b10"
                        strokeWidth={2.6 * k}
                        paintOrder="stroke"
                        style={{ pointerEvents: 'none' }}
                      >
                        {c.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Epicentre */}
          <g style={{ pointerEvents: 'none' }}>
            <circle cx={epicentre[0]} cy={epicentre[1]} r={40 * k} fill="url(#epiGlow)" />
            <path
              d={starPath(epicentre[0], epicentre[1], 11 * k, 4.6 * k)}
              fill="#ff5252"
              stroke="#ffffff"
              strokeWidth={1.1 * k}
            />
            <text
              x={epicentre[0] + 15 * k}
              y={epicentre[1] - 6 * k}
              fontSize={11.5 * k}
              fill="#ffb3b3"
              fontWeight="700"
              stroke="#070b10"
              strokeWidth={2.8 * k}
              paintOrder="stroke"
            >
              M{event.magnitude} epicentre
            </text>
            <text
              x={epicentre[0] + 15 * k}
              y={epicentre[1] + 6 * k}
              fontSize={9.5 * k}
              fill="#8fa3b8"
              stroke="#070b10"
              strokeWidth={2.6 * k}
              paintOrder="stroke"
            >
              {event.depth} km deep
            </text>
          </g>
        </svg>
      </div>

      <div className="legend">
        <span className="legend-item" style={{ marginRight: 2 }}>
          Shaking intensity (MMI)
        </span>
        <span className="legend-scale">
          {MMI_SCALE.filter(([v]) => v >= 3).map(([v, color]) => (
            <span
              className="sw"
              key={v}
              style={{ background: color, color: v >= 9 ? '#fff' : '#0a0e13' }}
              title={`${roman(v)} — ${MMI_LABELS[v]}`}
            >
              {roman(v)}
            </span>
          ))}
        </span>
        <span className="legend-item">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d={starPath(7, 7, 6.5, 2.8)} fill="#ff5252" stroke="#fff" strokeWidth="0.7" />
          </svg>
          Epicentre
        </span>
        <span className="legend-item">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="5" fill="rgba(255,138,61,0.2)" stroke="#ff8a3d" strokeWidth="1.4" />
          </svg>
          Catalogued aftershock
        </span>
        <span className="legend-item">
          <svg width="26" height="14" viewBox="0 0 26 14">
            <rect x="1" y="4" width="24" height="6" fill="rgba(255,82,82,0.7)" rx="1" />
          </svg>
          Deeper red = more deaths
        </span>
        <span className="legend-item" style={{ color: 'var(--dim)' }}>
          Drag to pan, scroll to zoom
        </span>
      </div>
    </div>
  );
}
