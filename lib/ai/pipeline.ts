import { prisma } from "@/lib/db";
import { generateStory } from "@/lib/ai/openrouter";
import { generateImage } from "@/lib/ai/nanoBanana";
import { saveImage } from "@/lib/storage";

/**
 * Drives a single story end-to-end. Updates the Story row's status as it
 * advances so the client poller can show progress.
 *
 * Pipeline (all via OpenRouter):
 *   1. Story text — chat-completions with JSON mode
 *   2. Per-scene image — chat-completions with `modalities: ["image","text"]`,
 *      saved to public/uploads/ for stable serving
 *   3. Voice — synthesized in the browser at playback time (no API)
 */
export async function runPipeline(storyId: string): Promise<void> {
  try {
    const story = await prisma.story.findUniqueOrThrow({ where: { id: storyId } });

    await prisma.story.update({
      where: { id: storyId },
      data: { status: "GENERATING_TEXT" },
    });

    const generated = await generateStory({
      childName: story.childName,
      childAge: story.childAge ?? undefined,
      funnyThing: story.funnyThing,
      niceThing: story.niceThing,
      badThing: story.badThing,
    });

    await prisma.$transaction([
      prisma.scene.deleteMany({ where: { storyId } }),
      prisma.story.update({
        where: { id: storyId },
        data: {
          title: generated.title,
          mood: generated.mood,
          characterRef: generated.characterDescription,
        },
      }),
      prisma.scene.createMany({
        data: generated.scenes.map((s, i) => ({
          storyId,
          index: i,
          text: s.text,
          imagePrompt: s.imagePrompt,
          // Filled in by the image step below.
          imageUrl: null,
          durationMs: Math.max(
            2500,
            Math.round((s.text.trim().split(/\s+/).length / 155) * 60_000),
          ),
        })),
      }),
    ]);

    await prisma.story.update({
      where: { id: storyId },
      data: { status: "GENERATING_IMAGES" },
    });

    // Parallel image generation. Stable Horde queues each job independently
    // on its volunteer GPU pool, so kicking them all off at once means total
    // wait ≈ slowest scene rather than sum of all scenes.
    await Promise.all(
      generated.scenes.map(async (scene, i) => {
        const img = await generateImage({
          prompt: scene.imagePrompt,
          characterDescription: generated.characterDescription,
        });
        const localPath = await saveImage(storyId, i, img.data, img.mimeType);
        await prisma.scene.update({
          where: { storyId_index: { storyId, index: i } },
          data: { imageUrl: localPath },
        });
      }),
    );

    await prisma.story.update({
      where: { id: storyId },
      data: { status: "READY" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[pipeline:${storyId}]`, message);
    await prisma.story.update({
      where: { id: storyId },
      data: { status: "FAILED", errorMessage: message.slice(0, 1000) },
    });
  }
}
