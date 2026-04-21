---
title: "OSS: DataLabel Toolkit"
description: "Active Learning対応の軽量アノテーションツール。CLIとWeb UIの両方でつかえるオープンソースライブラリ。"
category: "Open Source"
stack: ["Python", "Typer", "Svelte", "SQLite"]
date: "2025-08-15"
featured: false
links:
  - label: "GitHub"
    url: "#"
  - label: "PyPI"
    url: "#"
---

## 概要

既存のアノテーションツール（Label Studio等）は高機能だが重い。
シンプルなActive Learning実験用に、軽量・ゼロ設定で使えるツールを開発した。

## 特徴

- `pip install datalabel` 一発でインストール
- CLI: `datalabel run --strategy entropy ./images`
- 組み込みのUncertainty Sampling / Core-Set / Random
- SQLiteでローカル永続化

## インストール

```bash
pip install datalabel
datalabel init --task classification
datalabel run --strategy entropy ./unlabeled_images/
```
