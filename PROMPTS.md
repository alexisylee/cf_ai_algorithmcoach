# PROMPTS.md

AI prompts used during development of cf_ai_algorithmcoach.

---

### Prompt 1 — Project Specification & Architecture

> Build an AI-powered algorithm study coach using Cloudflare Agents framework that helps users prepare for technical interviews. Create a Cloudflare Agent application with: LLM Integration using Llama 3.3 on Workers AI (`@cf/meta/llama-3.3-70b-instruct`), Workflow/Coordination using Cloudflare Agents (built on Durable Objects), a Chat interface using Cloudflare Pages with real-time WebSocket updates, and persistent State Management tracking the user's study progress, weak areas, and problem history.
>
> The backend should be a `Coach` agent class with a `CoachState` type containing `solvedProblems[]`, `weakTopics[]`, `studyStreak`, `targetCompanies[]`, and `chatMessages[]`. Implement `@callable()` methods for `submitSolution` (send code to Llama 3.3 for complexity/correctness analysis and score 0-10), `getNextRecommendation` (recommend next problem based on weak topics, streak, and target companies), `explainConcept` (explain algorithm topics at beginner/intermediate/advanced depth), `analyzeWeaknesses` (generate a personalized study plan from performance data), and `updateTargetCompanies`.
>
> The React frontend should have three views: a Chat area with markdown rendering, a Code Submission form with language/difficulty/topic selectors, and a Dashboard showing streak, weak topics, and recent problems. Use `useAgent()` for WebSocket state sync. Configure `wrangler.jsonc` with Durable Object bindings, Workers AI binding, and SQLite migration.

### Prompt 2 — Durable Object Namespace Routing Debug

> ran dev and got: The url http://localhost/agents/algorithmcoach/default with namespace "algorithmcoach" and name "default" does not match any server namespace. Did you forget to add a durable object binding to the class Algorithmcoach in your wrangler.jsonc?

### Prompt 3 — SM-2 Spaced Repetition Algorithm

> Implementing spaced repetition. Need a helper function that implements the SM-2 (SuperMemo 2) algorithm. Takes current easiness factor, interval, and a performance score (0-10). Returns new easiness factor and next review interval in days. Use standard SM-2 formula but simplify for my use case. Add comments explaining the math.

### Prompt 4 — Spaced Repetition Full Integration

> Write frontend for next review feature and integrate with backend.

### Prompt 5 — Review Schedule Card Design Change

> Fix frontend for review feature by having the review card always be on dashboard, show overdue and upcoming problems.
