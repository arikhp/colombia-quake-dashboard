/**
 * Smoke test for the built dashboard.
 *
 * Loads dist/index.html in headless Chrome once per tab, checks the rendered DOM
 * for content that only exists if React mounted and the data survived the build,
 * and writes a screenshot of each tab to screenshots/.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'index.html');
const SHOTS = join(ROOT, 'screenshots');
const TMP = join(ROOT, '.verify-dom.html');

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const browser = process.env.CHROME_PATH || CANDIDATES.find((p) => existsSync(p));
if (!browser) {
  console.error('No Chromium-based browser found. Set CHROME_PATH.');
  process.exit(1);
}

/**
 * Each tab, with strings that must appear in the DOM for that tab to count as
 * rendered. Includes chart axis labels, so a chart that throws is caught too.
 */
const TABS = [
  { id: 'overview', size: '1600,2600', probes: ['What happened', 'PEOPLE EXPOSED', 'REPORTED DEATHS', 'Economic losses', 'Azimuthal gap'] },
  { id: 'map', size: '1600,2400', probes: ['Shaking intensity and impact', 'Affected region', 'Hypocentral', 'Map contents', 'Cali in context'] },
  { id: 'cali', size: '1600,2600', probes: ['What happened in Cali', 'Tequendama', 'University Hospital of Valle', 'Reconstruction'] },
  { id: 'pereira', size: '1600,2600', probes: ['What happened in Pereira', 'Matecaña', 'cable car', 'Pereira in context'] },
  { id: 'impact', size: '1600,2600', probes: ['Deaths and injuries by department', 'Valle del Cauca', 'Secondary hazards', 'Liquefaction'] },
  { id: 'seismology', size: '1600,2600', probes: ['Focal mechanism', 'Nodal plane 1', 'DEPTH (km)', 'Rupture model', 'Catalogued events'] },
  { id: 'loss', size: '1600,2800', probes: ['Probability of the fatality total', 'log scale', 'Adobe / mud wall with wood', 'Model versus outcome'] },
  { id: 'response', size: '1600,2800', probes: ['Chronology of the response', 'World Bank', 'The aid controversy', 'What went wrong'] },
  { id: 'sources', size: '1600,2200', probes: ['Machine-read sources', 'Known conflicts in the reporting', 'Method notes'] },
];

const flags = (url, extra) => [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--virtual-time-budget=6000',
  ...extra,
  url,
];

rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

let failures = 0;

for (const tab of TABS) {
  const url = `file:///${DIST.replace(/\\/g, '/')}#${tab.id}`;

  await run(browser, flags(url, [`--window-size=${tab.size}`, `--dump-dom`]), {
    maxBuffer: 64 * 1024 * 1024,
  }).then(({ stdout }) => {
    const missing = tab.probes.filter((p) => !stdout.includes(p));
    const rootEmpty = /<div id="root"><\/div>/.test(stdout);
    if (rootEmpty) {
      console.log(`FAIL #${tab.id}: React did not mount (empty root)`);
      failures++;
    } else if (missing.length) {
      console.log(`FAIL #${tab.id}: missing ${missing.map((m) => JSON.stringify(m)).join(', ')}`);
      failures++;
    } else {
      const nodes = (stdout.match(/</g) || []).length;
      console.log(`ok   #${tab.id.padEnd(11)} ${tab.probes.length} probes, ~${nodes} tags`);
    }
  });

  await run(
    browser,
    flags(url, [`--window-size=${tab.size}`, `--screenshot=${join(SHOTS, `${tab.id}.png`)}`]),
    { maxBuffer: 16 * 1024 * 1024 }
  );
}

if (existsSync(TMP)) rmSync(TMP);

const size = (readFileSync(DIST).length / 1024).toFixed(0);
console.log(`\n${TABS.length - failures}/${TABS.length} tabs rendered · dist/index.html ${size} kB`);
console.log(`screenshots in ${SHOTS}`);
process.exit(failures ? 1 : 0);
