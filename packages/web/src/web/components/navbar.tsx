import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

const CATEGORIES = [
  { name: "Portraits", slug: "portraits" },
  { name: "Family", slug: "family" },
  { name: "Street", slug: "street" },
  { name: "Travel", slug: "travel" },
  { name: "Seniors", slug: "seniors" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const isHome = location === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const textColor = isHome && !scrolled ? "text-white" : "text-[#0A0A0A]";
  const bgClass = scrolled || !isHome
    ? "bg-white border-b border-[#E5E5E5]"
    : "bg-transparent";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClass}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Site name */}
        <Link to="/">
          <span className={`font-display text-xl font-semibold tracking-tight cursor-pointer transition-colors duration-300 ${textColor}`}>
            photos by George
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} to={`/category/${cat.slug}`}>
              <span className={`nav-link text-xs font-medium tracking-[0.15em] uppercase cursor-pointer transition-colors duration-300 ${textColor}`}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          className={`md:hidden flex flex-col gap-1.5 transition-colors duration-300 ${textColor}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E5E5] px-6 py-6 flex flex-col gap-5">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} to={`/category/${cat.slug}`}>
              <span
                className="text-xs font-medium tracking-[0.15em] uppercase text-[#0A0A0A] cursor-pointer"
                onClick={() => setMenuOpen(false)}
              >
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
