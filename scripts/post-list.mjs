import fs from 'node:fs';

import { OUTPUT_DIR } from './config.mjs';

export function listTopLevelPostNames() {
  return fs.readdirSync(OUTPUT_DIR).filter((file) => file.endsWith('.html'));
}
