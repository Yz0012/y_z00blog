import fs from 'node:fs';
import path from 'node:path';

import { OUTPUT_DIR } from './config.mjs';
import { readFrontMatter, getOutputPath, getParentHtmlPath, stringifyFrontMatter } from './front-matter.mjs';
import { runHooks } from './hooks.mjs';
import { renderMarkdown } from './markdown.mjs';
import { buildPage } from './page.mjs';

export function convertDirectArticle(mdPath, { hooks = [] } = {}) {
  const sourceName = path.basename(mdPath);
  const htmlFileName = sourceName.replace(/\.md$/, '.html');
  console.log(`读取到${htmlFileName}`);

  const { data, content } = readFrontMatter(mdPath);
  const { mtime } = fs.statSync(mdPath);

  const outputPath = getOutputPath(data) || '';
  const parentPath = getParentHtmlPath(data);
  const outputHtmlDir = path.join(OUTPUT_DIR, outputPath);

  if (!fs.existsSync(outputHtmlDir)) {
    fs.mkdirSync(outputHtmlDir, { recursive: true });
  }

  const page = buildPage({
    frontMatter: stringifyFrontMatter(data),
    body: renderMarkdown(content),
    title: path.basename(mdPath, '.md'),
    belongingHref: parentPath ? `{{ site.baseurl }}/Post${parentPath}` : '{{ site.baseurl }}/',
    belongingText: parentPath ? `从属于${path.basename(parentPath)}` : '主页',
  });

  const htmlOutputPath = path.join(outputHtmlDir, htmlFileName);
  fs.writeFileSync(htmlOutputPath, page, 'utf8');
  console.log(`已转换: ${sourceName} → ${path.posix.join('Post', outputPath, htmlFileName)}`);
  runHooks(hooks, {
    sourcePath: mdPath,
    htmlPath: htmlOutputPath,
    htmlFileName,
    outputPath,
    parentPath,
    title: path.basename(mdPath, '.md'),
    time: mtime,
    href: `{{ site.baseurl }}/Post${outputPath}/${htmlFileName}`,
    data,
  });

  return true;
}
