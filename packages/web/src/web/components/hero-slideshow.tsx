import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface Photo {
  id: number;
  url: string;
  title: string | null;
}

export function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await api.photos.favorites.$get();
      return res.json();
    },
  });

  const [shuffled, setShuffled] = useState<Photo[]>([]);

  useEffect(() => {
    const raw: Photo[] = data?.photos ?? [];
    if (raw.length === 0) return;
    const arr = [...raw];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffled(arr);
  }, [data]);

  const photos = shuffled;

  const advance = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrent((c) => (c + 1) % photos.length);
  }, [photos.length]);

  const reverse = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrent((c) => (c - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Auto-advance
  useEffect(() => {
    if (photos.length <= 1 || paused) return;
    const timer = setInterval(advance, 5000);
    return () => clearInterval(timer);
  }, [advance, photos.length, paused]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "l", "L"].includes(e.key)) advance();
      else if (["ArrowLeft", "ArrowUp", "h", "H"].includes(e.key)) reverse();
      else if ([" ", "k", "K", "p", "P"].includes(e.key)) {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, reverse]);

  if (isLoading) {
    return (
      <div className="w-full bg-[#0A0A0A]" style={{height: "calc(100svh - 0px)"}} />
    );
  }

  if (photos.length === 0) {
    return (
      <div className="w-full bg-[#0A0A0A] flex items-center justify-center" style={{height: "calc(100svh - 0px)"}}>
        <p className="text-white/30 text-sm tracking-widest uppercase">No featured photos yet</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-[#0A0A0A]" style={{height: "calc(100svh - 0px)"}}>
      {/* Slides */}
      {photos.map((p, i) => (
        <div
          key={p.id}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={p.url}
            alt=""
            className="w-full h-full object-contain"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Dot indicators + pause toggle */}
      {photos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          <button
            onClick={() => setPaused((p) => !p)}
            className="text-white/50 hover:text-white transition-colors"
            aria-label={paused ? "Resume slideshow" : "Pause slideshow"}
          >
            {paused ? (
              // Play icon
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <polygon points="2,1 11,6 2,11" />
              </svg>
            ) : (
              // Pause icon
              <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                <rect x="0" y="0" width="3.5" height="12" rx="1" />
                <rect x="6.5" y="0" width="3.5" height="12" rx="1" />
              </svg>
            )}
          </button>
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
