# AGENTS.md

## Project Context
Thought Velocity Tracker (TVT) is a longitudinal AI system that measures the rate and direction of cognitive evolution in students over time. It tracks how the structure, depth, and complexity of a student's thinking changes across months, producing a dynamic intellectual fingerprint called a "Thinking Profile".

## Core Objectives
1. Capture periodic open-ended student responses via a web form.
2. Process text using an NLP pipeline (tokenization, semantic embedding via Sentence-BERT, structural analysis).
3. Generate a 6-dimensional Thinking Profile (Semantic Depth, Abstraction Level, Reasoning Structure, Cross-domain Links, Confidence Pattern, Vocabulary Expansion).
4. Compute Thought Velocity (magnitude and direction of change between sessions).
5. Visualize trajectories on a dashboard for students and faculty.

## Technology Stack
- **Frontend**: React.js, Chart.js, Plotly/D3.js (for longitudinal visualization).
- **Backend**: FastAPI (Python).
- **NLP Engine**: spaCy + Sentence-BERT.
- **ML Layer**: scikit-learn + NumPy (K-Means, DBSCAN, cosine similarity).
- **Database**: PostgreSQL (Student sessions, response history, profile snapshots).

## Critical Rules
1. **Non-evaluative Approach**: The system must strictly track the direction and speed of change. It must NOT judge students as good or bad thinkers.
2. **Data Privacy**: Do not integrate with live institutional databases unless explicitly instructed. Use simulated datasets for development.
3. **Architecture Separation**: Keep the NLP engine decoupled from the FastAPI backend to allow independent scaling.
4. **Frontend Aesthetics**: Use a premium, dynamic design (glassmorphism, smooth gradients, modern typography) for the dashboard. Avoid generic colors.

## Agent Roles
- **Architect Agent**: Responsible for database schema design and API routing.
- **Data Science Agent**: Responsible for the spaCy/Sentence-BERT pipeline and velocity computation logic.
- **Frontend Agent**: Responsible for the React UI, response collection forms, and Plotly/D3.js trajectory charts.
