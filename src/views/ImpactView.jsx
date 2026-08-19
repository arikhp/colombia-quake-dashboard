import React, { useMemo } from 'react';
import { Card, Kpi, Table, DefList } from '../components/ui.jsx';
import { BarList } from '../components/charts.jsx';
import { int, dec, compact } from '../lib/format.js';

export default function ImpactView({ data, impact }) {
  const { national, byDepartment, secondaryEffects, infrastructure } = impact;

  /** Flatten departments and their cities into one indented table. */
  const rows = useMemo(() => {
    const out = [];
    for (const d of [...byDepartment].sort((a, b) => b.deaths - a.deaths)) {
      out.push({
        __rowClass: 'group',
        key: d.department,
        name: d.department,
        deaths: d.deaths,
        injured: d.injured,
        note: d.note,
        stale: d.stale,
      });
      for (const c of d.cities) {
        out.push({
          __rowClass: 'child',
          key: `${d.department}/${c.city}`,
          name: c.city,
          deaths: c.deaths,
          injured: c.injured,
          note: c.note,
          official: c.official,
        });
      }
    }
    return out;
  }, [byDepartment]);

  /**
   * City reports can be more recent than the department total that contains them,
   * so the honest comparable value is the larger of the two.
   */
  const deptFloors = useMemo(
    () =>
      byDepartment.map((d) => ({
        label: d.department,
        value: Math.max(d.deaths || 0, d.cities.reduce((a, c) => a + (c.deaths || 0), 0)),
      })),
    [byDepartment]
  );

  const accountedFor = deptFloors.reduce((a, d) => a + d.value, 0);

  return (
    <div className="view">
      <div className="grid g4">
        <Kpi label="Homes damaged" value={compact(national.homesDamaged)} foot={`${int(national.homesDestroyed)} destroyed outright`} edge="var(--accent)" tone="accent" />
        <Kpi label="Schools affected" value={int(infrastructure.find((i) => i.label.startsWith('Educational')).value)} foot="educational institutions" edge="var(--blue)" tone="blue" />
        <Kpi label="Healthcare centres" value={int(infrastructure.find((i) => i.label.startsWith('Healthcare')).value)} foot="damaged nationwide" edge="var(--red)" tone="red" />
        <Kpi label="Bodies identified" value={`${int(national.bodiesIdentified)}/${int(national.bodiesReceived)}`} foot="forensic services, 17 Aug" edge="var(--muted)" />
      </div>

      <Card
        title="Deaths and injuries by department and city"
        hint={`departments: ${impact.departmentFiguresBasis}`}
      >
        <Table
          rows={rows}
          rowKey={(r) => r.key}
          columns={[
            {
              key: 'name',
              label: 'Department / city',
              render: (r) => (
                <>
                  {r.name}
                  {r.official && (
                    <span style={{ color: 'var(--green)', fontSize: 10.5, fontWeight: 700, marginLeft: 7 }}>
                      OFFICIAL 18 AUG
                    </span>
                  )}
                  {r.stale && (
                    <span style={{ color: 'var(--dim)', fontSize: 10.5, fontWeight: 700, marginLeft: 7 }}>
                      NOT RESTATED
                    </span>
                  )}
                </>
              ),
            },
            { key: 'deaths', label: 'Deaths', num: true, render: (r) => (r.deaths == null ? '—' : int(r.deaths)) },
            { key: 'injured', label: 'Injured', num: true, render: (r) => (r.injured == null ? '—' : int(r.injured)) },
            { key: 'note', label: 'Detail', wrap: true },
          ]}
        />
        <div className="note">
          More than 97% of deaths occurred in departmental capitals. These rows have different vintages and do
          not add up: the department figures are {impact.departmentFiguresBasis} and have not been restated,
          while Cali's are from its official 18 August report. That is why Cali's{' '}
          {int(impact.cali.deaths)} exceeds the {int(byDepartment.find((d) => d.department === 'Valle del Cauca').deaths)}{' '}
          last published for the whole of Valle del Cauca. Attributed deaths sum to {accountedFor} against a
          national total of {int(national.deaths)}.
        </div>
      </Card>

      <div className="grid g2">
        <Card title="Where the deaths concentrated" hint="latest figure at any level">
          <BarList
            items={[...deptFloors]
              .sort((a, b) => b.value - a.value)
              .map((d) => ({ ...d, color: 'var(--red)' }))}
          />
          <div className="note">
            Risaralda (Pereira) and Valle del Cauca (Cali) together account for at least{' '}
            {dec(((deptFloors.find((d) => d.label === 'Risaralda').value + deptFloors.find((d) => d.label === 'Valle del Cauca').value) / national.deaths) * 100, 0)}%
            of all deaths, despite being 150–200 km from the epicentre. Chocó, where the epicentre sits, records{' '}
            {byDepartment.find((d) => d.department === 'Chocó').deaths} — the epicentral area is sparsely
            populated and built low. Bars use the highest figure reported at either department or city level,
            since the two have different cut-off dates.
          </div>
        </Card>

        <Card title="Damaged infrastructure" hint="nationwide counts">
          <BarList items={infrastructure.map((d) => ({ label: d.label, value: d.value }))} />
          <div className="note">
            Damage to 2,612 schools and 3,621 community centres matters twice over: those buildings are also the
            shelters and distribution points a response depends on.
          </div>
        </Card>
      </div>

      <div className="grid g-1-2">
        <Card title="National totals" hint={`as of ${impact.asOf}`}>
          <DefList
            rows={[
              ['Deaths', int(national.deaths)],
              ['Injured', int(national.injured)],
              ['Missing', int(national.missing)],
              ['Homes damaged', int(national.homesDamaged)],
              ['Homes destroyed', int(national.homesDestroyed)],
              ['Buildings collapsed', int(national.buildingsCollapsed)],
              ['Departments affected', int(national.departmentsAffected)],
              ['Aftershocks reported', `${int(national.aftershocks)}+`],
            ]}
          />
          <div className="note">{national.source}.</div>
        </Card>

        <Card title="Secondary hazards and knock-on effects">
          <Table
            rows={secondaryEffects}
            rowKey={(r) => r.label}
            columns={[
              { key: 'label', label: 'Hazard', width: '150px' },
              { key: 'detail', label: 'Observed', wrap: true },
            ]}
          />
          <div className="note">
            USGS notes that recent earthquakes in this area have caused landslides and liquefaction that
            contributed to losses, which is why both secondary-hazard models were run for this event.
          </div>
        </Card>
      </div>
    </div>
  );
}
