const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const articleDir = path.join(process.cwd(), 'Post');
const indexPath = path.join(process.cwd(), 'index.html');

const files = fs.readdirSync(articleDir).filter(f => f.endsWith('.html'));

const fileData = files.map(file => {
  const filePath = path.join(articleDir, file);
  const stats = fs.statSync(filePath);
  return {
    name: file,
  };
});

const indexHtml = fs.readFileSync(indexPath, 'utf8');

let nonFrontMatterHtml = removeFrontMatter(indexHtml);

const $ = cheerio.load(nonFrontMatterHtml);

let linkHtml = '';
fileData.forEach(({ name }) => {
  const articleEl = $('#articlelink');
  if (articleEl.length === 0) {
    console.error('💔 找不到id为articlelink的元素');
    return;
  }
  linkHtml = `<a href="{{ site.baseurl }}/Post/${name}">${name}</a>`;
  articleEl.empty().append(linkHtml);
});

let frontMatterWtHtml = $;

console.log(frontMatterWtHtml);

console.log('-----');

if (!hasFrontMatter(frontMatterWtHtml)) {
  frontMatterWtHtml = `---
---
${$.html()}`;
}

console.log(frontMatterWtHtml);

fs.writeFileSync(indexPath, frontMatterWtHtml, 'utf8');
const parentHtmlBasename = path.basename(indexPath);

console.log(`✅ ${parentHtmlBasename}添加新的链接`);

function hasFrontMatter(str) {
  return /^---\s*\n[\s\S]*?\n---\s*\n/.test(str);
}

function removeFrontMatter(str) {
  const match = str.match(/^(---\s*\n[\s\S]*?\n---\s*\n)/);
  if (match) {
    return str.slice(match[0].length);
  }
  return str;
}