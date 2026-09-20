import fs from 'node:fs';
import path from 'node:path';

import { OUTPUT_DIR } from './config.mjs';
import { readFrontMatter, getOutputPath, getParentHtmlPath } from './front-matter.mjs';
import { renderMarkdown } from './markdown.mjs';
import { buildArticleLink, appendArticleLinkToParent } from './parent-html.mjs';
import { buildPage } from './page.mjs';

export function convertArticle(mdPath) {
  const sourceName = path.basename(mdPath);
  const htmlFileName = sourceName.replace(/\.md$/, '.html');
  console.log(`读取到${htmlFileName}`);

  const { data, content } = readFrontMatter(mdPath);
  const { mtime } = fs.statSync(mdPath);

  const outputPath = getOutputPath(data);
  if (!outputPath) {
    console.log('错误：读取输出路径元数据时出现错误');
    return false;
  }

  const parentPath = getParentHtmlPath(data);
  if (!parentPath) {
    console.log('错误：读取父Html路径元数据时出错');
    return false;
  }

  const outputHtmlDir = path.join(OUTPUT_DIR, outputPath);
  const parentHtmlPath = path.join(OUTPUT_DIR, parentPath);

  if (!fs.existsSync(outputHtmlDir)) {
    fs.mkdirSync(outputHtmlDir, { recursive: true });
  }

  if (!fs.existsSync(parentHtmlPath)) {
    console.log('错误：路径父Html不存在');
    console.log(parentHtmlPath);
    return false;
  }

  const articleLink = buildArticleLink({
    href: `{{ site.baseurl }}/Post${outputPath}/${htmlFileName}`,
    name: htmlFileName,
    time: mtime,
  });
  appendArticleLinkToParent(parentHtmlPath, articleLink);

  const parentHtmlBasename = path.basename(parentHtmlPath);
  const page = buildPage({
    body: renderMarkdown(content),
    title: path.basename(mdPath, '.md'),
    belongingHref: `{{ site.baseurl }}/Post${parentPath}`,
    belongingText: `从属于${parentHtmlBasename}`,
  });

  const htmlOutputPath = path.join(outputHtmlDir, htmlFileName);
  fs.writeFileSync(htmlOutputPath, page, 'utf8');
  console.log(`已转换: ${sourceName} → ${htmlFileName}`);

  return true;
}
