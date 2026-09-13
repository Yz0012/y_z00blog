const TEMPLATE = `---
---

<!DOCTYPE html>
<html lang="zh">

<head>
    <meta charset="UTF-8">
    <link rel="icon" href="{{ site.baseurl }}/MainImage/profile.jpg">
    <link rel="stylesheet" href="{{ site.baseurl }}/defaulttheme.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-funky.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.18.5/dist/katex.min.css" integrity="sha384-2dNi/m6JtSiviznrOIZ5fTiZ5As0In2QwkuXSgoqcQtCNplvJAbt+jveeN+8en73" crossorigin="anonymous">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
</head>

<body>
<a href="" id="belonging"></a>
<article>
</article></body>
<script src="{{ site.baseurl }}/defaultscript.js"></script>

</html>`;

export function buildPage({ body, title, belongingHref, belongingText }) {
  let html = TEMPLATE.replace('</article></body>', body + '</article></body>');
  html = html.replace('<title></title>', `<title>${title}</title>`);
  html = html.replace(
    '<a href="" id="belonging"></a>',
    `<a href="${belongingHref}" id="belonging">${belongingText}</a>`,
  );
  return html;
}
