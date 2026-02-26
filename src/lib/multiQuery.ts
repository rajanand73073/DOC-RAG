import Groq from "groq-sdk";
import { systemPrompt } from "../lib/system_prompt";

export type RoutedQuery = {
  query: string;
  topic: string;
  section: string;
};

function isRoutedQuery(value: unknown): value is RoutedQuery {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.query === "string" &&
    typeof record.topic === "string" &&
    typeof record.section === "string"
  );
}

function safeParseRoutedQueries(raw: string): RoutedQuery[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) {
    return [];
  }

  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isRoutedQuery)
      .map((item) => ({
        query: item.query.trim(),
        topic: item.topic.trim(),
        section: item.section.trim(),
      }))
      .filter((item) => item.query && item.topic && item.section);
  } catch {
    return [];
  }
}


export async function getMultiQueries(query: string) {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: query },
  ];

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages,
  });

  const rawOutput = (completion.choices?.[0]?.message?.content ?? "") as string;
  const parsed = safeParseRoutedQueries(rawOutput);
  return parsed;
}
