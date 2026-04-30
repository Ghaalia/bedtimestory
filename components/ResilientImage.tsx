"use client";

import { useEffect, useState } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * Pollinations free tier rate-limits aggressively. If a request 429s, the
 * <img> fires onError; we then wait and retry with a cache-busting suffix
 * a few times before giving up. The image is positioned with `object-cover`
 * by the caller via className.
 */
export function ResilientImage({ src, alt, className, priority }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setErrored(false);
    setLoaded(false);
  }, [src]);

  const url = attempt === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}_=${attempt}`;

  return (
    <div className="absolute inset-0">
      {!loaded && !errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-lavender/40 animate-pulse">
          <span className="text-4xl">✨</span>
        </div>
      )}
      {errored && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-lavender/40 text-ink/60 p-4 text-center">
          <span className="text-4xl mb-2">🌧️</span>
          <span className="text-sm">
            Image is taking a nap. Refresh in a moment.
          </span>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={className}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (attempt < 4) {
            // 3s, 6s, 12s, 24s — gives Pollinations time to recover.
            const delay = 3000 * 2 ** attempt;
            setTimeout(() => setAttempt((a) => a + 1), delay);
          } else {
            setErrored(true);
          }
        }}
      />
    </div>
  );
}
