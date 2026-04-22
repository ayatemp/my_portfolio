---
title: "Codex PDF Translator"
description: "PDF論文をCodex CLIで翻訳し、図表や疑似コードを保った日本語Markdown/PDFとして読みやすく再構成するローカルツール。"
category: "LLM Tooling"
stack: ["Python", "Codex CLI", "PyMuPDF", "Markdown", "Chrome PDF"]
date: "2026-04-23"
featured: true
links:
  - label: "GitHub"
    url: "https://github.com/ayatemp/codex-pdf-translator"
---

## 概要

**Codex PDF Translator** は、英語PDF論文を日本語で読みやすい形に変換するためのローカルツールです。

元のPDFからテキスト、ページ構造、図表領域を抽出し、翻訳はローカルの **Codex CLI** に任せます。OpenAI APIキーをツール側に保存する必要がなく、普段のCodexログイン状態をそのまま利用できます。

GitHubはこちらです。

[https://github.com/ayatemp/codex-pdf-translator](https://github.com/ayatemp/codex-pdf-translator)

## 作った背景

研究論文を読むとき、単に本文だけを翻訳しても読みづらいことが多いです。

特に論文では、次の要素が理解に大きく関わります。

- 表
- 図
- 数式
- 疑似コード
- 参考文献
- 手法名やシステム名

これらを全部テキストとして翻訳しようとすると、表が崩れたり、疑似コードが読みにくくなったり、英語のままでよい固有名詞まで翻訳されてしまいます。

そこで、本文は日本語にしつつ、図表や疑似コードはスクリーンショットとして残し、MarkdownとPDFに再構成する方針にしました。

## できること

- PDFからテキストブロックと座標情報を抽出
- 論文をCodexが扱いやすいchunkに分割
- `codex exec` でchunkごとに翻訳
- 翻訳済みchunkを1つの `translations.json` に統合
- 日本語本文をMarkdownとして出力
- 図、表、疑似コードをPNGとして切り出してMarkdownに埋め込み
- MarkdownをChromeの印刷エンジンでPDF化

最終的には、次のような出力を作れます。

```text
runs/my-paper/output/markdown/
  paper-ja.md
  paper-ja.html
  paper-ja.pdf
  assets/
    page-02-figure-01.png
    page-07-algorithm-01.png
```

## 工夫した点

### Markdown経由にしたこと

最初はPDFへ直接翻訳を重ねる方式を試しましたが、日本語は英語より長くなりやすく、論文PDFの枠に収めると文字が小さくなったり、表や数式の周辺が崩れたりしました。

そこで、PDFの完全再現よりも「読む体験」を優先し、Markdownを中間形式にしました。本文は日本語として読みやすく流し込み、図表は画像として残すことで、論文全体の構造を保ちやすくしています。

### 疑似コードを画像として残すこと

アルゴリズムの疑似コードは、翻訳テキストとして再構成するとインデントや式が崩れやすい部分です。

そのため、`Algorithm 1` のような領域はPDFから自動検出し、スクリーンショットとしてMarkdownへ埋め込むようにしました。本文では日本語の説明を読み、細かい手順は元の疑似コード画像で確認できます。

### 翻訳しすぎを避けること

参考文献、手法名、データセット名、システム名などは、無理に日本語化しない方が読みやすい場合があります。

このツールでは、論文中の専門用語や固有名詞をなるべく保ちながら、本文だけを自然な日本語に寄せることを重視しています。

## 使い方の例

```bash
codex-pdf-translate prepare path/to/paper.pdf --workdir runs/my-paper
codex-pdf-translate translate runs/my-paper --model gpt-5.4-mini
codex-pdf-translate merge runs/my-paper
codex-pdf-translate export-md runs/my-paper --output-dir runs/my-paper/output/markdown
codex-pdf-translate render-md-pdf \
  runs/my-paper/output/markdown/paper-ja.md \
  --output runs/my-paper/output/markdown/paper-ja.pdf
```

詳しい使い方はREADMEにまとめています。

[GitHub READMEを見る](https://github.com/ayatemp/codex-pdf-translator#readme)

## 技術スタック

| 領域 | 使用技術 |
|------|----------|
| PDF解析 | PyMuPDF |
| 翻訳実行 | Codex CLI |
| 中間形式 | JSON / Markdown |
| PDF生成 | Chrome headless print |
| 実装 | Python |

## 今後やりたいこと

- 複数論文の一括翻訳
- 数式ブロックのより自然な整形
- 画像assetの検出精度向上
- 論文タイプごとの出力テンプレート切り替え
- README内で実際の入出力例を見せるサンプル追加

このプロジェクトは、研究論文を「翻訳する」だけでなく、あとから読み返せる日本語版として整えることを目指しています。
