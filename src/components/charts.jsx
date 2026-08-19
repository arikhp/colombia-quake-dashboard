import React from 'react';
import { compact, int, mmiColor, roman, pct, usd, dayLabel } from '../lib/format.js';

/* ---------------------------------------------------------------------------
   Horizontal bar list (DOM, not SVG: labels wrap and align reliably)
   --------------------------------------------------------------------------- */
/**
 * @param scale 'linear' or 'log'. Log is for lists spanning orders of magnitude
 *   (aid pledges run from US$115k to US$450m) where linear hides everything small.
 */
export function BarList({ items, format = int, color = 'var(--accent)', max, scale = 'linear' }) {
  const values = items.map((d) => d.value).filter((v) => v > 0);
  const peak = max ?? Math.max(...values, 1);
  const floor = Math.min(...values, peak);

  const fraction = (v) => {
    if (v <= 0) return 0;
    if (scale === 'log' && peak > floor) {
      return Math.log(v / floor) / Math.log(peak / floor);
    }
    return v / peak;
  };

  return (
    <div className="bars">
      {items.map((d) => (
        <div className="bar-row" key={d.label} title={d.note || `${d.label}: ${format(d.value)}`}>
          <span className="bar-label">{d.label}</span>
          <span className="bar-track">
            <span
              className="bar-fill"
              style={{
                width: `${Math.max(2, fraction(d.value) * 100)}%`,
                background: d.color || color,
              }}
            />
          </span>
          <span className="bar-value">{format(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Population exposed to each shaking intensity
   --------------------------------------------------------------------------- */
export function MmiExposureChart({ data, height = 230 }) {
  const rows = data.filter((d) => d.population > 0);
  const W = 560;
  const H = height;
  const m = { top: 22, right: 8, bottom: 42, left: 52 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;
  const peak = Math.max(...rows.map((d) => d.population));
  const bw = iw / rows.length;
  const ticks = [0, peak / 2, peak];

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Population exposed by shaking intensity">
        {ticks.map((t, i) => {
          const y = m.top + ih - (t / peak) * ih;
          return (
            <g key={i}>
              <line className="grid-line" x1={m.left} x2={m.left + iw} y1={y} y2={y} />
              <text className="val" x={m.left - 8} y={y + 3.5} textAnchor="end" fontSize="10.5">
                {compact(t)}
              </text>
            </g>
          );
        })}
        {rows.map((d, i) => {
          const h = (d.population / peak) * ih;
          const x = m.left + i * bw + bw * 0.16;
          const w = bw * 0.68;
          const y = m.top + ih - h;
          return (
            <g key={d.mmi}>
              <rect className="bar" x={x} y={y} width={w} height={Math.max(h, 1)} fill={mmiColor(d.mmi)} rx="2" />
              <text className="val" x={x + w / 2} y={y - 6} textAnchor="middle" fontSize="10.5" fill="var(--text)">
                {compact(d.population)}
              </text>
              <text x={x + w / 2} y={m.top + ih + 15} textAnchor="middle" fontSize="11" fontWeight="700" fill={mmiColor(d.mmi)}>
                {roman(d.mmi)}
              </text>
              <text x={x + w / 2} y={m.top + ih + 30} textAnchor="middle" fontSize="9.5" fill="var(--dim)">
                {usd(d.economic).replace('US$', '$')}
              </text>
            </g>
          );
        })}
        <line className="axis-line" x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} />
        <text x={m.left} y={12} fontSize="10" fill="var(--dim)" letterSpacing="0.08em">
          PEOPLE EXPOSED
        </text>
        <text x={m.left + iw} y={H - 3} fontSize="9.5" fill="var(--dim)" textAnchor="end">
          bottom row: capital stock exposed
        </text>
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   PAGER alert probability distribution
   --------------------------------------------------------------------------- */
export function ProbabilityBins({ bins, unitLabel, height = 200 }) {
  const W = 480;
  const H = height;
  const m = { top: 20, right: 8, bottom: 38, left: 34 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;
  const peak = Math.max(...bins.map((b) => b.probability));
  const bw = iw / bins.length;
  const tone = { green: '#3ddc97', yellow: '#ffd23f', orange: '#ff8a3d', red: '#ff5252' };

  const binLabel = (b) => `${compact(Number(b.min))}–${compact(Number(b.max))}`;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Probability distribution of ${unitLabel}`}>
        {[0, 0.5, 1].map((f) => {
          const y = m.top + ih - f * ih;
          return (
            <g key={f}>
              <line className="grid-line" x1={m.left} x2={m.left + iw} y1={y} y2={y} />
              <text className="val" x={m.left - 7} y={y + 3.5} textAnchor="end" fontSize="10">
                {Math.round(f * peak * 100)}%
              </text>
            </g>
          );
        })}
        {bins.map((b, i) => {
          const h = (b.probability / peak) * ih;
          const x = m.left + i * bw + bw * 0.18;
          const w = bw * 0.64;
          const y = m.top + ih - h;
          return (
            <g key={i}>
              <rect className="bar" x={x} y={y} width={w} height={Math.max(h, 1)} fill={tone[b.color]} rx="2" />
              <text className="val" x={x + w / 2} y={y - 5} textAnchor="middle" fontSize="10" fill="var(--text)">
                {pct(b.probability, 0)}
              </text>
              <text x={x + w / 2} y={m.top + ih + 14} textAnchor="middle" fontSize="9.5" fill="var(--dim)">
                {binLabel(b)}
              </text>
            </g>
          );
        })}
        <line className="axis-line" x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} />
        <text x={m.left} y={11} fontSize="10" fill="var(--dim)" letterSpacing="0.08em">
          {unitLabel.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Reported death toll over time
   --------------------------------------------------------------------------- */
export function TollChart({ points, height = 240 }) {
  const W = 620;
  const H = height;
  const m = { top: 20, right: 14, bottom: 40, left: 44 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;

  const t0 = new Date(points[0].time).getTime();
  const t1 = new Date(points[points.length - 1].time).getTime();
  const peak = Math.max(...points.map((p) => p.deaths));
  const yMax = Math.ceil(peak / 50) * 50;

  const px = (p) => m.left + ((new Date(p.time).getTime() - t0) / (t1 - t0)) * iw;
  const py = (p) => m.top + ih - (p.deaths / yMax) * ih;

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${px(p).toFixed(1)} ${py(p).toFixed(1)}`).join('');
  const area = `${path}L${px(points[points.length - 1]).toFixed(1)} ${m.top + ih}L${m.left} ${m.top + ih}Z`;

  const dayTicks = [];
  for (let d = 10; d <= 18; d += 2) dayTicks.push(new Date(Date.UTC(2026, 7, d)).getTime());

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Reported death toll over time">
        <defs>
          <linearGradient id="tollFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5252" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ff5252" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = m.top + ih - f * ih;
          return (
            <g key={f}>
              <line className="grid-line" x1={m.left} x2={m.left + iw} y1={y} y2={y} />
              <text className="val" x={m.left - 7} y={y + 3.5} textAnchor="end" fontSize="10">
                {Math.round(f * yMax)}
              </text>
            </g>
          );
        })}
        {dayTicks.map((t) => {
          const x = m.left + ((t - t0) / (t1 - t0)) * iw;
          return (
            <text key={t} x={x} y={m.top + ih + 16} textAnchor="middle" fontSize="10" fill="var(--dim)">
              {dayLabel(new Date(t).toISOString())}
            </text>
          );
        })}
        <path d={area} fill="url(#tollFill)" />
        <path d={path} fill="none" stroke="#ff5252" strokeWidth="1.8" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={px(p)} cy={py(p)} r="3" fill="#0a0e13" stroke="#ff5252" strokeWidth="1.6" />
            <title>{`${p.label} — ${p.deaths} dead (${p.source})`}</title>
          </g>
        ))}
        {/* Call out the one downward revision: it is the point of the chart. */}
        {(() => {
          const dip = points.findIndex((p, i) => i > 0 && p.deaths < points[i - 1].deaths);
          if (dip < 0) return null;
          const p = points[dip];
          return (
            <g>
              <line
                x1={px(p)}
                y1={py(p) + 8}
                x2={px(p)}
                y2={m.top + ih - 8}
                stroke="var(--amber)"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
              <text x={px(p)} y={m.top + ih - 12} fontSize="10" fill="var(--amber)" textAnchor="middle">
                revised down
              </text>
            </g>
          );
        })()}
        <line className="axis-line" x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} />
        <text x={m.left} y={11} fontSize="10" fill="var(--dim)" letterSpacing="0.08em">
          REPORTED DEATHS
        </text>
        <text x={m.left + iw} y={H - 4} fontSize="9.5" fill="var(--dim)" textAnchor="end">
          hover a point for the reporting source
        </text>
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Depth cross-section of the sequence
   --------------------------------------------------------------------------- */
/** Pick a round tick step that yields roughly four to six labels. */
function niceTicks(max, target = 5) {
  const raw = max / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw) ?? 10 * mag;
  const ticks = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

export function DepthSection({ events, height = 260 }) {
  const W = 560;
  const H = height;
  const m = { top: 22, right: 16, bottom: 38, left: 46 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;

  // The aftershocks cluster tightly, so the axis adapts rather than using a fixed
  // regional span that would squash everything against the left edge.
  const maxDist = Math.max(Math.max(...events.map((e) => e.distanceFromMainshock)) * 1.35, 25);
  const maxDepth = Math.ceil(Math.max(...events.map((e) => e.depth)) / 25) * 25 + 15;
  const depthTicks = niceTicks(maxDepth, 4).filter((t) => t <= maxDepth);
  const distTicks = niceTicks(maxDist, 5).filter((t) => t <= maxDist);

  const px = (d) => m.left + (d / maxDist) * iw;
  const py = (z) => m.top + (z / maxDepth) * ih;
  const rOf = (mag) => 2.2 + (mag - 3.5) * 2.6;

  // Intermediate-depth earthquakes are conventionally 70-300 km.
  const bandTop = py(70);
  const bandBottom = Math.min(py(300), m.top + ih);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Depth cross-section of the earthquake sequence">
        <rect x={m.left} y={bandTop} width={iw} height={Math.max(0, bandBottom - bandTop)} fill="rgba(86,168,255,0.06)" />
        <text x={m.left + iw - 4} y={bandTop + 12} fontSize="9.5" fill="var(--blue)" textAnchor="end">
          intermediate depth (70–300 km)
        </text>
        {depthTicks.map((z) => (
          <g key={z}>
            <line className="grid-line" x1={m.left} x2={m.left + iw} y1={py(z)} y2={py(z)} />
            <text className="val" x={m.left - 7} y={py(z) + 3.5} textAnchor="end" fontSize="10">
              {z}
            </text>
          </g>
        ))}
        {distTicks.map((d) => (
          <text key={d} x={px(d)} y={m.top + ih + 16} textAnchor="middle" fontSize="10" fill="var(--dim)">
            {d}
          </text>
        ))}
        {events.map((e) => {
          const main = e.mag >= 7;
          return (
            <g key={e.id}>
              <circle
                cx={px(e.distanceFromMainshock)}
                cy={py(e.depth)}
                r={rOf(e.mag)}
                fill={main ? 'rgba(255,82,82,0.85)' : 'rgba(255,138,61,0.28)'}
                stroke={main ? '#ff5252' : '#ff8a3d'}
                strokeWidth="1.4"
              />
              <text
                x={px(e.distanceFromMainshock) + rOf(e.mag) + 5}
                y={py(e.depth) + 3.5}
                fontSize="10"
                className="val"
                fill={main ? 'var(--red)' : 'var(--muted)'}
              >
                M{e.mag.toFixed(1)}
              </text>
            </g>
          );
        })}
        <line className="axis-line" x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} />
        <line className="axis-line" x1={m.left} x2={m.left} y1={m.top} y2={m.top + ih} />
        <text x={m.left} y={12} fontSize="10" fill="var(--dim)" letterSpacing="0.08em">
          DEPTH (km)
        </text>
        <text x={m.left + iw} y={H - 4} fontSize="9.5" fill="var(--dim)" textAnchor="end">
          distance from mainshock epicentre (km)
        </text>
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Damage cost estimates, log scale, because they span 40x
   --------------------------------------------------------------------------- */
export function CostRangeChart({ items, height = 210 }) {
  const W = 600;
  const H = height;
  const m = { top: 18, right: 74, bottom: 34, left: 150 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;

  const lo = 5e8;
  const hi = 5e10;
  const x = (v) => m.left + ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * iw;
  const rowH = ih / items.length;
  const tone = { official: '#56a8ff', model: '#ff8a3d', private: '#a78bfa' };
  const ticks = [1e9, 5e9, 1e10, 5e10];

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Damage cost estimates by source">
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={x(t)} x2={x(t)} y1={m.top} y2={m.top + ih} />
            <text x={x(t)} y={m.top + ih + 16} textAnchor="middle" fontSize="10" fill="var(--dim)" className="val">
              {usd(t)}
            </text>
          </g>
        ))}
        {items.map((d, i) => {
          const cy = m.top + rowH * (i + 0.5);
          const isRange = d.highUSD > d.lowUSD;
          const c = tone[d.kind] || 'var(--muted)';
          return (
            <g key={d.source}>
              <text x={m.left - 10} y={cy + 3.5} textAnchor="end" fontSize="11.5" fill="var(--text)">
                {d.source}
              </text>
              {isRange ? (
                <>
                  <line x1={x(d.lowUSD)} x2={x(d.highUSD)} y1={cy} y2={cy} stroke={c} strokeWidth="7" strokeLinecap="round" opacity="0.55" />
                  <circle cx={x(d.lowUSD)} cy={cy} r="3.4" fill={c} />
                  <circle cx={x(d.highUSD)} cy={cy} r="3.4" fill={c} />
                </>
              ) : (
                <circle cx={x(d.lowUSD)} cy={cy} r="5" fill={c} />
              )}
              <text x={x(d.highUSD) + 12} y={cy + 3.5} fontSize="11" className="val" fill={c}>
                {isRange ? `${usd(d.lowUSD)}–${usd(d.highUSD)}` : usd(d.lowUSD)}
              </text>
              <title>{d.note}</title>
            </g>
          );
        })}
        <line className="axis-line" x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} />
        <text x={m.left + iw + 60} y={H - 4} fontSize="9.5" fill="var(--dim)" textAnchor="end">
          log scale
        </text>
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Historical comparison: magnitude vs deaths for nearby past events
   --------------------------------------------------------------------------- */
export function HistoricalChart({ events, current, height = 230 }) {
  const W = 520;
  const H = height;
  const m = { top: 24, right: 20, bottom: 40, left: 52 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;

  const all = [...events, current];
  const magLo = 5.8;
  const magHi = 7.6;
  const maxDeaths = Math.max(...all.map((e) => e.deaths)) * 1.15;

  const px = (mag) => m.left + ((mag - magLo) / (magHi - magLo)) * iw;
  const py = (d) => m.top + ih - (d / maxDeaths) * ih;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Magnitude versus deaths for nearby historical earthquakes">
        {[0, 500, 1000, 1500, 2000].filter((d) => d <= maxDeaths).map((d) => (
          <g key={d}>
            <line className="grid-line" x1={m.left} x2={m.left + iw} y1={py(d)} y2={py(d)} />
            <text className="val" x={m.left - 7} y={py(d) + 3.5} textAnchor="end" fontSize="10">
              {d}
            </text>
          </g>
        ))}
        {[6, 6.5, 7, 7.5].map((mg) => (
          <text key={mg} x={px(mg)} y={m.top + ih + 16} textAnchor="middle" fontSize="10" fill="var(--dim)" className="val">
            M{mg}
          </text>
        ))}
        {all.map((e, i) => {
          const isCurrent = e === current;
          return (
            <g key={i}>
              <circle
                cx={px(e.magnitude)}
                cy={py(e.deaths)}
                r={isCurrent ? 7 : 5}
                fill={isCurrent ? '#ff5252' : 'rgba(148,168,189,0.35)'}
                stroke={isCurrent ? '#ff5252' : 'var(--muted)'}
                strokeWidth="1.5"
              />
              <text
                x={px(e.magnitude)}
                y={py(e.deaths) - (isCurrent ? 13 : 11)}
                textAnchor="middle"
                fontSize="10"
                fill={isCurrent ? 'var(--red)' : 'var(--muted)'}
                fontWeight={isCurrent ? 700 : 400}
              >
                {e.label}
              </text>
              <title>{`${e.label}: M${e.magnitude}, ${int(e.deaths)} deaths, depth ${e.depth} km`}</title>
            </g>
          );
        })}
        <line className="axis-line" x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} />
        <text x={m.left} y={12} fontSize="10" fill="var(--dim)" letterSpacing="0.08em">
          DEATHS
        </text>
        <text x={m.left + iw} y={H - 4} fontSize="9.5" fill="var(--dim)" textAnchor="end">
          nearby events in the USGS PAGER catalogue
        </text>
      </svg>
    </div>
  );
}
