# Thought Velocity Tracker (TVT)

Thought Velocity Tracker (TVT) is a longitudinal AI system designed to measure the rate and direction of cognitive evolution in students over time. Rather than evaluating a student as "good" or "bad", TVT produces a dynamic intellectual fingerprint—a "Thinking Profile"—and tracks how the structure, depth, and complexity of a student's thinking changes across months.

## Core Features

- **Longitudinal Tracking**: Captures periodic open-ended student responses via a web form.
- **NLP Analysis Pipeline**: Analyzes text using tokenization, semantic embedding (Sentence-BERT), and structural analysis (spaCy).
- **6-Dimensional Thinking Profile**: Evaluates responses across Semantic Depth, Abstraction Level, Reasoning Structure, Cross-domain Links, Confidence Pattern, and Vocabulary Expansion.
- **Thought Velocity Computation**: Calculates the magnitude and direction of cognitive change between sessions.
- **Dynamic Dashboards**: Provides beautifully designed, premium visualizations for both students (personal trajectory) and faculty (cohort monitoring and early-warning alerts).

## Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Plotly.js (react-plotly.js)
- **Backend**: FastAPI (Python)
- **NLP Engine**: spaCy + Sentence-BERT
- **ML Layer**: scikit-learn + NumPy (K-Means, DBSCAN, cosine similarity)
- **Database**: PostgreSQL (Student sessions, response history, profile snapshots)

---

## 1. Frontend Setup & Execution

The frontend is a React application scaffolded with Vite, styled with a premium glassmorphism aesthetic using Tailwind CSS.

### Requirements
- Node.js (v16+)
- npm or yarn

### Installation
Navigate to the `frontend/` directory and install the dependencies:
```bash
cd frontend
npm install
```

### Running the Development Server
```bash
npm run dev
```
The frontend will be accessible at `http://localhost:5173`. 
- **Student View**: Displays the personal cognitive trajectory and radar charts showing velocity arrows across the 6 axes.
- **Faculty View**: Displays an Early Warning System for students exhibiting cognitive deceleration.

---

## 2. Backend & API Setup

The backend handles incoming responses, coordinates with the NLP engine, and interacts with PostgreSQL.

### API Endpoints
- `POST /api/responses`: Submit a new student response for NLP processing.
- `GET /api/students/{student_id}/profile`: Retrieve the latest 6-dimensional thinking profile and velocity history.
- `GET /api/faculty/alerts`: Retrieve early-warning alerts for cognitive deceleration across the cohort.

### Execution
Ensure you have Python 3.9+ and PostgreSQL installed.
```bash
# Navigate to the backend directory (if separated) or root
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`. API documentation is automatically generated at `/docs` (Swagger UI).

---

## 3. NLP Methodologies

The Data Science engine employs a completely non-evaluative approach to track the rate and direction of cognitive evolution.

### Preprocessing and Structural Parsing
We utilize `spaCy` (specifically `en_core_web_sm`) to perform robust dependency parsing. This allows us to structurally analyze responses without subjectively judging the content.

### Vector Embeddings
We use `sentence-transformers` (`all-MiniLM-L6-v2`) to encode student responses into dense vector embeddings. This allows us to spatially plot thoughts and track semantic drift over time.

### The 6-Dimensional Cognitive Profile
The 6 dimensions are extracted using structural heuristics:
1. **Semantic Depth**: Calculated by the ratio of subordinate clauses (e.g., advcl, ccomp) to total sentences.
2. **Abstraction Level**: A proxy metric tracking the proportion of complex noun forms.
3. **Reasoning Structure**: Frequency of explicit logical connectives (because, therefore, however, etc.).
4. **Cross-domain Links**: Density of unique noun chunks and disparate entities.
5. **Confidence Pattern**: Proportion of hedging/modal verbs (might, could, seem).
6. **Vocabulary Expansion**: Measured via Type-Token Ratio of lemmas.

### Thought Velocity Computation
- **Magnitude**: L2 norm of the delta vector between sessions.
- **Direction / Structural Shift**: Cosine similarity between historical and current profiles.
- **Cognitive Deceleration (Early Warning)**: Automatically detects when the scalar velocity drops below 0 for two or more consecutive sessions, allowing educators to intervene.

---

## Important Considerations

- **Non-evaluative Approach**: The system strictly tracks the *direction* and *speed* of change. It does not judge students.
- **Data Privacy**: Development uses simulated datasets. Live institutional database integrations must comply with strict privacy requirements.
