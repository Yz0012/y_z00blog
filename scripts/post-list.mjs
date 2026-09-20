import fs from 'node:fs';

import { OUTPUT_DIR } from './config.mjs';

/** 列出 Post 根目录下的 html 文件名 */
export function listTopLevelPostNames() {
  return fs.readdirSync(OUTPUT_DIR).filter((file) => file.endsWith('.html'));
}
