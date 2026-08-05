import spacy
import numpy as np

class FeatureExtractor:
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            self.nlp = spacy.load("en_core_web_sm")
            
        self.logical_connectives = {"because", "therefore", "if", "thus", "however", "hence", "since", "although"}
        self.hedging_words = {"might", "could", "possibly", "maybe", "perhaps", "seem", "appear"}

    def _clamp(self, value, max_expected=1.0):
        """Soft-clamp: divide by expected max then clip to [0,1]."""
        return float(min(1.0, max(0.0, value / max_expected)))

    def extract_dimensions(self, text):
        """Extract the 6 cognitive dimensions based on structural & semantic features."""
        
        # Fallback for empty or extremely short text
        if not text or len(text.strip()) == 0:
            return {
                "semantic_depth": 0.0,
                "abstraction_level": 0.0,
                "reasoning_structure": 0.0,
                "cross_domain_links": 0.0,
                "confidence_pattern": 0.0,
                "vocabulary_expansion": 0.0
            }
            
        doc = self.nlp(text)
        num_sents = max(1, len(list(doc.sents)))
        num_tokens = max(1, len(doc))
        
        # 1. Semantic Depth: subordinate clauses per sentence (expected max ~2 per sentence)
        subordinate_clauses = [token for token in doc if token.dep_ in ('advcl', 'csubj', 'ccomp', 'xcomp')]
        semantic_depth = self._clamp(len(subordinate_clauses) / num_sents, max_expected=2.0)
        
        # 2. Abstraction Level: ratio of long nouns (already 0-1, no clamping needed)
        nouns = [token for token in doc if token.pos_ == 'NOUN']
        abstraction_level = self._clamp(len([n for n in nouns if len(n.text) > 7]) / max(1, len(nouns)), max_expected=1.0)
        
        # 3. Reasoning Structure: logical connectives per sentence (expected max ~2 per sentence)
        connective_count = sum(1 for token in doc if token.text.lower() in self.logical_connectives)
        reasoning_structure = self._clamp(connective_count / num_sents, max_expected=2.0)
        
        # 4. Cross-domain Links: noun chunks per sentence (expected max ~8 per sentence)
        cross_domain_links = self._clamp(len(list(doc.noun_chunks)) / num_sents, max_expected=8.0)
        
        # 5. Confidence Pattern: hedging word frequency (already small ratio)
        hedge_count = sum(1 for token in doc if token.text.lower() in self.hedging_words)
        confidence_pattern = self._clamp(hedge_count / num_tokens, max_expected=0.15)
        
        # 6. Vocabulary Expansion: Type-Token Ratio (inherently 0-1)
        lemmas = [token.lemma_.lower() for token in doc if token.is_alpha]
        vocabulary_expansion = self._clamp(len(set(lemmas)) / max(1, len(lemmas)), max_expected=1.0)
        
        return {
            "semantic_depth": round(semantic_depth, 4),
            "abstraction_level": round(abstraction_level, 4),
            "reasoning_structure": round(reasoning_structure, 4),
            "cross_domain_links": round(cross_domain_links, 4),
            "confidence_pattern": round(confidence_pattern, 4),
            "vocabulary_expansion": round(vocabulary_expansion, 4)
        }

class FeatureNormalizer:
    def __init__(self):
        self.baselines = {}
        
    def fit(self, features_list):
        """Fit baselines (mean and std) for z-score normalization based on a cohort dataset."""
        keys = ["semantic_depth", "abstraction_level", "reasoning_structure", 
                "cross_domain_links", "confidence_pattern", "vocabulary_expansion"]
                
        for k in keys:
            values = [f[k] for f in features_list]
            self.baselines[k] = {
                "mean": np.mean(values) if values else 0.0,
                "std": np.std(values) if values else 1.0
            }
            # Prevent zero division
            if self.baselines[k]["std"] == 0:
                self.baselines[k]["std"] = 1.0
                
    def normalize(self, features):
        """Apply z-score normalization using fitted baselines."""
        normalized = {}
        for k, v in features.items():
            if k in self.baselines:
                mean = self.baselines[k]["mean"]
                std = self.baselines[k]["std"]
                normalized[k] = round((v - mean) / std, 4)
            else:
                normalized[k] = v
        return normalized
