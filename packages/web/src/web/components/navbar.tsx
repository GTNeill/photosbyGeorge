import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { X, Menu, ChevronDown } from "lucide-react";

type Category = { id: number; name: string; slug: string };
type Subcategory = { id: number; name: string; slug: string; categoryId: number };

function useSubcategories(categories: Category[]) {
  const { data } = useQuery({
    queryKey: ["subcategories-all", categories.map((c) => c.id).join(",")],
    enabled: categories.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        categories.map(async (cat) => {
          const res = await fetch(`/api/categories/${cat.id}/subcategories`);
          const json = await res.json();
          return { catId: cat.id, subs: (json.subcategories ?? []) as Subcategory[] };
        })
      );
      const map: Record<number, Subcategory[]> = {};
      for (const r of results) map[r.catId] = r.subs;
      return map;
    },
  });
  return data ?? {};
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  // Mobile: track which category is expanded
  const [mobileExpanded, setMobileExpanded] = useState<number | null>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const isHome = location === "/";

  const categorySlug = location.startsWith("/category/")
    ? location.replace("/category/", "").split("/")[0]
    : null;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.categories.$get();
      return res.json();
    },
  });

  const categories: Category[] = data?.categories ?? [];
  const subsMap = useSubcategories(categories);
  const activeCategoryName = categorySlug
    ? (categories.find((c) => c.slug === categorySlug)?.name ?? null)
    : null;

  const bgClass =
    scrolled || !isHome || menuOpen
      ? "bg-[#0A0A0A] border-b border-[#2A2A2A]"
      : "bg-transparent";

  const staticLinks = [
    { label: "Availability", to: "/availability" },
    { label: "Contact", to: "/contact" },
  ];

  const navLinkClass =
    "nav-link text-[13px] font-medium tracking-[0.15em] uppercase text-[#A0A0A0] hover:text-white cursor-pointer transition-colors duration-200";

  const closeAll = () => {
    setMenuOpen(false);
    setPortfolioOpen(false);
    setMobileExpanded(null);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClass}`}>
      <div className="max-w-[2560px] mx-auto px-5 sm:px-8 lg:px-12 2xl:px-20 h-14 sm:h-16 flex items-center justify-between relative">

        {/* Site name */}
        <Link to="/" onClick={closeAll}>
          <span className="font-display text-lg sm:text-xl font-semibold tracking-tight text-white cursor-pointer">
            photos by George
          </span>
        </Link>

        {/* Centered category title */}
        {activeCategoryName && (
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="font-display text-sm sm:text-base tracking-[0.2em] uppercase text-[#F0F0F0]">
              {activeCategoryName}
            </span>
          </div>
        )}

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">

          {/* Portfolio dropdown */}
          <div
            ref={portfolioRef}
            className="relative"
            onMouseEnter={() => setPortfolioOpen(true)}
            onMouseLeave={() => setPortfolioOpen(false)}
          >
            <span className={navLinkClass}>Portfolio</span>

            {portfolioOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/80 backdrop-blur-md border border-white/10 py-3 min-w-[200px] z-50">
                {categories.map((cat) => {
                  const subs = subsMap[cat.id] ?? [];
                  return (
                    <div key={cat.slug}>
                      {subs.length === 0 ? (
                        /* No subcategories — direct link */
                        <Link to={`/category/${cat.slug}`}>
                          <span
                            className="block px-6 py-2.5 text-[13px] font-medium tracking-[0.15em] uppercase text-[#A0A0A0] hover:text-white hover:bg-white/5 cursor-pointer transition-colors duration-150"
                            onClick={() => setPortfolioOpen(false)}
                          >
                            {cat.name}
                          </span>
                        </Link>
                      ) : (
                        /* Has subcategories — category label + indented subs */
                        <div>
                          <Link to={`/category/${cat.slug}`}>
                            <span
                              className="block px-6 py-2.5 text-[13px] font-medium tracking-[0.15em] uppercase text-[#F0F0F0] hover:text-white hover:bg-white/5 cursor-pointer transition-colors duration-150"
                              onClick={() => setPortfolioOpen(false)}
                            >
                              {cat.name}
                            </span>
                          </Link>
                          {subs.map((sub) => (
                            <Link key={sub.slug} to={`/category/${cat.slug}?sub=${sub.slug}`}>
                              <span
                                className="block pl-10 pr-6 py-2 text-[12px] font-medium tracking-[0.12em] uppercase text-[#5A5A5A] hover:text-[#C8A96E] hover:bg-white/5 cursor-pointer transition-colors duration-150"
                                onClick={() => setPortfolioOpen(false)}
                              >
                                {sub.name}
                              </span>
                            </Link>
                          ))}
                          <div className="mx-6 my-1 border-b border-[#2A2A2A]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <span className="text-[#2A2A2A] select-none">|</span>

          {staticLinks.map((l) => (
            <Link key={l.to} to={l.to}>
              <span className={navLinkClass}>{l.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-t border-[#2A2A2A] px-5 py-6 flex flex-col gap-5">

          {/* Portfolio — expand/collapse */}
          <button
            className="flex items-center gap-1 text-[13px] font-medium tracking-[0.15em] uppercase text-[#A0A0A0] cursor-pointer"
            onClick={() => setPortfolioOpen((o) => !o)}
          >
            Portfolio
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${portfolioOpen ? "rotate-180" : ""}`}
            />
          </button>

          {portfolioOpen && (
            <div className="flex flex-col gap-1 pl-4 border-l border-[#2A2A2A]">
              {categories.map((cat) => {
                const subs = subsMap[cat.id] ?? [];
                const isExpanded = mobileExpanded === cat.id;

                return (
                  <div key={cat.slug}>
                    {subs.length === 0 ? (
                      <Link to={`/category/${cat.slug}`}>
                        <span
                          className="block py-2 text-[13px] font-medium tracking-[0.15em] uppercase text-[#A0A0A0] hover:text-white cursor-pointer transition-colors"
                          onClick={closeAll}
                        >
                          {cat.name}
                        </span>
                      </Link>
                    ) : (
                      <div>
                        {/* Category row — name links, chevron expands subs */}
                        <div className="flex items-center justify-between py-2">
                          <Link to={`/category/${cat.slug}`}>
                            <span
                              className="text-[13px] font-medium tracking-[0.15em] uppercase text-[#F0F0F0] hover:text-white cursor-pointer transition-colors"
                              onClick={closeAll}
                            >
                              {cat.name}
                            </span>
                          </Link>
                          <button
                            className="pl-4 text-[#5A5A5A]"
                            onClick={() => setMobileExpanded(isExpanded ? null : cat.id)}
                          >
                            <ChevronDown
                              size={12}
                              className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="flex flex-col gap-1 pl-4 border-l border-[#2A2A2A] mb-2">
                            {subs.map((sub) => (
                              <Link key={sub.slug} to={`/category/${cat.slug}?sub=${sub.slug}`}>
                                <span
                                  className="block py-1.5 text-[12px] font-medium tracking-[0.12em] uppercase text-[#5A5A5A] hover:text-[#C8A96E] cursor-pointer transition-colors"
                                  onClick={closeAll}
                                >
                                  {sub.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="h-px bg-[#2A2A2A]" />

          {staticLinks.map((l) => (
            <Link key={l.to} to={l.to}>
              <span
                className="text-[13px] font-medium tracking-[0.15em] uppercase text-[#A0A0A0] hover:text-white cursor-pointer transition-colors"
                onClick={closeAll}
              >
                {l.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
