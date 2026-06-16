import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const res = await api.categories[":slug"].photos.$get({ param: { slug } });
      return res.json();
    },
  });

  const category = (data as any)?.category;
  const photos: Array<{ id: number; url: string; title: string | null }> = (data as any)?.photos ?? [];

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () => setLightboxIndex((i) => (i != null && i > 0 ? i - 1 : photos.length - 1));
  const nextPhoto = () => setLightboxIndex((i) => (i != null ? (i + 1) % photos.length : 0));

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#0A0A0A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <p className="text-[#6B6B6B]">Category not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-32 pb-16 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <p className="text-xs tracking-[0.2em] uppercase text-[#A0A0A0] font-medium mb-4">Photography</p>
        <h1 className="font-display text-5xl md:text-7xl font-semibold text-[#0A0A0A]">
          {category.name}
        </h1>
        <div className="w-12 h-px bg-[#C8A96E] mt-6" />
      </div>

      {/* Masonry-style photo grid */}
      <div className="px-6 lg:px-12 max-w-[1400px] mx-auto pb-24">
        {photos.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-2xl text-[#A0A0A0]">No photos yet in this category.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className="photo-card break-inside-avoid overflow-hidden cursor-pointer group relative"
                onClick={() => openLightbox(i)}
              >
                <img
                  src={photo.url}
                  alt={photo.title ?? ""}
                  className="w-full block"
                  loading="lazy"
                />
                {photo.title && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end p-4">
                    <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-display">
                      {photo.title}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
            onClick={closeLightbox}
          >
            <X size={28} />
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              className="absolute left-4 md:left-8 text-white/50 hover:text-white transition-colors z-10 p-2"
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            >
              <ChevronLeft size={36} />
            </button>
          )}

          {/* Image */}
          <div className="max-w-5xl max-h-[90vh] px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].title ?? ""}
              className="max-w-full max-h-[85vh] object-contain"
            />
            {photos[lightboxIndex].title && (
              <p className="text-white/60 text-center text-sm font-display mt-4">
                {photos[lightboxIndex].title}
              </p>
            )}
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              className="absolute right-4 md:right-8 text-white/50 hover:text-white transition-colors z-10 p-2"
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            >
              <ChevronRight size={36} />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
