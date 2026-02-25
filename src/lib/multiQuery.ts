
import Groq from "groq-sdk";
import {systemPrompt} from "../lib/system_prompt";


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

export async function getMultiQueries(query: string) {
const SYSTEM_PROMPT = systemPrompt
const messages: Groq.Chat.ChatCompletionMessageParam[]  = [
  { role: "system", content: SYSTEM_PROMPT },
  { role: "user", content: query },
];  
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})
  const completion = await groq.chat.completions.create({
    model: "qwen/qwen3-32b",
    messages
  });
    console.log(completion.choices[0]?.message?.content);
    const rawOutput:string = completion.choices?.[0]?.message?.content as string
    console.log("Raw Output: ",rawOutput);
    const parsed = safeParseArray(rawOutput)
    console.log("Parsed Output: ", parsed);
    return parsed
}