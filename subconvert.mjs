import { SOURCE_DIR } from './scripts/config.mjs';
import { convertArticle } from './scripts/convert-article.mjs';
import { runFlow } from './scripts/run-flow.mjs';

runFlow(SOURCE_DIR, convertArticle, '没有子 .md 文件需要转换。');
