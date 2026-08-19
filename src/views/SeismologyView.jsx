import React from 'react';
import Beachball from '../components/Beachball.jsx';
import { Card, DefList, Table, Kpi, Callout } from '../components/ui.jsx';
import { DepthSection } from '../components/charts.jsx';
import { faultingStyle } from '../lib/beachball.js';
import { int, dec, cot, elapsed, roman, mmiColor } from '../lib/format.js';

export default function SeismologyView({ data, sequence, live, onRefresh }) {
  const { event, momentTensor: mt, finiteFault: ff, shakemap } = data;
  const mainshock = sequence.find((s) => s.mag >= 7) || sequence[0];
  const aftershocks = sequence.filter((s) => s !== mainshock && s.related);
  const unrelated = sequence.filter((s) => !s.related);
  const inSequence = sequence.filter((s) => s.related);

  return (
    <div className="view">
      <div className="grid g4">
        <Kpi label="Scalar moment" value={`${dec(mt.scalarMoment / 1e20, 2)}×10²⁰`} unit="N·m" foot={`Mww ${dec(mt.derivedMagnitude, 1)}`} edge="var(--red)" tone="red" />
        <Kpi label="Source duration" value={int(mt.duration)} unit="s" foot={`rise time ${dec(ff['average-rise-time'], 1)} s`} edge="var(--accent)" tone="accent" />
        <Kpi label="Peak slip" value={dec(ff['maximum-slip'], 1)} unit="m" foot={`over ${int(ff['model-length'])}×${int(ff['model-width'])} km`} edge="var(--amber)" tone="amber" />
        <Kpi label="Rupture velocity" value={dec(ff['average-rupture-velocity'], 2)} unit="km/s" foot="finite-fault inversion" edge="var(--blue)" tone="blue" />
      </div>

      <div className="grid g-3-2">
        <Card title="Focal mechanism" hint="drawn from the published moment tensor">
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Beachball momentTensor={mt} size={196} />
            <div style={{ flex: '1 1 260px', minWidth: 240 }}>
              <DefList
                rows={[
                  ['Nodal plane 1', `strike ${dec(mt.nodalPlanes[0].strike, 0)}° · dip ${dec(mt.nodalPlanes[0].dip, 0)}° · rake ${dec(mt.nodalPlanes[0].rake, 0)}°`],
                  ['', faultingStyle(mt.nodalPlanes[0].rake)],
                  ['Nodal plane 2', `strike ${dec(mt.nodalPlanes[1].strike, 0)}° · dip ${dec(mt.nodalPlanes[1].dip, 0)}° · rake ${dec(mt.nodalPlanes[1].rake, 0)}°`],
                  ['', faultingStyle(mt.nodalPlanes[1].rake)],
                  ['P axis (compression)', `${dec(mt.axes.p.azimuth, 0)}° az · ${dec(mt.axes.p.plunge, 0)}° plunge`],
                  ['T axis (tension)', `${dec(mt.axes.t.azimuth, 0)}° az · ${dec(mt.axes.t.plunge, 0)}° plunge`],
                  ['Double-couple component', `${dec(mt.percentDoubleCouple * 100, 0)}%`],
                  ['Centroid depth', `${dec(mt.derivedDepth, 1)} km`],
                ]}
              />
            </div>
          </div>
          <div className="note">
            The diagram is computed here from the six tensor components, not copied as an image: each point of the
            lower focal hemisphere is shaded by the sign of the radial P-wave amplitude <span className="mono">l·M·l</span>.
            Shaded quadrants radiate compression and contain the T axis. Both nodal planes are steep, so this was
            near-vertical faulting inside the slab — either a northeast-trending left-lateral or a
            northwest-trending right-lateral fault; a moment tensor alone cannot tell you which.
          </div>
        </Card>

        <Card title="Why a deep earthquake did widespread damage">
          <div className="prose">
            <p>
              At <strong>{dec(event.depth, 0)} km</strong> this was an <strong>intermediate-depth</strong> event
              inside the subducting Nazca plate, not a shallow crustal rupture. That trade-off is well
              understood: the energy has to travel further to reach anyone, so peak shaking directly above is
              lower than a shallow event of the same size — but it also arrives over a much wider area, and it
              is richer in the longer periods that resonate with mid-rise buildings.
            </p>
            <p>
              The consequence is visible in the damage map. Peak ground acceleration was{' '}
              <strong>{dec(shakemap.maxPGA * 100, 1)}% g</strong>, and the strongest recorded value came from
              Jamundí, roughly 200 km from the epicentre near Cali — not from the epicentral area. Spectral
              acceleration peaked at {dec(shakemap.psa['0.3s'], 2)} g at 0.3 s and{' '}
              {dec(shakemap.psa['1.0s'], 2)} g at 1.0 s, the band that loads exactly the kind of mid-rise
              concrete frames that failed in Cali and Pereira.
            </p>
          </div>
          <div className="note">
            The same patch of slab produced a Mw 7.2 at 108 km depth in November 1979, which was assigned
            intensity VII–VIII across Pereira, Armenia and Manizales — the same cities damaged this time.
          </div>
        </Card>
      </div>

      <div className="grid g2">
        <Card title="Sequence in depth and distance" hint="mainshock plus catalogued aftershocks">
          <DepthSection events={inSequence} />
          <div className="note">
            Only {inSequence.length} events in this sequence are large enough for the global USGS catalogue, and
            all of them sit in the same depth range as the mainshock — inside the slab, not in the overlying
            crust. The Colombian Geological Survey reported <strong>more than 100 aftershocks</strong>, the
            largest an mb 5.0 at 08:18 COT, 44 minutes after the mainshock.
          </div>
        </Card>

        <Card title="Rupture model" hint="USGS finite-fault inversion">
          <DefList
            rows={[
              ['Fault dimensions', `${int(ff['model-length'])} km long × ${int(ff['model-width'])} km wide`],
              ['Top of rupture', `${dec(ff['model-top'], 1)} km depth`],
              ['Strike / dip / rake', `${dec(ff['model-strike'], 0)}° / ${dec(ff['model-dip'], 0)}° / ${dec(ff['model-rake'], 0)}°`],
              ['Maximum slip', `${dec(ff['maximum-slip'], 2)} m`],
              ['Average rise time', `${dec(ff['average-rise-time'], 1)} s`],
              ['Rupture velocity', `${dec(ff['average-rupture-velocity'], 2)} km/s`],
              ['Derived magnitude', `Mw ${dec(ff['derived-magnitude'], 2)}`],
              ['Waveforms inverted', `${ff.waveforms.p} P · ${ff.waveforms.sh} SH · ${ff.waveforms.long} long-period`],
            ]}
          />
          <div className="note">{ff.crustalModel}</div>
        </Card>
      </div>

      <Card
        title="Catalogued events"
        hint={live.message}
      >
        <div className="toolbar" style={{ marginBottom: 10 }}>
          <span className={`live ${live.status === 'error' ? 'error' : live.status === 'live' ? '' : 'stale'}`}>
            <span className="beacon" />
            {live.status === 'live' ? 'Live from USGS' : live.status === 'loading' ? 'Loading…' : live.status === 'error' ? 'Offline' : 'Bundled snapshot'}
          </span>
          <span className="sep" />
          <button type="button" className="btn sm" onClick={onRefresh} disabled={live.status === 'loading'}>
            {live.status === 'loading' ? 'Querying…' : 'Refresh from USGS'}
          </button>
        </div>
        <Table
          rows={sequence}
          rowKey={(r) => r.id}
          columns={[
            {
              key: 'mag',
              label: 'Mag',
              num: true,
              render: (r) => (
                <span style={{ color: r.mag >= 7 ? 'var(--red)' : 'var(--accent)', fontWeight: 700 }}>
                  {dec(r.mag, 1)}
                </span>
              ),
            },
            { key: 'magType', label: 'Type', render: (r) => <span className="mono" style={{ fontSize: 11.5, color: 'var(--dim)' }}>{r.magType}</span> },
            { key: 'time', label: 'Local time (COT)', render: (r) => cot(r.time) },
            { key: 'after', label: 'After mainshock', num: true, render: (r) => elapsed(r.time - event.originTimeUTC) },
            { key: 'depth', label: 'Depth', num: true, render: (r) => `${dec(r.depth, 1)} km` },
            {
              key: 'distanceFromMainshock',
              label: 'From epicentre',
              num: true,
              render: (r) => (
                <span style={{ color: r.related ? 'inherit' : 'var(--dim)' }}>
                  {int(r.distanceFromMainshock)} km{!r.related && '*'}
                </span>
              ),
            },
            {
              key: 'mmi',
              label: 'Max MMI',
              num: true,
              render: (r) => (r.mmi ? <span style={{ color: mmiColor(r.mmi), fontWeight: 700 }}>{roman(r.mmi)}</span> : '—'),
            },
            { key: 'felt', label: 'Felt reports', num: true, render: (r) => (r.felt ? int(r.felt) : '—') },
            { key: 'place', label: 'Location', wrap: true },
          ]}
        />
        <div className="note">
          {aftershocks.length} catalogued aftershocks lie within 150 km of the rupture.
          {unrelated.length > 0 && (
            <>
              {' '}
              *{unrelated.length} further event{unrelated.length > 1 ? 's' : ''} in the same time window (
              {unrelated.map((u) => `M${dec(u.mag, 1)} at ${int(u.distanceFromMainshock)} km`).join(', ')}){' '}
              {unrelated.length > 1 ? 'are' : 'is'} shown for completeness but almost certainly{' '}
              {unrelated.length > 1 ? 'are not aftershocks' : 'is not an aftershock'} — that distance points to
              the persistent intermediate-depth source near Bucaramanga, so it is excluded from the
              cross-section and the aftershock count.
            </>
          )}{' '}
          The table ships as a snapshot so the file works offline; "Refresh from USGS" re-queries the live FDSN
          event service and merges anything new.
        </div>
      </Card>

      <Callout title="Tectonic setting">
        The Malpelo microplate subducts eastward beneath South America along the Colombia–Ecuador trench at about
        58 mm per year. Between 4°N and 6°N the subducted Nazca crust is torn along an east-southeast trending
        slab tear, and the Cauca cluster hosts an unusual population of earthquakes 80–160 km deep — some inside
        the slab, some in the mantle wedge above it, which is normally too hot to fail seismically. This event sits
        in that cluster.
      </Callout>
    </div>
  );
}
