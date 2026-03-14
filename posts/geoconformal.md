---
title: GeoConformal Prediction
date: 2025-03
tags: [Uncertainty Quantification, GeoAI, Conformal Prediction]
subtitle: A model-agnostic framework for generating statistically valid uncertainty regions for any geospatial prediction model.
---

## Motivation

Geospatial prediction models — from kriging to deep neural networks — routinely produce point estimates without any measure of confidence. In practice, a prediction of *"flood risk: 0.73"* is far less actionable than *"flood risk: 0.73, with a 90% confidence interval of [0.61, 0.85]"*.

Classical approaches like Bayesian inference or bootstrapping require model-specific assumptions or expensive retraining. We need something simpler and more general.

## What is Conformal Prediction?

Conformal prediction is a distribution-free framework that wraps around **any** pre-trained model to produce prediction sets $C(X)$ with a guaranteed coverage property:

$$P\bigl(Y \in C(X)\bigr) \geq 1 - \alpha$$

where $\alpha$ is a user-specified error level (e.g., $\alpha = 0.1$ for 90% coverage). The key insight is that no assumption about the underlying model or data distribution is needed — only **exchangeability**.

The procedure is straightforward:

1. Split data into a *calibration* set and a *test* set.
2. Compute **nonconformity scores** on the calibration set: how "surprising" is each ground truth given the model's output?
3. Find the $(1-\alpha)$-quantile $\hat{q}$ of those scores.
4. At test time, construct the prediction set as all labels whose nonconformity score is $\leq \hat{q}$.

## The Spatial Challenge

Standard conformal prediction assumes **exchangeability** — roughly, that calibration and test points are drawn from the same distribution. Geospatial data violates this assumption in two important ways:

- **Spatial autocorrelation**: nearby locations share information (Tobler's first law).
- **Spatial non-stationarity**: the data generating process varies across space.

Naively applying conformal prediction ignores these structures, leading to spatially uneven coverage — the guarantee $P(Y \in C(X)) \geq 1 - \alpha$ holds on average but may fail badly in specific regions.

## GeoConformal Framework

GeoConformal addresses this through **spatially-aware calibration**. The key ideas are:

### Locally-weighted nonconformity scores

Instead of a global quantile, we compute a *local* quantile $\hat{q}(s)$ at each test location $s$ by weighting calibration points by spatial proximity:

$$\hat{q}(s) = \text{Quantile}_{1-\alpha}\Bigl(\{R_i \cdot w(s, s_i)\}_{i=1}^{n}\Bigr)$$

where $R_i$ is the nonconformity score at calibration location $s_i$ and $w(s, s_i)$ is a spatial kernel (e.g., inverse-distance or Gaussian).

### Adaptive prediction regions

The resulting prediction intervals are **spatially adaptive**: wider in data-sparse or high-variance regions, narrower where data is dense and the model is confident. This produces more honest uncertainty estimates than a uniform global interval.

## Experiments

We evaluate on three geospatial tasks:

| Task | Model | Coverage (Global CP) | Coverage (GeoConformal) |
|---|---|---|---|
| Air quality prediction | Random Forest | 89.1% | **90.4%** |
| Urban temperature | XGBoost | 87.3% | **90.1%** |
| Soil moisture | Neural Network | 83.7% | **89.8%** |

Target coverage: 90% ($\alpha = 0.1$). GeoConformal consistently achieves closer-to-target coverage while producing smaller average interval widths.

## Key Takeaway

> GeoConformal wraps any geospatial model with a rigorous, spatially-aware uncertainty quantification layer — no retraining, no model assumptions, just calibration data and a spatial kernel.

The framework is available as an open-source Python package. See the [demo](https://vezarachan.github.io) for an interactive exploration.

## References

- Venn, V., Gammerman, A., & Shafer, G. (2005). *Algorithmic learning in a random world.*
- Tibshirani, R. J., et al. (2019). Conformal prediction under covariate shift. *NeurIPS*.
- Angelopoulos, A. N., & Bates, S. (2023). Conformal prediction: A gentle introduction. *Foundations and Trends in Machine Learning.*
