---
title: "製造ライン異常検知システム"
description: "カメラ画像からリアルタイムで製品欠陥を検出するエッジAIシステム。ラベルなしデータを活用した半教師あり学習で実装。"
category: "Computer Vision"
stack: ["PyTorch", "ONNX", "Raspberry Pi", "FastAPI", "React"]
date: "2025-11-01"
featured: true
links:
  - label: "Case Study"
    url: "#"
---

## 概要

食品メーカー向けの、製造ラインにおける製品欠陥リアルタイム検出システム。
エッジデバイス（Raspberry Pi 5）上でONNXモデルを推論、クラウドへのデータ転送コストをゼロにした。

## 技術的挑戦

初期の教師あり学習では、欠陥パターンの多様性に対応しきれなかった。
Semi-Supervised Learningと組み合わせたActive Learningにより、正常品の大量データを活用しながら少ない欠陥サンプルで高精度を達成した。

## 結果

- 検出精度 F1 = **0.94**（従来の目視検査比）
- 推論レイテンシー **< 30ms**（Raspberry Pi 5上）
- 見逃し率を従来の **1/8** に削減
