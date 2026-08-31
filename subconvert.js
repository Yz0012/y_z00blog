const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const cheerio = require('cheerio');

const sourceDir = path.join(process.cwd(), 'SubMarkdown');
let outputDir = path.join(process.cwd(), 'Article');

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
<a href="" id="belonging"></a>
<article>
</article></body>
<script src="../defaultscript.js"></script>

</html>`;
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));

if (files.length === 0) {
    console.log('没有子 .md 文件需要转换。');
    process.exit(0);
}

files.forEach(file => {
    const mdPath = path.join(sourceDir, file);
    const htmlFileName = file.replace(/\.md$/, '.html');

    const mdContent = fs.readFileSync(mdPath, 'utf8');

    const matterObject = matter(mdContent);
    const outputPath = readOutputPath(matterObject);
    if (!outputPath) {
        console.log('💥 错误：读取输出路径元数据时出现错误');
        return;
    }

    let parentPath = readParentHtmlPath(matterObject);

    if (!parentPath) {
        console.log('💥 错误：读取父Html路径元数据时出错');
        return;
    }

    parentPath = path.join(outputDir, parentPath);
    outputDir = path.join(outputDir, outputPath);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    if (!fs.existsSync(parentPath)) {
        console.log('💥 错误：路径父Html不存在');
        console.log(parentPath);
        return;
    }

    const readParentHtml = fs.readFileSync(parentPath, 'utf-8');
    const parentHtml = cheerio.load(readParentHtml);
    let articleEl = parentHtml('#articlelink');
    if (articleEl.length === 0) {
        const bodyEl = parentHtml('body');
        bodyEl.append('<div id="article"></div>');
        articleEl = parentHtml('#articlelink');
        console.log('添加article元素');
    }

    const fileData = files.map(file => {
        const filePath = path.join(sourceDir, file);
        const stats = fs.statSync(filePath);
        return {
            name: file,
            mtime: stats.mtime
        };
    });

    fileData.sort((a, b) => b.mtime - a.mtime);

    let linkHtml = '';
    fileData.forEach(({ name, mtime }) => {
        linkHtml += `<a href="./Article/${name}">${name}</a> <span class="articletime">[${mtime}]</span><br>`;
    });

    articleEl.empty().append(linkHtml);
    console.log(`linkHtml:${linkHtml}`);

    fs.writeFileSync(parentPath, parentHtml.html(), 'utf8');

    const parentHtmlBasename = path.basename(parentPath);

    console.log(`✅ ${parentHtmlBasename}添加新的链接`);

    const bodyContent = marked(mdContent);

    let finalHtml = TEMPLATE.replace('</article></body>', bodyContent + '</article></body>');

    const title = path.basename(file, '.md');
    finalHtml = finalHtml.replace('<title></title>', `<title>${title}</title>`);

    finalHtml = finalHtml.replace('<a href="" id="belonging"></a>', `<a href=".${parentPath}" id="belonging>从属于${parentHtmlBasename}</a>`);

    const htmlOutputPath = path.join(outputDir, htmlFileName);

    fs.writeFileSync(htmlOutputPath, finalHtml, 'utf8');
    console.log(`✅ 已转换: ${file} → Article/${htmlFileName}`);

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