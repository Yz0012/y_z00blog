# marked-element-display

A [marked](https://marked.js.org/) extension that marks a content block with an id and renders a trigger. Clicking the trigger opens the block alone in a new browser page, reusing the stylesheets of the page it was clicked from.

No extra html, css or javascript file is needed.

## Install

```bash
npm i marked-element-display
```

> Requires `marked >= 4` (peer dependency).

## Usage

```js
import { marked } from 'marked';
import elementDisplay from 'marked-element-display';

marked.use(elementDisplay());
```

Wrap the content with `:::` and its id:

````md
:::mycode
```cpp
int main() {
    return 0;
}
```
:::
````

Then write `【mycode】` to place a trigger that points to it.

```html
<div class="element-display" id="mycode">…</div>
<a class="element-display-open" data-target="mycode" href="#mycode">单独查看</a>
```

The trigger itself opens the block in a new page. When the rendered html contains at least one trigger, the extension appends the `<script>` that handles the click.

## API

### `elementDisplay(options?)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `options.block` | `string` | `':::'` | Marks the start and the end of a block |
| `options.inlineOpen` | `string` | `'【'` | Opens an inline trigger |
| `options.inlineClose` | `string` | `'】'` | Closes an inline trigger |
| `options.text` | `string` | `'单独查看'` | Text of the trigger element |

```js
elementDisplay({ block: '@@@', inlineOpen: '<<', inlineClose: '>>', text: '打开' });
```

```md
@@@mycode
...
@@@

点击 <<mycode>>
```

## License

MIT
