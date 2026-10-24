import fs from 'node:fs';
import { load } from 'cheerio';

import { TIMELINE_PATH } from './config.mjs';

function formatTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildId(outputPath, htmlFileName) {
  return `${outputPath}/${htmlFileName}`
    .replace(/^\/+/, '')
    .replace(/\.html$/, '')
    .replace(/[\\/\s]+/g, '-');
}

export function buildTimelineEntry({ title, href, time, outputPath, htmlFileName }) {
  const id = buildId(outputPath, htmlFileName);
  return `<div class="timeline-item" id="${id}"><a href="${href}">${title}</a> <span class="articletime">[${formatTime(time)}]</span></div>`;
}

export function addTimelineEntry(article) {
  const raw = fs.readFileSync(TIMELINE_PATH, 'utf8');
  const $ = load(raw);
  const container = $('#articlelink');

  if (container.length === 0) {
    console.error('找不到id为articlelink的元素');
    return;
  }

  container.append(buildTimelineEntry(article));

  fs.writeFileSync(TIMELINE_PATH, $.html(), 'utf8');
}
