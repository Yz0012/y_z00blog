const Prism = require('prismjs');
const loadLanguages = require('prismjs/components/');

function highlightWithLineNumbers(code, lang = 'plaintext') {
    const grammar = Prism.languages[lang] || Prism.languages.plaintext;

    let highlightedCode;
    if (grammar) {
        highlightedCode = Prism.highlight(code, grammar, lang);
    } else {
        highlightedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    const lineCount = code.split('\n').length;
    const rowsSpans = '<span></span>'.repeat(lineCount);
    const rowsWrapper = `<span aria-hidden="true" class="line-numbers-rows">${rowsSpans}</span>`;
    return `<pre class="line-numbers language-${lang}"><code class="language-${lang}">${highlightedCode}${rowsWrapper}</code></pre>`;
}

const renderer = {
    code({ text, lang }) {
        const trimmedCode = text.trimEnd();
        return highlightWithLineNumbers(trimmedCode, lang || 'plaintext');
    }
};

function init(options = {}) {
    if (Array.isArray(options.languages)) {
        loadLanguages(options.languages);
    }
}

module.exports = {
    renderer,
    init
};