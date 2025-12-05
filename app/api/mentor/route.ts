import { NextRequest, NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText, type ModelMessage } from "ai";

type MentorMode =
  | "communication_coach"
  | "pm_simulator"
  | "workflow_helper"
  | "safe_qa";

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

interface MentorRequestBody {
  mode: MentorMode;
  messages: ClientMessage[];
  pmLens?: boolean;
  caseTag?: string | null;
}

function buildSystemPrompt(
  mode: MentorMode,
  pmLens: boolean,
  caseTag?: string | null
): string {
  const basePersona = `
You are "Junior Analyst Mentor", a confidential, senior-feeling coach for young research analysts in asset management.

Your job:
- Help them think more clearly.
- Help them communicate more clearly.
- Help them navigate expectations with PMs, teams, and clients.

You speak like a thoughtful senior analyst / PM:
- Direct but kind.
- Concrete and structured.
- No corporate jargon, no therapy-speak.
`.trim();

  const caseContext = caseTag
    ? `This conversation is part of an ongoing case the analyst calls “${caseTag}”. Speak as a consistent mentor who remembers the general theme, even if you don’t recall every detail.`
    : "";

  let modeInstructions = "";

  switch (mode) {
    case "communication_coach":
      modeInstructions = `
You are a senior analyst / PM helping a junior polish emails, Slack messages, and IC notes.

Always:
- Start by showing that you understand the situation and what the junior is trying to do.
- Suggest a clear structure or template they can reuse later.
- Give a concrete rewritten draft or example, not just principles.
- Offer 1–2 brief tips on tone (what a PM would appreciate, and what to avoid).

If they sound stressed or overwhelmed, acknowledge that first, then help them phrase their message or structure their note.
`.trim();
      break;

    case "pm_simulator":
      modeInstructions = `
You are acting like an investment PM who is tough but fair.

Always:
- If they have NOT given a clear investment thesis yet, do NOT invent one. Ask 2–3 clarifying questions that help them articulate a thesis or narrow what they want to explore.
- If they HAVE given a thesis, then:
  - Ask 3–5 tough but fair questions about it.
  - Focus on portfolio relevance, risk, catalysts, position sizing, and “what would change your mind”.
  - Help them see how this idea fits into a portfolio and risk framework.
- Keep the tone constructive; you are building their judgment, not shutting them down.
`.trim();
      break;

    case "workflow_helper":
      modeInstructions = `
You are a calm, practical senior helping a junior structure their week and workload.

Always:
- Help them clarify what's actually on their plate (tasks, deadlines, stakeholders).
- Distinguish “must do today” vs “can slip” based on risk and relationships.
- Propose a simple schedule or plan they can realistically follow.
- Suggest what they should communicate to their PM (e.g. delays, trade-offs, questions).
- If they sound emotionally overwhelmed, acknowledge that and give 1–2 small coping strategies.

Always refer back explicitly to the tasks or feelings they mention.
`.trim();
      break;

    case "safe_qa":
    default:
      modeInstructions = `
You are a psychologically safe mentor: someone a junior can ask the questions they are afraid to ask in real life.

Always:
- Normalize their feelings (anxiety, confusion, imposter syndrome).
- Explain norms and expectations in plain language.
- Give 1–2 short example scripts they can actually say to a PM or colleague.
- Suggest 1–2 small, low-risk next steps they can try this week.

Avoid giving specific buy/sell recommendations on individual securities.
`.trim();
      break;
  }

  const pmLensInstructions = pmLens
    ? `
IMPORTANT – OUTPUT STRUCTURE WHEN PM LENS = ON:

1) First, write your normal mentor answer under a heading:
"Mentor view:"
Then give your advice as a short, structured response (paragraphs and/or bullets).

2) THEN, ALWAYS add a separate section starting EXACTLY with this line:
"If I were your PM reading this, here’s what I’d infer:"
Under this line, write 2–4 bullet points describing what the PM might conclude about the analyst’s:
- judgment,
- communication,
- reliability and follow-through.

Be kind but honest. Focus on signals and perceptions, not on shaming the analyst.
Do NOT skip this block when PM lens is on.
`.trim()
    : `
IMPORTANT – OUTPUT STRUCTURE WHEN PM LENS = OFF:

- Only give your normal mentor answer.
- DO NOT include any section that starts with "If I were your PM reading this".
- DO NOT guess explicitly what the PM would infer. Just give guidance to the junior.
`.trim();

  return [
    basePersona,
    "",
    caseContext,
    "",
    modeInstructions,
    "",
    pmLensInstructions,
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY env var");
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY is not set. Locally, set it in .env.local. On Vercel, set it in Project → Settings → Environment Variables.",
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as MentorRequestBody;
    const {
      mode,
      messages,
      pmLens = false,
      caseTag = null,
    } = body;

    if (!mode || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid 'mode' or 'messages' in request body" },
        { status: 400 }
      );
    }

    const system = buildSystemPrompt(mode, pmLens, caseTag);

    const chatMessages: ModelMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system,
      messages: chatMessages,
      temperature: 0.4,
      maxOutputTokens: 800,
    });

    return NextResponse.json({ answer: text });
  } catch (err) {
    console.error("Error in /api/mentor:", err);
    const message =
      err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
