import fs from 'node:fs';
import path from 'node:path';

import { OUTPUT_DIR } from './config.mjs';
import { readFrontMatter, getOutputPath, getParentHtmlPath } from './front-matter.mjs';
import { renderMarkdown } from './markdown.mjs';
import { buildPage } from './page.mjs';

export function convertDirectArticle(mdPath) {
  const sourceName = path.basename(mdPath);
  const htmlFileName = sourceName.replace(/\.md$/, '.html');
  console.log(`读取到${htmlFileName}`);

  const { data, content } = readFrontMatter(mdPath);

  const outputPath = getOutputPath(data) || '';
  const parentPath = getParentHtmlPath(data);
  const outputHtmlDir = path.join(OUTPUT_DIR, outputPath);

  if (!fs.existsSync(outputHtmlDir)) {
    fs.mkdirSync(outputHtmlDir, { recursive: true });
  }

  const page = buildPage({
    body: renderMarkdown(content),
    title: path.basename(mdPath, '.md'),
    belongingHref: parentPath ? `{{ site.baseurl }}/Post${parentPath}` : '{{ site.baseurl }}/',
    belongingText: parentPath ? `从属于${path.basename(parentPath)}` : '主页',
  });

  const htmlOutputPath = path.join(outputHtmlDir, htmlFileName);
  fs.writeFileSync(htmlOutputPath, page, 'utf8');
  console.log(`已转换: ${sourceName} → ${path.posix.join('Post', outputPath, htmlFileName)}`);

  return true;
}
