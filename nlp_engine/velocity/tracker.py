import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class VelocityTracker:
    def __init__(self, weights=None):
        if weights is None:
            # Derived from Logistic Regression (L2, C=0.1) fit on V1 (Frozen) 
            self.weights = {
                'semantic_depth': -0.2416, 
                'abstraction_level': -1.1465, 
                'reasoning_structure': -0.4618, 
                'cross_domain_links': 0.3080, 
                'confidence_pattern': 0.1933, 
                'vocabulary_expansion': -0.2123
            }
        else:
            self.weights = weights

    def compute_velocity(self, profile_t0, profile_t1):
        """
        Computes the Thought Velocity between two consecutive 6D Thinking Profiles.
        """
        keys = ["semantic_depth", "abstraction_level", "reasoning_structure", 
                "cross_domain_links", "confidence_pattern", "vocabulary_expansion"]
        
        v0 = np.array([profile_t0.get(k, 0.0) for k in keys])
        v1 = np.array([profile_t1.get(k, 0.0) for k in keys])
        
        # 1. Delta vector (direction of change per dimension)
        delta = v1 - v0
        
        # 2. Magnitude of change (Euclidean distance)
        magnitude = np.linalg.norm(delta)
        
        # 3. Structural shift (Cosine similarity)
        if np.linalg.norm(v0) == 0 or np.linalg.norm(v1) == 0:
            cos_sim = 1.0 if np.linalg.norm(v0) == np.linalg.norm(v1) else 0.0
        else:
            cos_sim = cosine_similarity(v0.reshape(1, -1), v1.reshape(1, -1))[0][0]
            
        # 4. Scalar velocity: Overall growth or deceleration (weighted sum of deltas)
        weight_vec = np.array([self.weights.get(k, 1.0) for k in keys])
        scalar_velocity = np.sum(delta * weight_vec)
        
        return {
            "delta_vector": dict(zip(keys, np.round(delta, 4).tolist())),
            "magnitude": round(float(magnitude), 4),
            "cosine_similarity": round(float(cos_sim), 4),
            "scalar_velocity": round(float(scalar_velocity), 4)
        }

    def detect_deceleration(self, session_profiles, cohort_mean=0.0, cohort_std=1.0, k_threshold=1.0):
        """
        Early-warning logic: Detects cognitive deceleration using statistically 
        grounded thresholds against a cohort baseline.
        """
        if len(session_profiles) < 3:
            return {"warning": False, "reason": "Not enough data", "velocities": []}
            
        velocities = []
        scalar_velocities = []
        for i in range(1, len(session_profiles)):
            v_info = self.compute_velocity(session_profiles[i-1], session_profiles[i])
            velocities.append(v_info)
            scalar_velocities.append(v_info["scalar_velocity"])
            
        if len(scalar_velocities) >= 2:
            latest_velocity = scalar_velocities[-1]
            
            # Add small epsilon to avoid div-by-zero
            safe_std = max(cohort_std, 0.01)
            z_score = (latest_velocity - cohort_mean) / safe_std
            
            warning_triggered = z_score < -k_threshold
        else:
            warning_triggered = False
            z_score = 0.0
            
        return {
            "warning": bool(warning_triggered),
            "latest_z_score": round(float(z_score), 4),
            "velocities": velocities
        }
