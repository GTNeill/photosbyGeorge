import { useEffect } from "react";

export default function AvailabilityPage() {
  // Load TidyCal embed script once
  useEffect(() => {
    if (document.getElementById("tidycal-script")) return;
    const script = document.createElement("script");
    script.id = "tidycal-script";
    script.src = "https://asset-tidycal.b-cdn.net/js/embed.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // leave script in DOM — safe to keep
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A]" style={{ paddingTop: "clamp(64px, 5vw, 80px)" }}>
      {/* Header */}
      <div className="pt-8 sm:pt-12 pb-10 sm:pb-14 px-5 sm:px-8 lg:px-12 2xl:px-20 max-w-[2560px] mx-auto">
        <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#5A5A5A] font-medium mb-3">Book a session</p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-semibold text-[#F0F0F0]">Availability</h1>
        <div className="w-12 h-px bg-[#C8A96E] mt-4 sm:mt-6" />
      </div>

      {/* TidyCal embed */}
      <div className="px-5 sm:px-8 lg:px-12 2xl:px-20 max-w-[2560px] mx-auto pb-24">
        <div
          className="tidycal-embed"
          data-path="gneill"
          style={{ minHeight: 600 }}
        />
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
    </div>
  );
}
