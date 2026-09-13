import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import matter from 'gray-matter';

export function buildArticleLink({ href, name, time }) {
  return `<a href="${href}">${name}</a> <span class="articletime">[${time}]</span><br>`;
}

export function appendArticleLinkToParent(parentHtmlPath, linkHtml) {
  const raw = fs.readFileSync(parentHtmlPath, 'utf8');
  const $ = load(matter(raw).content);

  let articleEl = $('#articlelink');
  if (articleEl.length === 0) {
    $('body').append('<div id="articlelink"></div>');
    articleEl = $('#articlelink');
    console.log('添加article元素');
  }

  articleEl.append(linkHtml);

  fs.writeFileSync(parentHtmlPath, `---\n---\n${$.html()}`, 'utf8');
  console.log(`✅ ${path.basename(parentHtmlPath)}添加新的链接`);
}
