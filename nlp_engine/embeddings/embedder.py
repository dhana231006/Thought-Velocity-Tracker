from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class SemanticEmbedder:
    def __init__(self):
        # Load Sentence-BERT for dense embeddings
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')

    def get_embedding(self, text, topic=""):
        """Generate semantic embeddings using Sentence-BERT as dense vectors."""
        if not text or len(text.strip()) == 0:
            return np.zeros(384).tolist()
            
        if topic:
            text = f"Domain Topic: {topic}. Student Response: {text}"
            
        embedding = self.embedder.encode(text)
        return embedding.tolist()
        
    def compute_drift(self, embedding_t0, embedding_t1):
        """Compute semantic drift (1 - cosine similarity) between two embeddings."""
        v0 = np.array(embedding_t0)
        v1 = np.array(embedding_t1)
        
        if np.linalg.norm(v0) == 0 or np.linalg.norm(v1) == 0:
            cos_sim = 1.0 if np.linalg.norm(v0) == np.linalg.norm(v1) else 0.0
        else:
            cos_sim = cosine_similarity(v0.reshape(1, -1), v1.reshape(1, -1))[0][0]
            
        # Semantic drift is the distance, so 1 - similarity
        drift = 1.0 - cos_sim
        return {
            "cosine_similarity": round(float(cos_sim), 4),
            "semantic_drift": round(float(drift), 4)
        }
