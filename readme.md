### 这里是我用于发布个人文章的项目

当然可用于文章的发布，所以请先了解以下信息

### 发布文章

> [!CAUTION]
> 转换完成后Action会自动删除对应的md文件，假如转换过程中出现问题，Action也会删除上传的md文件，所以请务必保留md文件副本

以下有几种发布文章的情况

#### 1.初始目录文章

项目里的Markdown文件夹用于直接转换md文件到html文件

#### 2.子文章

项目里的SubMarkdown文件夹用于直接转换md文件到html文件，上传的文件必须含有元数据

```md
---

outputDir: 
parentPath: 

---
```

outputDir的起始位置是项目的发布文件夹
parentPath指的是父文章

使用方法:

```md
---

outputDir: /杂项
parentPath: /杂项.html

---
```

这将会转换md文件到发布文件夹->杂项内，如果输出文件夹不存在，会自动创建

#### 3.直接转换

DirectMarkdown文件夹用于放入直接转换的md文件，有outputDir元数据会输出到对应文件夹下，否则会直接输出到Post文件夹下。这个功能可用于替换旧的html文件而不破坏目录结构

#### 4.index.html
index.html只能手动改，只有初始目录文章转换的链接才会自动出现在这上面

> [!WARNING]
> 在Markdown，SubMarkdown和DirectMarkdown文件夹下同时放入md文件，由于项目流程上并没有区分它们提交的顺序，这会导致部分流程提交失败。暂时不会考虑同时提交的功能

### 模板
模板的可以在scripts->page.mjs下找到

### 插件
插件的可以在scripts->markdown.mjs下找到，你可以在里面找到用了哪些插件

[lazyImage](/marked-extensions/marked-image-lazy-loading/readme.md)

[linenumber](/marked-extensions/marked-prismjs-linenumber/readme.md)

[elementDisplay](/marked-extensions/marked-element-display/readme.md)

### 删除html
不会支持，因为存在相互引用，html之间并非纯粹机械化的关系，只能手动删除

### jekyll
因为github page的目录与本地目录不同，所以html中需要使用元数据以启用jekyll，html中的'site.baseurl'值在_config.yml可以找到