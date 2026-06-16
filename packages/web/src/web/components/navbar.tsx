import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { X, Menu, ChevronDown } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const isHome = location === "/";

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

  const categories: { id: number; name: string; slug: string }[] = data?.categories ?? [];

  const bgClass = scrolled || !isHome || menuOpen
    ? "bg-[#0A0A0A] border-b border-[#2A2A2A]"
    : "bg-transparent";

  const staticLinks = [
    { label: "Availability", to: "/availability" },
    { label: "Contact", to: "/contact" },
  ];

  const navLinkClass = "nav-link text-[13px] font-medium tracking-[0.15em] uppercase text-[#A0A0A0] hover:text-white cursor-pointer transition-colors duration-200";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClass}`}>
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between">

        {/* Site name */}
        <Link to="/" onClick={() => setMenuOpen(false)}>
          <span className="font-display text-lg sm:text-xl font-semibold tracking-tight text-white cursor-pointer">
            photos by George
          </span>
        </Link>

        {/* Desktop nav — all items in one flat row */}
        <div className="hidden md:flex items-center gap-8">

          {/* Portfolio — hover dropdown, no chevron */}
          <div
            ref={portfolioRef}
            className="relative"
            onMouseEnter={() => setPortfolioOpen(true)}
            onMouseLeave={() => setPortfolioOpen(false)}
          >
            <span className={navLinkClass}>Portfolio</span>
            {portfolioOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/60 backdrop-blur-md border border-white/10 py-4 min-w-[180px] z-50">
                {categories.map((cat) => (
                  <Link key={cat.slug} to={`/category/${cat.slug}`}>
                    <span
                      className="block px-6 py-3 text-[13px] font-medium tracking-[0.15em] uppercase text-[#A0A0A0] hover:text-white hover:bg-white/5 cursor-pointer transition-colors duration-150"
                      onClick={() => setPortfolioOpen(false)}
                    >
                      {cat.name}
                    </span>
                  </Link>
                ))}
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
          {/* Portfolio — tap to expand */}
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
            <div className="flex flex-col gap-4 pl-4 border-l border-[#2A2A2A]">
              {categories.map((cat) => (
                <Link key={cat.slug} to={`/category/${cat.slug}`}>
                  <span
                    className="text-[13px] font-medium tracking-[0.15em] uppercase text-[#A0A0A0] hover:text-white cursor-pointer transition-colors"
                    onClick={() => { setMenuOpen(false); setPortfolioOpen(false); }}
                  >
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="h-px bg-[#2A2A2A]" />
          {staticLinks.map((l) => (
            <Link key={l.to} to={l.to}>
              <span
                className="text-[13px] font-medium tracking-[0.15em] uppercase text-[#A0A0A0] hover:text-white cursor-pointer transition-colors"
                onClick={() => setMenuOpen(false)}
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
