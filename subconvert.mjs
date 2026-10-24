import { SOURCE_DIR } from './scripts/config.mjs';
import { convertArticle } from './scripts/convert-article.mjs';
import { runFlow } from './scripts/run-flow.mjs';
import { addTimelineEntry } from './scripts/timeline.mjs';

runFlow(
  SOURCE_DIR,
  (mdPath) => convertArticle(mdPath, { hooks: [addTimelineEntry] }),
  '没有子 .md 文件需要转换。',
);
