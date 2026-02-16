# Algorithm Coach

An AI-powered algorithm study coach built with **Cloudflare Agents** and **Workers AI (Llama 3.3)** that helps users prepare for technical coding interviews.

## Features

- **AI Solution Analysis** - Submit code solutions and get detailed feedback on correctness, time/space complexity, edge cases, and code quality with a 0-10 score
- **Smart Recommendations** - Get personalized problem recommendations based on weak areas, study streak, and target company interview patterns
- **Concept Explanations** - Learn algorithm concepts at beginner, intermediate, or advanced depth with analogies and code examples
- **Weakness Analysis** - Automatic tracking of performance by topic with AI-generated personalized study plans
- **Study Dashboard** - Visual overview of streak, solved problems, weak topics, and target companies
- **Persistent State** - All progress persists across sessions via Cloudflare Durable Objects (SQLite)
- **Real-time Updates** - WebSocket-based state synchronization between server and client
- **Dark/Light Theme** - Toggle between themes

## Architecture

```
┌──────────────────────────────────────┐
│           React Frontend             │
│  (Chat UI / Submit Form / Dashboard) │
│         useAgent() hook              │
└──────────────┬───────────────────────┘
               │ WebSocket
               ▼
┌──────────────────────────────────────┐
│     AlgorithmCoach (Durable Object)  │
│  ┌─────────────────────────────────┐ │
│  │ @callable() methods:            │ │
│  │  - chat()                       │ │
│  │  - submitSolution()             │ │
│  │  - getNextRecommendation()      │ │
│  │  - explainConcept()             │ │
│  │  - analyzeWeaknesses()          │ │
│  │  - updateTargetCompanies()      │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │ CoachState (SQLite-backed)      │ │
│  │  - solvedProblems[]             │ │
│  │  - weakTopics[]                 │ │
│  │  - studyStreak                  │ │
│  │  - targetCompanies[]            │ │
│  │  - chatMessages[]               │ │
│  └─────────────────────────────────┘ │
└──────────────┬───────────────────────┘
               │ Workers AI Binding
               ▼
┌──────────────────────────────────────┐
│   Cloudflare Workers AI              │
│   @cf/meta/llama-3.3-70b-instruct   │
└──────────────────────────────────────┘
```

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Agent Framework**: Cloudflare Agents (Durable Objects)
- **LLM**: Llama 3.3 70B via Workers AI
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4
- **Build**: Vite + `@cloudflare/vite-plugin`
- **State**: SQLite (via Durable Objects)
- **Communication**: WebSocket (via `useAgent` hook)

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- Cloudflare account (for Workers AI access)

### Installation

```bash
git clone <repository-url>
cd algorithmcoach
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note**: Workers AI requires authentication. When running locally, the Cloudflare Vite plugin handles this via your Cloudflare login session. Run `npx wrangler login` if not already authenticated.

## Deployment

```bash
npm run deploy
```

This builds the frontend and deploys the Worker + Durable Object to Cloudflare.

## Usage

### Chat
Talk to the AI coach about algorithms, data structures, and interview strategies. The coach maintains conversation context and personalizes responses based on your study history.

### Submit a Solution
1. Navigate to the **Submit** tab
2. Enter the problem name/ID, select language and difficulty, enter the topic
3. Paste your code solution
4. Click **Submit for Analysis**
5. View the AI's detailed feedback in the Chat tab

### Get Recommendations
Click **Get Recommendation** from the dashboard or welcome screen. The coach analyzes your weak areas, recent problems, and target companies to suggest the best next problem.

### Explain a Concept
Use the **Explain a Concept** form on the Submit tab. Choose the topic (e.g., "Dynamic Programming") and depth level (beginner/intermediate/advanced).

### Study Dashboard
View your study streak, total problems solved, weak topics, target companies, and recent problem history. Set target companies to get tailored recommendations.

## Project Structure

```
src/
  server.ts      # AlgorithmCoach agent (Durable Object) with @callable methods
  app.tsx         # Main React application (Chat, Submit, Dashboard views)
  client.tsx      # React entry point
  components/     # Reusable UI components (Button, Card, Avatar, etc.)
  providers/      # React context providers
  styles.css      # Tailwind CSS + custom styles
wrangler.jsonc     # Cloudflare Worker configuration
env.d.ts           # TypeScript type definitions for env bindings
PROMPTS.md         # Documentation of all AI prompts
```

## Assignment Requirements

| Requirement | Implementation |
|---|---|
| LLM Integration | Llama 3.3 70B via Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) |
| Workflow/Coordination | Cloudflare Agents framework (Durable Objects) with `@callable()` methods |
| Chat UI | React chat interface with WebSocket real-time updates via `useAgent()` |
| State Management | Persistent `CoachState` stored in SQLite via Agent framework |

## License

MIT
