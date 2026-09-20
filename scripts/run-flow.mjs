import fs from 'node:fs';
import path from 'node:path';

import { deleteSource } from './delete-source.mjs';

export function runFlow(sourceDir, convertOne, emptyMessage = '没有 .md 文件需要转换。') {
  const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.md'));

  if (files.length === 0) {
    console.log(emptyMessage);
    return;
  }

  for (const file of files) {
    const mdPath = path.join(sourceDir, file);
    try {
      convertOne(mdPath);
    } finally {
      deleteSource(mdPath);
    }
  }
}
