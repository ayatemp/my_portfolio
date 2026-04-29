---
title: "Assisted Mindmap"
description: "研究案・事業案・PoC仮説を、AI相談とマインドマップで広げるローカルWebアプリ。ノード編集、自由配置、AI深掘り5件、Codex相談スレッドを備える。"
category: "LLM Tooling"
stack: ["React Native", "Expo", "TypeScript", "React Native Web", "OpenAI API"]
date: "2026-04-29"
featured: true
links:
  - label: "GitHub"
    url: "https://github.com/ayatemp/assisted-mindmap"
---

## 概要

**Assisted Mindmap** は、研究案・事業案・PoC 仮説のような大きなテーマを、AI と相談しながらマインドマップとして広げるローカル Web アプリです。

テーマごとにプロジェクトを作り、ノードを選びながら、アイデア・問い・検証・リスク・メモを追加できます。

[GitHubはこちら](https://github.com/ayatemp/assisted-mindmap)

## 作った背景

研究案を考えるとき、チャットだけだと会話が流れてしまい、マインドマップだけだと次に広げる観点を自分で出し続ける必要があります。

そこで、AI の返答をそのままツリーに戻せるようにしました。

たとえば `pseudoGT の新しい研究案` というテーマから、既存手法、評価指標、失敗パターン、実験設計の枝を広げていくような使い方を想定しています。

## できること

- プロジェクト単位でマインドマップを保存
- プロジェクト検索、作成、削除
- ノード・メモノードの追加、編集、削除
- ノードの自由移動と位置リセット
- 曲線コネクタ表示
- トラックパッドでの上下左右・斜め移動
- pinch / `Ctrl` + wheel / `Cmd` + wheel によるズーム
- 左右パネル幅のドラッグ調整
- タグ編集・タグ追加
- ユーザー作成ノードと AI 作成ノードの色分け
- `AI 深掘り 5 件` による一括メモ生成
- `Codex` タブでの相談と候補ノード追加

## AI 深掘り 5 件

選択中のノードから、具体的なメモ型ノードを 4〜5 件まとめて生成できます。

OpenAI API key を設定している場合は `gpt-5.4` と web search を使って調査寄りのメモを生成します。

API key が未設定、または API 呼び出しに失敗した場合でも、アプリ内のローカル候補で最低限の深掘りができます。

## Codex 相談タブ

右側パネルには `編集` / `Codex` / `設定` のタブがあります。

`Codex` タブでは、選択中ノードとツリー全体を文脈として、通常のチャットのように相談できます。

返答には追加候補カードが付き、押すとそのままノードやメモとしてマインドマップへ追加されます。

会話スレッドはプロジェクトごとに複数作成でき、最新 5 件だけ保持します。

## 技術スタック

| 領域 | 使用技術 |
|------|----------|
| UI | React Native / Expo |
| Web | React Native Web / Expo Router |
| 実装 | TypeScript |
| コネクタ | react-native-svg |
| 保存 | localStorage |
| AI | OpenAI Responses API optional |

## ローカル起動

```bash
npm install
npm run web
```

Expo の出力に表示される URL をブラウザで開きます。

## 保存設計

Django や外部 DB は使わず、ブラウザの `localStorage` に保存します。

保存対象は、プロジェクト、ノード、メモ、タグ設定、Codex 会話、OpenAI API key です。

ローカルで思考を試すためのツールとして、まずは軽く動くことを優先しています。

## 今後やりたいこと

- Markdown / JSON export
- import
- 研究論文検索との連携
- ノード単位の履歴
- 複数デバイス同期

このプロジェクトは、チャット AI の発散力とマインドマップの構造化をつなげるための小さな実験として作りました。
