import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../lib/api";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Photo = {
  id: number;
  url: string;
  title: string | null;
  subcategoryId: number | null;
};

type Subcategory = {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
};

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [location] = useLocation();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Parse ?sub= from query string
  const subSlug = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("sub");
  }, [location]);

  const { data, isLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const res = await api.categories[":slug"].photos.$get({ param: { slug } });
      return res.json();
    },
  });

  const category = (data as any)?.category as { id: number; name: string; slug: string } | undefined;
  const rawPhotos: Photo[] = (data as any)?.photos ?? [];

  // Fetch subcategories for this category
  const { data: subsData } = useQuery({
    queryKey: ["subcategories", category?.id],
    enabled: !!category?.id,
    queryFn: async () => {
      const res = await fetch(`/api/categories/${category!.id}/subcategories`);
      const json = await res.json();
      return json.subcategories as Subcategory[];
    },
  });

  const subcategories: Subcategory[] = subsData ?? [];

  // Active subcategory id from slug
  const activeSub = subcategories.find((s) => s.slug === subSlug) ?? null;

  // Filter photos by active subcategory, then shuffle
  const photos = useMemo(() => {
    const filtered = activeSub
      ? rawPhotos.filter((p) => p.subcategoryId === activeSub.id)
      : rawPhotos;
    const arr = [...filtered];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [rawPhotos.length, slug, activeSub?.id]);

  // Reset lightbox on filter change
  useEffect(() => setLightboxIndex(null), [activeSub?.id, slug]);

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = useCallback(
    () => setLightboxIndex((i) => (i != null && i > 0 ? i - 1 : photos.length - 1)),
    [photos.length]
  );
  const nextPhoto = useCallback(
    () => setLightboxIndex((i) => (i != null ? (i + 1) % photos.length : 0)),
    [photos.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevPhoto();
      else if (e.key === "ArrowRight") nextPhoto();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, prevPhoto, nextPhoto]);

  useEffect(() => {
    if (lightboxIndex !== null) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"
        style={{ paddingTop: "clamp(56px, 4vw, 64px)" }}
      >
        <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#C8A96E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div
        className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"
        style={{ paddingTop: "clamp(56px, 4vw, 64px)" }}
      >
        <p className="text-[#5A5A5A]">Category not found.</p>
      </div>
    );
  }

  const setSubFilter = (subSlug: string | null) => {
    window.location.href = subSlug
      ? `/category/${slug}?sub=${subSlug}`
      : `/category/${slug}`;
  };

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] overflow-x-hidden w-full"
      style={{ paddingTop: "clamp(56px, 4vw, 64px)" }}
    >
      <div className="pt-6 sm:pt-8 px-5 sm:px-8 lg:px-12 2xl:px-20 max-w-[2560px] mx-auto pb-16 sm:pb-24">

        {/* Subcategory filter pills — only shown if subcategories exist */}
        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 sm:mb-10">
            <button
              onClick={() => setSubFilter(null)}
              className={`px-4 py-1.5 text-[11px] font-medium tracking-[0.15em] uppercase border transition-colors duration-150 ${
                !activeSub
                  ? "border-[#C8A96E] text-[#C8A96E]"
                  : "border-[#2A2A2A] text-[#5A5A5A] hover:border-[#5A5A5A] hover:text-[#A0A0A0]"
              }`}
            >
              All
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSubFilter(sub.slug)}
                className={`px-4 py-1.5 text-[11px] font-medium tracking-[0.15em] uppercase border transition-colors duration-150 ${
                  activeSub?.id === sub.id
                    ? "border-[#C8A96E] text-[#C8A96E]"
                    : "border-[#2A2A2A] text-[#5A5A5A] hover:border-[#5A5A5A] hover:text-[#A0A0A0]"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {photos.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-display text-xl text-[#5A5A5A]">
              {activeSub
                ? `No photos in ${activeSub.name} yet.`
                : "No photos yet in this category."}
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4">
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className="photo-card break-inside-avoid overflow-hidden cursor-pointer group relative border border-[#2A2A2A] mb-4"
                onClick={() => openLightbox(i)}
              >
                <img src={photo.url} alt="" className="w-full block" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#2A2A2A] py-10 sm:py-12">
        <div className="max-w-[2560px] mx-auto px-5 sm:px-8 lg:px-12 2xl:px-20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display text-base text-[#F0F0F0]">photos by George</p>
          <p className="text-xs text-[#5A5A5A] tracking-widest uppercase">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </footer>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/60 hover:text-white transition-colors z-10 p-2"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {photos.length > 1 && (
            <button
              className="absolute left-2 sm:left-6 md:left-8 text-white/40 hover:text-white transition-colors z-10 p-2"
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              aria-label="Previous"
            >
              <ChevronLeft size={32} className="sm:w-9 sm:h-9" />
            </button>
          )}

          <div
            className="w-full max-w-5xl max-h-[90svh] px-10 sm:px-16 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].title ?? ""}
              className="max-w-full max-h-[80svh] object-contain"
            />
            {photos[lightboxIndex].title && (
              <p className="text-white/50 text-center text-xs sm:text-sm font-display mt-3 sm:mt-4">
                {photos[lightboxIndex].title}
              </p>
            )}
          </div>

          {photos.length > 1 && (
            <button
              className="absolute right-2 sm:right-6 md:right-8 text-white/40 hover:text-white transition-colors z-10 p-2"
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              aria-label="Next"
            >
              <ChevronRight size={32} className="sm:w-9 sm:h-9" />
            </button>
          )}

          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-xs tracking-widest">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
