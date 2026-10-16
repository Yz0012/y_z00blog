import { Marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import linenumber from 'marked-prismjs-linenumber';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import markedAlert from 'marked-alert';
import lazyImage from 'marked-image-lazy-loading';
import elementDisplay from 'marked-element-display';

const KATEX_OPTIONS = { throwOnError: false, nonStandard: true };
const LINE_NUMBER_OPTIONS = { languages: ['cpp'] };
const GFM_HEADING_ID_OPTIONS = { prefix: 'title-' };

const marked = new Marked()
  .use(markedKatex(KATEX_OPTIONS))
  .use(linenumber(LINE_NUMBER_OPTIONS))
  .use(gfmHeadingId(GFM_HEADING_ID_OPTIONS))
  .use(markedAlert())
  .use(lazyImage())
  .use(elementDisplay());

export function renderMarkdown(content) {
  return marked.parse(content);
}
