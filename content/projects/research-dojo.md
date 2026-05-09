---
title: "Research Dojo"
description: "論文を読んで終わりにせず、自分で答え、Codex App Serverに厳しく採点され、弱点に合わせた追加問題や研究アイデアの検討へ進むローカル研究トレーニングアプリ。"
category: "Research Tooling"
stack: ["Next.js", "Electron", "Codex App Server", "SQLite", "GitHub Actions"]
date: "2026-05-09"
featured: true
links:
  - label: "Desktop Release"
    url: "https://github.com/ayatemp/research-dojo-PCapp/releases/latest"
  - label: "GitHub"
    url: "https://github.com/ayatemp/research-dojo-PCapp"
  - label: "Web Prototype"
    url: "https://research-dojo.vercel.app"
---

<figure class="portfolio-video">
  <video controls preload="metadata" playsinline poster="/img/projects/research-dojo-poster.jpg">
    <source src="/videos/research-dojo-demo.mp4" type="video/mp4" />
  </video>
  <figcaption>Research Dojo の紹介動画。Paper Room、Idea mode、Topic Room、Research Lab、Codex Room、デスクトップ配布までをひとつの研究トレーニング環境としてまとめています。</figcaption>
</figure>

## 概要

**Research Dojo** は、研究論文や技術トピックを「読んだ気になる」状態で終わらせないためのローカル研究トレーニングアプリです。

中心にあるのは、次のループです。

```text
読む -> 自分で答える -> 厳しく採点される -> 不足部分を特定する -> 追加問題で鍛える -> 研究アイデアや実装タスクへ進める
```

普通のAIチャットでは、ユーザーが質問するとAIがすぐ答えを返します。Research Dojoではそれをあえて逆にしました。AIが最初に答えを出すのではなく、まず自分が論文を読み、自分の言葉で答えます。その回答をCodexがレビューし、理解が浅い部分、読み飛ばしている節、実験設計の弱さ、主張の曖昧さを指摘します。

つまりこれは、論文要約ツールではなく、研究者としての読み方・問い方・詰め方を鍛えるための道場です。

## 作った背景

論文を読むとき、自分が本当に理解できているかを判断するのはかなり難しいです。

AbstractやIntroductionを読んで「なんとなく分かった」と感じても、いざ人に説明しようとすると、次のような穴が出ます。

- 何が既存研究に対する新規性なのか言えない
- 手法の効きどころと失敗条件を分けられない
- 実験の比較対象やアブレーションの意味を説明できない
- 自分の研究にどう接続できるかが浅い
- アイデアは出るが、検証可能な仮説や実装タスクに落ちない

そこで、Research Dojoでは「読む量」ではなく「答えてレビューされる回数」を中心に置きました。論文を読んだ後に問題を解き、点数とコメントで理解度を測り、足りないところだけを追加で鍛える設計にしています。

## Paper Room

Paper Roomは、論文ごとの理解トレーニングを行う部屋です。

arXiv URLや論文メモを登録すると、Codex App ServerがPaper Cardと問題セットを生成します。問題は単なる確認問題ではなく、論文の要点、手法の機構、実験の妥当性、限界、Reviewer視点の弱点を問う形にしています。

ユーザーは問題に対して自分で回答します。その後、Codexが100点満点で採点します。

レビューでは次のような情報を返します。

- total score
- rubricごとの点数
- fatal issue
- missing perspective
- shallow phrase
- next fix
- revision challenge
- reading gaps

特に `reading gaps` は、回答から「どの節・どの観点の読み込みが足りないか」を返すための項目です。単に点数を出すのではなく、次にどこを読み直せばよいかまで示します。

## Adaptive Questions

最初から固定で8問を出すだけだと、だんだん問題が溜まり、本人の弱点ともズレていきます。

そこでResearch Dojoでは、過去の回答とレビューをもとに、次に出すべき問題を変える仕組みを入れました。

たとえば、ユーザーの回答が手法説明には強いが実験設計に弱い場合、次の問題は次のように変わります。

- baseline選定を問う
- ablationの意味を問う
- 失敗条件を問う
- claimとevidenceの対応を問う

UI上も、全部の問題を同じ重さで並べるのではなく、未回答・回答済み・待機中の問題を分け、今取り組むべき問題が見えるようにしました。

## Idea Mode

Paper Roomには、理解問題とは別に **アイデアを育てるモード** があります。

ここで重視したのは、AIにアイデアを代わりに出させないことです。研究アイデアは、自分で悩んで、自分の仮説として育てる必要があります。そこでこのモードでは、Codexは答えを出すのではなく、かなり厳しめの問いを返します。

たとえば、次のような観点を問います。

- この論文の前提を1つ壊すならどこか
- 著者が見落としている分布シフトは何か
- この手法が失敗するデータ条件は何か
- 自分の研究テーマに接続するなら、何を最小実験にするか
- 新規性があるように見えて、実は既存研究と被りそうな点はどこか

ユーザーはその問いに答え、Codexがアイデアとしての具体性、新規性、論文への根ざし、実現可能性、評価設計、リスク認識を採点します。理解問題と同じように、回答して点数を受け取り、次に直す一点をもらう形です。

## Topic Room

Topic Roomは、特定の論文ではなく、機械学習・分散学習・LLMなどの広いトピックに対する理解度診断です。

たとえば `機械学習` と入力すると、Codexが中級者向けの概念問題を生成します。ユーザーが回答すると、どの概念が弱いかを抽出し、次の問題戦略を返します。

この部屋は、論文に入る前の基礎確認や、研究分野を移るときの弱点探索に向いています。

## Research Lab

Research Labは、研究アイデアをより深く見るための部屋です。

ここでは、入力したアイデアに対して、Codexが次のようなレンズを返します。

- falsification test
- weird angle
- minimal experiment
- reviewer attack

特に気に入っているのは `reviewer attack` です。自分では良いアイデアに見えているものを、査読者ならどこから崩すか、どの主張が危ないか、どの実験が足りないかという視点で叩きます。

## Codex Room

Codex Roomは、Research Dojoが本当にCodex App Serverにつながっているかを確認するための会話部屋です。

ここで送ったメッセージは、Research Dojo backendを経由して `codex app-server` に送られます。返信が返れば、Codex CLIのログイン、App Server起動、JSON-RPC通信が通っていることを確認できます。

ユーザーから見ても、「これは本当にCodexに届いているのか？」という不安が減るように作りました。

## デスクトップアプリ化

最初はVercel上のWebアプリとして作っていましたが、Research Dojoはローカルで完結する方が自然でした。

理由は3つあります。

1. 論文メモや回答をローカルに置きたい
2. Codex CLIはローカル環境にログインしている
3. Codex Taskではローカルのrepoに触る可能性がある

そこで、既存のNext.jsアプリをElectronで包み、macOS / Windows向けのデスクトップアプリとして配布できるようにしました。データはアプリのローカルDBに保存し、生成・採点はローカルで起動するCodex App Serverに流します。

GitHub Releasesでは、macOS Apple Silicon、macOS Intel、Windows向けのビルドを配布しています。

[最新のデスクトップ版をダウンロードする](https://github.com/ayatemp/research-dojo-PCapp/releases/latest)

## Codex App Serverの使い方

Research DojoはOpenAI APIキーをアプリ内に保存しません。

代わりに、ローカルの `codex app-server` を起動し、JSON-RPCでやり取りします。主な流れは次の通りです。

```text
Research Dojo
  -> spawn("codex", ["app-server"])
  -> initialize
  -> getAuthStatus
  -> thread/start
  -> turn/start
  -> streamed answer / JSON output
```

これにより、普段のCodexログイン状態を使いながら、アプリ側ではPaper Card生成、問題生成、厳しめレビュー、Topic診断、Research Labの問い生成を行えます。

デスクトップアプリでは、Finderから起動したときに `codex` がPATHに入らない問題がありました。そこで `/usr/local/bin` や `/opt/homebrew/bin` も探索し、さらにSettings画面から `codex login --device-auth` を起動して、認証URLとワンタイムコードをアプリ内に表示できるようにしました。

## 技術構成

| 領域 | 使用技術 |
|------|----------|
| UI | Next.js / React / Tailwind CSS |
| Desktop | Electron / electron-builder |
| AI runtime | Codex CLI / Codex App Server |
| Database | SQLite compatible local DB via sql.js |
| Release | GitHub Actions / GitHub Releases |
| Deployment | Vercel for web prototype |

## 作ってよかったところ

Research Dojoを使うと、論文を読んだあとに「理解したつもり」で止まりにくくなります。

自分で答える必要があり、曖昧な言葉はレビューで突かれます。点数が出るので、自分の理解がどの程度なのかも残ります。さらに、回答の弱点から次の問題が出るので、学習が少しずつ個人化されます。

研究アイデアについても、AIが代わりに華やかな案を出すのではなく、ユーザー自身の仮説を厳しく育てる方向に寄せられました。

## 今後やりたいこと

- 論文PDFそのものの取り込み強化
- Zoteroやローカル論文フォルダとの連携
- 回答履歴からの長期的な弱点プロファイル
- 研究テーマごとのカリキュラム生成
- Codex Task実行時のdiffレビューUI
- macOS notarization / Windows code signing

Research Dojoは、研究を「読む」だけでなく、答えて、叩かれて、直して、実験へ進めるためのローカル研究ジムです。
