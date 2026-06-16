import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { HeroSlideshow } from "../components/hero-slideshow";

const CATEGORY_COVERS: Record<string, string> = {
  portraits: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80",
  family: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&q=80",
  street: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
  travel: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  seniors: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=800&q=80",
};

export default function IndexPage() {
  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.categories.$get();
      return res.json();
    },
  });

  const categories = data?.categories ?? [];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero slideshow */}
      <HeroSlideshow />

      {/* Category grid */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {categories.map((cat: { id: number; name: string; slug: string }, index: number) => {
            const isLarge = index % 3 === 0;
            const colSpan = isLarge ? "md:col-span-7" : "md:col-span-5";
            const imgSrc = CATEGORY_COVERS[cat.slug] ?? `https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80`;

            return (
              <Link key={cat.id} to={`/category/${cat.slug}`}>
                <div
                  className={`photo-card relative overflow-hidden cursor-pointer group ${colSpan} bg-[#F8F8F6]`}
                  style={{ height: isLarge ? "500px" : "380px" }}
                >
                  <img src={imgSrc} alt={cat.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                    <h3 className="font-display text-white text-3xl md:text-4xl font-semibold">
                      {cat.name}
                    </h3>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] py-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-display text-lg text-[#0A0A0A]">photos by George</p>
          <p className="text-xs text-[#A0A0A0] tracking-widest uppercase">
            © {new Date().getFullYear()} All rights reserved
          </p>
          <Link to="/admin">
            <span className="text-xs text-[#A0A0A0] hover:text-[#0A0A0A] transition-colors cursor-pointer tracking-widest uppercase">
              Admin
            </span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
