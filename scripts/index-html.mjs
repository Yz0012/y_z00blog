import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

/** 生成主页里的一条文章链接 */
export function buildIndexLink(name) {
  return `<a href="./Post/${name}">${name}</a>`;
}

/** 用给定的链接 HTML 重建主页 #articlelink 的内容 */
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
