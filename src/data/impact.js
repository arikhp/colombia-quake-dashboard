/**
 * Hand-curated impact, response and chronology data.
 *
 * Everything here comes from news reporting and official statements rather than
 * from an instrument feed, so figures are attributed and time-stamped. Where
 * sources disagree (they do, especially on the death toll) the disagreement is
 * preserved instead of averaged away.
 *
 * Last reconciled: 19 August 2026.
 */

export const asOf = '2026-08-19';

/** Nationwide totals, latest reconciled figures. */
export const national = {
  deaths: 304,
  injured: 4548,
  missing: 426,
  homesDamaged: 81506,
  homesDestroyed: 14493,
  buildingsCollapsed: 66,
  departmentsAffected: 12,
  aftershocks: 100,
  bodiesIdentified: 288,
  bodiesReceived: 298,
  source: 'Local officials / UNGRD, reported 18 August 2026',
};

/** Infrastructure damaged nationwide. */
export const infrastructure = [
  { label: 'Educational institutions', value: 2612 },
  { label: 'Community centres', value: 3621 },
  { label: 'Roads', value: 298 },
  { label: 'Healthcare centres', value: 241 },
  { label: 'Aqueducts', value: 59 },
  { label: 'Bridges', value: 44 },
  { label: 'Airports', value: 10 },
];

/**
 * Departmental figures come from news reporting between 11 and 13 August and
 * have not been restated since. Cali's own official report is five days later
 * and higher than the department total it sits inside, so the two are not
 * directly comparable — the dashboard flags this rather than reconciling it.
 */
export const departmentFiguresBasis = 'news reporting, 11–13 August 2026';

/**
 * Deaths and injuries by department / city. `deaths` is the reported figure at
 * the level named; city rows roll up into the department rows above them.
 */
export const byDepartment = [
  {
    department: 'Valle del Cauca',
    deaths: 133,
    injured: null,
    stale: true,
    note: 'About 5,000 homes destroyed. ~80% of homes destroyed in El Cairo; severe damage in Riofrío and Vijes. This department total predates Cali\u2019s official report and is now lower than the city figure inside it.',
    cities: [
      {
        city: 'Cali',
        deaths: 141,
        injured: 1569,
        official: true,
        note: 'City of 2.2 million. Official report #016 (18 Aug): 24 verified total collapses, 177 partial, 197 with structural damage; 18 hospitals damaged.',
      },
      { city: 'Calima', deaths: 4, injured: 30, note: 'Gimnasio Calima school partially collapsed; the four dead were children.' },
      { city: 'Buenaventura', deaths: 1, injured: null, note: '15 vehicles stranded in a tunnel on the Cali–Buenaventura highway after rockslides.' },
    ],
  },
  {
    department: 'Risaralda',
    deaths: 101,
    injured: null,
    note: 'Overwhelmingly concentrated in Pereira.',
    cities: [
      {
        city: 'Pereira',
        deaths: 101,
        injured: null,
        note: '65 buildings collapsed, 15 with people trapped inside. Matecaña International Airport partially collapsed, killing three. Some people were also trapped in the city\u2019s cable cars. See the Pereira tab.',
      },
    ],
  },
  {
    department: 'Chocó',
    deaths: 14,
    injured: 119,
    note: 'Epicentral department. Roads buried by landslides and telecommunications cut in places.',
    cities: [
      { city: 'Quibdó', deaths: 8, injured: 36, note: '42 structures collapsed; 10 people missing.' },
      { city: 'San José del Palmar', deaths: null, injured: null, note: 'Epicentral town: 20 buildings destroyed, 400 homes damaged.' },
      { city: 'Istmina', deaths: null, injured: 70, note: '550+ homes damaged, ~3,000 people affected; all schools and the city hall affected.' },
      { city: 'Sipí', deaths: null, injured: null, note: 'A local leader reported only four or five of the town\u2019s 65 homes left intact.' },
    ],
  },
  {
    department: 'Caldas',
    deaths: 6,
    injured: null,
    note: '',
    cities: [
      { city: 'Manizales', deaths: 5, injured: null, note: '36 structures collapsed. A tower of the Cathedral Basilica collapsed into the nave.' },
      { city: 'Palestina', deaths: null, injured: 1, note: '8 homes collapsed, 100 damaged; 4 schools, 2 hospitals and a police station affected.' },
    ],
  },
  {
    department: 'Quindío',
    deaths: 1,
    injured: 334,
    note: 'More than 10,000 homes damaged or destroyed.',
    cities: [
      { city: 'Armenia', deaths: null, injured: 174, note: '5 buildings collapsed; El Edén airport control tower and runway damaged.' },
    ],
  },
  {
    department: 'Antioquia',
    deaths: 1,
    injured: null,
    note: '350+ homes, 61 schools, 29 churches and 7 hospitals damaged.',
    cities: [{ city: 'Támesis', deaths: 1, injured: null, note: 'One person killed by a rockfall.' }],
  },
];

/**
 * Official figures for Cali from the district administration's situation report
 * #016, "Update on Cali Earthquake Figures" (Spanish original: "Actualización de
 * cifras sismo Cali"), cut at 18 August 2026, 18:30 COT.
 *
 * This supersedes the news reporting for Cali. It is substantially higher than
 * the early figures — 141 dead against 95 on 11 August — because it counts
 * verified cases rather than initial reports, and because the toll kept rising
 * as collapsed buildings were cleared.
 */
export const caliOfficial = {
  source: 'the Office of the Mayor of Santiago de Cali, Official Report #016',
  asOf: '18 August 2026, 18:30 COT',
  people: {
    rescued: 88,
    missing: 47,
    deaths: 141,
    injured: 1569,
    bodiesReturnedToFamilies: 132,
  },
  /** Structural assessment, from citizen reports through verified inspection. */
  infrastructure: {
    citizenReportsProcessed: 7797,
    buildingsVerified: 920,
    totalCollapseVerified: 24,
    partialCollapseVerified: 177,
    structuralDamageVerified: 197,
  },
  operations: {
    debrisRemovedTonnes: 28535,
    damageNeedsAssessments: 11224,
    activePersonnel: 1365,
    animalsRescued: 158,
  },
  notes: [
    'The missing-persons count fell from 56 to 47 as the district cross-checked its records against health authorities and Medicina Legal and called the families who filed reports. It will keep changing as verification continues.',
    'Specialist rescue teams from Pasto, Yopal, Santander, Palmira, Ortigal, Villarrica, Popayán, Medellín, Boyacá, Jamundí and the United States have now stood down and left the field.',
  ],
};

/** Cali-specific detail: the focus of this dashboard. */
export const cali = {
  population: 2200000,
  // Latest official figures, from report #016 above.
  deaths: caliOfficial.people.deaths,
  injured: caliOfficial.people.injured,
  missing: caliOfficial.people.missing,
  rescuedAlive: caliOfficial.people.rescued,
  buildingsCollapsed: caliOfficial.infrastructure.totalCollapseVerified,
  partialCollapse: caliOfficial.infrastructure.partialCollapseVerified,
  structuralDamage: caliOfficial.infrastructure.structuralDamageVerified,
  buildingsDamaged: 5000,
  hospitalsDamaged: 18,
  trapped: 239,
  rebuildYears: 3,
  rebuildCostUSD: 3.2e9,
  neighbourhoodsWithCollapse: [
    'El Lido',
    'Alameda',
    'Tequendama',
    'Nueva Tequendama',
    'Cámbulos',
    'Cuarto de Legua',
    'El Refugio',
    'Pampalinda',
    'El Limonar',
    'Capri',
    'Caldas',
  ],
  landmarks: [
    {
      name: 'University Hospital of Valle (Evaristo García)',
      status: 'critical',
      detail:
        'Upper floors partially collapsed and 70% of the infrastructure damaged. 800 patients evacuated, 6 died, outpatient and surgical services suspended.',
    },
    {
      name: 'Vanessa Building (7 storeys)',
      status: 'critical',
      detail:
        'Search and rescue suspended on 14 August; operations moved to body recovery.',
    },
    {
      name: 'Estadio Olímpico Pascual Guerrero',
      status: 'damaged',
      detail: 'Structural damage reported to the stadium.',
    },
    {
      name: 'Cali–Buenaventura highway',
      status: 'damaged',
      detail: 'Rockslides blocked the tunnel exit toward Cali, stranding 15 vehicles.',
    },
    {
      name: 'Basilica of Our Lord of the Miracles, Buga',
      status: 'damaged',
      detail: 'Cracks across the central dome.',
    },
  ],
  healthSystem: {
    hospitalsOutOfService: 4,
    clinicsDamaged: 6,
    alert: 'Red alert for hospitals; public hospitals at 100% capacity on 10 August.',
    adaptation:
      'City health authorities created "expansion zones" in and around less-affected institutions; officials described the situation as stable by 12 August.',
  },
  responseMeasures: [
    'Unified Command Post set up to coordinate rescue',
    '220+ rescue specialists and 100 military engineers in the city by 11 August',
    '1,000+ soldiers deployed for public order after looting reports',
    'Curfew from 20:00 to 06:00, with exemptions for responders',
    'Search window formally extended past 72 hours to 15 August',
    '30th Petronio Álvarez Pacific Music Festival (12–17 August) suspended',
    'Parks and streets used as refuge space; stadiums and community halls converted to shelters',
  ],
};

/**
 * Pereira-specific detail. Unlike Cali, no district situation report equivalent
 * to #016 has been published or supplied for Pereira, so every figure here comes
 * from press reporting (mainly Wikipedia's aggregated account, El Espectador and
 * Semana) rather than a verified official source. Treat the precision here as
 * lower than Cali's.
 */
export const pereira = {
  population: 590554,
  deaths: 101,
  buildingsCollapsed: 65,
  buildingsWithPeopleTrapped: 15,
  airportDeaths: 3,
  sourceNote:
    'No official Pereira situation report equivalent to Cali\u2019s #016 has been published or supplied. These figures are the settled totals aggregated by Wikipedia\u2019s account of the event, sourced in turn to local officials and wire coverage.',
  landmarks: [
    {
      name: 'Matecaña International Airport',
      status: 'critical',
      detail:
        'Sections of the terminal ceiling and interior structure collapsed onto passenger areas, killing three people and injuring several more. The terminal was evacuated and commercial flights suspended pending a structural inspection.',
    },
    {
      name: 'Noé Clinic',
      status: 'damaged',
      detail: 'Partially evacuated after sustaining damage in the earthquake.',
    },
    {
      name: 'Pereira aerial cable car',
      status: 'damaged',
      detail: 'Some passengers were left trapped inside cars when the shaking hit; the system was suspended for inspection.',
    },
    {
      name: 'Basílica Menor Nuestra Señora de la Pobreza (Pereira cathedral)',
      status: 'damaged',
      detail: 'Visible damage shown in photos and video shared immediately after the quake; extent of structural damage not independently detailed in the sources reviewed.',
    },
  ],
  healthSystem: {
    overwhelmed: ['Los Nevados Clinic', 'San Jorge Hospital', 'Comfamiliar Clinic'],
    alert:
      'Mayor Mauricio Salazar Peláez publicly advised residents not to go to three of the city\u2019s hospitals and clinics — Los Nevados Clinic, San Jorge Hospital and Comfamiliar Clinic — because they were overwhelmed by the number of injured arriving.',
    note: 'The Noé Clinic was partially evacuated separately, due to structural damage rather than caseload.',
  },
  responseMeasures: [
    'More than 500 people, including specialists and volunteers, searched the rubble for survivors, largely without heavy equipment',
    'Search window for survivors formally extended past the 72-hour mark to 15 August, matching the extension granted in Cali',
    'Curfew enforced alongside Cali\u2019s to deter looting and protect rescue work',
    'Matecaña airport\u2019s commercial operations suspended by the Colombian Civil Aviation Authority pending structural inspection',
    'World Central Kitchen operated in the city, distributing meals to those displaced',
  ],
};

/**
 * How Pereira's death toll was first reported and then settled. The mayor's own
 * same-day figure (18) was roughly a fifth of the eventual toll — an even wider
 * gap than Cali saw on its first day.
 */
export const pereiraProgression = [
  {
    asOf: '2026-08-10T15:02Z',
    label: '10 Aug, 10:02 COT',
    deaths: 18,
    source: 'Mayor Mauricio Salazar, to Caracol Radio (reported by Semana)',
  },
  {
    asOf: '2026-08-10T23:00Z',
    label: '10 Aug, evening',
    deaths: 40,
    source: 'El Espectador, citing city officials',
  },
  {
    asOf: '2026-08-18T12:00Z',
    label: '18 Aug (settled)',
    deaths: 101,
    source: 'Settled toll aggregated by Wikipedia from local officials and wire coverage',
  },
];

/**
 * How Cali's own figures moved between the first city update and the official
 * situation report nine days later. The deaths and injuries roughly halved the
 * distance to their final values only after building-by-building verification.
 */
export const caliProgression = [
  {
    asOf: '2026-08-11T11:30Z',
    label: '11 Aug, 06:30 COT',
    deaths: 95,
    injured: 949,
    missing: 188,
    trapped: 239,
    collapsed: 40,
    source: 'City officials, first structured update',
  },
  {
    asOf: '2026-08-13T12:00Z',
    label: '13 Aug',
    deaths: 96,
    injured: 1224,
    missing: 111,
    trapped: null,
    collapsed: 45,
    source: 'Al Jazeera, citing city authorities',
  },
  {
    asOf: '2026-08-18T23:30Z',
    label: '18 Aug, 18:30 COT',
    deaths: 141,
    injured: 1569,
    missing: 47,
    trapped: null,
    collapsed: 24,
    source: 'Official district report #016 (verified inspections)',
  },
];

/**
 * How the reported national death toll evolved. This is the clearest single
 * illustration of how much uncertainty there is in the first days of a disaster.
 */
export const tollTimeline = [
  { time: '2026-08-10T12:34Z', label: 'Earthquake', deaths: 0, source: 'Origin time' },
  { time: '2026-08-10T14:00Z', label: 'First reports', deaths: 20, source: 'AP' },
  { time: '2026-08-10T16:00Z', label: 'Rising', deaths: 22, source: '20minutos' },
  { time: '2026-08-10T18:00Z', label: 'National disaster declared', deaths: 70, source: 'BBC' },
  { time: '2026-08-10T20:00Z', label: 'Evening', deaths: 111, source: 'BBC / La Vanguardia' },
  { time: '2026-08-10T23:00Z', label: 'Overnight', deaths: 224, source: 'El País' },
  { time: '2026-08-11T12:00Z', label: 'Day 2', deaths: 169, source: 'Colombia One (revised down)' },
  { time: '2026-08-11T20:00Z', label: 'Day 2 evening', deaths: 179, source: 'CNN' },
  { time: '2026-08-12T12:00Z', label: 'Day 3', deaths: 181, source: 'BBC (official)' },
  { time: '2026-08-13T12:00Z', label: 'Day 4', deaths: 273, source: 'Al Jazeera' },
  { time: '2026-08-15T12:00Z', label: 'Day 6', deaths: 294, source: 'EFE' },
  { time: '2026-08-18T12:00Z', label: 'Day 9', deaths: 304, source: 'La Opinión' },
];

/** Damage and reconstruction cost estimates. They disagree by an order of magnitude. */
export const costEstimates = [
  {
    source: 'Colombian government',
    lowUSD: 9.6e9,
    highUSD: 9.6e9,
    note: '30 trillion pesos, initial official estimate',
    kind: 'official',
  },
  {
    source: 'Oxford Economics',
    lowUSD: 0.99e9,
    highUSD: 1.98e9,
    note: '0.2–0.4% of Colombian GDP, direct damages',
    kind: 'private',
  },
  {
    source: 'USGS PAGER (empirical)',
    lowUSD: 6.48e9,
    highUSD: 6.48e9,
    note: 'Empirical loss model point estimate',
    kind: 'model',
  },
  {
    source: 'USGS (headline)',
    lowUSD: 40e9,
    highUSD: 40e9,
    note: 'Near US$40 billion, ~7% of GDP',
    kind: 'model',
  },
  {
    source: 'City of Cali',
    lowUSD: 3.2e9,
    highUSD: 3.2e9,
    note: 'Cali alone, over an estimated three years',
    kind: 'official',
  },
];

/** Chronology of the response. */
export const responseTimeline = [
  { date: '2026-08-10', actor: 'Colombia', text: 'President Abelardo de la Espriella declares a state of national disaster and three days of national mourning; Unified Command Post established. He travels to Quibdó and Cali the same evening.' },
  { date: '2026-08-10', actor: 'Bogotá', text: 'Mayor Carlos Fernando Galán dispatches 100 rescuers to Cali; five army units with rescue capability deployed. Medellín sends 263 firefighters and 40 engineers for damage inspection.' },
  { date: '2026-08-10', actor: 'Aviation', text: 'Flights suspended at 10+ damaged airports including Manizales, Quibdó, Armenia, Cartago and Buenaventura.' },
  { date: '2026-08-11', actor: 'Cali / Pereira', text: 'Curfews imposed to deter looting and protect rescue operations. 220+ rescue specialists and 100 military engineers working in Cali.' },
  { date: '2026-08-11', actor: 'Sport & culture', text: 'DIMAYOR suspends all competition for the week; CONMEBOL postpones Copa Libertadores and Sudamericana ties involving Colombian clubs. Pereira cancels its harvest festival.' },
  { date: '2026-08-12', actor: 'Colombia', text: 'Economic emergency declared. A "Miracle Fund" proposed to channel national and international contributions into reconstruction.' },
  { date: '2026-08-12', actor: 'International', text: 'Vice President José Manuel Restrepo says 12+ countries pledged humanitarian aid and rescue teams. Starlink offers free service in five departments until 12 September.' },
  { date: '2026-08-13', actor: 'Controversy', text: 'A leaked letter shows UNGRD head Javier Pava had rejected international rescue offers. He is removed the next day and replaced by David Santiago Tamayo, and may face criminal investigation.' },
  { date: '2026-08-13', actor: 'Finance', text: 'A World Bank loan of up to US$450 million activated; income tax deadline extended by one month.' },
  { date: '2026-08-14', actor: 'Israel', text: 'An 80-person delegation lands in Cali. Colombia formally requested search and rescue teams from only four countries: the US, Ecuador, El Salvador and Israel.' },
  { date: '2026-08-14', actor: 'Cali', text: 'Search period for survivors formally extended beyond the 72-hour window, to 15 August.' },
  { date: '2026-08-15', actor: 'Colombia / US', text: 'De la Espriella asks President Trump by phone to suspend tariffs on Colombian exports to speed economic recovery.' },
  { date: '2026-08-16', actor: 'Cali', text: 'City government estimates rebuilding will take up to three years and cost at least US$3.2 billion.' },
  { date: '2026-08-17', actor: 'Forensics', text: '288 of 298 bodies received have been identified.' },
  { date: '2026-08-17', actor: 'Recovery', text: 'Rescue teams wind down; aid organisations shift to housing the displaced and providing basic necessities. Shakira visits Quibdó with Howard Buffett.' },
];

/** Financial and material aid pledges. */
export const aid = [
  { donor: 'World Bank', amountUSD: 200e6, kind: 'Emergency financing', origin: 'multilateral' },
  { donor: 'World Bank (loan facility)', amountUSD: 450e6, kind: 'Contingent loan activated', origin: 'multilateral' },
  { donor: 'ANDI (Colombian business association)', amountUSD: 64e6, kind: 'Emergency assistance and reconstruction', origin: 'domestic' },
  { donor: 'Gilinski family', amountUSD: 48e6, kind: 'Reconstruction', origin: 'domestic' },
  { donor: 'Santo Domingo family', amountUSD: 32e6, kind: 'Reconstruction', origin: 'domestic' },
  { donor: 'United States', amountUSD: 26.5e6, kind: 'Relief', origin: 'international' },
  { donor: 'United Arab Emirates', amountUSD: 10e6, kind: 'Donation', origin: 'international' },
  { donor: 'Nicky Jam & Grupo Argos', amountUSD: 4.2e6, kind: 'Aid (COP 13bn)', origin: 'domestic' },
  { donor: 'European Union', amountUSD: 2.3e6, kind: 'Humanitarian aid (€2m)', origin: 'multilateral' },
  { donor: 'Shakira', amountUSD: 1e6, kind: 'Rebuilding schools; 10 new schools and Univ. of Chocó', origin: 'individual' },
  { donor: 'José Andrés', amountUSD: 1e6, kind: 'Small food businesses', origin: 'individual' },
  { donor: 'FC Barcelona', amountUSD: 0.115e6, kind: 'Donation campaign (€100k)', origin: 'international' },
  { donor: 'Vatican', amountUSD: 0.115e6, kind: 'Via Episcopal Conference of Colombia (€100k)', origin: 'international' },
];

/** Search-and-rescue teams formally requested and received. */
export const sarTeams = [
  { country: 'Israel', detail: '80-person delegation (IDF, Defence and Foreign ministries), landed in Cali 14 August', status: 'requested' },
  { country: 'United States', detail: 'Los Angeles County Fire Department team; Fairfax County, Virginia urban SAR team', status: 'requested' },
  { country: 'Ecuador', detail: '47-member team, self-sufficient for seven days', status: 'requested' },
  { country: 'El Salvador', detail: 'Two planes with 100 tonnes of relief', status: 'requested' },
  { country: 'Mexico', detail: 'Topos de Tlatelolco redeployed from Caracas to Cali, but reported they were not permitted to operate; material aid accepted', status: 'disputed' },
  { country: 'Chile', detail: '10-tonne shipment of food, hygiene items and medicine', status: 'material aid' },
];

/** Secondary hazards and effects beyond the shaking itself. */
export const secondaryEffects = [
  { label: 'Landslides', detail: 'Roads to San José del Palmar buried; rockslides on the Cali–Buenaventura highway; a fatal rockfall in Támesis.' },
  { label: 'Liquefaction', detail: 'USGS models a red liquefaction alert with roughly 480,000 people in exposed areas.' },
  { label: 'Volcanic activity', detail: 'Puracé volcano in Cauca emitted ash and gases after the quake; the CGS said it was unrelated.' },
  { label: 'Telecommunications', detail: 'Service disabled around the epicentral area; Starlink provided free service in five departments.' },
  { label: 'Felt reach', detail: 'Shaking felt in 32 of Colombia\u2019s departmental capitals and in Panama, Ecuador and Venezuela. 464+ damage reports in Bogotá alone.' },
];

/** Sources used in this dashboard. */
export const sources = [
  {
    label: 'Office of the Mayor of Santiago de Cali — Official Report #016, "Update on Cali Earthquake Figures" (18 August 2026, 18:30 COT)',
    url: null,
    note: 'Local PDF supplied with this project (original Spanish title: "Actualización de cifras sismo Cali"); the primary source for all Cali figures.',
  },
  { label: 'USGS event page — M 7.4, 5 km S of San José del Palmar', url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000tjl2' },
  { label: 'Semana — Pereira\u2019s mayor confirms 18 dead (10 Aug, first same-day report)', url: 'https://www.semana.com/nacion/articulo/terremoto-en-colombia-alcalde-de-pereira-confirmo-18-muertos/202659/' },
  { label: 'El Espectador — inside Matecaña airport during the earthquake; three dead', url: 'https://www.elespectador.com/colombia/mas-regiones/que-paso-en-el-aeropuerto-matecana-de-pereira-durante-el-sismo/' },
  { label: 'USGS FDSN event API (mainshock, aftershocks, ShakeMap, PAGER, moment tensor, finite fault, ground failure)', url: 'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us6000tjl2&format=geojson' },
  { label: 'Wikipedia — 2026 Colombia earthquake', url: 'https://en.wikipedia.org/wiki/2026_Colombia_earthquake' },
  { label: 'BBC — Rescuers scramble for survivors with 180 dead in Colombia earthquake', url: 'https://www.bbc.com/news/articles/c20dqd9qwq4o' },
  { label: 'Al Jazeera — Hospitals adapt to save lives amid widespread damage (13 Aug)', url: 'https://www.aljazeera.com/news/2026/8/13/colombia-earthquake-hospitals-adapt-to-save-lives-amid-widespread-damage' },
  { label: 'Al Jazeera — As rubble clears, Colombia begins focusing on recovery (17 Aug)', url: 'https://www.aljazeera.com/news/2026/8/17/as-rubble-clears-colombia-begins-focusing-on-recovery-after-the-earthquake' },
  { label: 'Colombian Geological Survey (SGC) — San José del Palmar, Chocó', url: 'https://www.sgc.gov.co/' },
];
