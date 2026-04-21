---
title: "Active Learning Annotation Platform"
description: "ラベリングコストを最大70%削減する、不確実性ベースのアノテーション支援システム。FastAPI + Next.jsで構築したフルスタックPOC。"
category: "ML System"
stack: ["Python", "FastAPI", "PyTorch", "Next.js", "PostgreSQL"]
date: "2026-02-01"
featured: true
links:
  - label: "GitHub"
    url: "#"
  - label: "Demo"
    url: "#"
---

## 概要

画像認識モデルのアノテーション作業を効率化するWebプラットフォーム。
MC Dropoutによる不確実性推定を用いて、アノテータに「最も学習効果の高い」サンプルを優先提示する。

## 課題

クライアント（製造業）では、工場の品質検査用画像分類モデルの訓練に毎月数万枚の画像アノテーションが必要だった。コスト・リードタイムが大きなボトルネックになっていた。

## アーキテクチャ

```
[FastAPI Backend]
├── /query       ← Uncertainty Samplingでサンプル選択
├── /annotate    ← アノテーション保存・モデル再訓練トリガー
└── /evaluate    ← モデル性能モニタリング

[Next.js Frontend]
├── アノテーション UI（キーボードショートカット対応）
└── 進捗ダッシュボード（精度推移・コスト削減率）
```

## 結果

- ランダムサンプリング比でラベル数 **68%削減** で同等精度達成
- アノテーター1名あたりの1日処理件数 **2.3倍** 向上
- POC期間：6週間

## 技術的なポイント

アノテーション中のモデル再訓練は非同期で走らせ、フロントエンドはポーリングで進捗を確認する設計にした。リアルタイム再訓練によるレイテンシーをユーザーに意識させないのが要件だった。
