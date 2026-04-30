// Image generation via Stable Horde — a free, anonymous, volunteer-run
// distributed GPU network. No signup, no key, no credit card.
// Anonymous use is allowed via the special `0000000000` API key.
// Trade-off: queue-based, so each image takes 30s–3min depending on demand.
//
// Docs: https://stablehorde.net/api/

const ENDPOINT = "https://stablehorde.net/api/v2";
const ANONYMOUS_KEY = "0000000000";
const CLIENT_AGENT = "BedTimeStory:1.0:local-dev";

const STYLE_SUFFIX =
  "soft storybook illustration, warm pastel palette, gentle rim light, watercolor and gouache, cozy, cinematic, kid-friendly, no text, no letters";

export interface GeneratedImage {
  data: Buffer;
  mimeType: string;
}

interface StartResponse {
  id?: string;
  message?: string;
  errors?: unknown;
}
interface CheckResponse {
  done?: boolean;
  faulted?: boolean;
  wait_time?: number;
  queue_position?: number;
  is_possible?: boolean;
}
interface StatusResponse {
  generations?: Array<{ img?: string }>;
}

async function startJob(prompt: string): Promise<string> {
  const res = await fetch(`${ENDPOINT}/generate/async`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.STABLE_HORDE_API_KEY || ANONYMOUS_KEY,
      "Client-Agent": CLIENT_AGENT,
    },
    body: JSON.stringify({
      prompt,
      params: {
        width: 1024,
        height: 576,
        steps: 20,
        sampler_name: "k_euler",
        cfg_scale: 7.5,
        n: 1,
      },
      nsfw: false,
      censor_nsfw: true,
      // Empty list = let Horde pick any available worker. More reliable than
      // requesting a specific model that may have no online workers.
      models: [],
      r2: true, // image returned via Cloudflare R2 url
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Stable Horde start ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as StartResponse;
  if (!json.id) {
    throw new Error(
      `Stable Horde returned no job id: ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  return json.id;
}

async function pollUntilDone(id: string): Promise<void> {
  // Up to ~5 minutes total at 5s intervals.
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`${ENDPOINT}/generate/check/${id}`);
    if (!res.ok) continue;
    const json = (await res.json()) as CheckResponse;
    if (json.done) return;
    if (json.faulted) throw new Error("Stable Horde job faulted");
    if (json.is_possible === false) {
      throw new Error("Stable Horde: no workers available for this request");
    }
  }
  throw new Error("Stable Horde: timed out waiting for image");
}

async function fetchResult(id: string): Promise<Buffer> {
  const res = await fetch(`${ENDPOINT}/generate/status/${id}`);
  if (!res.ok) {
    throw new Error(`Stable Horde status ${res.status}`);
  }
  const json = (await res.json()) as StatusResponse;
  const img = json.generations?.[0]?.img;
  if (!img) throw new Error("Stable Horde returned no image");

  // r2: true → `img` is a download URL. Fall back to inline base64 if not.
  if (img.startsWith("http")) {
    const dl = await fetch(img);
    if (!dl.ok) throw new Error(`Image download failed: ${dl.status}`);
    return Buffer.from(await dl.arrayBuffer());
  }
  return Buffer.from(img, "base64");
}

export async function generateImage(opts: {
  prompt: string;
  characterDescription: string;
}): Promise<GeneratedImage> {
  const fullPrompt = [
    `Main character: ${opts.characterDescription}.`,
    `Scene: ${opts.prompt}.`,
    STYLE_SUFFIX,
  ].join(" ");

  const id = await startJob(fullPrompt);
  await pollUntilDone(id);
  const data = await fetchResult(id);
  return { data, mimeType: "image/webp" };
}
