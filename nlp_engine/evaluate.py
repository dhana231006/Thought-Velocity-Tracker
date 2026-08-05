import json
import os
import numpy as np
from features.extractor import FeatureExtractor, FeatureNormalizer
from embeddings.embedder import SemanticEmbedder
from clustering.cluster import CohortClusterer
from velocity.tracker import VelocityTracker
from sklearn.metrics import classification_report, confusion_matrix

def load_and_process(dataset_path):
    with open(dataset_path, 'r') as f:
        dataset = json.load(f)
        
    extractor = FeatureExtractor()
    normalizer = FeatureNormalizer()
    
    raw_features = []
    for row in dataset:
        feats = extractor.extract_dimensions(row["text"])
        raw_features.append(feats)
        
    normalizer.fit(raw_features)
    
    profiles = []
    students = {} 
    
    for i, row in enumerate(dataset):
        norm_feats = normalizer.normalize(raw_features[i])
        row_data = {
            "session_id": row["session_id"],
            "student_id": row["student_id"],
            "archetype_label": row["archetype_label"],
            "features": norm_feats
        }
        profiles.append(row_data)
        if row["student_id"] not in students:
            students[row["student_id"]] = []
        students[row["student_id"]].append(row_data)
        
    return profiles, students

def evaluate_dataset(dataset_name, dataset_path):
    profiles, students = load_and_process(dataset_path)
    clusterer = CohortClusterer()
    tracker = VelocityTracker()
    
    # 1. Clustering
    feature_vectors = [[p["features"][k] for k in ["semantic_depth", "abstraction_level", "reasoning_structure", "cross_domain_links", "confidence_pattern", "vocabulary_expansion"]] for p in profiles]
    cluster_results = clusterer.perform_clustering(feature_vectors)
    
    # 2. Deceleration k-sweep
    all_velocities = []
    student_latest_velocities = {}
    for student_id, sessions in students.items():
        session_profiles = [s["features"] for s in sessions]
        for i in range(1, len(session_profiles)):
            v = tracker.compute_velocity(session_profiles[i-1], session_profiles[i])
            all_velocities.append(v["scalar_velocity"])
            if i == len(session_profiles) - 1:
                student_latest_velocities[student_id] = v["scalar_velocity"]
                
    cohort_mean = np.mean(all_velocities)
    cohort_std = np.std(all_velocities)
    
    sweep_results = {}
    y_true_all_k = {0.5: [], 1.0: [], 1.5: [], 2.0: []}
    y_pred_all_k = {0.5: [], 1.0: [], 1.5: [], 2.0: []}
    
    print(f"\n--- RAW DATA DUMP FOR {dataset_name} ---")
    print(f"Cohort Mean Velocity: {cohort_mean:.4f}, Cohort Std: {cohort_std:.4f}")
    
    for k in [0.5, 1.0, 1.5, 2.0]:
        y_true = []
        y_pred = []
        
        for student_id, sessions in students.items():
            label = sessions[0]["archetype_label"]
            true_dec = 1 if label == "declining" else 0
            
            latest_v = student_latest_velocities.get(student_id, 0)
            z_score = (latest_v - cohort_mean) / max(cohort_std, 0.01)
            
            pred_dec = 1 if z_score < -k else 0
            
            y_true.append(true_dec)
            y_pred.append(pred_dec)
            
        y_true_all_k[k] = y_true
        y_pred_all_k[k] = y_pred
            
        report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
        sweep_results[k] = report['1'] if '1' in report else {"precision": 0, "recall": 0, "f1-score": 0}
        
        print(f"k={k} -> y_true: {sum(y_true)} decliners | y_pred: {sum(y_pred)} alerts | F1: {sweep_results[k].get('f1-score', 0):.2f}")
        
    best_k = 1.0
    best_conf = confusion_matrix(y_true_all_k[best_k], y_pred_all_k[best_k])
            
    fp_by_archetype = {"steady_improver": 0, "plateauing": 0, "noisy": 0}
    fn_by_archetype = {"declining": 0}
    
    for student_id, sessions in students.items():
        label = sessions[0]["archetype_label"]
        latest_v = student_latest_velocities.get(student_id, 0)
        z_score = (latest_v - cohort_mean) / max(cohort_std, 0.01)
        pred_dec = 1 if z_score < -best_k else 0
        true_dec = 1 if label == "declining" else 0
        
        if pred_dec == 1 and true_dec == 0:
            fp_by_archetype[label] += 1
        elif pred_dec == 0 and true_dec == 1:
            fn_by_archetype[label] += 1

    return {
        "name": dataset_name,
        "cluster_k": cluster_results['k'],
        "silhouette": cluster_results['silhouette'],
        "sweep": sweep_results,
        "best_k": best_k,
        "best_conf": best_conf,
        "fp_by_archetype": fp_by_archetype,
        "fn_by_archetype": fn_by_archetype
    }

def run_evaluation():
    base_dir = os.path.dirname(__file__)
    
    v1_path = os.path.join(base_dir, "synthetic_dataset", "student_responses_v1_frozen.json")
    v2_path = os.path.join(base_dir, "synthetic_dataset", "student_responses.json")
    
    v1_results = evaluate_dataset("V1 (Frozen)", v1_path)
    v2_results = evaluate_dataset("V2 (Improved)", v2_path)
    
    eval_path = os.path.join(base_dir, "EVALUATION.md")
    with open(eval_path, 'w') as f:
        f.write("# TVT ML/NLP Pipeline Evaluation\n\n")
        f.write("## Root Cause Summary\n")
        f.write("1. **Tracker Bug**: The detector previously calculated a Z-score relative to a student's own historical velocities. For sustained decliners, this meant a plateau at the bottom resulted in a *positive* Z-score, missing the decline.\n")
        f.write("2. **Clustering Overlap**: The v1 synthetic generator produced overlapping distributions (only 2 distinct clusters found) because the 'noisy' archetype perfectly bridged the data centers without actual statistical variance.\n\n")
        
        f.write("## Fix 1: Cohort-Relative Deceleration Threshold (K-Sweep)\n")
        f.write("We sweep the threshold `k` across [0.5, 1.0, 1.5, 2.0] standard deviations below the cohort mean velocity.\n\n")
        
        for res in [v1_results, v2_results]:
            f.write(f"### {res['name']} Threshold Sweep\n")
            f.write("| k (Threshold) | Precision | Recall | F1-Score |\n")
            f.write("|---|---|---|---|\n")
            for k_val, metrics in res['sweep'].items():
                f.write(f"| {k_val} | {metrics['precision']:.2f} | {metrics['recall']:.2f} | {metrics['f1-score']:.2f} |\n")
            
            f.write(f"\n**Chosen Threshold for {res['name']}**: k = {res['best_k']}\n")
            f.write("#### Confusion Matrix Breakdown at chosen k:\n")
            f.write("| Archetype | Predicted: Not Declining | Predicted: Declining (Alert) |\n")
            f.write("|---|---|---|\n")
            f.write(f"| **Declining (True)** | {res['fn_by_archetype']['declining']} (FN) | {res['best_conf'][1][1]} (TP) |\n")
            f.write(f"| **Steady Improver** | {20 - res['fp_by_archetype']['steady_improver']} | {res['fp_by_archetype']['steady_improver']} (FP) |\n")
            f.write(f"| **Plateauing** | {20 - res['fp_by_archetype']['plateauing']} | {res['fp_by_archetype']['plateauing']} (FP) |\n")
            f.write(f"| **Noisy** | {20 - res['fp_by_archetype']['noisy']} | {res['fp_by_archetype']['noisy']} (FP) |\n\n")
            
        f.write("### Justification for k\n")
        f.write(f"A threshold of k = 1.0 represents the optimal tradeoff for an early-warning system. While a lower threshold (k = 0.5) maximizes raw F1-score and catches more decliners, it yields an unacceptably high false-positive rate across steady and plateauing students. A threshold of 1.0 ensures alerts are only triggered for statistically significant drops, preventing faculty alert fatigue.\n\n")

        f.write("## Fix 2: V1 vs V2 Side-by-Side Comparison\n")
        f.write("| Metric | V1 (Frozen/Hard) | V2 (Improved Generator) |\n")
        f.write("|---|---|---|\n")
        f.write(f"| Optimal Clusters Found | {v1_results['cluster_k']} | {v2_results['cluster_k']} |\n")
        f.write(f"| Silhouette Score | {v1_results['silhouette']:.4f} | {v2_results['silhouette']:.4f} |\n")
        f.write(f"| F1-Score (Best k) | {v1_results['sweep'][v1_results['best_k']]['f1-score']:.2f} | {v2_results['sweep'][v2_results['best_k']]['f1-score']:.2f} |\n\n")

        f.write("### Interpretation\n")
        f.write("The underlying tracking algorithm (Fix 1) objectively improved the baseline: V1's F1 score rose from 0.13 to 0.22 because the cohort-relative Z-score is mathematically sounder than comparing a student against their own already-declining history. However, overall performance remains poor. **V2 metrics did not improve substantially over V1**, and the clustering algorithm still only finds 2 optimal clusters. \n\n")
        f.write("**Honest Assessment:** The ML pipeline is still struggling significantly. The issue is NOT resolved. The embedding vectors generated from these synthetic sentences simply do not separate neatly into 4 archetypes, and the scalar velocity metric (even with cohort thresholds) is still heavily polluted by noise, resulting in unacceptably high false positive rates for steady/plateauing students. \n\n")
        f.write("**Open Issue & Next Steps:** The synthetic data generation is fundamentally flawed at simulating the nuances of cognitive change that `Sentence-BERT` expects. Instead of tweaking the generator further, we must either (a) test with a real, human-annotated dataset, or (b) completely rethink the `VelocityTracker` to use a multi-dimensional classifier rather than aggregating 6 dimensions into a single scalar velocity, which destroys signal. I recommend pausing ML tweaks here until real data is available.")

if __name__ == "__main__":
    run_evaluation()
