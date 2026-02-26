import Groq from "groq-sdk";
import { Document } from "@langchain/core/documents";
import { LLMPrompt } from "./system_prompt";

export async function getFinalOutput(docs: Document[], userQuery: string) {
  const docsContent = docs
    .map((doc, i) => {
      const source = doc.metadata?.source ?? `Document ${i + 1}`;
      return `[${source}]\n${doc.pageContent}`;
    })
    .join("\n\n---\n\n");

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: LLMPrompt },
    {
      role: "user",
      content: `Here are the relevant documents:\n\n${docsContent}\n\nUser Question: ${userQuery}`,
    },
  ];

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const completion = await groq.chat.completions.create({
    model: "groq/compound",
    messages,
  });

  const rawOutput = completion.choices?.[0]?.message?.content ?? "";
  console.log("RawOutput", rawOutput);

  return rawOutput;
}
