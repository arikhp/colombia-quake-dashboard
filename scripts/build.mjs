/**
 * Bundles the dashboard into one self-contained HTML file.
 *
 * React, the app code, the CSS and ~100 kB of USGS/geo data all end up inlined,
 * so dist/index.html opens straight from the filesystem with no server, no CDN
 * and no network access.
 */
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const OUT_FILE = join(DIST, 'index.html');

const watch = process.argv.includes('--watch');
const dev = process.argv.includes('--dev');

async function build() {
  const result = await esbuild.build({
    entryPoints: [join(SRC, 'main.jsx')],
    bundle: true,
    write: false,
    format: 'iife',
    target: ['es2020'],
    jsx: 'transform',
    minify: !dev,
    sourcemap: false,
    legalComments: 'none',
    define: { 'process.env.NODE_ENV': dev ? '"development"' : '"production"' },
    loader: { '.js': 'jsx' },
    logLevel: 'warning',
  });

  const bundle = result.outputFiles[0].text;
  const css = readFileSync(join(SRC, 'styles.css'), 'utf8');
  const template = readFileSync(join(SRC, 'index.html'), 'utf8');

  // Guard against the bundle terminating the inline <script> element early.
  const safeBundle = bundle.replace(/<\/script/gi, '<\\/script');

  const html = template
    .replace('/*__STYLES__*/', () => (dev ? css : minifyCss(css)))
    .replace('/*__BUNDLE__*/', () => safeBundle);

  mkdirSync(DIST, { recursive: true });
  writeFileSync(OUT_FILE, html, 'utf8');

  const kb = (statSync(OUT_FILE).size / 1024).toFixed(0);
  console.log(`built dist/index.html  ${kb} kB  (single file, no external requests)`);
}

/** Conservative CSS squeeze: comments and redundant whitespace only. */
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s+/g, ' ')
    .trim();
}

await build();

if (watch) {
  const { watch: fsWatch } = await import('node:fs');
  console.log('watching src/ for changes…');
  let timer = null;
  fsWatch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch((e) => console.error(e.message)), 120);
  });
}
