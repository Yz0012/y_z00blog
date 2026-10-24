import fs from 'node:fs';
import { load } from 'cheerio';
import matter from 'gray-matter';

import { TIMELINE_PATH } from './config.mjs';

function monthOf(value) {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function buildTimelineEntry({ title, href, time }) {
  return `<div class="timeline-item"><a href="${href}">${title}</a> <span class="articletime">[${time}]</span></div>`;
}

export function addTimelineEntry(article) {
  const raw = fs.readFileSync(TIMELINE_PATH, 'utf8');
  const parsed = matter(raw);
  const $ = load(parsed.content);
  const container = $('#articlelink');

  if (container.length === 0) {
    console.error('找不到id为articlelink的元素');
    return;
  }

  const month = monthOf(article.time);
  const sections = container.find('section.timeline-month');
  let section = sections
    .filter((index, element) => $(element).find('h3').attr('id') === month)
    .first();

  if (section.length === 0) {
    section = $(`<section class="timeline-month"><h3 id="${month}">${month}</h3><div class="timeline-list"></div></section>`);
    const next = sections
      .filter((index, element) => ($(element).find('h3').attr('id') || '') > month)
      .first();

    if (next.length > 0) {
      next.before(section);
    } else {
      container.append(section);
    }
  }

  section.find('.timeline-list').append(buildTimelineEntry(article));

  const frontMatter = parsed.matter.trim() ? `---\n${parsed.matter.trim()}\n---` : '---\n---';
  fs.writeFileSync(TIMELINE_PATH, `${frontMatter}\n${$.html()}`, 'utf8');
}
