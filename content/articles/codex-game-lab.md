---
title: "OpenGame ベースで、Codex CLI にゲーム実装とデバッグを任せる `codex-game-lab` を作った"
description: "OpenGame 由来のテンプレと設計 docs を流用しつつ、ゲーム生成の実装者をローカル Codex CLI に置き換え、build/test/dev の検証と repair loop まで自動化した話。"
date: "2026-04-24"
tags: ["Codex", "Game Development", "Phaser", "Automation"]
---

## 何を作ったか

`codex-game-lab` は、ゲームのアイデア文から Phaser/Vite ベースのゲームを scaffold し、実装と修正をローカルの `codex exec` に任せる CLI です。

ポイントは、単にコード生成するだけでなく、最後にローカルで検証を回すところにあります。

```text
npm install
npm run build
npm run test
npm run dev -- --host 127.0.0.1 --port 4173
```

ここで失敗したら、検証ログを Codex に返してもう一段修正させます。

## なぜ作ったか

既存の AI ゲーム生成プロジェクトは面白いものが多いですが、OpenAI API キーを直接使う runtime を抱えていることが多いです。

自分は普段から Codex を使っているので、すでにログイン済みのローカル Codex CLI をそのまま worker にしたい、という気持ちがありました。

そこで、

- OpenGame の template と docs は借りる
- runtime は自前で薄く包む
- 実装者は Codex CLI にする

という方向で作りました。

## 仕組み

`codex-game-lab` の役割は大きく 4 つです。

1. ゲーム案を archetype に分類する
2. OpenGame 由来 template / docs をコピーする
3. `AGENTS.md` と task prompt を書いて Codex に実装させる
4. 生成後に build/test/dev 起動まで検証する

このとき、`VERIFICATION.md` と `.codex-game-verify.log` も残すので、何が通って何が落ちたかをあとで追いやすくしています。

## 今回入れた改善

最初の版では「ゲームはできるが、生成後のデバッグが弱い」問題がありました。

特にありがちだったのが、

- build は通る
- でも test がない
- あるいは dev サーバが起動しない

という状態です。

そこで、生成後の local verification を CLI に組み込み、失敗した場合は Codex に repair pass を投げるようにしました。

この修正で、AI が「作ったつもり」で終わるのをかなり減らせています。

## 良かった点

- API キーを別管理しなくていい
- OpenGame の知見を活かせる
- 生成後の debug まで flow に乗せられる

とくに 3 つ目が大きくて、実運用では「最後の詰め」がいちばん時間を食いやすいので、そこを機械的に回せる価値が大きいです。

## 次にやりたいこと

- Playwright を使った画面 smoke test
- archetype ごとの verify 追加
- 生成物の別 repo 化

AI にゲームを作らせる系はまだ粗い部分もありますが、template と verification をちゃんと噛ませると一気に使い物に近づく、という手応えがありました。
