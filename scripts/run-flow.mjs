import fs from 'node:fs';
import path from 'node:path';

/** 遍历源目录下的所有 .md，逐个交给 convertOne 处理 */
export function runFlow(sourceDir, convertOne, emptyMessage = '没有 .md 文件需要转换。') {
  const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.md'));

  if (files.length === 0) {
    console.log(emptyMessage);
    return;
  }

  for (const file of files) {
    convertOne(path.join(sourceDir, file));
  }
}
