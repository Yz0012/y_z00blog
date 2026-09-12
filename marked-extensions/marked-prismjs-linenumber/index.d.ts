export interface PrismJsLineNumberOptions {
  languages?: string[];
}

export interface MarkedCodeArgs {
  text: string;
  lang?: string;
}

export const renderer: {
  code(args: MarkedCodeArgs): string;
};

export function init(options?: PrismJsLineNumberOptions): void;

declare const _default: {
  renderer: typeof renderer;
  init: typeof init;
};

export default _default;