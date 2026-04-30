import type { Mood } from "@/lib/ai/prompts";

export function musicForMood(mood: string): string {
  const m = (mood as Mood) ?? "calm";
  switch (m) {
    case "adventure":
      return "/music/adventure.mp3";
    case "magical":
      return "/music/magical.mp3";
    case "silly":
      return "/music/silly.mp3";
    case "calm":
    default:
      return "/music/calm.mp3";
  }
}
