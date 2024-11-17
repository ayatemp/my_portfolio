// article_page.js

// この関数を呼び出すと、MarkdownコンテンツをHTMLに変換して表示します
document.addEventListener("DOMContentLoaded", () => {
    // Markdownテキスト（例として入れてあります。実際にはサーバーから取得したり、入力フィールドから取得したりします）
    const markdownContent = `
# プロジェクトのタイトル
これはプロジェクトに関する詳細な説明です。Markdown形式で記事を書くことができます。

## サブタイトル1
- ポイント1
- ポイント2
- ポイント3

## コード例
\`\`\`javascript
function example() {
    console.log("Hello, world!");
}
\`\`\`

さらに詳細な説明も記述できます。

> これは引用です。
    `;

    // MarkdownをHTMLに変換して表示するための要素
    const articleContent = document.querySelector(".article-content");

    // ライブラリ「marked.js」を使ってMarkdownをHTMLに変換
    articleContent.innerHTML = marked.parse(markdownContent);
});