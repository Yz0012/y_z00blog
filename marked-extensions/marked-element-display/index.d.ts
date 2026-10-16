import type { MarkedExtension } from 'marked';

export interface ElementDisplayOptions {
  block?: string;
  inlineOpen?: string;
  inlineClose?: string;
  text?: string;
}

export declare function elementDisplay(options?: ElementDisplayOptions): MarkedExtension;

export default elementDisplay;
