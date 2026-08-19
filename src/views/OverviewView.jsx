import React from 'react';
import { Card, Kpi, DefList, AlertPill, Callout, Pill } from '../components/ui.jsx';
import { MmiExposureChart, TollChart, BarList } from '../components/charts.jsx';
import { int, dec, usd, roman, cot, utc, MMI_LABELS, compact } from '../lib/format.js';

export default function OverviewView({ data, impact }) {
  const { event, shakemap, pager, groundFailure } = data;
  const { national, cali, tollTimeline, infrastructure } = impact;

  const exposedAtVI = pager.populationExposure
    .filter((d) => d.mmi >= 6)
    .reduce((a, d) => a + d.population, 0);

  return (
    <div className="view">
      <div className="grid g4">
        <Kpi label="Magnitude" value={dec(event.magnitude, 1)} unit={event.magnitudeType} foot="USGS moment magnitude" edge="var(--red)" tone="red" />
        <Kpi label="Focal depth" value={dec(event.depth, 1)} unit="km" foot="Intermediate depth, intraslab" edge="var(--blue)" tone="blue" />
        <Kpi label="Deaths" value={int(national.deaths)} foot={national.source} edge="var(--red)" tone="red" />
        <Kpi label="Injured" value={int(national.injured)} foot={`${int(national.missing)} still missing`} edge="var(--accent)" tone="accent" />
      </div>

      <div className="grid g-3-2">
        <Card title="What happened" hint={`Event ${event.id}`}>
          <div className="prose">
            <p>
              At <strong>07:34:28 local time on Monday 10 August 2026</strong> a{' '}
              <strong>magnitude {event.magnitude} earthquake</strong> ruptured inside the subducting Nazca
              plate <strong>{dec(event.depth, 0)} km beneath Chocó department</strong>, 20 km from the town of San
              José del Palmar. Because it was so deep, the shaking spread far rather than concentrating at the
              epicentre: it was felt in <strong>32 of Colombia's 33 departmental capitals</strong> and in Panama,
              Ecuador and Venezuela, and it lasted around two minutes.
            </p>
            <p>
              The worst damage landed <strong>150–200 km from the epicentre</strong>, in the cities of the Cauca
              valley and the coffee axis — <strong>Cali</strong>, Pereira, Armenia, Manizales and Quibdó. Cali, a
              city of 2.2 million, accounts for <strong>{cali.deaths} deaths</strong> and {int(cali.injured)}{' '}
              injured on its own official count, with {cali.hospitalsDamaged} hospitals damaged at the moment
              they were most needed.
            </p>
            <p>
              It is the strongest earthquake in Colombia in a decade, the largest since 1979, and the deadliest
              since the 1999 Armenia earthquake. Nationally{' '}
              <strong>{int(national.deaths)} people are confirmed dead</strong>, {int(national.injured)} injured
              and {int(national.missing)} missing, with reconstruction officially costed at{' '}
              <strong>{usd(9.6e9)}</strong>.
            </p>
          </div>
          <div className="note">
            Origin time {utc(event.originTimeUTC)} · {cot(event.originTimeUTC)} · epicentre{' '}
            {dec(event.lat, 3)}°N {dec(Math.abs(event.lon), 3)}°W · reviewed by USGS ·{' '}
            <a href={event.url} target="_blank" rel="noreferrer">
              USGS event page
            </a>
          </div>
        </Card>

        <Card title="Alert levels" hint="USGS PAGER + ground failure">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AlertRow
              level={pager.alertBins.economic.level}
              title="Economic losses"
              body={pager.comments.impact1}
            />
            <AlertRow
              level={pager.alertBins.fatality.level}
              title="Shaking fatalities"
              body={pager.comments.impact2}
            />
            <AlertRow
              level={groundFailure.liquefaction.alert}
              title="Liquefaction"
              body={`Roughly ${compact(groundFailure.liquefaction.populationExposed)} people in areas the model flags for liquefaction.`}
            />
            <AlertRow
              level={groundFailure.landslide.alert}
              title="Landslides"
              body={`Roughly ${compact(groundFailure.landslide.populationExposed)} people in areas the model flags for landsliding.`}
            />
          </div>
        </Card>
      </div>

      <div className="grid g-2-1">
        <Card
          title="Who felt what"
          hint={`ShakeMap v${shakemap.version} · max MMI ${roman(shakemap.maxMMI)}`}
        >
          <MmiExposureChart data={pager.populationExposure} />
          <div className="note">
            <strong>{compact(exposedAtVI)} people</strong> experienced intensity VI (strong) or above, and{' '}
            {compact(pager.populationExposure.find((d) => d.mmi === 8).population)} experienced intensity VIII
            (severe) — the level at which ordinary masonry buildings begin to fail. The largest single group,{' '}
            {compact(pager.populationExposure.find((d) => d.mmi === 5).population)} people, felt moderate
            intensity V.
          </div>
        </Card>

        <Card title="Event parameters" hint="USGS ComCat">
          <DefList
            rows={[
              ['Magnitude', `${dec(event.magnitude, 1)} ${event.magnitudeType}`],
              ['Depth', `${dec(event.depth, 1)} km`],
              ['Max. intensity', `${roman(shakemap.maxMMI)} (${MMI_LABELS[Math.round(shakemap.maxMMI)]})`],
              ['Peak ground accel.', `${dec(shakemap.maxPGA * 100, 1)} %g`],
              ['Peak ground velocity', `${dec(shakemap.maxPGV, 1)} cm/s`],
              ['Community reports', `${int(event.felt)} (CDI ${dec(event.cdi, 1)})`],
              ['Tsunami', event.tsunami ? 'Yes' : 'No'],
              ['Significance', int(event.significance)],
              ['Stations used', int(event.stationCount)],
              ['Azimuthal gap', `${dec(event.azimuthalGap, 0)}°`],
              ['RMS residual', `${dec(event.rmsResidual, 2)} s`],
            ]}
          />
        </Card>
      </div>

      <div className="grid g-2-1">
        <Card title="The death toll took nine days to settle" hint="reported figures, not revisions of one series">
          <TollChart points={tollTimeline} />
          <div className="note">
            Early figures came from different authorities counting different things, and the total was revised
            downward once on 11 August before climbing again. Anyone reading a single headline number during
            the first three days was reading a snapshot of an incomplete count, not an estimate of the eventual
            total.
          </div>
        </Card>

        <Card title="What was damaged" hint="nationwide, count of structures">
          <BarList items={infrastructure.map((d) => ({ label: d.label, value: d.value }))} />
          <div className="note">
            Plus {int(national.homesDamaged)} homes damaged and {int(national.homesDestroyed)} destroyed across{' '}
            {national.departmentsAffected} departments.
          </div>
        </Card>
      </div>

      <Callout title="Reading this dashboard" tone="">
        Instrument values (magnitude, depth, intensity, modelled losses) come straight from the USGS products
        for event <span className="mono">{event.id}</span> and are exact. Casualty and damage figures are still
        moving and are labelled with their source and date. Cali's figures come from the city's own official
        situation report; national and departmental figures come from news reporting several days earlier, which
        is why the Cali death toll ({int(cali.deaths)}) now exceeds the last published total for the whole of
        Valle del Cauca (133). The dashboard flags that rather than quietly reconciling it.
      </Callout>
    </div>
  );
}

function AlertRow({ level, title, body }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
        <AlertPill level={level}>{level}</AlertPill>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
