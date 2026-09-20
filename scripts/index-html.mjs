import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

export function buildIndexLink(name) {
  return `<a href="./Post/${name}">${name}</a>`;
}

export function setArticleLinks(indexPath, linksHtml) {
  const raw = fs.readFileSync(indexPath, 'utf8');
  const $ = load(raw);

  const articleEl = $('#articlelink');
  if (articleEl.length === 0) {
    console.error('找不到id为articlelink的元素');
    return false;
  }

  articleEl.empty().append(linksHtml);

  fs.writeFileSync(indexPath, $.html(), 'utf8');
  console.log(`${path.basename(indexPath)}添加新的链接`);
  return true;
}
