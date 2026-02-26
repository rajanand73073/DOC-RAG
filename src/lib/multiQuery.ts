import Groq from "groq-sdk";
import { systemPrompt } from "../lib/system_prompt";

export type RoutedQuery = {
  query: string;
  topic: string;
  section: string;
};

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
  const parsed = JSON.parse(rawOutput);
  return parsed;
}
