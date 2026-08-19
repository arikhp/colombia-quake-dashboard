import React from 'react';
import { Card, Table, DefList, Callout } from '../components/ui.jsx';
import { utc, int } from '../lib/format.js';

export default function SourcesView({ data, impact }) {
  const { event, generatedAt, shakemap } = data;

  return (
    <div className="view">
      <Callout title="How to treat these numbers">
        Two kinds of data are mixed in this dashboard and they do not carry the same weight. Instrument and model
        values are reproducible: they come from named USGS products for one event ID and will not change except
        when USGS revises them. Casualty, damage and cost figures are journalism and official statements from an
        ongoing emergency; they were still moving when this was built and some of them will be wrong.
      </Callout>

      <div className="grid g2">
        <Card title="Machine-read sources" hint="fetched, not transcribed">
          <DefList
            rows={[
              ['USGS event ID', event.id],
              ['Catalogue', 'ANSS ComCat via FDSN event web service'],
              ['Origin', `${utc(event.originTimeUTC)}, reviewed`],
              ['ShakeMap', `version ${shakemap.version}, code v${shakemap.codeVersion}`],
              ['PAGER', 'exposure, loss, alert and historical products'],
              ['Moment tensor', 'USGS Mww, reviewed'],
              ['Finite fault', 'USGS inversion, version 1'],
              ['Ground failure', 'Zhu et al. 2017 / Jessee et al. 2018'],
              ['Boundaries', '33 Colombian departments, public GeoJSON'],
              ['Snapshot taken', utc(new Date(generatedAt).getTime())],
            ]}
          />
          <div className="note">
            The build step downloads these products and reduces them to a single embedded module, so the
            dashboard opens with no network access. The seismology tab can re-query the live feed on demand.
          </div>
        </Card>

        <Card title="Reported sources" hint="official report first, then press">
          <Table
            rows={impact.sources}
            rowKey={(r) => r.url}
            columns={[
            {
              key: 'label',
              label: 'Source',
              wrap: true,
              render: (r) =>
                r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer">
                    {r.label}
                  </a>
                ) : (
                  <span>
                    <strong style={{ color: 'var(--text)' }}>{r.label}</strong>
                    {r.note && <span style={{ color: 'var(--dim)' }}> — {r.note}</span>}
                  </span>
                ),
            },
            ]}
          />
        </Card>
      </div>

      <Card title="Known conflicts in the reporting" hint="preserved rather than resolved">
        <Table
          rows={[
            {
              item: 'National death toll',
              values: '181 (official, 12 Aug) · 240+ (aggregated from local officials) · 273 (13 Aug) · 294 (15 Aug) · 304 (18 Aug)',
              handling: 'Latest reconciled figure used for totals; full series shown on the overview chart.',
            },
            {
              item: 'Cali deaths and injuries',
              values: '95 dead / 949 injured (city, 11 Aug 06:30 COT) · 96 dead / 1,224 injured (13 Aug) · 141 dead / 1,569 injured (official report #016, 18 Aug 18:30 COT)',
              handling: 'The official 18 August district report is used throughout; the full progression is tabulated on the Cali tab.',
            },
            {
              item: 'Cali vs Valle del Cauca totals',
              values: 'Cali 141 dead (official, 18 Aug) inside a department last reported at 133 (news, ~13 Aug)',
              handling: 'Both shown and flagged. Charts use the higher of the department or city figure and label it as a floor; the department total is marked "not restated".',
            },
            {
              item: 'Cali buildings collapsed',
              values: '19 (10 Aug) · 40 · 45 (13 Aug) · 24 verified total collapse plus 177 partial (official, 18 Aug)',
              handling: 'Official verified counts used, with total and partial collapse kept separate — the apparent fall from 45 to 24 is a change of definition, not a correction.',
            },
            {
              item: 'Cali missing persons',
              values: '188 (10 Aug) · 111 (13 Aug) · 56 then 47 (official, 18 Aug)',
              handling: 'Official figure used. The district reduced it by cross-checking records against health authorities and Medicina Legal, not because people were found.',
            },
            {
              item: 'Pereira death toll',
              values: '18 (mayor, same day) · 40 (10 Aug evening) · 101 (settled)',
              handling: 'Settled figure used elsewhere; full progression tabulated on the Pereira tab. No official district report equivalent to Cali\u2019s #016 exists for Pereira, so this is press-sourced throughout.',
            },
            {
              item: 'Magnitude',
              values: 'Mw 7.4 (USGS) · Mw 7.5 (GCMT and Colombian Geological Survey)',
              handling: 'USGS 7.4 used throughout for consistency with the other USGS products.',
            },
            {
              item: 'Depth',
              values: '110.3 km (USGS) · 96 km (CGS) · 120.5 km (moment tensor centroid) · 125 km (finite fault)',
              handling: 'USGS hypocentral depth used; the others are shown in the seismology tab.',
            },
            {
              item: 'Economic damage',
              values: 'US$0.99–1.98bn (Oxford Economics) · US$6.5bn (PAGER) · US$9.6bn (government) · ~US$40bn (USGS headline)',
              handling: 'All four charted; none treated as definitive.',
            },
            {
              item: 'Missing persons',
              values: '2,700+ (11 Aug, early reports) · 500+ (13 Aug) · 426 (18 Aug)',
              handling: 'Latest figure used; early figures reflect duplicate and unverified reports.',
            },
          ]}
          rowKey={(r) => r.item}
          columns={[
            { key: 'item', label: 'Figure', width: '180px' },
            { key: 'values', label: 'Published values', wrap: true },
            { key: 'handling', label: 'How this dashboard handles it', wrap: true },
          ]}
        />
      </Card>

      <div className="grid g2">
        <Card title="Method notes">
          <ul className="checklist">
            <li>The focal mechanism diagram is computed from the six published moment-tensor components by sampling the sign of the radial P-wave amplitude over the lower focal hemisphere — it is not a reproduced image.</li>
            <li>Hypocentral distances are computed from the great-circle surface distance and the {int(event.depth)} km focal depth, because shaking scales with distance to the rupture, not to the map point above it.</li>
            <li>Department boundaries and ShakeMap intensity contours are simplified with Ramer-Douglas-Peucker and rounded to three decimal degrees (about 110 m).</li>
            <li>Intensity values for towns are ShakeMap modelled values at the town centroid, not station recordings.</li>
            <li>The map projection is equirectangular, scaled by the cosine of the mid-latitude; at this scale it is visually equivalent to Mercator and stays cheaply invertible for pan and zoom.</li>
            <li>All aid figures are converted to US dollars at the rate implied by the source reporting, not at a single reference rate.</li>
          </ul>
        </Card>

        <Card title="What is deliberately not here">
          <ul className="checklist">
            <li>No casualty photographs or victim names.</li>
            <li>No per-building damage assessments: no authoritative structure-level dataset has been published.</li>
            <li>No forecast of aftershock probability — USGS published an aftershock forecast product for this event, but it is not included, and nothing here should be read as a prediction.</li>
            <li>No shelter or missing-person lookup: this is a situational overview, not an operational tool. For assistance, contact the UNGRD or the Colombian Red Cross directly.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
