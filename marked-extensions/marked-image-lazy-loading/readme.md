# marked-lazy-image

Add `loading="lazy"` to all images rendered by [marked](https://github.com/markedjs/marked).

## Install

```bash
npm i marked-lazy-image
```

> Requires `marked >= 4` (peer dependency).

## Usage

**ESM / TypeScript**

```ts
import { marked } from 'marked';
import { lazyImage } from 'marked-lazy-image';

marked.use(lazyImage());

marked.parse('![alt](a.png)');
// <p><img src="a.png" alt="alt" loading="lazy"></p>
```

**CommonJS**

```js
const { marked } = require('marked');
const lazyImage = require('marked-lazy-image');

marked.use(lazyImage());
```

## API

### `lazyImage(options?)`

Returns a marked extension object.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `options.loading` | `'lazy' \| 'eager'` | `'lazy'` | Value written to the `<img>` `loading` attribute |

```ts
marked.use(lazyImage({ loading: 'eager' }));
// <img src="a.png" alt="alt" loading="eager">
```

## License

MIT