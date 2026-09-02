const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const cheerio = require('cheerio');
const markedKatex = require('marked-katex-extension');

const sourceDir = path.join(process.cwd(), 'SubMarkdown');
const outputDir = path.join(process.cwd(), 'Article');

const katexOptions = { throwOnError: false, nonStandard: true };
marked.use(markedKatex(katexOptions));

const TEMPLATE = `---
---

<!DOCTYPE html>
<html lang="zh">

<head>
    <meta charset="UTF-8">
    <link rel="icon" href="{{ site.baseurl }}/MainImage/profile.jpg">
    <link rel="stylesheet" href="{{ site.baseurl }}/defaulttheme.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.18.5/dist/katex.min.css" integrity="sha384-2dNi/m6JtSiviznrOIZ5fTiZ5As0In2QwkuXSgoqcQtCNplvJAbt+jveeN+8en73" crossorigin="anonymous">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title></title>
</head>

<body>
<a href="" id="belonging"></a>
<article>
</article></body>
<script src="{{ site.baseurl }}/defaultscript.js"></script>

</html>`;
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));

if (files.length === 0) {
    console.log('没有子 .md 文件需要转换。');
    process.exit(0);
}

var linkHtml = '';

files.forEach(file => {
    const mdPath = path.join(sourceDir, file);
    const htmlFileName = file.replace(/\.md$/, '.html');
    console.log(`读取到${htmlFileName}`);
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const stats = fs.statSync(mdPath);

    const matterObject = matter(mdContent);
    const outputPath = readOutputPath(matterObject);
    if (!outputPath) {
        console.log('💥 错误：读取输出路径元数据时出现错误');
        return;
    }

    const parentPath = readParentHtmlPath(matterObject);

    if (!parentPath) {
        console.log('💥 错误：读取父Html路径元数据时出错');
        return;
    }

    const parentHtmlPath = path.join(outputDir, parentPath);
    const outputHtmlDir = path.join(outputDir, outputPath);

    if (!fs.existsSync(outputHtmlDir)) {
        fs.mkdirSync(outputHtmlDir, { recursive: true });
    }

    if (!fs.existsSync(parentHtmlPath)) {
        console.log('💥 错误：路径父Html不存在');
        console.log(parentHtmlPath);
        return;
    }

    const readParentHtml = fs.readFileSync(parentHtmlPath, 'utf-8');

    let nonFrontMatterHtml = removeFrontMatter(readParentHtml);

    const parentHtml = cheerio.load(nonFrontMatterHtml);
    let articleEl = parentHtml('#articlelink');
    if (articleEl.length === 0) {
        const bodyEl = parentHtml('body');
        bodyEl.append('<div id="articlelink"></div>');
        articleEl = parentHtml('#articlelink');
        console.log('添加article元素');
    }

    linkHtml += `<a href="{{ site.baseurl }}/Article${outputPath}/${htmlFileName}">${htmlFileName}</a> <span class="articletime">[${stats.mtime}]</span><br>`;

    articleEl.append(linkHtml);
    console.log(`linkHtml:${linkHtml}`);

    let frontMatterWtHtml = parentHtml.html();

    if (!hasFrontMatter(frontMatterWtHtml)) {
        frontMatterWtHtml = `---
---
${parentHtml.html()}`;
    }

    fs.writeFileSync(parentHtmlPath, frontMatterWtHtml, 'utf8');
    const parentHtmlBasename = path.basename(parentHtmlPath);

    console.log(`✅ ${parentHtmlBasename}添加新的链接`);

    const bodyContent = marked(matterObject.content);

    let finalHtml = TEMPLATE.replace('</article></body>', bodyContent + '</article></body>');

    const title = path.basename(file, '.md');
    finalHtml = finalHtml.replace('<title></title>', `<title>${title}</title>`);

    finalHtml = finalHtml.replace('<a href="" id="belonging"></a>', `<a href="{{ site.baseurl }}/Article${parentPath}" id="belonging">从属于${parentHtmlBasename}</a>`);

    const htmlOutputPath = path.join(outputHtmlDir, htmlFileName);

    fs.writeFileSync(htmlOutputPath, finalHtml, 'utf8');
    console.log(`✅ 已转换: ${file} → ${htmlFileName}`);

    fs.unlinkSync(mdPath);
    console.log(`🗑️ 已删除: ${file}`);
});

function readOutputPath(md) {
    if (md.data.outputDir) {
        const outputPath = md.data.outputDir;
        return outputPath;
    } else {
        return false;
    }
}

function readParentHtmlPath(md) {
    if (md.data.parentPath) {
        const parentPath = md.data.parentPath;
        return parentPath;
    } else {
        return false;
    }
}

function addLinktoParentHtml(md) {
    const html = cheerio.load(md);
}

function hasFrontMatter(str) {
    return /^---\s*\n[\s\S]*?\n---\s*\n/.test(str);
}

function removeFrontMatter(str) {
    const match = str.match(/^(---\s*\n[\s\S]*?\n---\s*\n)/);
    if (match) {
        return str.slice(match[0].length);
    }
    return str;
}