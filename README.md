# 🌙 BedTimeStory

Turn your child's day into a personalized, illustrated bedtime story.

A parent answers three little questions about their kid's day — something **funny**, something **nice**, something **bad/scary** — and the app weaves it into a gentle illustrated story with a warm voice-over and music. Watch it as a video, or swipe through it as a picture book.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind**
- **Auth.js v5** — Google OAuth + email magic link (Resend)
- **Postgres** + **Prisma**
- **Vercel Blob** for image/audio storage
- **OpenRouter** for the LLM (default: Claude Sonnet 4.6)
- **Nano Banana** (Gemini 2.5 Flash Image) for illustrations, with image-conditioning between scenes for a consistent protagonist
- **ElevenLabs** for narration
- **Framer Motion** for animations, **Embla** for the book carousel

## Getting started

```bash
cp .env.example .env.local        # fill in API keys
npm install
npx prisma migrate dev            # set up Postgres schema
npm run dev
```

Open http://localhost:3000.

## Required env vars

See `.env.example`. You'll need accounts on:
- Postgres host (Neon / Supabase / Railway)
- Google Cloud Console (OAuth client)
- Resend (email)
- OpenRouter
- Google AI Studio (Gemini API key)
- ElevenLabs
- Vercel (for Blob storage)

## Music

Drop royalty-free MP3s into `public/music/` named `calm.mp3`, `adventure.mp3`, `magical.mp3`, `silly.mp3`. See `public/music/README.md`.

## How it flows

1. Parent fills the wizard (`/new`) → `POST /api/stories`
2. Server kicks off `runPipeline(storyId)` which:
   - calls OpenRouter to write a 6–8 scene story (JSON-validated against Zod)
   - generates each illustration with Nano Banana, passing the previous frame as a reference for character consistency
   - synthesizes per-scene narration with ElevenLabs in parallel
   - uploads everything to Vercel Blob
3. Client polls `GET /api/stories/[id]` every 2s and shows a friendly loader
4. Once `READY`, the parent picks **Watch as video** or **Read as book**
