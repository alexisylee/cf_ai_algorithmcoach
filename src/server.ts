import { Agent, routeAgentRequest } from "agents";
import { callable } from "agents";

export type CoachState = {
  userId: string | null;
  solvedProblems: Array<{
    id: string;
    difficulty: "easy" | "medium" | "hard";
    topic: string;
    timestamp: number;
    timeSpent: number;
    needsReview: boolean;
    complexityAnalysis?: string;
  }>;
  weakTopics: string[];
  studyStreak: number;
  lastStudyDate: string | null;
  targetCompanies: string[];
  chatMessages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }>;
};

export class AlgorithmCoach extends Agent<Env, CoachState> {
  initialState: CoachState = {
    userId: null,
    solvedProblems: [],
    weakTopics: [],
    studyStreak: 0,
    lastStudyDate: null,
    targetCompanies: [],
    chatMessages: [],
  };

  onStart(): void {
    this.updateStreak();
  }

  private updateStreak(): void {
    const today = new Date().toISOString().split("T")[0];
    const last = this.state.lastStudyDate;
    if (!last) return;

    const lastDate = new Date(last);
    const todayDate = new Date(today);
    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays > 1) {
      this.setState({ ...this.state, studyStreak: 0 });
    }
  }

  private recordStudyDay(): void {
    const today = new Date().toISOString().split("T")[0];
    const last = this.state.lastStudyDate;
    let streak = this.state.studyStreak;

    if (last !== today) {
      const lastDate = last ? new Date(last) : null;
      const todayDate = new Date(today);
      if (
        lastDate &&
        Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        ) === 1
      ) {
        streak += 1;
      } else if (!lastDate) {
        streak = 1;
      } else {
        streak = 1;
      }
    }

    this.setState({
      ...this.state,
      lastStudyDate: today,
      studyStreak: streak,
    });
  }

  private addChatMessage(role: "user" | "assistant", content: string): void {
    const messages = [
      ...this.state.chatMessages,
      { role, content, timestamp: Date.now() },
    ];
    // Keep last 50 messages
    const trimmed = messages.slice(-50);
    this.setState({ ...this.state, chatMessages: trimmed });
  }

  private async callLlama(
    systemPrompt: string,
    userMessage: string
  ): Promise<string> {
    const response = await this.env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 2048,
      }
    );

    if (response instanceof ReadableStream) {
      const reader = response.getReader();
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
      return result;
    }

    return (response as { response?: string }).response || "No response generated.";
  }

  @callable({ description: "Submit a coding solution for AI analysis" })
  async submitSolution(
    problemId: string,
    code: string,
    language: string,
    difficulty: string,
    topic: string
  ): Promise<string> {
    this.addChatMessage(
      "user",
      `Submitted solution for ${problemId} (${difficulty}, ${topic}) in ${language}`
    );

    const systemPrompt = `You are an expert algorithms instructor and coding interview coach. Analyze the submitted coding solution thoroughly.

Provide your analysis in this format:

## Solution Analysis for ${problemId}

### 1. Correctness
Evaluate whether the solution correctly solves the problem.

### 2. Time Complexity
Analyze the time complexity with Big-O notation. Explain the reasoning.

### 3. Space Complexity
Analyze the space complexity with Big-O notation. Explain the reasoning.

### 4. Edge Cases
Identify edge cases and whether the solution handles them (empty inputs, single elements, large inputs, negative numbers, duplicates, etc.).

### 5. Code Quality
Evaluate readability, naming conventions, and code organization.

### 6. Suggested Improvements
Provide specific improvements with code examples if possible.

### Score: X/10
Give a score from 0-10 and explain your reasoning.`;

    const userMessage = `Problem: ${problemId}
Difficulty: ${difficulty}
Topic: ${topic}
Language: ${language}

Code:
\`\`\`${language}
${code}
\`\`\``;

    try {
      const feedback = await this.callLlama(systemPrompt, userMessage);

      // Parse score from response
      const scoreMatch = feedback.match(/Score:\s*(\d+)\s*\/\s*10/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      const needsReview = score < 7;

      // Update solved problems
      const solvedProblems = [
        ...this.state.solvedProblems,
        {
          id: problemId,
          difficulty: difficulty as "easy" | "medium" | "hard",
          topic,
          timestamp: Date.now(),
          timeSpent: 0,
          needsReview,
          complexityAnalysis: feedback.substring(0, 500),
        },
      ];

      // Update weak topics if score is low
      let weakTopics = [...this.state.weakTopics];
      if (score < 6 && !weakTopics.includes(topic)) {
        weakTopics.push(topic);
      } else if (score >= 8) {
        // Remove from weak topics if consistently good
        const topicProblems = solvedProblems.filter((p) => p.topic === topic);
        const recentGood = topicProblems
          .slice(-3)
          .every((p) => !p.needsReview);
        if (recentGood) {
          weakTopics = weakTopics.filter((t) => t !== topic);
        }
      }

      this.setState({ ...this.state, solvedProblems, weakTopics });
      this.recordStudyDay();
      this.addChatMessage("assistant", feedback);

      return feedback;
    } catch (error) {
      const errorMsg = `Sorry, I encountered an error analyzing your solution. Please try again. Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addChatMessage("assistant", errorMsg);
      return errorMsg;
    }
  }

  @callable({
    description: "Get next problem recommendation based on study history",
  })
  async getNextRecommendation(): Promise<string> {
    this.addChatMessage("user", "Requesting next problem recommendation");

    const recentProblems = this.state.solvedProblems.slice(-5);
    const recentSummary =
      recentProblems.length > 0
        ? recentProblems
            .map(
              (p) =>
                `- ${p.id} (${p.difficulty}, ${p.topic}, review needed: ${p.needsReview})`
            )
            .join("\n")
        : "No problems solved yet";

    const systemPrompt = `You are an algorithm study coach specializing in technical interview preparation. Based on the student's study history, recommend the next problem they should work on.

Provide your recommendation in this format:

## Recommended Next Problem

### Problem Suggestion
Give a specific problem name/type (similar to LeetCode-style problems).

### Difficulty
Recommend Easy, Medium, or Hard based on their progression.

### Topic
The algorithm/data structure topic.

### Why This Problem
Explain why this is the best next step based on:
- Their weak areas that need practice
- Progressive difficulty building
- Interview patterns for their target companies
- Spaced repetition for previously struggled topics

### Key Concepts to Review
List 2-3 concepts they should review before attempting.

### Similar Problems
Suggest 2-3 similar problems for additional practice.`;

    const userMessage = `Student Study Profile:
- Weak topics: ${this.state.weakTopics.length > 0 ? this.state.weakTopics.join(", ") : "None identified yet"}
- Study streak: ${this.state.studyStreak} days
- Total problems solved: ${this.state.solvedProblems.length}
- Target companies: ${this.state.targetCompanies.length > 0 ? this.state.targetCompanies.join(", ") : "General preparation"}
- Recent problems:
${recentSummary}`;

    try {
      const recommendation = await this.callLlama(systemPrompt, userMessage);
      this.addChatMessage("assistant", recommendation);
      return recommendation;
    } catch (error) {
      const errorMsg = `Sorry, I couldn't generate a recommendation. Please try again. Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addChatMessage("assistant", errorMsg);
      return errorMsg;
    }
  }

  @callable({ description: "Explain an algorithm concept at a given depth" })
  async explainConcept(
    topic: string,
    depth: "beginner" | "intermediate" | "advanced"
  ): Promise<string> {
    this.addChatMessage(
      "user",
      `Explain ${topic} at ${depth} level`
    );

    // Adjust context based on user's history with this topic
    const topicProblems = this.state.solvedProblems.filter(
      (p) => p.topic.toLowerCase() === topic.toLowerCase()
    );
    const historyContext =
      topicProblems.length > 0
        ? `The student has solved ${topicProblems.length} problems on this topic. ${topicProblems.some((p) => p.needsReview) ? "They still struggle with some aspects." : "They seem to have a reasonable grasp."}`
        : "The student has not solved any problems on this topic yet.";

    const systemPrompt = `You are a patient and thorough algorithms tutor. Explain the requested topic at the specified depth level.

${historyContext}

Format your explanation as:

## ${topic}

### Core Concept
Explain the core concept in 2-3 clear sentences.

### Real-World Analogy
Provide an intuitive real-world analogy that makes the concept click.

### How It Works
Step-by-step explanation of the algorithm/data structure.

### Code Example
Provide a clear, well-commented code example in Python.

### Time & Space Complexity
Explain the typical complexity.

### Common Pitfalls
List common mistakes and misconceptions.

### When to Use It
Describe typical interview scenarios where this applies.

### Practice Suggestions
Suggest specific problems to practice this concept.

Adjust detail level for ${depth}:
- beginner: Focus on intuition, simple examples, avoid jargon
- intermediate: Include implementation details, edge cases, variations
- advanced: Cover optimizations, advanced variations, real-world applications`;

    const userMessage = `Explain: ${topic}
Depth: ${depth}`;

    try {
      const explanation = await this.callLlama(systemPrompt, userMessage);
      this.recordStudyDay();
      this.addChatMessage("assistant", explanation);
      return explanation;
    } catch (error) {
      const errorMsg = `Sorry, I couldn't generate an explanation. Please try again. Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addChatMessage("assistant", errorMsg);
      return errorMsg;
    }
  }

  @callable({ description: "Analyze weaknesses and generate a study plan" })
  async analyzeWeaknesses(): Promise<string> {
    this.addChatMessage("user", "Analyze my weaknesses and create a study plan");

    if (this.state.solvedProblems.length === 0) {
      const msg =
        "You haven't solved any problems yet! Start by submitting a solution, and I'll track your progress to identify areas for improvement.";
      this.addChatMessage("assistant", msg);
      return msg;
    }

    // Build detailed analysis data
    const topicStats: Record<
      string,
      { total: number; needsReview: number; difficulties: string[] }
    > = {};

    for (const problem of this.state.solvedProblems) {
      if (!topicStats[problem.topic]) {
        topicStats[problem.topic] = {
          total: 0,
          needsReview: 0,
          difficulties: [],
        };
      }
      topicStats[problem.topic].total++;
      if (problem.needsReview) topicStats[problem.topic].needsReview++;
      topicStats[problem.topic].difficulties.push(problem.difficulty);
    }

    const statsStr = Object.entries(topicStats)
      .map(
        ([topic, stats]) =>
          `- ${topic}: ${stats.total} solved, ${stats.needsReview} need review, difficulties: ${stats.difficulties.join(", ")}`
      )
      .join("\n");

    const systemPrompt = `You are an expert algorithm study coach. Analyze the student's performance data and create a personalized study plan.

Format your analysis as:

## Weakness Analysis

### Performance Overview
Summarize overall performance and progress.

### Identified Weak Areas
List weak areas ranked by priority, with specific evidence.

### Strength Areas
Acknowledge what the student is doing well.

## Personalized Study Plan

### Week 1-2: Foundation Strengthening
Specific daily tasks focusing on the weakest areas.

### Week 3-4: Progressive Challenges
Build up difficulty in weak areas while maintaining strengths.

### Daily Practice Routine
Suggest a daily time-boxed routine.

### Key Strategies
- Specific techniques for each weak area
- Review schedule for previously solved problems
- Mock interview preparation tips`;

    const userMessage = `Student Data:
- Total problems solved: ${this.state.solvedProblems.length}
- Study streak: ${this.state.studyStreak} days
- Weak topics: ${this.state.weakTopics.join(", ") || "None flagged"}
- Target companies: ${this.state.targetCompanies.join(", ") || "General"}
- Topic breakdown:
${statsStr}`;

    try {
      const analysis = await this.callLlama(systemPrompt, userMessage);
      this.addChatMessage("assistant", analysis);
      return analysis;
    } catch (error) {
      const errorMsg = `Sorry, I couldn't analyze your weaknesses. Please try again. Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.addChatMessage("assistant", errorMsg);
      return errorMsg;
    }
  }

  @callable({ description: "Update target companies for interview prep" })
  async updateTargetCompanies(companies: string[]): Promise<string> {
    this.setState({ ...this.state, targetCompanies: companies });
    const msg = `Target companies updated to: ${companies.join(", ")}. I'll tailor problem recommendations to match their interview patterns.`;
    this.addChatMessage("user", `Set target companies: ${companies.join(", ")}`);
    this.addChatMessage("assistant", msg);
    return msg;
  }

  @callable({ description: "Send a chat message to the coach" })
  async chat(message: string): Promise<string> {
    this.addChatMessage("user", message);

    const recentMessages = this.state.chatMessages
      .slice(-10)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const systemPrompt = `You are an AI algorithm study coach helping students prepare for technical interviews. You're friendly, encouraging, and knowledgeable about data structures, algorithms, and coding interview strategies.

You can help with:
- Explaining algorithm concepts
- Reviewing solution approaches
- Providing study tips and strategies
- Motivating students to keep studying
- Answering questions about data structures and algorithms

Keep responses concise but helpful. Use markdown formatting for clarity.

Student profile:
- Problems solved: ${this.state.solvedProblems.length}
- Study streak: ${this.state.studyStreak} days
- Weak topics: ${this.state.weakTopics.join(", ") || "None identified"}
- Target companies: ${this.state.targetCompanies.join(", ") || "General"}`;

    try {
      const response = await this.callLlama(systemPrompt, `Recent conversation:\n${recentMessages}\n\nCurrent message: ${message}`);
      this.addChatMessage("assistant", response);
      return response;
    } catch (error) {
      const errorMsg = `Sorry, I encountered an error. Please try again.`;
      this.addChatMessage("assistant", errorMsg);
      return errorMsg;
    }
  }
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
