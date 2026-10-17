import fs from 'node:fs';
import path from 'node:path';

import { OUTPUT_DIR, ROOT_DIR } from './scripts/config.mjs';

const SITE_URL = 'https://yz0012.github.io/y_z00blog';
const OUTPUT_FILE = path.join(ROOT_DIR, 'sitemap.xml');

function listHtmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listHtmlFiles(fullPath);
    }
    return entry.name.endsWith('.html') ? [fullPath] : [];
  });
}

function toRoute(filePath) {
  const relative = path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
  return `/${relative.split('/').map(encodeURIComponent).join('/')}`;
}

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const routes = ['/', ...listHtmlFiles(OUTPUT_DIR).map(toRoute)];
const urls = routes.map((route) => `  <url><loc>${escapeXml(SITE_URL + route)}</loc></url>`);

fs.writeFileSync(
  OUTPUT_FILE,
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`,
  'utf8',
);

console.log(`sitemap.xml: ${urls.length} urls`);
