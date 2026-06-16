import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { authClient, clearToken } from "../lib/auth";
import {
  Upload, Trash2, Star, LogOut, Image, Settings,
  Pencil, Check, X, ChevronDown, ChevronRight, Plus, Phone,
} from "lucide-react";

// ── helpers ────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ── InlineEdit ─────────────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    if (draft.trim() !== value) onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          className={`border-b border-[#0A0A0A] bg-transparent outline-none ${className}`}
        />
        <button onClick={commit} className="text-green-600 hover:text-green-700"><Check size={13} /></button>
        <button onClick={() => { setDraft(value); setEditing(false); }} className="text-[#A0A0A0] hover:text-[#0A0A0A]"><X size={13} /></button>
      </span>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`flex items-center gap-1 group/edit ${className}`}
    >
      {value || <span className="text-[#A0A0A0] italic">—</span>}
      <Pencil size={11} className="opacity-0 group-hover/edit:opacity-60 transition-opacity flex-shrink-0" />
    </button>
  );
}

// ── SubcategoryRow ─────────────────────────────────────────────────────────

function SubcategoryRow({ sub, catId }: { sub: { id: number; name: string; slug: string }; catId: number }) {
  const qc = useQueryClient();

  const rename = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/categories/${catId}/subcategories/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: toSlug(name) }),
        credentials: "include",
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subcategories", catId] }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      await fetch(`/api/categories/${catId}/subcategories/${sub.id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subcategories", catId] }),
  });

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-[#F8F8F6] group">
      <div className="flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-[#C8A96E] flex-shrink-0" />
        <InlineEdit value={sub.name} onSave={(v) => rename.mutate(v)} className="text-sm text-[#3A3A3A]" />
      </div>
      <button
        onClick={() => { if (confirm(`Delete subcategory "${sub.name}"?`)) remove.mutate(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A0A0A0] hover:text-red-500"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ── CategoryCard ───────────────────────────────────────────────────────────

function CategoryCard({ cat }: { cat: { id: number; name: string; slug: string } }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [addingSubcat, setAddingSubcat] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState("");

  const { data: subData } = useQuery({
    queryKey: ["subcategories", cat.id],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${cat.id}/subcategories`, { credentials: "include" });
      return res.json();
    },
    enabled: expanded,
  });

  const subcats: any[] = subData?.subcategories ?? [];

  const rename = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: toSlug(name) }),
        credentials: "include",
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      await fetch(`/api/categories/${cat.id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const addSubcat = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/categories/${cat.id}/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: toSlug(name) }),
        credentials: "include",
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcategories", cat.id] });
      setNewSubcatName("");
      setAddingSubcat(false);
    },
  });

  return (
    <div className="border border-[#E5E5E5] rounded-sm bg-white">
      <div className="flex items-center justify-between px-4 py-3 group">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setExpanded((e) => !e)} className="text-[#A0A0A0] hover:text-[#0A0A0A] flex-shrink-0 transition-colors">
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
          <InlineEdit value={cat.name} onSave={(v) => rename.mutate(v)} className="font-medium text-[#0A0A0A] text-sm" />
          <span className="text-[10px] text-[#A0A0A0] font-mono">{cat.slug}</span>
        </div>
        <button
          onClick={() => { if (confirm(`Delete category "${cat.name}"? Photos won't be deleted.`)) remove.mutate(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A0A0A0] hover:text-red-500 ml-3 flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[#E5E5E5] px-4 py-3">
          {subcats.length === 0 && !addingSubcat && (
            <p className="text-xs text-[#A0A0A0] mb-2">No subcategories yet.</p>
          )}
          {subcats.map((sub) => <SubcategoryRow key={sub.id} sub={sub} catId={cat.id} />)}

          {addingSubcat ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                autoFocus
                placeholder="Subcategory name"
                value={newSubcatName}
                onChange={(e) => setNewSubcatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSubcatName.trim()) addSubcat.mutate(newSubcatName.trim());
                  if (e.key === "Escape") { setAddingSubcat(false); setNewSubcatName(""); }
                }}
                className="flex-1 text-sm border-b border-[#E5E5E5] bg-transparent outline-none py-1 focus:border-[#0A0A0A]"
              />
              <button onClick={() => { if (newSubcatName.trim()) addSubcat.mutate(newSubcatName.trim()); }} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
              <button onClick={() => { setAddingSubcat(false); setNewSubcatName(""); }} className="text-[#A0A0A0] hover:text-[#0A0A0A]"><X size={14} /></button>
            </div>
          ) : (
            <button
              onClick={() => { setExpanded(true); setAddingSubcat(true); }}
              className="flex items-center gap-1.5 text-xs text-[#A0A0A0] hover:text-[#0A0A0A] transition-colors mt-2"
            >
              <Plus size={12} /> Add subcategory
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── ManageCategoriesTab ────────────────────────────────────────────────────

function ManageCategoriesTab() {
  const qc = useQueryClient();
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => { const res = await api.categories.$get(); return res.json(); },
  });

  const categories: any[] = catData?.categories ?? [];

  const addCategory = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: toSlug(name) }),
        credentials: "include",
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setNewCatName(""); setAddingCat(false); },
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-[#0A0A0A]">Manage Categories</h1>
        <p className="text-sm text-[#A0A0A0] mt-1">Rename, delete, or expand categories and subcategories.</p>
      </div>
      <div className="space-y-2">
        {categories.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
      </div>
      <div className="mt-4">
        {addingCat ? (
          <div className="border border-dashed border-[#C8A96E] rounded-sm px-4 py-3 flex items-center gap-2 bg-white">
            <input
              autoFocus
              placeholder="New category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCatName.trim()) addCategory.mutate(newCatName.trim());
                if (e.key === "Escape") { setAddingCat(false); setNewCatName(""); }
              }}
              className="flex-1 text-sm bg-transparent outline-none"
            />
            <button onClick={() => { if (newCatName.trim()) addCategory.mutate(newCatName.trim()); }} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
            <button onClick={() => { setAddingCat(false); setNewCatName(""); }} className="text-[#A0A0A0] hover:text-[#0A0A0A]"><X size={14} /></button>
          </div>
        ) : (
          <button
            onClick={() => setAddingCat(true)}
            className="flex items-center gap-2 text-sm text-[#A0A0A0] hover:text-[#0A0A0A] transition-colors border border-dashed border-[#E5E5E5] hover:border-[#A0A0A0] rounded-sm px-4 py-3 w-full"
          >
            <Plus size={14} /> Add new category
          </button>
        )}
      </div>
    </div>
  );
}

// ── ContactSettingsTab ─────────────────────────────────────────────────────

function ContactSettingsTab() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings", { credentials: "include" });
      return res.json() as Promise<{ settings: Record<string, string> }>;
    },
  });

  const settings = data?.settings ?? {};

  const [form, setForm] = useState<Record<string, string> | null>(null);
  const current = form ?? settings;

  const save = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setForm(null);
    },
  });

  const fields: { key: string; label: string; type?: string; placeholder: string }[] = [
    { key: "contact_name",    label: "Name",    placeholder: "George Neill" },
    { key: "contact_address", label: "Address", placeholder: "123 Main St, City, State ZIP" },
    { key: "contact_email",   label: "Email",   type: "email", placeholder: "hello@example.com" },
    { key: "contact_phone",   label: "Phone",   type: "tel",   placeholder: "+1 (555) 000-0000" },
  ];

  const isDirty = form !== null;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-[#0A0A0A]">Contact Details</h1>
        <p className="text-sm text-[#A0A0A0] mt-1">Shown on the public Contact page.</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#E5E5E5] border-t-[#0A0A0A] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs tracking-[0.12em] uppercase text-[#6B6B6B] font-medium mb-1.5">
                {f.label}
              </label>
              <input
                type={f.type ?? "text"}
                value={current[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setForm({ ...(form ?? settings), [f.key]: e.target.value })}
                className="w-full border border-[#E5E5E5] px-3 py-2.5 text-sm text-[#0A0A0A] bg-white outline-none focus:border-[#0A0A0A] transition-colors rounded-sm"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { if (form) save.mutate(form); }}
              disabled={!isDirty || save.isPending}
              className="px-5 py-2.5 bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </button>
            {isDirty && (
              <button
                onClick={() => setForm(null)}
                className="px-5 py-2.5 border border-[#E5E5E5] text-[#6B6B6B] text-sm hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors"
              >
                Discard
              </button>
            )}
          </div>

          {save.isSuccess && (
            <p className="text-xs text-green-600 flex items-center gap-1"><Check size={12} /> Saved successfully</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────────────────────

type AdminTab = "photos" | "manage" | "contact";

export default function AdminPage() {
  const { data: session } = authClient.useSession();
  const [tab, setTab] = useState<AdminTab>("photos");
  const [activeSlug, setActiveSlug] = useState("portraits");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => { const res = await api.categories.$get(); return res.json(); },
  });

  const categories: any[] = catData?.categories ?? [];
  const activeCategory = categories.find((c: any) => c.slug === activeSlug);

  const { data: photoData, isLoading: photosLoading } = useQuery({
    queryKey: ["admin-photos", activeSlug],
    queryFn: async () => {
      const res = await api.categories[":slug"].photos.$get({ param: { slug: activeSlug } });
      return res.json();
    },
    enabled: !!activeSlug && activeSlug !== "all" && tab === "photos",
  });

  const { data: allData } = useQuery({
    queryKey: ["all-photos"],
    queryFn: async () => { const res = await api.photos.$get(); return res.json(); },
    enabled: tab === "photos",
  });

  const photos = activeSlug === "all" ? ((allData as any)?.photos ?? []) : ((photoData as any)?.photos ?? []);

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

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const presignRes = await api.photos.presign.$post({ json: { filename: file.name, contentType: file.type } });
      const { url, key, publicUrl } = await presignRes.json();
      await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      await api.photos.$post({ json: {
        key, url: publicUrl,
        title: uploadTitle || file.name.replace(/\.[^.]+$/, ""),
        categoryId: activeCategory?.id ?? null,
      }});
      setUploadTitle("");
      queryClient.invalidateQueries({ queryKey: ["admin-photos", activeSlug] });
      queryClient.invalidateQueries({ queryKey: ["all-photos"] });
    } catch (e) { console.error("Upload failed", e); }
    finally { setUploading(false); }
  };

  const handleFiles = (files: FileList | null) => { if (!files) return; Array.from(files).forEach(uploadFile); };

  const handleSignOut = async () => { await authClient.signOut(); clearToken(); window.location.href = "/"; };

  const sidebarBtn = (active: boolean) =>
    `w-full text-left px-4 py-2.5 rounded text-sm font-medium transition-colors mb-1 flex items-center gap-2 ${
      active ? "bg-[#0A0A0A] text-white" : "text-[#6B6B6B] hover:bg-[#F8F8F6]"
    }`;

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E5E5] flex flex-col fixed h-full z-10">
        <div className="px-6 py-8 border-b border-[#E5E5E5]">
          <p className="font-display text-lg font-semibold text-[#0A0A0A]">photos by George</p>
          <p className="text-xs text-[#A0A0A0] mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#A0A0A0] font-medium px-4 mb-3">Photos</p>

          <button onClick={() => { setTab("photos"); setActiveSlug("all"); }} className={sidebarBtn(tab === "photos" && activeSlug === "all")}>
            <Image size={14} /> All Photos
          </button>

          {categories.map((cat: any) => (
            <button key={cat.slug} onClick={() => { setTab("photos"); setActiveSlug(cat.slug); }} className={sidebarBtn(tab === "photos" && activeSlug === cat.slug)}>
              <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
              {cat.name}
            </button>
          ))}

          <div className="mt-6">
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#A0A0A0] font-medium px-4 mb-3">Settings</p>
            <button onClick={() => setTab("manage")} className={sidebarBtn(tab === "manage")}>
              <Settings size={14} /> Manage Categories
            </button>
            <button onClick={() => setTab("contact")} className={sidebarBtn(tab === "contact")}>
              <Phone size={14} /> Contact Details
            </button>
          </div>
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
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 text-xs text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 w-[calc(100%-16rem)] p-8 lg:p-10 overflow-x-hidden">
        {tab === "manage" ? <ManageCategoriesTab /> :
         tab === "contact" ? <ContactSettingsTab /> : (
          <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-semibold text-[#0A0A0A]">
                  {activeSlug === "all" ? "All Photos" : categories.find((c: any) => c.slug === activeSlug)?.name ?? activeSlug}
                </h1>
                <p className="text-sm text-[#A0A0A0] mt-1">{photos.length} photo{photos.length !== 1 ? "s" : ""}</p>
              </div>
              <a href="/" target="_blank" rel="noopener noreferrer" className="text-xs text-[#A0A0A0] hover:text-[#0A0A0A] transition-colors tracking-widest uppercase border border-[#E5E5E5] px-4 py-2 hover:border-[#0A0A0A]">
                View Site
              </a>
            </div>

            {/* Upload area */}
            {activeSlug !== "all" && (
              <div className="mb-8">
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                <div
                  className={`border-2 border-dashed rounded-sm p-10 text-center transition-colors cursor-pointer ${dragOver ? "border-[#C8A96E] bg-[#C8A96E]/5" : "border-[#E5E5E5] hover:border-[#A0A0A0]"}`}
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
                {activeSlug !== "all" && <p className="text-sm text-[#A0A0A0] mt-2">Upload your first photo above.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map((photo: any) => (
                  <div key={photo.id} className="group relative bg-white overflow-hidden rounded-sm border border-[#E5E5E5]">
                    <img src={photo.url} alt={photo.title ?? ""} className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => toggleFavorite.mutate({ id: photo.id, isFavorite: !photo.isFavorite })}
                        className={`p-2 rounded-full transition-colors ${photo.isFavorite ? "bg-[#C8A96E] text-white" : "bg-white text-[#0A0A0A] hover:bg-[#C8A96E] hover:text-white"}`}
                        title={photo.isFavorite ? "Remove from favorites" : "Add to front page"}
                      >
                        <Star size={16} fill={photo.isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this photo?")) deletePhoto.mutate(photo.id); }}
                        className="p-2 rounded-full bg-white text-[#0A0A0A] hover:bg-red-500 hover:text-white transition-colors"
                        title="Delete photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {photo.isFavorite && (
                      <div className="absolute top-2 right-2 bg-[#C8A96E] text-white p-1 rounded-full">
                        <Star size={10} fill="currentColor" />
                      </div>
                    )}
                    <div className="p-3 border-t border-[#E5E5E5]">
                      <p className="text-xs text-[#6B6B6B] truncate font-medium">{photo.title ?? "Untitled"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
