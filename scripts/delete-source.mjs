import fs from 'node:fs';
import path from 'node:path';

export function deleteSource(filePath) {
  fs.rmSync(filePath, { force: true });
  console.log(`已删除: ${path.basename(filePath)}`);
}
