import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, MapPin, User } from "lucide-react";

export default function ContactPage() {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json() as Promise<{ settings: Record<string, string> }>;
    },
  });

  const s = data?.settings ?? {};

  const fields = [
    { icon: User,   label: "Name",    value: s.contact_name },
    { icon: MapPin, label: "Address", value: s.contact_address },
    { icon: Mail,   label: "Email",   value: s.contact_email,
      href: s.contact_email ? `mailto:${s.contact_email}` : undefined },
    { icon: Phone,  label: "Phone",   value: s.contact_phone,
      href: s.contact_phone ? `tel:${s.contact_phone.replace(/\s/g, "")}` : undefined },
  ].filter((f) => f.value);

  return (
    <div className="min-h-screen bg-[#0A0A0A]" style={{ paddingTop: "clamp(56px, 4vw, 64px)" }}>
      {/* Header */}
      <div className="pt-8 sm:pt-12 pb-10 sm:pb-14 px-5 sm:px-8 lg:px-12 2xl:px-20 max-w-[2560px] mx-auto">
        <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#5A5A5A] font-medium mb-3">Get in touch</p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-semibold text-[#F0F0F0]">Contact</h1>
        <div className="w-12 h-px bg-[#C8A96E] mt-4 sm:mt-6" />
      </div>

      {/* Contact details */}
      <div className="px-5 sm:px-8 lg:px-12 2xl:px-20 max-w-[2560px] mx-auto pb-24">
        {fields.length === 0 ? (
          <p className="text-[#5A5A5A] text-sm">Contact details not yet configured.</p>
        ) : (
          <div className="flex flex-col gap-6 sm:gap-8 max-w-lg">
            {fields.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4 sm:gap-5">
                <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-full border border-[#2A2A2A] flex items-center justify-center">
                  <Icon size={15} className="text-[#C8A96E]" />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-[#5A5A5A] font-medium mb-1">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      className="text-[#F0F0F0] text-base sm:text-lg hover:text-[#C8A96E] transition-colors"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-[#F0F0F0] text-base sm:text-lg">{value}</p>
                  )}
                </div>
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
    </div>
  );
}
