import { TOP_SOURCE_DIR } from './scripts/config.mjs';
import { convertDirectArticle } from './scripts/convert-direct.mjs';
import { runFlow } from './scripts/run-flow.mjs';

runFlow(TOP_SOURCE_DIR, convertDirectArticle);
