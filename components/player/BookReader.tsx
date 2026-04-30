"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { speak, stopSpeaking, primeVoices } from "@/lib/tts";
import { ResilientImage } from "@/components/ResilientImage";

export interface BookPage {
  imageUrl: string;
  text: string;
}

interface Props {
  title: string;
  pages: BookPage[];
  backHref: string;
}

export function BookReader({ title, pages, backHref }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [index, setIndex] = useState(0);
  const [readAloud, setReadAloud] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    primeVoices();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Speak the current page when read-aloud is on; cancel on toggle off / unmount.
  useEffect(() => {
    if (!readAloud) {
      cancelRef.current?.();
      stopSpeaking();
      return;
    }
    const text = pages[index]?.text;
    if (!text) return;
    const handle = speak(text);
    cancelRef.current = handle.cancel;
    return () => handle.cancel();
  }, [readAloud, index, pages]);

  useEffect(
    () => () => {
      stopSpeaking();
    },
    [],
  );

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href={backHref} className="btn-secondary text-sm py-2 px-4">
          ← Back
        </Link>
        <h1 className="font-display font-bold truncate mx-4">{title}</h1>
        <button
          onClick={() => setReadAloud((r) => !r)}
          className={`text-sm py-2 px-4 rounded-full font-display font-bold transition ${
            readAloud ? "bg-ink text-cream" : "bg-white/80 text-ink"
          }`}
        >
          {readAloud ? "🔊 Reading" : "🔇 Read to me"}
        </button>
      </header>

      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {pages.map((p, i) => (
            <div
              key={i}
              className="flex-[0_0_100%] min-w-0 h-full px-4 md:px-12 pb-6"
            >
              <div className="card h-full flex flex-col p-0 overflow-hidden">
                <div className="relative flex-1 min-h-[40vh] bg-lavender/30">
                  <ResilientImage
                    src={p.imageUrl}
                    alt=""
                    priority={i === 0}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="p-6 md:p-10 bg-white/95">
                  <p className="font-display text-xl md:text-2xl leading-relaxed">
                    {p.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto w-full">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          disabled={index === 0}
          className="btn-secondary"
        >
          ← Previous
        </button>
        <span className="text-ink/60 font-display font-bold">
          {index + 1} / {pages.length}
        </span>
        <button
          onClick={() => emblaApi?.scrollNext()}
          disabled={index === pages.length - 1}
          className="btn"
        >
          Next →
        </button>
      </footer>
    </main>
  );
}
