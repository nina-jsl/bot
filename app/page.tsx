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
  tagline: string;
  placeholder: string;
  example: string;
  accent: {
    pillBg: string;
    pillText: string;
    userBubbleBg: string;
    userBubbleText: string;
    headerBorder: string;
  };
};

const MODE_CONFIG: Record<MentorMode, ModeConfig> = {
  communication_coach: {
    label: "Communication Coach",
    tagline: "Helps you draft and polish emails, memos, and IC notes.",
    placeholder:
      "Paste your draft or describe what you’re trying to say to your PM...",
    example:
      "“Here is my rough email to my PM about missing a deadline. Can you help me make it clearer and more professional?”",
    accent: {
      pillBg: "bg-sky-500/15 dark:bg-sky-500/20",
      pillText: "text-sky-600 dark:text-sky-300",
      userBubbleBg: "bg-sky-500",
      userBubbleText: "text-white",
      headerBorder: "border-sky-500/30 dark:border-sky-500/40",
    },
  },
  pm_simulator: {
    label: "PM Simulator",
    tagline: "Asks tough but fair questions about your investment idea.",
    placeholder: "Describe your investment idea or thesis. Rough is okay...",
    example:
      "“I’m thinking about pitching a long in a Chinese clean-tech company benefiting from EV adoption. Can you challenge my thesis like a PM would?”",
    accent: {
      pillBg: "bg-emerald-500/15 dark:bg-emerald-500/20",
      pillText: "text-emerald-600 dark:text-emerald-300",
      userBubbleBg: "bg-emerald-500",
      userBubbleText: "text-white",
      headerBorder: "border-emerald-500/30 dark:border-emerald-500/40",
    },
  },
  workflow_helper: {
    label: "Workflow Helper",
    tagline: "Helps you prioritize tasks and structure your day or week.",
    placeholder: "List your tasks, deadlines, and what you’re stressed about...",
    example:
      "“This week I have: 1) a sector deep-dive due Thursday, 2) daily news summaries, and 3) a case study presentation. How should I prioritize and what should I tell my PM if I can’t do everything perfectly?”",
    accent: {
      pillBg: "bg-amber-500/15 dark:bg-amber-500/20",
      pillText: "text-amber-700 dark:text-amber-300",
      userBubbleBg: "bg-amber-400",
      userBubbleText: "text-black",
      headerBorder: "border-amber-500/30 dark:border-amber-500/40",
    },
  },
  safe_qa: {
    label: "Safe Q&A",
    tagline: "Ask about culture, expectations, and soft skills at work.",
    placeholder:
      "Ask anything about being a junior analyst or working in asset management...",
    example:
      "“I often feel lost in team meetings and don’t know when it’s okay to ask questions. How should a junior analyst behave so I don’t look clueless but still learn?”",
    accent: {
      pillBg: "bg-violet-500/15 dark:bg-violet-500/20",
      pillText: "text-violet-600 dark:text-violet-300",
      userBubbleBg: "bg-violet-500",
      userBubbleText: "text-white",
      headerBorder: "border-violet-500/30 dark:border-violet-500/40",
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
    if (!trimmed || loading) return;

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
      void handleSend();
    }
  }

  function handleModeChange(newMode: MentorMode) {
    if (newMode === mode) return;
    setMode(newMode);
    setErrorMsg("");
  }

  return (
    <main className="h-screen w-screen flex justify-center items-stretch bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-2 sm:px-4 lg:px-8 py-4">
      {/* Single full-height chat card */}
      <section className="w-full max-w-5xl flex flex-col h-full rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm dark:bg-slate-950/80 dark:border-slate-800">
        {/* Card header */}
        <div
          className={`px-4 pb-3 pt-3 border-b bg-gradient-to-b from-slate-50/80 to-transparent dark:from-white/5 dark:to-transparent ${currentConfig.accent.headerBorder}`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Mentor Chat
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Mode-specific guidance with memory within each mode.
              </p>
            </div>
            <div
              className={`px-2 py-1 rounded-full text-[10px] font-medium border border-white/40 dark:border-white/20 ${currentConfig.accent.pillBg} ${currentConfig.accent.pillText}`}
            >
              {currentConfig.label}
            </div>
          </div>

          {/* Mode selector */}
          <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            {MODES.map((m) => {
              const cfg = MODE_CONFIG[m];
              const isActive = m === mode;
              return (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`px-2.5 py-1 rounded-full border whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-slate-900 text-slate-50 border-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:border-slate-50 shadow-sm"
                      : "bg-transparent text-slate-600 border-slate-200 hover:border-slate-400 dark:text-slate-300 dark:border-slate-700 dark:hover:border-slate-500"
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            {currentConfig.tagline}{" "}
            {currentMessages.length > 0 &&
              "You’re continuing your previous chat in this mode."}
          </p>
        </div>

        {/* Messages area */}
        <div className="flex-1 flex flex-col px-4 pt-3 pb-2 gap-2 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/40">
          {currentMessages.length === 0 && (
            <div className="mx-auto mt-6 max-w-[85%] text-center text-[11px] text-slate-500 dark:text-slate-400">
              <p className="mb-2">Example to start with (click to insert):</p>
              <button
                type="button"
                onClick={() => setInput(currentConfig.example)}
                className="italic underline-offset-2 hover:underline text-slate-700 dark:text-slate-200"
              >
                {currentConfig.example}
              </button>
            </div>
          )}

          {currentMessages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex w-full ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex max-w-[80%] items-end gap-1">
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-300 shrink-0">
                      M
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3 py-2 text-[13px] leading-snug shadow-sm whitespace-pre-wrap ${
                      isUser
                        ? `${currentConfig.accent.userBubbleBg} ${currentConfig.accent.userBubbleText} rounded-br-sm`
                        : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm dark:bg-slate-900/80 dark:text-slate-50 dark:border-slate-700"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input area */}
        <div className="px-3 pb-3 pt-2 border-t border-slate-200/80 bg-slate-50/80 dark:bg-slate-950/80 dark:border-slate-800/80">
          <div className="flex items-end gap-2">
            <div className="flex-1 rounded-2xl bg-white border border-slate-200 px-3 py-1.5 flex flex-col shadow-sm dark:bg-slate-900 dark:border-slate-700">
              <textarea
                className="w-full bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 resize-none outline-none max-h-40 min-h-[40px] dark:text-slate-50 dark:placeholder:text-slate-500"
                placeholder={currentConfig.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Enter to send • Shift+Enter for new line
                </span>
                {errorMsg && (
                  <span className="text-[10px] text-red-500">{errorMsg}</span>
                )}
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className={`h-9 w-9 rounded-full flex items-center justify-center text-[13px] font-medium transition ${
                loading || !input.trim()
                  ? "bg-slate-200 text-slate-500 cursor-default dark:bg-slate-800 dark:text-slate-500"
                  : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
              }`}
            >
              {loading ? "…" : "↑"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
