# marked-prism-linenumber

> A [marked](https://marked.js.org/) renderer that highlights Markdown code blocks with [Prism.js](https://prismjs.com/) and renders line numbers — just like the `line-numbers` plugin, but produced straight from the Markdown parser.

[![npm version](https://img.shields.io/npm/v/marked-prism-linenumber.svg)](https://www.npmjs.com/package/marked-prism-linenumber)
[![license](https://img.shields.io/npm/l/marked-prism-linenumber.svg)](./LICENSE)

## Installation

```bash
npm install marked-prism-linenumber
```

Or with pnpm / yarn:

```bash
pnpm add marked-prism-linenumber
yarn add marked-prism-linenumber
```

You also need `marked` and `prismjs`:

```bash
npm install marked prismjs marked-prism-linenumber
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

### 1. Register the renderer

```js
import { marked } from 'marked';
import { renderer, init } from 'marked-prism-linenumber';

// Optional: preload Prism grammars you need.
// Anything not loaded falls back to escaped plain text.
init({ languages: ['javascript', 'typescript', 'css', 'bash', 'json'] });

// Hook the renderer into marked.
marked.use({ renderer });

const markdown = `
# Example

\`\`\`js
const greeting = 'hello world';
console.log(greeting);
\`\`\`
`;

console.log(marked.parse(markdown));
```

### 2. Output

The code block above is rendered as:

```html
<pre class="line-numbers language-js">
  <code class="language-js">
    <span class="token keyword">const</span> greeting <span class="token operator">=</span> ...
    <span aria-hidden="true" class="line-numbers-rows">
      <span></span><span></span>
    </span>
  </code>
</pre>
```

Each `<span></span>` inside `.line-numbers-rows` becomes one line number via the Prism line-numbers CSS.

## API

### `init(options?)`

Loads Prism language grammars before rendering. Call it once at startup.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `languages` | `string[]` | — | Language names or aliases to load via `prismjs/components/index.js`. |

```js
init({ languages: ['javascript', 'python', 'go'] });
```

If a language is not loaded, or an unknown `lang` is used in a fenced code block, the renderer escapes the raw code and outputs it as plain text.

### `renderer`

A `marked` renderer object exposing a single `code({ text, lang })` method. Pass it to `marked.use({ renderer })`.

```js
import { marked } from 'marked';
import { renderer } from 'marked-prism-linenumber';

marked.use({ renderer });
```

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `code` | `string` | — | The source code to highlight. |
| `lang` | `string` | `'plaintext'` | Prism language name or alias. |