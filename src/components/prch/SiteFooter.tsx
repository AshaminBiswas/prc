import { Instagram, Linkedin, Facebook, Youtube, ArrowRight } from "lucide-react";
import { ProtectedLogo } from "./ProtectedLogo";

const columns = [
  {
    title: "Products",
    links: ["Cubicle Hardware", "Locker Hardware", "Toilet Partition Hardware", "New Arrivals"],
    hrefs: [
      "/category/cubicle-hardware",
      "/category/locker-hardware",
      "/category/toilet-partition-hardware",
      "/new-arrivals",
    ],
  },
  {
    title: "Materials",
    links: ["Stainless Steel", "Aluminium Hardware", "Nylon Hardware", "Custom Finish"],
    hrefs: [
      "/material/stainless-steel",
      "/material/aluminium-hardware",
      "/material/nylon-hardware",
      "/contact",
    ],
  },
  {
    title: "Company",
    links: ["About PRC", "Manufacturing", "Projects", "Contact"],
    hrefs: ["/about", "#", "/projects", "/contact"],
  },
  {
    title: "Support",
    links: ["Bulk Enquiry", "Downloads", "Warranty", "Shipping"],
    hrefs: ["/book-appointment", "#", "/warranty", "/shipping"],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-black bg-black text-[#F6EBD5]">
      <div className="px-5 py-16 md:px-10 md:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <ProtectedLogo className="h-14 w-auto object-contain" />
            <p className="mt-4 max-w-xs text-sm text-[#F6EBD5]/80">
              Precision hardware for cubicles, lockers and toilet partitions.
              Engineered in India, installed worldwide.
            </p>
            <form className="mt-8 flex max-w-xs items-center border-b border-[#F6EBD5]/40 pb-2">
              <input
                type="email"
                placeholder="Enquiry email"
                suppressHydrationWarning
                className="flex-1 bg-transparent text-sm placeholder:text-[#F6EBD5]/50 text-[#F6EBD5] focus:outline-none"
              />
              <button aria-label="Submit" suppressHydrationWarning className="ml-2 text-[#F6EBD5]/80 hover:text-[#F6EBD5] transition-colors">
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <p className="mb-4 text-[11px] uppercase tracking-[0.28em] text-[#F6EBD5]/70 font-semibold">
                {c.title}
              </p>
              <ul className="space-y-2.5">
                {c.links.map((l, i) => {
                  const href = ("hrefs" in c && Array.isArray(c.hrefs) ? c.hrefs[i] : undefined) ?? "#";
                  return (
                    <li key={l}>
                      <a href={href} className="text-sm text-[#F6EBD5]/85 transition-colors hover:text-[#F6EBD5]">
                        {l}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col-reverse items-start justify-between gap-6 border-t border-[#F6EBD5]/20 pt-6 md:flex-row md:items-center">
          <p className="text-xs text-[#F6EBD5]/60">
            © {new Date().getFullYear()} PRC Hardware. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-[#F6EBD5]/80">
            <a href="#" aria-label="Instagram" className="transition-colors hover:text-[#F6EBD5]">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="transition-colors hover:text-[#F6EBD5]">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Facebook" className="transition-colors hover:text-[#F6EBD5]">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="YouTube" className="transition-colors hover:text-[#F6EBD5]">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
