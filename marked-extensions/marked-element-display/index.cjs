'use strict';

const DEFAULTS = {
  block: ':::',
  inlineOpen: '【',
  inlineClose: '】',
  text: '单独查看',
};

const CLIENT_SCRIPT = `<script>(function () {
  function openDisplay(target) {
    var page = window.open('', '_blank');
    if (!page) return;
    var doc = page.document;
    doc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body></body></html>');
    doc.close();
    var nodes = document.querySelectorAll('link[rel="stylesheet"], style, meta[name="viewport"]');
    Array.prototype.forEach.call(nodes, function (node) {
      var copy = node.cloneNode(true);
      if (copy.tagName === 'LINK') {
        copy.href = node.href;
      }
      doc.head.appendChild(copy);
    });
    doc.title = document.title;
    doc.body.className = document.body.className;
    var article = doc.createElement('article');
    article.appendChild(target.cloneNode(true));
    doc.body.appendChild(article);
  }
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('.element-display-open');
    if (!trigger) return;
    var target = document.getElementById(trigger.dataset.target);
    if (!target) return;
    event.preventDefault();
    openDisplay(target);
  });
})();</script>`;

function escapeAttr(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function elementDisplay(options = {}) {
  const { block, inlineOpen, inlineClose, text } = { ...DEFAULTS, ...options };

  const blockMark = escapeRegExp(block);
  const openMark = escapeRegExp(inlineOpen);
  const closeMark = escapeRegExp(inlineClose);

  const blockStart = new RegExp(`^${blockMark}`, 'm');
  const blockMatch = new RegExp(
    `^${blockMark}[ \\t]*([^\\s]+?)[ \\t]*\\n([\\s\\S]+?)\\n${blockMark}[ \\t]*(?:\\n+|$)`,
  );
  const inlineStart = new RegExp(openMark);
  const inlineMatch = new RegExp(`^${openMark}([^\\s]+?)${closeMark}`);

  return {
    extensions: [
      {
        name: 'elementDisplay',
        level: 'block',
        start(src) {
          return src.match(blockStart)?.index;
        },
        tokenizer(src) {
          const match = blockMatch.exec(src);
          if (!match) {
            return undefined;
          }
          return {
            type: 'elementDisplay',
            raw: match[0],
            id: match[1],
            tokens: this.lexer.blockTokens(match[2], []),
          };
        },
        renderer(token) {
          return `<div class="element-display" id="${escapeAttr(token.id)}">${this.parser.parse(token.tokens)}</div>\n`;
        },
      },
      {
        name: 'elementDisplayOpen',
        level: 'inline',
        start(src) {
          return src.match(inlineStart)?.index;
        },
        tokenizer(src) {
          const match = inlineMatch.exec(src);
          if (!match) {
            return undefined;
          }
          return {
            type: 'elementDisplayOpen',
            raw: match[0],
            id: match[1],
          };
        },
        renderer(token) {
          const id = escapeAttr(token.id);
          return `<a class="element-display-open" data-target="${id}" href="#${id}">${escapeAttr(text)}</a>`;
        },
      },
    ],
    hooks: {
      postprocess(html) {
        if (!html.includes('element-display-open')) {
          return html;
        }
        return html + CLIENT_SCRIPT;
      },
    },
  };
}

module.exports = elementDisplay;
module.exports.elementDisplay = elementDisplay;
module.exports.default = elementDisplay;
