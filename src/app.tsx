import { useEffect, useState, useRef, useCallback } from "react";
import { useAgent } from "agents/react";

import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Avatar } from "@/components/avatar/Avatar";
import { Textarea } from "@/components/textarea/Textarea";
import { MemoizedMarkdown } from "@/components/memoized-markdown";

import {
  MoonIcon,
  SunIcon,
  PaperPlaneTiltIcon,
  CodeIcon,
  LightbulbIcon,
  ChartBarIcon,
  TargetIcon,
  ArrowRightIcon,
  BookOpenIcon,
  FireIcon,
  TrophyIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";

import type { CoachState } from "./server";

type View = "chat" | "submit" | "dashboard";

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("theme");
    return (saved as "dark" | "light") || "dark";
  });
  const [showDebug] = useState(false);
  const [view, setView] = useState<View>("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: number }>
  >([]);

  // Submit solution state
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [difficulty, setDifficulty] = useState("medium");
  const [problemId, setProblemId] = useState("");
  const [topic, setTopic] = useState("");

  // Concept explanation state
  const [conceptTopic, setConceptTopic] = useState("");
  const [conceptDepth, setConceptDepth] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");

  // Target companies state
  const [companiesInput, setCompaniesInput] = useState("");

  // Agent state
  const [coachState, setCoachState] = useState<CoachState | null>(null);

  const agent = useAgent<CoachState>({
    agent: "algorithmcoach",
    onStateUpdate: (state: CoachState) => {
      setCoachState(state);
      if (state?.chatMessages) {
        setMessages(state.chatMessages);
      }
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Chat handler
  const handleChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || loading) return;
    const msg = chatInput;
    setChatInput("");
    setLoading(true);
    try {
      await agent.call("chat", [msg]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Submit solution handler
  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !problemId.trim() || !topic.trim() || loading) return;
    setLoading(true);
    setView("chat");
    try {
      await agent.call("submitSolution", [
        problemId,
        code,
        language,
        difficulty,
        topic,
      ]);
      setCode("");
      setProblemId("");
      setTopic("");
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get recommendation
  const handleGetRecommendation = async () => {
    if (loading) return;
    setLoading(true);
    setView("chat");
    try {
      await agent.call("getNextRecommendation");
    } catch (err) {
      console.error("Recommendation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Explain concept
  const handleExplainConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptTopic.trim() || loading) return;
    setLoading(true);
    setView("chat");
    try {
      await agent.call("explainConcept", [conceptTopic, conceptDepth]);
      setConceptTopic("");
    } catch (err) {
      console.error("Explain error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Analyze weaknesses
  const handleAnalyzeWeaknesses = async () => {
    if (loading) return;
    setLoading(true);
    setView("chat");
    try {
      await agent.call("analyzeWeaknesses");
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update companies
  const handleUpdateCompanies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companiesInput.trim() || loading) return;
    const companies = companiesInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    setLoading(true);
    try {
      await agent.call("updateTargetCompanies", [companies]);
      setCompaniesInput("");
    } catch (err) {
      console.error("Update companies error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = coachState || {
    solvedProblems: [],
    weakTopics: [],
    studyStreak: 0,
    targetCompanies: [],
    lastStudyDate: null,
  };

  return (
    <div className="h-screen w-full p-4 flex justify-center items-center bg-fixed overflow-hidden">
      <div className="h-[calc(100vh-2rem)] w-full mx-auto max-w-2xl flex flex-col shadow-xl rounded-md overflow-hidden relative border border-neutral-300 dark:border-neutral-800">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 flex items-center gap-3 sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <BookOpenIcon size={24} className="text-blue-500" />
            <h2 className="font-semibold text-base">Algorithm Coach</h2>
          </div>

          <div className="flex-1 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setView("chat")}
              className={`px-3 py-1 text-sm rounded-md cursor-pointer transition-colors ${
                view === "chat"
                  ? "bg-blue-600 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setView("submit")}
              className={`px-3 py-1 text-sm rounded-md cursor-pointer transition-colors ${
                view === "submit"
                  ? "bg-blue-600 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => setView("dashboard")}
              className={`px-3 py-1 text-sm rounded-md cursor-pointer transition-colors ${
                view === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Dashboard
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="md"
              shape="square"
              className="rounded-full h-8 w-8"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {view === "chat" && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
              {messages.length === 0 && !loading && (
                <div className="h-full flex items-center justify-center">
                  <Card className="p-6 max-w-md mx-auto bg-neutral-100 dark:bg-neutral-900">
                    <div className="text-center space-y-4">
                      <div className="bg-blue-500/10 text-blue-500 rounded-full p-3 inline-flex">
                        <BookOpenIcon size={24} />
                      </div>
                      <h3 className="font-semibold text-lg">
                        Welcome to Algorithm Coach
                      </h3>
                      <p className="text-neutral-400 text-sm">
                        Your AI-powered study partner for technical interviews.
                        Try these actions:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <button
                          type="button"
                          onClick={() => setView("submit")}
                          className="flex items-center gap-2 p-2 rounded-md bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                        >
                          <CodeIcon size={16} className="text-green-500" />
                          <span>Submit Solution</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleGetRecommendation}
                          className="flex items-center gap-2 p-2 rounded-md bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                        >
                          <LightbulbIcon
                            size={16}
                            className="text-yellow-500"
                          />
                          <span>Get Recommendation</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAnalyzeWeaknesses}
                          className="flex items-center gap-2 p-2 rounded-md bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                        >
                          <ChartBarIcon
                            size={16}
                            className="text-purple-500"
                          />
                          <span>Analyze Weaknesses</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setView("dashboard")}
                          className="flex items-center gap-2 p-2 rounded-md bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                        >
                          <TargetIcon size={16} className="text-red-500" />
                          <span>View Dashboard</span>
                        </button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {messages.map((m, index) => {
                const isUser = m.role === "user";
                const showAvatar =
                  index === 0 || messages[index - 1]?.role !== m.role;

                return (
                  <div
                    key={`${m.timestamp}-${index}`}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[85%] ${
                        isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {showAvatar && !isUser ? (
                        <Avatar username="Coach" className="shrink-0" />
                      ) : (
                        !isUser && <div className="w-8" />
                      )}
                      <div>
                        <Card
                          className={`p-3 rounded-md bg-neutral-100 dark:bg-neutral-900 ${
                            isUser ? "rounded-br-none" : "rounded-bl-none"
                          }`}
                        >
                          {showDebug ? (
                            <pre className="text-xs overflow-auto">
                              {m.content}
                            </pre>
                          ) : (
                            <MemoizedMarkdown
                              id={`msg-${m.timestamp}-${index}`}
                              content={m.content}
                            />
                          )}
                        </Card>
                        <p
                          className={`text-xs text-neutral-500 mt-1 ${
                            isUser ? "text-right" : "text-left"
                          }`}
                        >
                          {formatTime(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <Avatar username="Coach" className="shrink-0" />
                    <Card className="p-3 rounded-md rounded-bl-none bg-neutral-100 dark:bg-neutral-900">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <SpinnerGapIcon size={16} className="animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChat(e);
              }}
              className="p-3 absolute bottom-0 left-0 right-0 z-10 border-t border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    disabled={loading}
                    placeholder="Ask about algorithms, get study tips..."
                    className="flex w-full border border-neutral-200 dark:border-neutral-700 px-3 py-2 ring-offset-background placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl text-base! pb-10 dark:bg-neutral-900"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        handleChat();
                      }
                    }}
                    rows={2}
                  />
                  <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                    <button
                      type="submit"
                      disabled={loading || !chatInput.trim()}
                      className="inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-neutral-200 dark:border-neutral-800"
                      aria-label="Send message"
                    >
                      <PaperPlaneTiltIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </>
        )}

        {view === "submit" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="font-semibold text-lg">Submit Solution</h3>
            <form onSubmit={handleSubmitSolution} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Problem ID / Name
                </label>
                <input
                  type="text"
                  value={problemId}
                  onChange={(e) => setProblemId(e.target.value)}
                  placeholder="e.g., Two Sum, LC-1"
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., arrays, dp"
                    className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Your Code
                </label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your solution code here..."
                  rows={12}
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                disabled={
                  loading || !code.trim() || !problemId.trim() || !topic.trim()
                }
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <SpinnerGapIcon size={16} className="animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ArrowRightIcon size={16} />
                    Submit for Analysis
                  </span>
                )}
              </Button>
            </form>

            {/* Explain Concept Section */}
            <div className="border-t border-neutral-300 dark:border-neutral-700 pt-4">
              <h3 className="font-semibold text-lg mb-3">Explain a Concept</h3>
              <form onSubmit={handleExplainConcept} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={conceptTopic}
                      onChange={(e) => setConceptTopic(e.target.value)}
                      placeholder="e.g., Binary Search"
                      className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Depth
                    </label>
                    <select
                      value={conceptDepth}
                      onChange={(e) =>
                        setConceptDepth(
                          e.target.value as
                            | "beginner"
                            | "intermediate"
                            | "advanced"
                        )
                      }
                      className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  disabled={loading || !conceptTopic.trim()}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <SpinnerGapIcon size={16} className="animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LightbulbIcon size={16} />
                      Explain Concept
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {view === "dashboard" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="font-semibold text-lg">Study Dashboard</h3>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 bg-neutral-100 dark:bg-neutral-900 text-center">
                <FireIcon
                  size={24}
                  className="mx-auto mb-1 text-orange-500"
                />
                <div className="text-2xl font-bold">{stats.studyStreak}</div>
                <div className="text-xs text-neutral-500">Day Streak</div>
              </Card>
              <Card className="p-3 bg-neutral-100 dark:bg-neutral-900 text-center">
                <TrophyIcon
                  size={24}
                  className="mx-auto mb-1 text-yellow-500"
                />
                <div className="text-2xl font-bold">
                  {stats.solvedProblems.length}
                </div>
                <div className="text-xs text-neutral-500">Solved</div>
              </Card>
              <Card className="p-3 bg-neutral-100 dark:bg-neutral-900 text-center">
                <ChartBarIcon
                  size={24}
                  className="mx-auto mb-1 text-purple-500"
                />
                <div className="text-2xl font-bold">
                  {stats.weakTopics.length}
                </div>
                <div className="text-xs text-neutral-500">Weak Topics</div>
              </Card>
            </div>

            {/* Weak Topics */}
            {stats.weakTopics.length > 0 && (
              <Card className="p-4 bg-neutral-100 dark:bg-neutral-900">
                <h4 className="font-medium mb-2 text-sm">
                  Weak Topics (Needs Practice)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {stats.weakTopics.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Target Companies */}
            <Card className="p-4 bg-neutral-100 dark:bg-neutral-900">
              <h4 className="font-medium mb-2 text-sm">Target Companies</h4>
              {stats.targetCompanies.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-3">
                  {stats.targetCompanies.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 mb-3">
                  No target companies set yet.
                </p>
              )}
              <form
                onSubmit={handleUpdateCompanies}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={companiesInput}
                  onChange={(e) => setCompaniesInput(e.target.value)}
                  placeholder="Google, Meta, Amazon..."
                  className="flex-1 px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loading || !companiesInput.trim()}
                >
                  Set
                </Button>
              </form>
            </Card>

            {/* Recent Problems */}
            <Card className="p-4 bg-neutral-100 dark:bg-neutral-900">
              <h4 className="font-medium mb-2 text-sm">Recent Problems</h4>
              {stats.solvedProblems.length > 0 ? (
                <div className="space-y-2">
                  {stats.solvedProblems
                    .slice(-5)
                    .reverse()
                    .map((p) => (
                      <div
                        key={`${p.id}-${p.timestamp}`}
                        className="flex items-center justify-between text-sm p-2 rounded-md bg-neutral-200 dark:bg-neutral-800"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.needsReview
                                ? "bg-red-500"
                                : "bg-green-500"
                            }`}
                          />
                          <span className="font-medium">{p.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              p.difficulty === "easy"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                : p.difficulty === "medium"
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {p.difficulty}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {p.topic}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  No problems solved yet. Submit your first solution!
                </p>
              )}
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleGetRecommendation}
                disabled={loading}
              >
                <span className="flex items-center gap-2">
                  <LightbulbIcon size={16} />
                  Get Recommendation
                </span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={handleAnalyzeWeaknesses}
                disabled={loading}
              >
                <span className="flex items-center gap-2">
                  <ChartBarIcon size={16} />
                  Analyze Weaknesses
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
