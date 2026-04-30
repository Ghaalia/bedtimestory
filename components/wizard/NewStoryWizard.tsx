"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface Form {
  childName: string;
  childAge: string;
  funnyThing: string;
  niceThing: string;
  badThing: string;
}

const STEPS = [
  {
    key: "childName",
    emoji: "👶",
    title: "Who is tonight's story for?",
    sub: "Tell us your child's name (and age, if you'd like).",
    placeholder: "Maya",
    type: "name",
  },
  {
    key: "funnyThing",
    emoji: "😄",
    title: "What was something funny today?",
    sub: "A silly moment, a giggle, a face the dog made…",
    placeholder: "The cat chased its own tail at breakfast.",
    type: "text",
  },
  {
    key: "niceThing",
    emoji: "💛",
    title: "What was something nice today?",
    sub: "A kind moment, a friend, a hug, a small win.",
    placeholder: "I shared my snack with Leo at recess.",
    type: "text",
  },
  {
    key: "badThing",
    emoji: "🌧️",
    title: "Was anything hard or scary today?",
    sub: "It's okay to share — we'll wrap it up gently in the story.",
    placeholder: "I tripped and scraped my knee.",
    type: "text",
  },
] as const;

export function NewStoryWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Form>({
    childName: "",
    childAge: "",
    funnyThing: "",
    niceThing: "",
    badThing: "",
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const value =
    current.key === "childName" ? form.childName : (form[current.key] as string);

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: form.childName.trim(),
          childAge: form.childAge ? Number(form.childAge) : undefined,
          funnyThing: form.funnyThing.trim(),
          niceThing: form.niceThing.trim(),
          badThing: form.badThing.trim(),
        }),
      });
      if (!res.ok) throw new Error("Could not start the story");
      const { id } = (await res.json()) as { id: string };
      router.push(`/story/${id}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong starting the story. Please try again.");
      setSubmitting(false);
    }
  }

  const canAdvance = (() => {
    if (current.key === "childName") return form.childName.trim().length > 0;
    return (form[current.key] as string).trim().length >= 2;
  })();

  return (
    <div>
      <Progress step={step} total={STEPS.length} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="card mt-6"
        >
          <div className="text-6xl mb-3 animate-float">{current.emoji}</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight">
            {current.title}
          </h2>
          <p className="text-ink/60 mt-2 text-lg">{current.sub}</p>

          <div className="mt-6 space-y-3">
            {current.type === "name" ? (
              <div className="flex gap-3">
                <input
                  className="input flex-1"
                  placeholder={current.placeholder}
                  value={form.childName}
                  autoFocus
                  onChange={(e) =>
                    setForm({ ...form, childName: e.target.value })
                  }
                />
                <input
                  className="input w-28"
                  type="number"
                  min={2}
                  max={12}
                  placeholder="Age"
                  value={form.childAge}
                  onChange={(e) =>
                    setForm({ ...form, childAge: e.target.value })
                  }
                />
              </div>
            ) : (
              <textarea
                className="input min-h-[120px]"
                placeholder={current.placeholder}
                value={value}
                autoFocus
                onChange={(e) =>
                  setForm({ ...form, [current.key]: e.target.value })
                }
              />
            )}

            <VoiceInputButton
              onText={(text) =>
                setForm((f) => ({
                  ...f,
                  [current.key]: ((f[current.key] as string) + " " + text).trim(),
                }))
              }
            />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="btn-secondary"
            >
              ← Back
            </button>
            {isLast ? (
              <button
                onClick={submit}
                disabled={!canAdvance || submitting}
                className="btn"
              >
                {submitting ? "Sprinkling magic…" : "✨ Make my story"}
              </button>
            ) : (
              <button onClick={next} disabled={!canAdvance} className="btn">
                Next →
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-all ${
            i <= step ? "bg-ink" : "bg-ink/15"
          }`}
        />
      ))}
    </div>
  );
}

function VoiceInputButton({ onText }: { onText: (text: string) => void }) {
  const [listening, setListening] = useState(false);

  function start() {
    type SR = typeof window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const w = window as SR;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      alert("Voice input isn't supported in this browser.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListening(true);
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      onText(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={listening}
      className="text-sm text-ink/60 hover:text-ink underline-offset-4 hover:underline"
    >
      {listening ? "🎙️ Listening…" : "🎙️ Or say it out loud"}
    </button>
  );
}
