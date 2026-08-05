from nlp_engine.features.extractor import FeatureExtractor

class ThoughtVelocityPipeline:
    def __init__(self):
        self.extractor = FeatureExtractor()
        self.nlp = self.extractor.nlp
        
    def extract_dimensions(self, text, doc=None):
        return self.extractor.extract_dimensions(text)
