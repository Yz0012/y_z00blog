import type { MarkedExtension } from 'marked';

export interface LazyImageOptions {
  /**
   * @default 'lazy'
   */
  loading?: 'lazy' | 'eager';
}

/**
 *
 * @example
 * import { marked } from 'marked';
 * import { lazyImage } from 'marked-lazy-image';
 *
 * marked.use(lazyImage());
 * marked.parse('![alt](a.png)');
 * // => '<p><img src="a.png" alt="alt" loading="lazy"></p>'
 */
export declare function lazyImage(options?: LazyImageOptions): MarkedExtension;

export default lazyImage;