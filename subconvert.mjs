import fs from 'node:fs';
import path from 'node:path';

import { SOURCE_DIR } from './scripts/config.mjs';
import { convertArticle } from './scripts/convert-article.mjs';

const files = fs.readdirSync(SOURCE_DIR).filter((file) => file.endsWith('.md'));

if (files.length === 0) {
  console.log('没有子 .md 文件需要转换。');
  process.exit(0);
}

for (const file of files) {
  convertArticle(path.join(SOURCE_DIR, file));
}
