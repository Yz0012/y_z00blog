import { INDEX_PATH } from './scripts/config.mjs';
import { buildIndexLink, setArticleLinks } from './scripts/index-html.mjs';
import { listTopLevelPostNames } from './scripts/post-list.mjs';

const linksHtml = listTopLevelPostNames().map(buildIndexLink).join('');

setArticleLinks(INDEX_PATH, linksHtml);
