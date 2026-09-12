const Prism = require('prismjs');
const loadLanguages = require('prismjs/components/');

function linenumber(options = {}) {
    if (Array.isArray(options.languages)) {
        loadLanguages(options.languages);
    }

    return {
        renderer: {
            code({ text, lang }) {
                const language = lang || 'plaintext';
                const grammar = Prism.languages[language] || Prism.languages.plaintext;
                const code = text.trimEnd();

                let highlightedCode;
                if (grammar) {
                    highlightedCode = Prism.highlight(code, grammar, language);
                } else {
                    highlightedCode = code
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                }

                const lineCount = code.split('\n').length;
                const rowsSpans = '<span></span>'.repeat(lineCount);
                const rowsWrapper = `<span aria-hidden="true" class="line-numbers-rows">${rowsSpans}</span>`;

                return `<pre class="line-numbers language-${language}"><code class="language-${language}">${highlightedCode}${rowsWrapper}</code></pre>`;
            }
        }
    };
}

module.exports = linenumber;
module.exports.default = linenumber;
module.exports.linenumber = linenumber;