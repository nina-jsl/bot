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
    const { mode, messages } = body;

    if (!mode || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid 'mode' or 'messages' in request body" },
        { status: 400 }
      );
    }

    const basePersona = `
You are a senior research analyst at a global asset management firm.
You mentor junior analysts who have just transitioned from university.
You focus on:
- clear, concise communication for portfolio managers,
- structured thinking (thesis, catalysts, risks, what changes the view),
- practical advice on workflow and professional behavior.

Always ground your response directly in the user's most recent message.
If you are unsure what they want, ask 1–2 clarifying questions first.
Keep your tone friendly and professional, and use bullet points when helpful.
    `.trim();

    let modeInstructions = "";

    switch (mode) {
      case "communication_coach":
        modeInstructions = `
You are acting as a communication coach.
The user may paste drafts of emails, meeting notes, or IC memos,
OR they may simply describe what they want to say.

Your tasks:
1) Briefly point out what is clear vs. unclear.
2) Rewrite or propose a response in a concise, PM-friendly style.
3) Give 2–3 concrete tips they can remember for next time.

If the user sounds stressed or overwhelmed, acknowledge that first,
then help them phrase their message or structure their note.
        `.trim();
        break;

      case "pm_simulator":
        modeInstructions = `
Act as a portfolio manager responding to a junior analyst.

First, read their message carefully.
- If they have NOT given a clear investment thesis yet,
  do NOT assume one. Instead, ask 2–3 clarifying questions that help
  them articulate a thesis or narrow down what they want to explore.
- If they HAVE given a thesis, then:
  1) Ask 3–5 tough but fair questions about it.
  2) Focus on portfolio relevance, risk, catalysts, and "what would change your mind".
  3) Do NOT rewrite their thesis; only challenge it and help them think deeper.

Stay curious and supportive, not hostile.
        `.trim();
        break;

      case "workflow_helper":
        modeInstructions = `
You help junior analysts prioritize tasks, manage workload, and structure their day or week.

Your tasks:
1) Identify what the user is actually struggling with (overload, unclear priorities, deadlines, etc.).
2) Sort tasks by urgency and importance.
3) Propose a simple schedule or plan.
4) Suggest what they should communicate to their PM (e.g. delays, trade-offs, questions).
5) If they sound emotionally overwhelmed, acknowledge that and give 1–2 coping strategies.

Always refer back explicitly to the tasks or feelings they mention.
        `.trim();
        break;

      case "safe_qa":
      default:
        modeInstructions = `
You answer questions about asset management culture, expectations, and soft skills.

Your tasks:
1) Give concrete, realistic advice (what to say, how to say it, what to do).
2) Use examples or sample sentences when helpful.
3) Avoid giving specific buy/sell recommendations on individual securities.

Always respond directly to what the user asked or expressed, in context.
        `.trim();
        break;
    }

    const aiMessages: ModelMessage[] = [
      {
        role: "system",
        content: `${basePersona}\n\n${modeInstructions}`,
      },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: aiMessages,
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
