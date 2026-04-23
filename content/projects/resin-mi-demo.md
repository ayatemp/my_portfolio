---
title: "Resin MI Demo"
description: "公開ポリマーTgデータで学習したMaterials Informaticsデモ。要求特性から候補樹脂をランキングし、開発中材料の物性予測とCAE連携目安を表示するWebアプリ。"
category: "Materials Informatics"
stack: ["React", "TypeScript", "Vite", "Polymer ML", "Vercel"]
date: "2026-04-23"
featured: true
links:
  - label: "Live Demo"
    url: "https://resin-mi-demo.vercel.app"
  - label: "Usage Guide"
    url: "https://resin-mi-demo.vercel.app/guide"
  - label: "GitHub"
    url: "https://github.com/ayatemp/resin-mi-demo"
---

## 概要

**Resin MI Demo** は、樹脂材料開発における **Materials Informatics** の流れを体験できるWebデモです。

顧客や部材側が求める特性を入力すると、公開ポリマーTgデータから学習した軽量モデルと構造特徴ベースの推定ロジックを使って、候補樹脂をランキングします。

[デモを見る](https://resin-mi-demo.vercel.app)

## 作った背景

材料開発では、過去に蓄積した配合・構造・物性データを使って、候補材料の探索や開発中材料の初期評価を早く回すことが重要になります。

このデモでは、社内データの代わりに公開されているポリマーTgデータを使い、次のような流れを疑似的に再現しました。

- 蓄積データをもとに物性予測モデルを作る
- 顧客の要求特性から候補材料を絞り込む
- 開発中材料の構造表現を入力して予測する
- CAE解析へ渡す前の材料選定目安を出す

実際の業務システムでは社内実測データやCAE結果との接続が必要ですが、このプロジェクトではその手前の「MIで材料候補を探索する体験」をWebアプリとして形にしています。

## できること

- 目標Tg、弾性率、密度、耐薬品性、成形しやすさを指定
- 用途に応じて評価重みを切り替え
- 候補樹脂をスコア順にランキング
- PSMILESを入力して開発中材料のTgと弾性率目安を即時予測
- 選択した候補のTg、弾性率、耐薬品性、成形性を可視化
- 熱余裕、反りリスク、たわみリスクなどの簡易CAE連携目安を表示
- 別ページのガイドで候補材料の数値の意味を説明

## データとモデル

学習には、PolyMetriX / Zenodo の curated polymer glass-transition dataset を利用しています。

このデータには、ポリマーの **PSMILES**、実験Tg、データソース、reliability、polymer class などが含まれています。

デモでは、PSMILESから簡易構造特徴量を作り、Ridge regression と近傍探索を組み合わせてTgを予測しています。

```text
PSMILES -> structure features -> Tg prediction -> candidate ranking
```

## 表示している数値

候補材料の行には、次の値を表示しています。

| 表示 | 意味 |
|------|------|
| 丸い数値 | 要求特性との適合スコア |
| `140C` | 予測Tg |
| `4.46GPa` | 弾性率の目安 |
| `1.08` | 密度の目安、単位は g/cm3 |

詳しい見方は、デモ内の使い方ページにまとめています。

[使い方ページを見る](https://resin-mi-demo.vercel.app/guide)

## 技術スタック

| 領域 | 使用技術 |
|------|----------|
| フロントエンド | React / TypeScript |
| ビルド | Vite |
| モデル生成 | Node.js script |
| データ処理 | CSV parse / PSMILES feature extraction |
| デプロイ | Vercel |

## 今後やりたいこと

- Tg以外の公開物性データを追加してマルチタスク予測にする
- 実測データと予測値の不確実性表示を追加する
- 候補材料の類似構造検索を強化する
- CAE入力向けに材料カードをJSON出力できるようにする
- ポートフォリオ上でスクリーンショット付きの紹介にする

このプロジェクトは、材料開発におけるAI活用を「話として説明する」だけでなく、実際に触れる形で示すためのデモとして作成しました。
