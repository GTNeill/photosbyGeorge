import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { authClient, clearToken } from "../lib/auth";
import { Upload, Trash2, Star, StarOff, LogOut, Plus, X, Image } from "lucide-react";

const CATEGORIES = [
  { name: "Portraits", slug: "portraits" },
  { name: "Family", slug: "family" },
  { name: "Street", slug: "street" },
  { name: "Travel", slug: "travel" },
  { name: "Seniors", slug: "seniors" },
];

export default function AdminPage() {
  const { data: session } = authClient.useSession();
  const [activeSlug, setActiveSlug] = useState("portraits");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.categories.$get();
      return res.json();
    },
  });

  const categories = catData?.categories ?? [];
  const activeCategory = categories.find((c: any) => c.slug === activeSlug);

  // Fetch photos for active category
  const { data: photoData, isLoading: photosLoading } = useQuery({
    queryKey: ["admin-photos", activeSlug],
    queryFn: async () => {
      const res = await api.categories[":slug"].photos.$get({ param: { slug: activeSlug } });
      return res.json();
    },
    enabled: !!activeSlug,
  });

  // Fetch all photos for "All Photos" view
  const { data: allData } = useQuery({
    queryKey: ["all-photos"],
    queryFn: async () => {
      const res = await api.photos.$get();
      return res.json();
    },
  });

  const photos = activeSlug === "all"
    ? ((allData as any)?.photos ?? [])
    : ((photoData as any)?.photos ?? []);

  // Toggle favorite
  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: number; isFavorite: boolean }) => {
      const res = await api.photos[":id"].$patch({ param: { id: String(id) }, json: { isFavorite } });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-photos", activeSlug] });
      queryClient.invalidateQueries({ queryKey: ["all-photos"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // Delete photo
  const deletePhoto = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.photos[":id"].$delete({ param: { id: String(id) } });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-photos", activeSlug] });
      queryClient.invalidateQueries({ queryKey: ["all-photos"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // Upload photo
  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const presignRes = await api.photos.presign.$post({
        json: { filename: file.name, contentType: file.type },
      });
      const { url, key, publicUrl } = await presignRes.json();

      await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      await api.photos.$post({
        json: {
          key,
          url: publicUrl,
          title: uploadTitle || file.name.replace(/\.[^.]+$/, ""),
          categoryId: activeCategory?.id ?? null,
        },
      });

      setUploadTitle("");
      queryClient.invalidateQueries({ queryKey: ["admin-photos", activeSlug] });
      queryClient.invalidateQueries({ queryKey: ["all-photos"] });
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    clearToken();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E5E5] flex flex-col fixed h-full z-10">
        <div className="px-6 py-8 border-b border-[#E5E5E5]">
          <p className="font-display text-lg font-semibold text-[#0A0A0A]">photos by George</p>
          <p className="text-xs text-[#A0A0A0] mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#A0A0A0] font-medium px-3 mb-3">Categories</p>

          <button
            onClick={() => setActiveSlug("all")}
            className={`w-full text-left px-3 py-2.5 rounded text-sm font-medium transition-colors mb-1 flex items-center gap-2 ${
              activeSlug === "all" ? "bg-[#0A0A0A] text-white" : "text-[#6B6B6B] hover:bg-[#F8F8F6]"
            }`}
          >
            <Image size={14} />
            All Photos
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveSlug(cat.slug)}
              className={`w-full text-left px-3 py-2.5 rounded text-sm font-medium transition-colors mb-1 flex items-center gap-2 ${
                activeSlug === cat.slug ? "bg-[#0A0A0A] text-white" : "text-[#6B6B6B] hover:bg-[#F8F8F6]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
              {cat.name}
            </button>
          ))}
        </nav>

        <div className="px-6 py-5 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-3 mb-4">
            {session?.user?.image && (
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0A0A0A] truncate">{session?.user?.name}</p>
              <p className="text-xs text-[#A0A0A0] truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 text-xs text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold text-[#0A0A0A]">
                {activeSlug === "all" ? "All Photos" : CATEGORIES.find(c => c.slug === activeSlug)?.name ?? activeSlug}
              </h1>
              <p className="text-sm text-[#A0A0A0] mt-1">{photos.length} photo{photos.length !== 1 ? "s" : ""}</p>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#A0A0A0] hover:text-[#0A0A0A] transition-colors tracking-widest uppercase border border-[#E5E5E5] px-4 py-2 hover:border-[#0A0A0A]"
            >
              View Site
            </a>
          </div>

          {/* Upload area — only show when not in "all" view */}
          {activeSlug !== "all" && (
            <div className="mb-8">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              <div
                className={`border-2 border-dashed rounded-sm p-10 text-center transition-colors cursor-pointer ${
                  dragOver ? "border-[#C8A96E] bg-[#C8A96E]/5" : "border-[#E5E5E5] hover:border-[#A0A0A0]"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-[#E5E5E5] border-t-[#C8A96E] rounded-full animate-spin" />
                    <p className="text-sm text-[#6B6B6B]">Uploading…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload size={24} className="text-[#A0A0A0]" />
                    <div>
                      <p className="text-sm font-medium text-[#0A0A0A]">Drop photos here or click to browse</p>
                      <p className="text-xs text-[#A0A0A0] mt-1">JPG, PNG, WebP — multiple files supported</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photo grid */}
          {photosLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 border-2 border-[#E5E5E5] border-t-[#0A0A0A] rounded-full animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl text-[#A0A0A0]">No photos yet.</p>
              {activeSlug !== "all" && (
                <p className="text-sm text-[#A0A0A0] mt-2">Upload your first photo above.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((photo: any) => (
                <div key={photo.id} className="group relative bg-white overflow-hidden rounded-sm border border-[#E5E5E5]">
                  <img
                    src={photo.url}
                    alt={photo.title ?? ""}
                    className="w-full h-48 object-cover"
                  />

                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => toggleFavorite.mutate({ id: photo.id, isFavorite: !photo.isFavorite })}
                      className={`p-2 rounded-full transition-colors ${
                        photo.isFavorite ? "bg-[#C8A96E] text-white" : "bg-white text-[#0A0A0A] hover:bg-[#C8A96E] hover:text-white"
                      }`}
                      title={photo.isFavorite ? "Remove from favorites" : "Add to front page"}
                    >
                      {photo.isFavorite ? <Star size={16} fill="currentColor" /> : <Star size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this photo?")) deletePhoto.mutate(photo.id);
                      }}
                      className="p-2 rounded-full bg-white text-[#0A0A0A] hover:bg-red-500 hover:text-white transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Favorite badge */}
                  {photo.isFavorite && (
                    <div className="absolute top-2 right-2 bg-[#C8A96E] text-white p-1 rounded-full">
                      <Star size={10} fill="currentColor" />
                    </div>
                  )}

                  {/* Title */}
                  <div className="p-3 border-t border-[#E5E5E5]">
                    <p className="text-xs text-[#6B6B6B] truncate font-medium">{photo.title ?? "Untitled"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
