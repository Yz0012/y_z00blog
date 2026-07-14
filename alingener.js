const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const articleDir = path.join(process.cwd(), 'Article');
const indexPath = path.join(process.cwd(), 'index.html');

const files = fs.readdirSync(articleDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  linkHtml += `<a href="./Article/${file}">${file}</a>\n`;
});

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const $ = cheerio.load(indexHtml);

const articleEl = $('#articlelink');
if (articleEl.length === 0) {
  console.error('💔 找不到id为article的元素');
  process.exit(1);
}
articleEl.empty().append(linkHtml);

fs.writeFileSync(indexPath, $.html(), 'utf8');
console.log('✅ index.html添加新的链接');