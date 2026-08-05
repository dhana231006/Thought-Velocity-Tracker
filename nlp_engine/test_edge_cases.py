from pipeline import ThoughtVelocityPipeline
import json

def test_edge_cases():
    pipeline = ThoughtVelocityPipeline()
    
    edge_cases = {
        "extremely_short": "Yes.",
        "single_word": "Okay",
        "highly_technical": "The homoscedasticity of the residuals in the OLS regression implies that the variance of the error term is constant across all levels of the independent variables, rendering the Gauss-Markov theorem applicable.",
        "gibberish": "Asdflkjasdflkjasdf qwerty xyz.",
        "empty_string": "",
    }
    
    results = {}
    print("Testing NLP Pipeline Edge Cases...\n")
    
    for case_name, text in edge_cases.items():
        try:
            print(f"Running case: {case_name}")
            # process_response outputs to file, but we just want the return dict here
            res = pipeline.process_response("student_edge", text, output_file="f:\\Programmes\\PDD V2\\nlp_engine\\edge_case_results.json")
            results[case_name] = res["dimensions"]
            print(f"Success for {case_name}: {res['dimensions']}")
        except Exception as e:
            print(f"Failed for {case_name}: {str(e)}")
            results[case_name] = {"error": str(e)}
            
    return results

if __name__ == "__main__":
    test_edge_cases()
