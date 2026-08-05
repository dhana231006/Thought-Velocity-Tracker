import json
import os
import random
from datetime import datetime, timedelta
import uuid

# Define archetypes and their structural characteristics

def generate_sentence(complexity, topic, confidence):
    # Expand sentence structures to reduce overlap
    # Expand sentence structures to reduce overlap and increase variance
    simple = [
        f"I think {topic} is important.",
        f"We should study {topic} more.",
        f"{topic} affects society.",
        f"Many people care about {topic}.",
        f"The issue of {topic} matters.",
        f"I really care about {topic}.",
        f"{topic} is something we should focus on.",
        f"It is clear that {topic} is a big deal."
    ]
    
    complex_structs = [
        f"Although some argue otherwise, {topic} is important because it fundamentally alters our perspective.",
        f"If we consider the historical context, therefore, {topic} plays a critical role.",
        f"Since the data indicates a clear trend, it is evident that {topic} leads to broader implications.",
        f"While {topic} might seem trivial initially, it ultimately shapes our shared understanding.",
        f"Because of its wide reach, {topic} must be carefully analyzed, hence its relevance.",
        f"Even though there are detractors, {topic} remains central to the discourse as it impacts multiple domains.",
        f"Given the recent developments, our understanding of {topic} necessitates a deeper investigation."
    ]
    
    hedged = [
        f"It might be possible that {topic} could influence the outcome.",
        f"Perhaps {topic} seems to have a minor effect.",
        f"I might suggest that {topic} could possibly be related.",
        f"Maybe {topic} is somewhat responsible, but it appears uncertain.",
        f"It could be that {topic} might potentially alter things.",
        f"There is a chance that {topic} might be partially involved.",
        f"I suppose {topic} could sort of matter in some contexts."
    ]
    
    abstract = [
        f"The conceptualization of {topic} necessitates a paradigm shift.",
        f"Methodological considerations regarding {topic} require institutional framework modifications.",
        f"The socioeconomic ramifications of {topic} exemplify systematic disparities.",
        f"Theoretical frameworks surrounding {topic} demonstrate profound epistemic consequences.",
        f"Institutionalization of {topic} precipitates fundamental structural realignments.",
        f"The dialectical relationship between {topic} and modern institutions reveals underlying structural biases.",
        f"Ontological assumptions about {topic} inherently constrain the epistemological boundaries."
    ]
    
    sentences = []
    
    if complexity == "low":
        sentences.append(random.choice(simple))
    elif complexity == "medium":
        sentences.append(random.choice(simple))
        sentences.append(random.choice(complex_structs))
    elif complexity == "high":
        sentences.append(random.choice(complex_structs))
        sentences.append(random.choice(abstract))
    elif complexity == "very_low":
        sentences.append(random.choice(simple))
        # No extra sentences, highly constrained
        
    if confidence == "low":
        sentences.append(random.choice(hedged))
        
    return " ".join(sentences)

def generate_student_trajectory(student_id, archetype, num_sessions=5):
    sessions = []
    base_date = datetime.now() - timedelta(days=num_sessions * 14)
    
    topics = ["climate change", "artificial intelligence", "global economics", "social psychology", "quantum computing", "bioethics", "urban planning", "machine learning", "philosophy", "sociology"]
    
    # Randomize the base topic sequence for this specific student so not all students are identical
    student_topic_seq = random.sample(topics, num_sessions)
    student_single_topic = random.choice(topics)
    
    for i in range(num_sessions):
        date = base_date + timedelta(days=i * 14)
        
        if archetype == "steady_improver":
            complexity = "low" if i < 2 else "medium" if i < 4 else "high"
            confidence = "low" if i < 2 else "high"
            topic = student_topic_seq[i]
            
        elif archetype == "plateauing":
            complexity = "medium"
            confidence = "medium"
            topic = student_single_topic
            
        elif archetype == "declining":
            comps = ["high", "high", "medium", "low", "very_low"]
            complexity = comps[i]
            confidence = "high" if i < 2 else "low"
            topic = student_single_topic
            
        else: # noisy
            complexity = random.choice(["high", "medium", "low"])
            confidence = random.choice(["high", "medium", "low"])
            topic = random.choice(topics)
            
        text = generate_sentence(complexity, topic, confidence)
        
        sessions.append({
            "session_id": str(uuid.uuid4()),
            "student_id": student_id,
            "timestamp": date.isoformat(),
            "archetype_label": archetype,
            "text": text
        })
        
    return sessions

def generate_dataset(output_dir, filename="student_responses.json"):
    os.makedirs(output_dir, exist_ok=True)
    
    archetypes = {
        "steady_improver": 20,
        "plateauing": 20,
        "declining": 20,
        "noisy": 20
    }
    
    dataset = []
    student_count = 1
    
    for archetype, count in archetypes.items():
        for _ in range(count):
            student_id = f"student_{student_count:03d}"
            sessions = generate_student_trajectory(student_id, archetype, num_sessions=5)
            dataset.extend(sessions)
            student_count += 1
            
    output_file = os.path.join(output_dir, filename)
    with open(output_file, 'w') as f:
        json.dump(dataset, f, indent=2)
        
    print(f"Generated synthetic dataset with {len(dataset)} total responses across {student_count-1} students.")
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    generate_dataset(os.path.join(os.path.dirname(os.path.dirname(__file__)), "synthetic_dataset"))
