import { Link } from "wouter";
import { HeroSlideshow } from "../components/hero-slideshow";

export default function IndexPage() {
  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      {/* Full-screen hero slideshow */}
      <HeroSlideshow />

      {/* Footer */}
      <footer className="border-t border-[#2A2A2A] py-10 sm:py-12">
        <div className="max-w-[2560px] mx-auto px-5 sm:px-8 lg:px-12 2xl:px-20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display text-base sm:text-lg text-[#F0F0F0]">photos by George</p>
          <p className="text-xs text-[#5A5A5A] tracking-widest uppercase">
            © {new Date().getFullYear()} All rights reserved
          </p>
          <Link to="/admin">
            <span className="text-xs text-[#5A5A5A] hover:text-[#A0A0A0] transition-colors cursor-pointer tracking-widest uppercase">
              Admin
            </span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
