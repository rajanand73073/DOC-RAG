import { routingPrompt } from "./system_prompt"
import Groq from "groq-sdk";


function safeParseArray(text: string): string[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    return [];
  }
  try {
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}

export async function suggestTopicSection(query: string[]) {
const SYSTEM_PROMPT = routingPrompt

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const result = query.map(async (q) => {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
  { role: "system", content: SYSTEM_PROMPT },
  { role: "user", content: q },
];
const completion = await groq.chat.completions.create({
  model: "openai/gpt-oss-120b",
  messages,
})
console.log(completion.choices[0]?.message?.content);
const rawOutput: string = completion.choices?.[0]?.message?.content as string;
console.log("Raw Output: ", rawOutput);
const parsed = safeParseArray(rawOutput);
return parsed;
})


const results = await Promise.all(result);
console.log("results",result.flat());

return results.flat()

}