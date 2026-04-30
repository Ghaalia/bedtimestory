"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { speak, stopSpeaking, primeVoices } from "@/lib/tts";
import { ResilientImage } from "@/components/ResilientImage";

export interface VideoScene {
  imageUrl: string;
  text: string;
  durationMs: number;
}

interface Props {
  title: string;
  scenes: VideoScene[];
  musicSrc: string;
  backHref: string;
}

export function VideoPlayer({ title, scenes, musicSrc, backHref }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showCaption, setShowCaption] = useState(true);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const ttsCancelRef = useRef<(() => void) | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    primeVoices();
    if (musicRef.current) musicRef.current.volume = 0.18;
  }, []);

  // Drive narration whenever `playing` or `index` changes.
  useEffect(() => {
    if (!playing) {
      stopSpeaking();
      ttsCancelRef.current?.();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      musicRef.current?.pause();
      return;
    }

    const scene = scenes[index];
    if (!scene) return;

    void musicRef.current?.play().catch(() => {});

    const advance = () => {
      if (index < scenes.length - 1) {
        setIndex((i) => i + 1);
      } else {
        setPlaying(false);
      }
    };

    const handle = speak(scene.text, { onEnd: advance, onError: advance });
    ttsCancelRef.current = handle.cancel;

    // Safety net: some browsers (notably Chrome) silently drop `onend` on
    // long utterances. Estimated duration + a small buffer guarantees we
    // advance even when the API ghosts us.
    fallbackTimerRef.current = setTimeout(advance, scene.durationMs + 1500);

    return () => {
      handle.cancel();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [playing, index, scenes]);

  // Always stop on unmount.
  useEffect(
    () => () => {
      stopSpeaking();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    },
    [],
  );

  function togglePlay() {
    setPlaying((p) => !p);
  }
  function restart() {
    setIndex(0);
    setPlaying(true);
  }

  const scene = scenes[index];
  if (!scene) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>This story has no scenes yet.</p>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 bg-black text-white">
      <Link
        href={backHref}
        className="absolute top-4 left-4 z-30 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-sm hover:bg-white/30"
      >
        ← Back
      </Link>

      <button
        onClick={() => setShowCaption((s) => !s)}
        className="absolute top-4 right-4 z-30 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-sm hover:bg-white/30"
      >
        {showCaption ? "Hide text" : "Show text"}
      </button>

      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1 }}
              animate={{ scale: 1.1 }}
              transition={{
                duration: scene.durationMs / 1000,
                ease: "linear",
              }}
            >
              <ResilientImage
                src={scene.imageUrl}
                alt=""
                priority
                className="absolute inset-0 h-full w-full object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
          </motion.div>
        </AnimatePresence>
      </div>

      {showCaption && (
        <motion.div
          key={`caption-${index}`}
          className="absolute bottom-32 left-0 right-0 z-20 px-8 md:px-20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <p className="font-display text-xl md:text-3xl leading-snug max-w-3xl mx-auto text-center drop-shadow-lg">
            {scene.text}
          </p>
        </motion.div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/90 to-transparent">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-lg mb-3 opacity-80">{title}</h2>

          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="h-14 w-14 rounded-full bg-white text-black flex items-center justify-center text-2xl hover:scale-105 transition"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <button
              onClick={restart}
              className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              aria-label="Restart"
            >
              ↻
            </button>

            <div className="flex-1 flex gap-1">
              {scenes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    i < index
                      ? "bg-white"
                      : i === index
                        ? "bg-white animate-pulse"
                        : "bg-white/30"
                  }`}
                  aria-label={`Scene ${i + 1}`}
                />
              ))}
            </div>

            <span className="text-sm opacity-70 tabular-nums">
              {index + 1} / {scenes.length}
            </span>
          </div>
        </div>
      </div>

      <audio ref={musicRef} src={musicSrc} loop preload="auto" />
    </main>
  );
}
