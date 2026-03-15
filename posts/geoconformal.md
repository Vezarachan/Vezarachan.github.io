---
title: How much should we trust the results given by GeoAI models?
date: 2025-03
tags: [Uncertainty Quantification, GeoAI, Conformal Prediction]
subtitle: A model-agnostic framework for generating statistically valid uncertainty regions for any geospatial prediction model.
---

## Motivation

GeoAI (geospatial artificial intelligence) models — from Kriging to deep neural networks — routinely produce point estimates without any measure of uncertainty. However, two questions remain unknown: (1) **how much should we trust these models?** (2) **whether these models perform equally at different locations?** In practice, a prediction at location $A$ of *"flood risk: 0.73"* is far less actionable than *"flood risk: 0.73, with a statistically guaranteed prediction interval of [0.61, 0.85]"*.

Classical approaches like Bayesian inference or bootstrapping require model-specific assumptions or expensive retraining. We need something simpler and more general.

## What is Conformal Prediction?

Conformal prediction[^1] is a distribution-free framework that wraps around **any** pre-trained model to produce prediction sets $C(X)$ with a guaranteed coverage property:

$$P\left[Y \in C(X)\right] \geq 1 - \alpha$$

where $\alpha$ is a user-specified error level (e.g., $\alpha = 0.1$ for 90% coverage). The key insight is that no assumption about the underlying model or data distribution is needed — only **exchangeability**.

For computational efficiency, we employ split conformal prediction (SCP) here. The procedure of SCP is straightforward:

1. Split data into a *calibration* set and a *test* set.
2. Compute **nonconformity scores** on the calibration set: how "surprising" is each ground truth given the model's output?
3. Find the $(1-\alpha)$-quantile $\hat{q}$ of those scores.
4. At test time, construct the prediction set as all labels whose nonconformity score is $\leq \hat{q}$.

## The Spatial Challenge

Standard conformal prediction assumes **exchangeability** — roughly, that calibration and test points are drawn from the same distribution. Geospatial data violates this assumption in two important ways:

- **Spatial autocorrelation**: nearby locations share information (Tobler's first law)[^2].
- **Spatial non-stationarity**: the data generating process varies across space.

Naively applying conformal prediction ignores these structures, leading to spatially uneven coverage — the guarantee $P(Y \in C(X)) \geq 1 - \alpha$ holds on average but may fail badly in specific regions.

## GeoConformal Prediction (GeoCP) Framework

GeoConformal addresses this through **spatially-aware calibration**. The key ideas are:

### Locally-weighted nonconformity scores

Instead of a global quantile, we compute a *local* quantile $\hat{q}(s)$ at each test location $s$ by weighting calibration points by spatial proximity:

$$\hat{q}(s) = \text{Quantile}_{1-\alpha}\left(\{R_i \cdot w(s, s_i)\}_{i=1}^{n}\right)$$

$$w(s,s_i)=\exp\left(-\frac{\lVert s - s_i\rVert^2}{2h^2}\right)$$

where $R_i$ is the nonconformity score at calibration location $s_i$ and $w(s, s_i)$ is a spatial kernel (e.g., inverse-distance or Gaussian), $h$ is the user-defined bandwidth.

### Spatially varying uncertainty quantitification

The resulting prediction intervals are **spatially varying**: wider in data-sparse or high-variance regions, narrower where data is dense and the model is confident. This produces more honest uncertainty estimates than a uniform global interval.

## Adaptive Extension to GeoCP
A fixed bandwidth struggles when point density varies greatly. In comparison, an adaptive bandwidth automatically widens in sparse regions (more smoothing) and narrows in dense regions (more local detail). Compared to GeoCP, adaptive GeoCP (AdaGeoCP) use a spatially adaptive bandwidth:
$$h_i = h_0\cdot \left(\frac{d_k(s_i)}{\text{median}(d_k)}\right)$$
where $d_k(s_i)$ is the distance to the $k$-th nearest neighbor of point $i$, and $h_0$ is the base bandwidth. The ratio scales bandwidth up in sparse areas, down in dense areas.



## Key Takeaway

> GeoConformal wraps any geospatial model with a rigorous, spatially-aware uncertainty quantification layer — no retraining, no model assumptions, just calibration data and a spatial kernel.

The framework is available as an open-source Python package. See the [demo](https://spatialuncertaintyviz-production.up.railway.app/) for an interactive exploration.

## References

[^1]: Venn, V., Gammerman, A., & Shafer, G. (2005). *Algorithmic learning in a random world.*

[^2]: Tobler WR. A computer movie simulating urban growth in the Detroit region. Economic geography. 1970 Jun 1;46(sup1):234-40.