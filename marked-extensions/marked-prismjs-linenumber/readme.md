# marked-prismjs-linenumber

> A [marked](https://marked.js.org/) extension that highlights Markdown code blocks with [Prism.js](https://prismjs.com/) and renders line numbers

[![npm version](https://img.shields.io/npm/v/marked-prismjs-linenumber.svg)](https://www.npmjs.com/package/marked-prismjs-linenumber)
[![license](https://img.shields.io/npm/l/marked-prismjs-linenumber.svg)](./LICENSE)

## Installation

```bash
npm install marked-prismjs-linenumber
```

You also need `marked` and `prismjs`:

```bash
npm install marked prismjs marked-prismjs-linenumber
```

## Required styles

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-funky.min.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.css"
/>
```

- `prism-funky.min.css` — the syntax theme. You can replace it with any other [Prism theme](https://prismjs.com/#themes).
- `line-numbers.min.css` — required for the line-number gutter, `pre.line-numbers` and `.line-numbers-rows`.

## Usage

### 1. Register the extension

```js
import { marked } from 'marked';
import linenumber from 'marked-prismjs-linenumber';

marked.use(
  linenumber({
    // Optional: preload Prism grammars you need.
    // Anything not loaded falls back to escaped plain text.
    languages: ['javascript', 'typescript', 'css', 'bash', 'json'],
  })
);

const markdown = `
# Example

\`\`\`js
const greeting = 'hello world';
console.log(greeting);
\`\`\`
`;

console.log(marked.parse(markdown));
```

## API

### `linenumber(options?)`

Creates a `marked` extension. Pass it directly to `marked.use(...)`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `languages` | `string[]` | — | Language names or aliases to load via `prismjs/components/index.js`. |

```js
import { marked } from 'marked';
import linenumber from 'marked-prismjs-linenumber';

marked.use(linenumber({ languages: ['javascript', 'python', 'go'] }));
```

If a language is not loaded, or an unknown `lang` is used in a fenced code block, the renderer escapes the raw code and outputs it as plain text.

The extension overrides the `code({ text, lang })` renderer:

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | — | The source code to highlight. |
| `lang` | `string` | `'plaintext'` | Prism language name or alias. |