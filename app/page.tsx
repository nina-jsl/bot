"use client";

import { useState, type KeyboardEvent } from "react";

type MentorMode =
  | "communication_coach"
  | "pm_simulator"
  | "workflow_helper"
  | "safe_qa";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ModeConfig = {
  label: string;
  description: string;
  placeholder: string;
  colors: {
    tabActive: string;
    tabInactive: string;
    userBubble: string;
    assistantBubble: string;
  };
};

const MODE_CONFIG: Record<MentorMode, ModeConfig> = {
  communication_coach: {
    label: "Communication Coach",
    description: "Helps you polish emails, notes, and memos.",
    placeholder:
      "Paste your draft email / memo, or describe what you want to say...",
    colors: {
      tabActive: "bg-blue-600 text-white border-blue-600",
      tabInactive: "bg-white text-gray-800 border-gray-300",
      userBubble: "bg-blue-600 text-white",
      assistantBubble: "bg-blue-50 text-gray-900",
    },
  },
  pm_simulator: {
    label: "PM Simulator",
    description: "Asks tough but fair questions about your investment idea.",
    placeholder: "Describe your investment idea or thesis. Rough is okay...",
    colors: {
      tabActive: "bg-emerald-600 text-white border-emerald-600",
      tabInactive: "bg-white text-gray-800 border-gray-300",
      userBubble: "bg-emerald-600 text-white",
      assistantBubble: "bg-emerald-50 text-gray-900",
    },
  },
  workflow_helper: {
    label: "Workflow Helper",
    description: "Prioritizes tasks and helps you plan your day or week.",
    placeholder: "List your tasks, deadlines, and what you're stressed about...",
    colors: {
      tabActive: "bg-amber-500 text-white border-amber-500",
      tabInactive: "bg-white text-gray-800 border-gray-300",
      userBubble: "bg-amber-500 text-white",
      assistantBubble: "bg-amber-50 text-gray-900",
    },
  },
  safe_qa: {
    label: "Safe Q&A",
    description: "Talk about culture, expectations, and soft skills at work.",
    placeholder:
      "Ask anything about working in asset management or being a junior analyst...",
    colors: {
      tabActive: "bg-purple-600 text-white border-purple-600",
      tabInactive: "bg-white text-gray-800 border-gray-300",
      userBubble: "bg-purple-600 text-white",
      assistantBubble: "bg-purple-50 text-gray-900",
    },
  },
};

const MODES: MentorMode[] = [
  "communication_coach",
  "pm_simulator",
  "workflow_helper",
  "safe_qa",
];

export default function HomePage() {
  const [mode, setMode] = useState<MentorMode>("communication_coach");

  const [histories, setHistories] = useState<Record<MentorMode, ChatMessage[]>>(
    {
      communication_coach: [],
      pm_simulator: [],
      workflow_helper: [],
      safe_qa: [],
    }
  );

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const currentConfig = MODE_CONFIG[mode];
  const currentMessages = histories[mode] || [];

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const newHistory = [...currentMessages, userMessage];

    setHistories((prev) => ({
      ...prev,
      [mode]: newHistory,
    }));
    setInput("");
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages: newHistory }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Request failed");
      } else {
        const reply: ChatMessage = {
          role: "assistant",
          content: data.answer,
        };
        setHistories((prev) => ({
          ...prev,
          [mode]: [...newHistory, reply],
        }));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) {
        handleSend();
      }
    }
  }

  function handleModeChange(newMode: MentorMode) {
    setMode(newMode);
    setErrorMsg("");
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-6 gap-4 bg-gray-50">
      <h1 className="text-2xl font-semibold text-center">
        Junior Analyst Mentor
      </h1>

      {/* Mode tabs */}
      <div className="flex gap-3 flex-wrap mb-1">
        {MODES.map((m) => {
          const cfg = MODE_CONFIG[m];
          const isActive = m === mode;
          return (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-3 py-1 rounded-full border text-sm font-medium transition ${
                isActive ? cfg.colors.tabActive : cfg.colors.tabInactive
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Mode description */}
      <p className="text-sm text-gray-600 mb-2 text-center max-w-xl">
        {currentConfig.description}
        {currentMessages.length > 0 &&
          " You are continuing your previous chat in this mode."}
      </p>

      {/* Conversation window */}
      <div className="w-full max-w-2xl border rounded-lg p-3 h-80 overflow-y-auto bg-white shadow-sm">
        {currentMessages.length === 0 && (
          <p className="text-gray-500 text-sm">
            Start by telling your mentor what you&apos;re working on, what
            you&apos;re stuck on, or paste a draft / thesis.
          </p>
        )}
        {currentMessages.map((m, idx) => (
          <div
            key={idx}
            className={`mb-3 ${
              m.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block px-3 py-2 rounded-lg whitespace-pre-wrap text-sm ${
                m.role === "user"
                  ? currentConfig.colors.userBubble
                  : currentConfig.colors.assistantBubble
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <textarea
        className="w-full max-w-2xl border rounded-lg p-2 h-24 shadow-sm"
        placeholder={currentConfig.placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button
        onClick={handleSend}
        disabled={loading}
        className="mt-2 px-4 py-2 rounded-md bg-gray-900 text-white disabled:opacity-50"
      >
        {loading ? "Thinking..." : "Ask Mentor"}
      </button>

      {errorMsg && (
        <p className="text-red-600 mt-2 text-sm">{errorMsg}</p>
      )}
    </main>
  );
}
