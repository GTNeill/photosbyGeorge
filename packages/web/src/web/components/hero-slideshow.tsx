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
  const [animKey, setAnimKey] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await api.photos.favorites.$get();
      return res.json();
    },
  });

  const photos: Photo[] = data?.photos ?? [];

  const advance = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrent((c) => (c + 1) % photos.length);
    setAnimKey((k) => k + 1);
  }, [photos.length]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(advance, 5000);
    return () => clearInterval(timer);
  }, [advance, photos.length]);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-[#0A0A0A] flex items-end pb-20 px-10 lg:px-20">
        <div className="animate-pulse">
          <div className="w-64 h-1 bg-white/20 mb-4" />
          <div className="w-96 h-12 bg-white/10" />
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="w-full h-screen bg-[#0A0A0A] flex items-end pb-20 px-10 lg:px-20">
        <h1 className="font-display text-white text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none">
          photos by George
        </h1>
      </div>
    );
  }

  const photo = photos[current];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0A0A0A]">
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
            alt={p.title ?? ""}
            className="w-full h-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      {/* Headline — bottom left only */}
      <div key={animKey} className="slide-fade-in absolute bottom-20 left-10 lg:left-20 z-10">
        <h1 className="font-display text-white text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none">
          photos by George
        </h1>
      </div>

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setAnimKey((k) => k + 1); }}
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
