---
title: "Codex Game Lab"
description: "OpenGame 由来のテンプレと設計ドキュメントを流用しつつ、ゲーム実装と修正をローカル Codex CLI に任せるゲーム生成 CLI。生成後の build/test/dev 検証と自動 repair loop も備える。"
category: "LLM Tooling"
stack: ["Node.js", "JavaScript", "Codex CLI", "Phaser", "Vite"]
date: "2026-04-24"
featured: true
links:
  - label: "GitHub"
    url: "https://github.com/ayatemp/codex-game-lab"
---

## 概要

**Codex Game Lab** は、ゲームのアイデア文からローカルの **Codex CLI** に実装を任せるためのゲーム生成ツールです。

OpenGame の template と設計ドキュメントをベースにしつつ、OpenAI API キーを直接アプリへ渡す runtime ではなく、普段使っている `codex exec` を実装担当として呼び出す構成にしています。

[GitHubはこちら](https://github.com/ayatemp/codex-game-lab)

## 作った背景

AI にゲームを作らせる流れ自体は面白いのですが、多くのプロジェクトが API キー前提の生成 runtime を抱えています。

自分としては、すでにログイン済みの Codex をそのまま使って、

- テンプレを切る
- 設計ルールを読む
- 実装する
- build/test/dev 起動まで確認する

という一連の流れをローカルで完結させたかったので、この CLI を作りました。

## できること

- ゲーム案を `platformer / top_down / grid_logic / tower_defense / ui_heavy` に分類
- OpenGame 由来 template と docs をコピーして scaffold
- `AGENTS.md` と `CODEX_GAME_TASK.md` を生成
- `codex exec` でゲームを実装
- 生成後に `npm install`, `npm run build`, `npm run test`, `npm run dev` を自動検証
- 検証に失敗した場合、ログを添えて Codex に repair pass を依頼
- `VERIFICATION.md` と `.codex-game-verify.log` を出力

## 工夫した点

### OpenGame の知見だけを借りたこと

このプロジェクトでは、OpenGame の runtime をそのまま使うのではなく、template と docs を vendor しています。

その上で、Codex に必要な instruction だけを `AGENTS.md` と task prompt に再構成しました。これにより、既存のゲーム制作ノウハウを活かしながら、自分のローカル作業フローに馴染む形へ寄せています。

### 完成後の検証を gate にしたこと

生成 AI は「見た目上コードができた」段階で止まりやすいです。

そこで `codex-game-lab` では、実装後に次を必ず確認するようにしました。

```text
npm install
npm run build
npm run test
npm run dev -- --host 127.0.0.1 --port 4173
```

これで build だけ通って test がない、あるいは dev サーバが立たない、といった半端な状態を減らせます。

### repair loop を入れたこと

ローカル検証が失敗したら、そのログを Codex に返して修正させる loop を入れています。

そのため、1 回の生成で終わらず、最後の詰めまで含めて AI に持たせやすくなっています。

## 使い方の例

```bash
codex-game create "Build a browser-based social deduction game" \
  --archetype top_down \
  --repair-attempts 2
```

まず scaffold だけしたい場合は次のようにします。

```bash
codex-game create "Build a tiny dungeon crawler" --no-run
```

## 技術スタック

| 領域 | 使用技術 |
|------|----------|
| CLI 実装 | Node.js / JavaScript |
| 生成エンジン | Codex CLI |
| ゲーム雛形 | Phaser / Vite |
| テンプレソース | OpenGame-derived templates/docs |
| 検証 | npm scripts / local dev smoke |

## 今後やりたいこと

- Playwright を使った画面レベルの smoke test 追加
- archetype ごとの verify ルール拡張
- 生成物を別 repo として自動初期化する機能
- アセット生成の optional plugin 化

このプロジェクトは、AI にゲームを作らせる体験を「実装だけ」で終わらせず、最後の検証と修正まで含めて回すための土台として作りました。
