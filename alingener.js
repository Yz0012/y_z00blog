import fs from 'fs';
import path from 'path';
import cheerio from 'cheerio';

const articleDir = path.join(process.cwd(), 'Article');
const indexPath = path.join(process.cwd(), 'index.html');

const files = fs.readdirSync(articleDir).filter(f => f.endsWith('.html'));

let linkHtml = '<ul>\n';
files.forEach(file => {

  linkHtml += `  <li><a href="./Article/${file}">${file}</a></li>\n`;
});
linkHtml += '</ul>';

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const $ = cheerio.load(indexHtml);

const articleEl = $('#article');
if (articleEl.length === 0) {
  console.error('💔 找不到id为article的元素');
  process.exit(1);
}
articleEl.empty().append(linkHtml);

fs.writeFileSync(indexPath, $.html(), 'utf8');
console.log('✅ index.html添加新的链接');