import { z } from "zod";

export const MOODS = ["calm", "adventure", "magical", "silly"] as const;
export type Mood = (typeof MOODS)[number];

export const StorySchema = z.object({
  title: z.string().min(1).max(80),
  mood: z.enum(MOODS),
  characterDescription: z.string().min(10).max(600),
  scenes: z
    .array(
      z.object({
        text: z.string().min(20).max(600),
        imagePrompt: z.string().min(20).max(600),
      }),
    )
    .min(3)
    .max(6),
});

export type GeneratedStory = z.infer<typeof StorySchema>;

export interface StoryInputs {
  childName: string;
  childAge?: number;
  funnyThing: string;
  niceThing: string;
  badThing: string;
}

export function buildSystemPrompt() {
  return [
    "You are a warm, gentle bedtime-story writer for young children.",
    "Write in simple, sensory, present-tense language. Vocabulary suitable for ages 3-8.",
    "The story should be exactly 4 scenes long. Each scene is 2-3 short sentences.",
    "Weave the child's three real-life moments (something funny, something nice, something they found scary or hard) into the story so each one is gently transformed:",
    "- the funny moment becomes a giggle-worthy beat,",
    "- the nice moment becomes a moment of warmth or friendship,",
    "- the hard or scary moment is met with courage and resolved kindly — never frightening.",
    "End on a calm, reassuring, sleepy note. No cliffhangers. No violence. No scary creatures up close.",
    "",
    "For each scene also produce an `imagePrompt`: a vivid description of one painted illustration for that scene.",
    "Image style guidance: 'soft storybook illustration, warm pastel palette, gentle rim light, cozy, cinematic, watercolor and gouache, kid-friendly, no text, no letters'.",
    "Keep the protagonist consistent: include the `characterDescription` essence in every imagePrompt.",
    "",
    "Return JSON only — no markdown fences, no commentary — matching this shape:",
    `{
  "title": string,
  "mood": "calm" | "adventure" | "magical" | "silly",
  "characterDescription": string,
  "scenes": [{ "text": string, "imagePrompt": string }]
}`,
  ].join("\n");
}

export function buildUserPrompt(i: StoryInputs) {
  const age = i.childAge ? `${i.childAge} years old` : "young";
  return [
    `Child's name: ${i.childName} (${age}).`,
    `Something funny they noticed today: ${i.funnyThing}`,
    `Something nice that happened today: ${i.niceThing}`,
    `Something that felt bad or scary today: ${i.badThing}`,
    "",
    "Please write a personalized bedtime story now.",
  ].join("\n");
}
