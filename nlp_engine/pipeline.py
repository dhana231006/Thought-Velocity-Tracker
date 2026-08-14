from nlp_engine.features.extractor import FeatureExtractor

from nlp_engine.embeddings.embedder import SemanticEmbedder

class ThoughtVelocityPipeline:
    def __init__(self):
        self.extractor = FeatureExtractor()
        self.nlp = self.extractor.nlp
        self.embedder = SemanticEmbedder()
        
    def extract_dimensions(self, text, doc=None, topic=""):
        dimensions = self.extractor.extract_dimensions(text)
        embedding = self.embedder.get_embedding(text, topic)
        return dimensions, embedding
