# cf_ai_algorithmcoach

An AI-powered algorithm study coach built with Cloudflare Agents and Workers AI (Llama 3.3 70B). Helps users prepare for technical coding interviews with personalized feedback, spaced repetition review scheduling, and adaptive study plans.

## Features

- **AI Solution Analysis** - Submit code and get feedback on correctness, time/space complexity, edge cases, and code quality (scored 0-10)
- **Spaced Repetition** - SM-2 algorithm tracks review intervals per problem; dashboard shows overdue and upcoming reviews
- **Smart Recommendations** - Personalized next-problem suggestions based on weak areas, review schedule, and target company patterns
- **Concept Explanations** - Learn topics at beginner/intermediate/advanced depth with analogies and code examples
- **Weakness Analysis** - AI-generated multi-week study plans based on per-topic performance data
- **Study Dashboard** - Streak counter, solved problems, weak topics, target companies, and review schedule
- **Persistent State** - Progress persists across sessions via Durable Objects (SQLite)
- **Real-time Updates** - WebSocket state sync between server and client

## Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend                 │
│                                             │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Chat   │ │  Submit  │ │  Dashboard   │  │
│  │  View   │ │  View    │ │  View        │  │
│  └─────────┘ └──────────┘ └──────────────┘  │
│         useAgent("coach") hook              │
└──────────────────┬──────────────────────────┘
                   │ WebSocket (real-time state sync)
                   ▼
┌─────────────────────────────────────────────┐
│        Coach (Durable Object Agent)         │
│                                             │
│  @callable() methods:                       │
│    chat()              - general coaching   │
│    submitSolution()    - analyze code + SM-2│
│    getNextRecommendation() - spaced rep     │
│    explainConcept()    - teach topics       │
│    analyzeWeaknesses() - study plans        │
│    updateTargetCompanies()                  │
│                                             │
│  CoachState (persisted to SQLite):          │
│    solvedProblems[] (with SM-2 fields)      │
│    weakTopics[], studyStreak                │
│    targetCompanies[], chatMessages[]        │
└──────────────────┬──────────────────────────┘
                   │ Workers AI binding
                   ▼
┌─────────────────────────────────────────────┐
│          Cloudflare Workers AI              │
│    @cf/meta/llama-3.3-70b-instruct-fp8-fast │
└─────────────────────────────────────────────┘
```

## Tech Stack

| Layer           | Technology                            |
| --------------- | ------------------------------------- |
| Runtime         | Cloudflare Workers                    |
| Agent Framework | Cloudflare Agents (Durable Objects)   |
| LLM             | Llama 3.3 70B via Workers AI          |
| Frontend        | React 19, TypeScript, Tailwind CSS v4 |
| Build           | Vite + @cloudflare/vite-plugin        |
| State           | SQLite (Durable Objects storage)      |
| Communication   | WebSocket via `useAgent` hook         |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Cloudflare account (free tier works — needed for Workers AI)

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/cf_ai_algorithmcoach.git
cd cf_ai_algorithmcoach
npm install
```

### 2. Authenticate with Cloudflare

Workers AI runs remotely even in local dev, so you need to be logged in:

```bash
npx wrangler login
```

This opens a browser window to authorize your Cloudflare account.

### 3. Run locally

```bash
npm run dev
```

Open the URL shown in terminal (usually `http://localhost:5173`).

### 4. Try it out

1. **Chat tab** - Type a message like "What's the best way to learn dynamic programming?" and press Enter
2. **Submit tab** - Paste a coding solution (e.g., a Two Sum solution), fill in the problem name, language, difficulty, and topic, then click Submit for Analysis
3. **Submit tab (bottom)** - Use "Explain a Concept" to get a breakdown of any algorithm topic
4. **Dashboard tab** - View your stats, set target companies, see review schedule, and click "Get Recommendation" or "Analyze Weaknesses"

### 5. Deploy (optional)

```bash
npm run deploy
```

This builds the frontend and deploys the Worker + Durable Object to your Cloudflare account. The deployed URL will be printed in the terminal.

## Project Structure

```
src/
  server.ts       # Coach agent class — @callable methods, SM-2 logic, LLM calls
  app.tsx          # React app — Chat, Submit, and Dashboard views
  client.tsx       # React entry point
  components/      # UI components (Button, Card, Avatar, Textarea, etc.)
  providers/       # React context providers
  styles.css       # Tailwind CSS + custom theme
wrangler.jsonc     # Cloudflare Worker config (DO bindings, AI binding)
env.d.ts           # TypeScript env type definitions
PROMPTS.md         # All AI prompts documented
```

## Key Implementation Details

### Spaced Repetition (SM-2)

Each solved problem tracks `easinessFactor`, `interval`, `reviewCount`, and `nextReview`. When re-submitting the same problem ID, the SM-2 algorithm updates these fields based on the new score. The recommendation engine prioritizes overdue reviews.

### State Management

`Coach` extends `Agent<Env, CoachState>`. Calling `this.setState()` persists to SQLite and pushes the update to connected clients over WebSocket. The frontend receives updates via the `onStateUpdate` callback in `useAgent()`.

### LLM Integration

All LLM calls go through `this.env.AI.run()` using the Workers AI binding. The model (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) runs on Cloudflare's edge infrastructure — no API keys needed.

## Assignment Requirements

| Requirement           | Implementation                                                         |
| --------------------- | ---------------------------------------------------------------------- |
| LLM Integration       | Llama 3.3 70B via Workers AI                                           |
| Workflow/Coordination | Cloudflare Agents (Durable Objects) with `@callable()` methods         |
| Chat UI               | React chat interface with real-time WebSocket updates via `useAgent()` |
| State Management      | Persistent `CoachState` in SQLite, synced to frontend in real-time     |

## License

MIT
