"use client";

import { useState, useEffect, type KeyboardEvent } from "react";

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

// ---- Skills-path types ----

type SkillId = "data" | "modeling" | "communication" | "judgment" | "time";

type SkillsScores = Record<SkillId, number>;

type SkillsPathStep = {
  week: number;
  label: string;
  description: string;
};

type SkillsPath = {
  steps: SkillsPathStep[];
  generatedAt: string;
};

const SKILLS: { id: SkillId; label: string }[] = [
  { id: "data", label: "Data work (pulling, cleaning, basic analysis)" },
  { id: "modeling", label: "Modeling (Excel, valuations, scenarios)" },
  {
    id: "communication",
    label: "Communication (emails, IC notes, PM updates)",
  },
  {
    id: "judgment",
    label: "Investment judgment (sizing, catalysts, risk thinking)",
  },
  { id: "time", label: "Time & workflow management" },
];

type PreBriefScenario = "email_pm" | "ic_meeting" | "client_call" | "stock_pitch";

type PreBriefConfig = {
  label: string;
  defaultMode: MentorMode;
  intro: string;
};

const PREBRIEF_CONFIG: Record<PreBriefScenario, PreBriefConfig> = {
  email_pm: {
    label: "Email my PM",
    defaultMode: "communication_coach",
    intro:
      "Okay, let’s get you ready to email your PM. Before you hit send, I want you clear on a few things:",
  },
  ic_meeting: {
    label: "IC / investment committee",
    defaultMode: "pm_simulator",
    intro:
      "IC prep mode. Let’s sharpen your story so you can walk into the room with a clear spine to your pitch:",
  },
  client_call: {
    label: "Client call / update",
    defaultMode: "communication_coach",
    intro:
      "Client call coming up. Let’s line up your message so you sound calm and in control:",
  },
  stock_pitch: {
    label: "Stock pitch / idea review",
    defaultMode: "pm_simulator",
    intro:
      "Pitching an idea. Let’s pressure-test the basics before you’re in front of anyone:",
  },
};


// Generate a simple 3-week path; light personalization from the weakest skills
function generateSkillsPath(scores: SkillsScores): SkillsPath {
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]); // lowest confidence first
  const weakestLabels = sorted
    .slice(0, 2)
    .map(([id]) => SKILLS.find((s) => s.id === id)?.label ?? id);

  const steps: SkillsPathStep[] = [
    {
      week: 1,
      label: "Communication Coach",
      description: `Focus on communication and soft skills, especially around "${weakestLabels[0]}". Aim for ~3 real emails or updates this week using Communication Coach.`,
    },
    {
      week: 2,
      label: "PM Simulator",
      description:
        "Pick ONE investment idea and run 2 deeper PM Simulator sessions to pressure-test the thesis like an investment committee would.",
    },
    {
      week: 3,
      label: "Workflow Helper",
      description:
        "Use Workflow Helper to structure a full week: daily tasks, research blocks, and check-ins with your PM around that same idea.",
    },
  ];

  return {
    steps,
    generatedAt: new Date().toISOString(),
  };
}

// ---- Mode config (same as before) ----

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
    placeholder:
      "List your tasks, deadlines, and what you’re stressed about...",
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

  // ---- Skills path state ----
  const [showSkillsOverlay, setShowSkillsOverlay] = useState(false);
  const [skillScores, setSkillScores] = useState<SkillsScores>({
    data: 3,
    modeling: 3,
    communication: 3,
    judgment: 3,
    time: 3,
  });
  const [skillsPath, setSkillsPath] = useState<SkillsPath | null>(null);

  // interaction counter for check-ins
  const [interactionCount, setInteractionCount] = useState(0);
  const [checkInPrompt, setCheckInPrompt] = useState<string | null>(null);

  const [showPathModal, setShowPathModal] = useState(false);

    // ---- Workflow-integrated learning state ----
  const [showPreBriefMenu, setShowPreBriefMenu] = useState(false);
  const [caseName, setCaseName] = useState<string | null>(null);


  // Load path from localStorage or show overlay on first load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("jam_skills_path_v1");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SkillsPath;
        setSkillsPath(parsed);
      } catch {
        // ignore parse error, show overlay
        setShowSkillsOverlay(true);
      }
    } else {
      setShowSkillsOverlay(true);
    }
  }, []);

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

        // bump interaction count after a successful exchange
        setInteractionCount((prev) => {
          const next = prev + 1;
          if (skillsPath && next % 5 === 0) {
            const focus = skillsPath.steps[0]?.label ?? "your main focus area";
            setCheckInPrompt(
              `Quick check-in on ${focus}: since we started, what has changed, and where are you still stuck?`
            );
          }
          return next;
        });
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

  function handleSkillsSubmit() {
    const path = generateSkillsPath(skillScores);
    setSkillsPath(path);
    setShowSkillsOverlay(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("jam_skills_path_v1", JSON.stringify(path));
    }
  }
    function handlePreBrief(scenario: PreBriefScenario) {
    const cfg = PREBRIEF_CONFIG[scenario];
    const targetMode = cfg.defaultMode;

    // Switch to the most relevant mode for this scenario
    setMode(targetMode);
    setShowPreBriefMenu(false);

    const content = [
      cfg.intro,
      "",
      "1) What is your main objective?",
      '2) What would “success” look like here—for you and for your PM / client?',
      "3) Any constraints or worries I should know about (timing, politics, data, confidence)?",
      "",
      "Answer in plain language; I’ll help you turn that into a clear ask or structure.",
    ].join("\n");

    setHistories((prev) => {
      const prevMessages = prev[targetMode] ?? [];
      return {
        ...prev,
        [targetMode]: [
          ...prevMessages,
          { role: "assistant", content } as ChatMessage,
        ],
      };
    });
  }

  function handleAfterAction() {
    const content = [
      "Nice—sounds like something just finished.",
      "",
      "Let’s capture the learning while it’s still fresh:",
      "1) What went well?",
      "2) What felt uncomfortable or messy?",
      "3) If you had to do this again next week, what would you do differently?",
      "",
      "Type your thoughts in a few bullet points. I’ll help you turn them into 2–3 “next time” rules you can reuse.",
    ].join("\n");

    setHistories((prev) => {
      const msgs = prev[mode] ?? [];
      return {
        ...prev,
        [mode]: [...msgs, { role: "assistant", content }],
      };
    });
  }

  function handleTagCase() {
    if (typeof window === "undefined") return;
    const name = window.prompt(
      "Give this thread a short case name (e.g. “EV battery pitch”):",
      caseName ?? ""
    );
    if (name && name.trim()) {
      const trimmed = name.trim();
      setCaseName(trimmed);
      window.localStorage.setItem("jam_current_case_v1", trimmed);
    }
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

          {skillsPath && (
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <p className="leading-snug">
                <span className="font-semibold">Current 3-week path: </span>
                {skillsPath.steps
                  .map((s) => `Week ${s.week} – ${s.label}`)
                  .join(" → ")}
              </p>
              <button
                type="button"
                onClick={() => setShowPathModal(true)}
                className="shrink-0 rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:border-slate-500 hover:text-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400"
              >
                View details
              </button>
            </div>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 flex flex-col px-4 pt-3 pb-2 gap-2 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/40">
          {checkInPrompt && (
            <div className="mx-auto mb-2 max-w-[85%] rounded-2xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-50">
              <p className="font-medium mb-1">Skills path check-in</p>
              <p className="mb-1">{checkInPrompt}</p>
              <button
                type="button"
                onClick={() => {
                  setInput(checkInPrompt);
                  setCheckInPrompt(null);
                }}
                className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-amber-700 dark:bg-amber-400 dark:text-black"
              >
                Ask this to the mentor
              </button>
            </div>
          )}

          {currentMessages.length === 0 && !checkInPrompt && (
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
                {/* Input area with pre-brief + after-action + case tag */}
        <div className="px-3 pb-3 pt-2 border-t border-slate-200/80 bg-slate-50/80 dark:bg-slate-950/80 dark:border-slate-800/80">
          {/* Pre-brief / case tag / after-action row */}
          <div className="mb-2 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowPreBriefMenu((v) => !v)}
                  className="rounded-full border border-slate-300 bg-white px-2 py-0.5 font-medium text-slate-600 hover:border-slate-500 hover:text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-400"
                >
                  I’m about to…
                </button>
                <span className="text-slate-400 dark:text-slate-500">
                  Pre-brief before emails, meetings, or pitches.
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {caseName && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    Case: {caseName}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleTagCase}
                  className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                >
                  Tag case
                </button>
                <button
                  type="button"
                  onClick={handleAfterAction}
                  className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-800 hover:border-amber-400 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100"
                >
                  After-action
                </button>
              </div>
            </div>

            {showPreBriefMenu && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {(Object.keys(PREBRIEF_CONFIG) as PreBriefScenario[]).map(
                  (key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePreBrief(key)}
                      className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-600 hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                    >
                      {PREBRIEF_CONFIG[key].label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Main input row */}
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

      {/* Skills path overlay */}
      {showSkillsOverlay && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-lg dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Set up your skills path
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              In 1 minute, tell me where you feel strong or weak. I’ll suggest a
              3-week focus path that fits junior research analysts.
            </p>

            <div className="mt-3 space-y-3">
              {SKILLS.map((s) => (
                <div key={s.id} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                    <span>{s.label}</span>
                    <span>{skillScores[s.id]}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={skillScores[s.id]}
                    onChange={(e) =>
                      setSkillScores((prev) => ({
                        ...prev,
                        [s.id]: Number(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                    <span>Not confident</span>
                    <span>Very confident</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="text-xs text-slate-500 hover:underline dark:text-slate-400"
                onClick={() => setShowSkillsOverlay(false)}
              >
                Skip for now
              </button>
              <button
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                onClick={handleSkillsSubmit}
              >
                Generate path
              </button>
            </div>
          </div>
        </div>
      )}
      {skillsPath && showPathModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-lg dark:bg-slate-900">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Your 3-week skills path
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Based on your self-check when you first opened the mentor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPathModal(false)}
                className="h-6 w-6 rounded-full border border-slate-200 text-[11px] text-slate-500 hover:border-slate-400 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {skillsPath.steps.map((step) => (
                <div
                  key={step.week}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Week {step.week}: {step.label}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPathModal(false)}
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Back to mentor
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
