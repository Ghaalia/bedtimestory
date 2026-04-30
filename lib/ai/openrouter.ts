import {
  StorySchema,
  buildSystemPrompt,
  buildUserPrompt,
  type GeneratedStory,
  type StoryInputs,
} from "./prompts";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

export async function generateStory(inputs: StoryInputs): Promise<GeneratedStory> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to .env.local (no quotes needed) and restart `npm run dev`.",
    );
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.AUTH_URL || "http://localhost:3000",
      "X-Title": "BedTimeStory",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.85,
      // Sized to fit within OpenRouter free-tier daily allotment. Override
      // with OPENROUTER_MAX_TOKENS once you have paid credit.
      max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS || 1800),
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(inputs) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned no content");

  return StorySchema.parse(extractJson(content));
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("LLM response was not valid JSON");
    return JSON.parse(match[0]);
  }
}
