export interface PrismJsLineNumberOptions {
  languages?: string[];
}

export interface MarkedCodeArgs {
  text: string;
  lang?: string;
}

export interface MarkedExtension {
  renderer: {
    code(args: MarkedCodeArgs): string;
  };
}

declare function linenumber(options?: PrismJsLineNumberOptions): MarkedExtension;

export { linenumber };
export default linenumber;