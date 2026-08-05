import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics import silhouette_score, davies_bouldin_score
from sklearn.utils import resample

class CohortClusterer:
    def __init__(self):
        pass
        
    def find_optimal_k(self, data, max_k=10):
        """Find optimal k for KMeans using Silhouette Score (and optionally elbow)."""
        if len(data) < 3:
            return 2 # Fallback
            
        best_k = 2
        best_score = -1
        
        max_k = min(max_k, len(data) - 1)
        
        for k in range(2, max_k + 1):
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(data)
            score = silhouette_score(data, labels)
            
            if score > best_score:
                best_score = score
                best_k = k
                
        return best_k
        
    def perform_clustering(self, profile_vectors):
        """
        [LEGACY] KMeans over individual session profile vectors.
        
        NOTE: This method clusters on single session-level feature snapshots.
        Evaluation (EVALUATION.md, Fix 4) showed this yields ARI ≈ 0 (at-chance)
        against true archetype labels once template variance is present.
        
        Prefer perform_trajectory_clustering() for student-level archetype discovery.
        """
        arr = np.array(profile_vectors)
        if len(arr) < 3:
            return {"k": 1, "labels": [0]*len(arr), "silhouette": 0, "davies_bouldin": 0}
            
        k = self.find_optimal_k(arr)
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(arr)
        
        sil_score = silhouette_score(arr, labels)
        db_score = davies_bouldin_score(arr, labels)
        
        return {
            "k": k,
            "labels": labels.tolist(),
            "silhouette": round(float(sil_score), 4),
            "davies_bouldin": round(float(db_score), 4),
            "cluster_centers": kmeans.cluster_centers_.tolist()
        }
    
    def perform_trajectory_clustering(self, student_trajectory_vectors, k=None):
        """
        Recommended default: KMeans over per-student 12-D trajectory signatures.
        
        Each student trajectory vector should be a 12-D vector:
          [mean_delta_per_dim (6-D), std_delta_per_dim (6-D)]
        computed from consecutive session profile deltas.
        
        Evaluation (EVALUATION.md, Fix 5) showed ARI = 0.16 at k=4 — ~9 standard
        deviations above the random baseline of 0.001 ± 0.017.
        
        declining and steady_improver are clearly separated; plateauing and noisy
        remain partially ambiguous pending real student data.
        
        NOTE: All current metrics are validated against synthetic ground truth only.
        Real-data validation is required before production deployment.
        """
        arr = np.array(student_trajectory_vectors)
        if len(arr) < 3:
            return {"k": 1, "labels": [0]*len(arr), "silhouette": 0, "davies_bouldin": 0}
        
        if k is None:
            k = self.find_optimal_k(arr)
        
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=20)
        labels = kmeans.fit_predict(arr)
        
        sil_score = silhouette_score(arr, labels) if len(set(labels)) > 1 else 0.0
        db_score = davies_bouldin_score(arr, labels) if len(set(labels)) > 1 else 0.0
        
        return {
            "k": k,
            "labels": labels.tolist(),
            "silhouette": round(float(sil_score), 4),
            "davies_bouldin": round(float(db_score), 4),
            "cluster_centers": kmeans.cluster_centers_.tolist()
        }

        
    def find_outliers(self, profile_vectors, eps=0.5, min_samples=3):
        """DBSCAN to flag outlier students."""
        arr = np.array(profile_vectors)
        if len(arr) < min_samples:
            return []
            
        # In a real scenario, eps would be tuned via k-distance graph
        clustering = DBSCAN(eps=eps, min_samples=min_samples)
        labels = clustering.fit_predict(arr)
        
        # -1 indicates an outlier in DBSCAN
        outliers = [i for i, label in enumerate(labels) if label == -1]
        return outliers
        
    def check_stability(self, profile_vectors, num_bootstraps=10):
        """Check cluster stability by resample bootstrapping."""
        arr = np.array(profile_vectors)
        if len(arr) < 10:
            return {"stability": "low", "mean_silhouette": 0}
            
        scores = []
        for i in range(num_bootstraps):
            sample = resample(arr, random_state=i)
            k = self.find_optimal_k(sample)
            kmeans = KMeans(n_clusters=k, random_state=i, n_init=10)
            labels = kmeans.fit_predict(sample)
            scores.append(silhouette_score(sample, labels))
            
        return {
            "mean_silhouette": round(float(np.mean(scores)), 4),
            "std_silhouette": round(float(np.std(scores)), 4),
            "stability_score": round(float(np.mean(scores) / (np.std(scores) + 0.01)), 4)
        }
