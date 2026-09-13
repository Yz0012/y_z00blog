import fs from 'node:fs';
import path from 'node:path';

import { DIRECT_SOURCE_DIR } from './scripts/config.mjs';
import { convertDirectArticle } from './scripts/convert-direct.mjs';

const files = fs.readdirSync(DIRECT_SOURCE_DIR).filter((file) => file.endsWith('.md'));

if (files.length === 0) {
  console.log('没有 .md 文件需要转换。');
  process.exit(0);
}

for (const file of files) {
  convertDirectArticle(path.join(DIRECT_SOURCE_DIR, file));
}
