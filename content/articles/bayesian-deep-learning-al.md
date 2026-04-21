---
title: "MC Dropoutで実装するBayesian Deep Learning入門"
description: "ニューラルネットワークに確率論的な不確実性推定を組み込む最も実用的な手法を、実装コードとともに解説します。"
date: "2026-02-15"
tags: ["Bayesian Deep Learning", "Uncertainty", "PyTorch"]
---

## なぜ不確実性が重要か

深層学習モデルが「自信満々に間違える」問題は深刻だ。
特に医療・自動運転・金融など安全性が求められる領域では、予測の確信度を正しく推定できることが不可欠になる。

**Bayesian Deep Learning** は、この問題に対してネットワークの重みを確率変数として扱うことで、予測の不確実性を定量化するアプローチだ。

---

## MC Dropout：最もシンプルな実装

Gal & Ghahramani (2016) が示したのは、**訓練時のDropoutはベイズ近似と等価**だという驚くべき事実だ。

テスト時にもDropoutを有効にしたまま複数回推論を行い、その分布から不確実性を推定できる。

```python
import torch
import torch.nn as nn

class MCDropoutModel(nn.Module):
    def __init__(self, in_features: int, num_classes: int, p: float = 0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(p),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(p),
            nn.Linear(256, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

def mc_predict(model: nn.Module, x: torch.Tensor, T: int = 30) -> dict:
    """MC Dropoutによる確率的推論"""
    model.train()  # Dropoutを有効化
    with torch.no_grad():
        preds = torch.stack([
            torch.softmax(model(x), dim=-1) for _ in range(T)
        ])  # (T, B, C)

    mean = preds.mean(dim=0)           # 予測平均
    uncertainty = preds.var(dim=0)     # 予測分散（不確実性）
    entropy = -(mean * mean.log()).sum(dim=-1)  # エントロピー

    return {"mean": mean, "variance": uncertainty, "entropy": entropy}
```

---

## 不確実性の2種類

| 種類 | 別名 | 意味 | 削減可能か |
|------|------|------|-----------|
| Aleatoric | データ的不確実性 | データ自体のノイズ | ✗ 不可能 |
| Epistemic | モデル的不確実性 | 訓練データ不足 | ✓ データ追加で削減 |

Active Learningにとって重要なのは **Epistemic Uncertainty**。
モデルが「知らない」領域のサンプルに優先的にラベルを付けることで、効率的に学習できる。

---

## BatchBALD：相関を考慮したバッチ選択

単純なEntropy SamplingをBayesian的に行うと、似たようなサンプルをバッチ選択してしまう問題がある。

**BatchBALD**（Kirsch et al., 2019）は、バッチ内サンプル間の相互情報量を最大化することでこの問題を解決する。

```python
# 概念的な実装（実際はbatchbaldライブラリを使用推奨）
def batchbald_score(entropy_batch: torch.Tensor, joint_entropy: torch.Tensor) -> torch.Tensor:
    """BALD スコア = H[y|x] - E_w[H[y|x,w]]"""
    return entropy_batch - joint_entropy
```

---

## まとめ

MC Dropoutは、既存のネットワークを**ほぼ変えずにBayesian化**できる最も実用的な手法だ。
推論コストはT倍になるが、Active Learningのクエリフェーズのみで使えばオーバーヘッドは許容範囲内に収まる。

次のステップとして、Deep Ensemblesとの比較、そしてConvolutional Networkへの適用を試してみてほしい。
