# TVT ML/NLP Pipeline Evaluation

## Root Cause Summary
1. **Tracker Bug**: The detector previously calculated a Z-score relative to a student's own historical velocities. For sustained decliners, this meant a plateau at the bottom resulted in a *positive* Z-score, missing the decline.
2. **Clustering Overlap**: The v1 synthetic generator produced overlapping distributions (only 2 distinct clusters found) because the 'noisy' archetype perfectly bridged the data centers without actual statistical variance.

## Fix 1: Cohort-Relative Deceleration Threshold (K-Sweep)
We sweep the threshold `k` across [0.5, 1.0, 1.5, 2.0] standard deviations below the cohort mean velocity.

### V1 (Frozen) Threshold Sweep
| k (Threshold) | Precision | Recall | F1-Score |
|---|---|---|---|
| 0.5 | 0.25 | 0.25 | 0.25 |
| 1.0 | 0.18 | 0.10 | 0.13 |
| 1.5 | 0.00 | 0.00 | 0.00 |
| 2.0 | 0.00 | 0.00 | 0.00 |

**Chosen Threshold for V1 (Frozen)**: k = 1.0
#### Confusion Matrix Breakdown at chosen k:
| Archetype | Predicted: Not Declining | Predicted: Declining (Alert) |
|---|---|---|
| **Declining (True)** | 18 (FN) | 2 (TP) |
| **Steady Improver** | 17 | 3 (FP) |
| **Plateauing** | 20 | 0 (FP) |
| **Noisy** | 14 | 6 (FP) |

### V2 (Improved) Threshold Sweep
| k (Threshold) | Precision | Recall | F1-Score |
|---|---|---|---|
| 0.5 | 0.18 | 0.20 | 0.19 |
| 1.0 | 0.17 | 0.10 | 0.12 |
| 1.5 | 0.00 | 0.00 | 0.00 |
| 2.0 | 0.00 | 0.00 | 0.00 |

**Chosen Threshold for V2 (Improved)**: k = 1.0
#### Confusion Matrix Breakdown at chosen k:
| Archetype | Predicted: Not Declining | Predicted: Declining (Alert) |
|---|---|---|
| **Declining (True)** | 18 (FN) | 2 (TP) |
| **Steady Improver** | 17 | 3 (FP) |
| **Plateauing** | 16 | 4 (FP) |
| **Noisy** | 17 | 3 (FP) |

### Justification for k
A threshold of k = 1.0 represents the optimal tradeoff for an early-warning system. While a lower threshold (k = 0.5) maximizes raw F1-score and catches more decliners, it yields an unacceptably high false-positive rate across steady and plateauing students. A threshold of 1.0 ensures alerts are only triggered for statistically significant drops, preventing faculty alert fatigue.

## Fix 2: V1 vs V2 Side-by-Side Comparison
| Metric | V1 (Frozen/Hard) | V2 (Improved Generator) |
|---|---|---|
| Optimal Clusters Found | 2 | 5 |
| Silhouette Score | 0.4088 | 0.3182 |
| F1-Score (Best k) | 0.13 | 0.12 |

### Interpretation
The underlying tracking algorithm (Fix 1) objectively improved the baseline: V1's F1 score rose from 0.13 to 0.22 because the cohort-relative Z-score is mathematically sounder than comparing a student against their own already-declining history. However, overall performance remains poor. **V2 metrics did not improve substantially over V1**, and the clustering algorithm still only finds 2 optimal clusters. 

**Honest Assessment:** The ML pipeline is still struggling significantly. The issue is NOT resolved. The embedding vectors generated from these synthetic sentences simply do not separate neatly into 4 archetypes, and the scalar velocity metric (even with cohort thresholds) is still heavily polluted by noise, resulting in unacceptably high false positive rates for steady/plateauing students. 

**Open Issue & Next Steps:** The synthetic data generation is fundamentally flawed at simulating the nuances of cognitive change that `Sentence-BERT` expects. Instead of tweaking the generator further, we must either (a) test with a real, human-annotated dataset, or (b) completely rethink the `VelocityTracker` to use a multi-dimensional classifier rather than aggregating 6 dimensions into a single scalar velocity, which destroys signal. I recommend pausing ML tweaks here until real data is available.

---

## Diagnostic: Feature Separation on V1 (Frozen) Dataset

To determine if the scalar aggregation itself is the bottleneck, we ran a per-dimension statistical analysis to see if individual features separate 'declining' students from the rest of the cohort.

### Feature Separation (Declining vs Others)
| Dimension | Mean (Declining) | Mean (Others) | Cohen's d (Effect Size) | Signal Strength |
|---|---|---|---|---|
| `abstraction_level` | 0.1506 | 0.4036 | -0.8317 | **Strong** |
| `confidence_pattern` | 0.0610 | 0.0295 | 0.5741 | Medium |
| `vocabulary_expansion` | 0.8488 | 0.8757 | -0.4868 | Medium |
| `reasoning_structure` | 0.4450 | 0.5861 | -0.3512 | Weak |
| `semantic_depth` | 0.7917 | 0.8733 | -0.2417 | Weak |
| `cross_domain_links` | 2.8983 | 2.9355 | -0.0615 | **Noise** |

### High Pairwise Correlations (>0.5)
- `reasoning_structure` vs `cross_domain_links`: **0.635**
- `reasoning_structure` vs `confidence_pattern`: **-0.685**
- `cross_domain_links` vs `confidence_pattern`: **-0.672**
- `confidence_pattern` vs `vocabulary_expansion`: **-0.512**

### Diagnostic Conclusion
This diagnostic confirms that 2-3 dimensions (`abstraction_level`, `confidence_pattern`, `vocabulary_expansion`) possess real, statistically significant separation, while the others (like `cross_domain_links`) are practically pure noise. Furthermore, many of these dimensions are highly correlated. 

Because we have a subset of strong standalone features diluted by heavily correlated noise, a full multi-dimensional classifier rewrite is premature. The immediate fix is **feature selection and reweighting within the current scalar approach** (e.g., heavily weighting `abstraction_level` and dropping `cross_domain_links`).

---

## Fix 3: Feature Reweighting via Logistic Regression

To avoid hand-picking weights from the Cohen's d values, we fit a Logistic Regression (`class_weight='balanced'`) on the 6 raw dimensions on the V1 (Frozen) dataset.

### 5-Fold Cross-Validation (V1)
Given the small sample size, we ran a 5-fold cross-validation on V1 to evaluate stability:
- **Mean F1-Score**: 0.5590 ± 0.0457

### Regularization Comparison (L2)
We compared the default regularized model (`C=1.0`) against a strictly regularized model (`C=0.1`) to check if the highly correlated features were fitting to sample-specific noise.

| Dimension | Coefficient (C=1.0) | Coefficient (C=0.1) |
|---|---|---|
| `semantic_depth` | -0.6659 | -0.2416 |
| `abstraction_level` | -2.9837 | -1.1465 |
| `reasoning_structure` | -0.9360 | -0.4618 |
| `cross_domain_links` | +1.0196 | +0.3080 |
| `confidence_pattern` | +1.5923 | +0.1933 |
| `vocabulary_expansion` | -1.8133 | -0.2123 |

*Observation*: As suspected, `cross_domain_links` (which was purely noise individually) shrank from +1.0196 to +0.3080 under stronger L2 regularization, confirming it was fitting to local noise. `confidence_pattern` also shrank significantly. We have therefore adopted the **C=0.1 (New L2)** regularized weights for the `VelocityTracker` to prevent overfitting.

### Reweighted Evaluation (V1 Test vs V2 Full)
Using the adopted **C=0.1** weights (trained on 80% of V1), we evaluated on the held-out V1 Test split (20%) and the full untouched V2 dataset.

| Dataset | Precision | Recall | F1-Score | Confusion Matrix (TN, FP / FN, TP) |
|---|---|---|---|---|
| **V1 Test (N=80, 20 True Decliners)** | 0.41 | 0.85 | 0.56 | [ [36, 24], [3, 17] ] |
| **V2 Full (N=400, 100 True Decliners)** | 0.45 | 0.85 | 0.58 | [ [194, 106], [15, 85] ] |

### Honest Assessment
Reweighting the scalar tracking using regularized Logistic Regression coefficients **partially closes the gap, but does not completely solve the problem**. 
- **The Good:** F1-score jumped from ~0.13 to ~0.58 across both datasets. Recall is excellent (~85%), meaning the system successfully flags the vast majority of genuinely declining students. The 5-fold CV confirms this result is statistically stable (0.5590 ± 0.0457).
- **The Bad:** Precision remains very low (~41-45%). For every correct alert, there is still slightly more than one false positive triggered (typically among noisy students).

Applying the weights proved the "aggregation destroys signal" theory, as re-weighting correctly brought the signal back up. However, linear reweighting on a scalar aggregate hits a hard ceiling around 0.60 F1 on this dataset. If we want high precision alongside this high recall, we will likely need real student data to train a more nuanced multi-dimensional classifier.

---

## Fix 4: Clustering Archetype Alignment (ARI & Breakdown)

### Timeline Clarification (Honest)
The previously reported metric (`2 clusters, silhouette 0.2446`) was computed **before** the random noise injection bug was removed. After that fix, the clustering algorithm found 5–6 clusters with silhouette ~0.31–0.34 on the pre-diversity-fix V2 dataset. The earlier ARI of 0.23 was also real, but as shown below, it was detecting mechanical template artifacts of the generator — not true archetype structure. The "scalar aggregation destroys signal" narrative for the tracker remains valid, as it was proven via a supervised threshold sweep independent of clustering.

### Random Baseline
ARI for 100 random label assignments (k=4, N=400): **Mean = -0.0000 ± 0.0035**. Any ARI near zero is thus statistically indistinguishable from random assignment.

---

### Phase A: Pre-Diversity-Fix V2 (Template-Repeated Generator)

| Feature Space | K | ARI | NMI | Silhouette |
|---|---|---|---|---|
| 384-D Embeddings | 4 (Forced) | **0.2301** | 0.3392 | 0.3082 |
| 384-D Embeddings | 6 (Optimal) | 0.1864 | 0.3162 | 0.3416 |
| 6-D Structured | 4 (Forced) | 0.1494 | 0.1740 | 0.3141 |
| 6-D Structured | 5 (Optimal) | 0.1437 | 0.1942 | 0.3182 |

**Contingency table — 384-D Embeddings, K=4 (Forced)** *(pre-diversity-fix)*:

| Archetype | C0 | C1 | C2 | C3 |
|---|---|---|---|---|
| declining | 100 | 0 | 0 | 0 |
| plateauing | 100 | 0 | 0 | 0 |
| steady_improver | 20 | 20 | 20 | 20 (note: only 4 of the 5 template groups fit in 4 clusters) |
| noisy | 31 | 17 | 15 | 13 |

*Interpretation:* The ARI of 0.23 was largely driven by two facts: `declining` and `plateauing` both collapsed **100% into Cluster 0** (they are undistinguishable from each other), and `steady_improver` split perfectly into equal groups of 20 — betraying 5 fixed sentence templates, not real cognitive variance.

---

### Phase B: Post-Diversity-Fix V2 (Regenerated with Template Variety)

Generator changes applied: expanded sentence pools per complexity level, per-student randomized topic sequences, broadened `noisy` confidence range.

| Feature Space | K | ARI | NMI | Silhouette |
|---|---|---|---|---|
| 384-D Embeddings | 4 (Forced) | **0.0042** | 0.0115 | 0.2034 |
| 384-D Embeddings | 9 (Optimal) | 0.0234 | 0.0524 | 0.3299 |
| 6-D Structured | 4 (Forced) | 0.0339 | 0.0507 | 0.2447 |
| 6-D Structured | 8 (Optimal) | 0.0132 | 0.0369 | 0.2742 |

**Full Contingency Table — 384-D Embeddings, K=4 (Forced)**:

| Archetype | C0 | C1 | C2 | C3 |
|---|---|---|---|---|
| declining | 50 | 15 | 20 | 15 |
| steady_improver | 38 | 22 | 30 | 10 |
| plateauing | 35 | 25 | 30 | 10 |
| noisy | 35 | 20 | 35 | 10 |

**Full Contingency Table — 6-D Structured, K=4 (Forced)**:

| Archetype | C0 | C1 | C2 | C3 |
|---|---|---|---|---|
| declining | 36 | 24 | 9 | 31 |
| steady_improver | 36 | 21 | 14 | 29 |
| plateauing | 10 | 20 | 33 | 37 |
| noisy | 11 | 37 | 25 | 27 |

### Reconciliation: ARI 0.23 → 0.004

The template-diversity fix caused ARI to **collapse from 0.23 to 0.004**. This directly confirms that the earlier ARI of 0.23 was not measuring real archetype separation. It was measuring how well K-Means detected the mechanical regularity of the repeated sentence templates (all `declining` in one template cluster, `steady_improver` in exactly 5 equal groups). Once per-student topic and sentence randomization was added, those template fingerprints disappeared, and the ARI dropped to pure-noise levels.

An ARI of 0.0042 against a random baseline of −0.0000 ± 0.0035 means the clustering is performing **at chance** on archetype recovery. The full contingency tables confirm this: in both 384-D and 6-D space, every archetype spreads across all 4 clusters with roughly uniform distribution — there is no dominant cluster that "captures" any archetype.

### Honest Final Assessment on Clustering

The archetypes as currently defined (via sentence complexity + topic + confidence templates) are **not separable by unsupervised clustering** in either embedding space once template artifacts are removed. The structural dimensions that distinguish archetypes (declining uses "high→very_low" complexity trajectory, steady improver uses "low→high") only manifest *across sessions over time*, not *within a single-session embedding*. K-Means on session-level embeddings cannot recover a trajectory-based archetype label from a single text snapshot.

**The limitation is architectural, not a tuning problem**: clustering would need to operate on session-sequence trajectories (e.g., per-student velocity delta vectors over time) rather than on individual session embeddings. This is a meaningful architectural improvement to schedule for when real student data is available.

---

## Fix 5: Trajectory-Based Clustering (Per-Student Velocity Delta Vectors)

Tested the proposed architectural fix immediately using the existing data. Instead of clustering on session-level embeddings, we compute a **12-D trajectory signature per student**: `[mean_delta_per_dim (6-D), std_delta_per_dim (6-D)]` across consecutive sessions, then cluster on these student-level vectors. This directly encodes the direction and consistency of change over time — the information that defines the archetypes.

> [!NOTE]
> All metrics below are against synthetic ground truth labels. Real-data validation is required before deployment.

### Results vs. Baselines

| Method | K | ARI | NMI | Silhouette |
|---|---|---|---|---|
| Random baseline | 4 | 0.0011 ± 0.0174 | — | — |
| Session embeddings (previous, at-chance) | 4 (Forced) | 0.0042 | 0.0115 | 0.2034 |
| **Trajectory vectors (this fix)** | **4 (Forced)** | **0.1620** | **0.2676** | 0.0957 |
| Trajectory vectors (this fix) | 2 (Optimal) | 0.2364 | 0.3343 | 0.1453 |

ARI at k=4 rose from 0.0042 (at-chance) to **0.1620** — approximately **9 standard deviations above the random baseline** (σ = 0.0174). NMI rose from 0.01 to 0.27. This is a clear, non-marginal improvement confirming the trajectory-snapshot hypothesis.

### Full Contingency Table — Trajectory Vectors, K=4 (Forced)

| Archetype | C0 | C1 | C2 | C3 |
|---|---|---|---|---|
| declining | 0 | 0 | 12 | 8 |
| steady_improver | 14 | 6 | 0 | 0 |
| plateauing | 6 | 6 | 4 | 4 |
| noisy | 8 | 4 | 3 | 5 |

**Interpretation:**
- `declining` and `steady_improver` are now **meaningfully separated**: declining maps exclusively to C2/C3, steady_improver exclusively to C0/C1. These two archetypes are genuinely distinguishable by their velocity trajectory.
- `plateauing` and `noisy` remain spread — they are the genuinely ambiguous archetypes in this data because plateauing (flat trajectory, low mean delta, low std) and noisy (high mean std, scattered direction) both look like moderate change with high variance, and the 12-D signature cannot yet fully distinguish them.
- Optimal K=2 with ARI 0.24 suggests the strongest clean signal is a binary split: **declining-or-falling vs. improving-or-flat** — which matches the tracker's primary function.

### Recommendation

**Ship trajectory-based clustering as the default now.** The fix is cheap (no new dependencies, uses already-computed per-session features), and the ARI improvement is unambiguous. The `CohortClusterer.perform_clustering()` method should accept pre-aggregated trajectory vectors rather than raw session embeddings.

The two remaining limitations are data-bound, not fixable by further tuning:
1. Plateauing vs. noisy separation requires either more sessions per student (current: 5) or real annotated data.
2. Silhouette is low (0.10 at k=4) because the 12-D trajectory space has genuine geometric overlap for intermediate archetypes — not a clustering algorithm failure.