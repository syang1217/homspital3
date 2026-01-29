import { NextResponse } from "next/server";
import OpenAI from "openai";

import {
  addChatExchange,
  clearVoiceMessages,
  getLastUserMessage,
  listChatMessages,
  listVoiceMessages,
} from "@/lib/inmemory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CONVERSATION_PROMPT =
  "You are an emergency response assistant. Respond calmly and concisely, prioritizing immediate safe actions. Reply in natural English.";
const CONVERSATION_PROMPT_WITH_STEPS =
  "You are an emergency response assistant. Respond calmly and concisely, prioritizing immediate safe actions. Do not list step-by-step instructions. End with one sentence: \"If you need step-by-step guidance, say so.\"";
const STEP_PROMPT =
  "You are an emergency response assistant. Respond calmly and concisely, prioritizing immediate safe actions. Provide 3-5 short steps, each one sentence (~20 words). Separate steps with new lines and do not number them. Ask only one brief follow-up question if truly needed. Reply in English.";
const MAX_HISTORY = 12;

function splitLongStep(step: string) {
  const trimmed = step.trim();
  if (!trimmed) {
    return [];
  }
  return [trimmed];
}

function splitAssistantSteps(text: string) {
  const lines = text.split(/\n+/);
  const chunks: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    const sentences = trimmed.match(/[^.!?]+[.!?]?/g);
    if (sentences && sentences.length > 0) {
      sentences.forEach((sentence) => {
        const cleaned = sentence.trim();
        if (cleaned) {
          chunks.push(...splitLongStep(cleaned));
        }
      });
    } else {
      chunks.push(...splitLongStep(trimmed));
    }
  });

  return chunks.length > 0 ? chunks : [text];
}

export function GET() {
  return NextResponse.json({ messages: listVoiceMessages() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const mode = body?.mode === "steps" ? "steps" : "conversation";
  const askSteps = body?.askSteps === false ? false : true;

  if (!text && mode !== "steps") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  try {
    const userText =
      mode === "steps" && !text ? getLastUserMessage() : text;

    if (!userText) {
      return NextResponse.json(
        { error: "No prior user message to generate steps." },
        { status: 400 },
      );
    }

    const history =
      mode === "conversation"
        ? listChatMessages().slice(-MAX_HISTORY).map((message) => ({
            role: message.role,
            content: message.content,
          }))
        : [];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            mode === "steps"
              ? STEP_PROMPT
              : askSteps
                ? CONVERSATION_PROMPT_WITH_STEPS
                : CONVERSATION_PROMPT,
        },
        ...history,
        { role: "user", content: userText },
      ],
    });

    const assistantTextFull =
      completion.choices[0]?.message?.content?.trim() ||
      "Please briefly describe what is happening.";

    const assistantSteps =
      mode === "steps" ? splitAssistantSteps(assistantTextFull) : null;
    const assistantTextForLog =
      mode === "steps"
        ? assistantSteps?.[0] ?? assistantTextFull
        : assistantTextFull;

    const exchange = addChatExchange(userText, assistantTextForLog);
    return NextResponse.json({
      ...exchange,
      messages: listVoiceMessages(),
      assistantText: assistantTextForLog,
      assistantSteps,
      mode,
      askSteps: mode === "conversation" && askSteps,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OpenAI request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export function DELETE() {
  clearVoiceMessages();
  return NextResponse.json({ ok: true });
}
