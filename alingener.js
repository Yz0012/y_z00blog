const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const articleDir = path.join(process.cwd(), 'Article');
const indexPath = path.join(process.cwd(), 'index.html');

const files = fs.readdirSync(articleDir).filter(f => f.endsWith('.html'));

const fileData = files.map(file => {
  const filePath = path.join(articleDir, file);
  const stats = fs.statSync(filePath);
  return {
    name: file,
  };
});

let linkHtml = '';
fileData.forEach(({ name }) => {
  linkHtml += `<a href="{{ sitebaseurl }}/Article/${name}">${name}</a>`;
});

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const $ = cheerio.load(indexHtml);

const articleEl = $('#articlelink');
if (articleEl.length === 0) {
  console.error('💔 找不到id为articlelink的元素');
  return;
}
articleEl.empty().append(linkHtml);

fs.writeFileSync(indexPath, $.html(), 'utf8');
console.log('✅ index.html添加新的链接');