const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const sourceDir = path.join(process.cwd(), 'Markdown');
const outputDir = path.join(process.cwd(), 'Article');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const TEMPLATE = `<!DOCTYPE html>
<html lang="zh">

<head>
    <meta charset="UTF-8">
    <link rel="icon" href="../MainImage/profile.jpg">
    <link rel="stylesheet" href="../defaulttheme.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title></title>
</head>

<body>
<article>
</article></body>
<script src="../defaultscript.js"></script>

</html>`;
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));

if (files.length === 0) {
    console.log('没有 .md 文件需要转换。');
    process.exit(0);
}

files.forEach(file => {
    const mdPath = path.join(sourceDir, file);
    const htmlFileName = file.replace(/\.md$/, '.html');
    const htmlPath = path.join(outputDir, htmlFileName);

    const mdContent = fs.readFileSync(mdPath, 'utf8');

    const bodyContent = marked(mdContent);

    let finalHtml = TEMPLATE.replace('</article></body>', bodyContent + '</article></body>');

    const title = path.basename(file, '.md');
    finalHtml = finalHtml.replace('<title></title>', `<title>${title}</title>`);

    fs.writeFileSync(htmlPath, finalHtml, 'utf8');
    console.log(`✅ 已转换: ${file} → Article/${htmlFileName}`);

    fs.unlinkSync(mdPath);
    console.log(`🗑️  已删除: ${file}`);
});