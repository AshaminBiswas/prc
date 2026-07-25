import { useState, useRef, useEffect } from "react";
import { ProtectedLogo } from "@/components/prch/ProtectedLogo";
import { Download, Award, CheckCircle2, RefreshCw, Loader2, User, Calendar, Globe } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export type CertificateData = {
  customerName: string;
  orderId: string;
  projectSite: string;
  hardwareCategory: string;
  issueDate: string;
  certNumber: string;
};

export function WarrantyCertificateGenerator() {
  const printRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [formData, setFormData] = useState({
    customerName: "",
    orderId: "",
    projectSite: "",
    hardwareCategory: "SS304 Cubicle & Toilet Partition Fittings",
    issueDate: new Date().toISOString().slice(0, 10),
  });

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [downloading, setDownloading] = useState(false);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.customerName || !formData.orderId) {
      toast.error("Please fill in Customer Name and Order ID.");
      return;
    }

    const certNum = `PRC-WC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    setCertificate({
      customerName: formData.customerName,
      orderId: formData.orderId,
      projectSite: formData.projectSite || "Pan-India Installation",
      hardwareCategory: formData.hardwareCategory,
      issueDate: formData.issueDate,
      certNumber: certNum,
    });

    toast.success("Warranty Certificate generated successfully!");
  }

  async function handleDownloadPdf() {
    if (!printRef.current || !certificate) return;
    setDownloading(true);
    const toastId = toast.loading("Generating Ultra-HD PDF certificate...");

    try {
      const element = printRef.current;

      // Render native vector DOM tree to Ultra-HD PNG via browser engine (html-to-image)
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 4, // 384 DPI Ultra HD Crisp Zoom
        backgroundColor: "#fcfcfb",
        cacheBust: true,
        fontEmbedCSS: "",
        skipFonts: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const imgWidth = 210; // A4 width mm
      const imgHeight = (element.offsetHeight * imgWidth) / element.offsetWidth;

      pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");

      const fileName = `PRC-Warranty-Certificate-${certificate.certNumber}.pdf`;
      pdf.save(fileName);
      if (isMounted.current) {
        toast.success(`Downloaded ${fileName}`, { id: toastId });
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      if (isMounted.current) {
        toast.error("Failed to generate PDF. Please try again.", { id: toastId });
      }
    } finally {
      if (isMounted.current) {
        setDownloading(false);
      }
    }
  }

  return (
    <div className="w-full">
      {/* 1. Input Form Section */}
      {!certificate ? (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-lg">
          <div className="flex items-center gap-3 border-b border-border/70 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-medium text-foreground">
                Generate Official PRC Warranty Certificate
              </h3>
              <p className="text-xs text-muted-foreground">
                Enter project details to generate an official PRC 2-Year Universal Warranty Certificate.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Client / Customer Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ashamin Biswas"
                  value={formData.customerName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Order ID / Invoice Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PRC-2026-9D2D32EW"
                  value={formData.orderId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, orderId: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Project Site / Installation Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delhi"
                  value={formData.projectSite}
                  onChange={(e) => setFormData((prev) => ({ ...prev, projectSite: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Hardware Category
                </label>
                <select
                  value={formData.hardwareCategory}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hardwareCategory: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground transition-colors cursor-pointer"
                >
                  <option value="SS304 Cubicle & Toilet Partition Fittings">SS304 Cubicle & Toilet Partition Fittings</option>
                  <option value="Solid Brass Indicator Locks & Hinges">Solid Brass Indicator Locks & Hinges</option>
                  <option value="Anodised Aluminium Architectural Profiles">Anodised Aluminium Architectural Profiles</option>
                  <option value="Complete Partition Hardware Package">Complete Partition Hardware Package</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-xs font-semibold uppercase tracking-[0.24em] text-background transition-all hover:opacity-95 active:scale-98 shadow-md"
            >
              <Award className="h-4 w-4 text-amber-400" />
              Generate Certificate
            </button>
          </form>
        </div>
      ) : (
        /* 2. Official Printable Certificate Render */
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm print:hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Certificate Issued: <span className="font-mono text-foreground">{certificate.certNumber}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCertificate(null)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Edit Details
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-background transition-all hover:opacity-90 active:scale-95 shadow-md disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* LUXURY CERTIFICATE CONTAINER MATCHING REFERENCE DESIGN */}
          <div
            ref={printRef}
            className="certificate-print-area relative mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-zinc-300 p-8 sm:p-12 md:p-14 text-slate-800 shadow-2xl print:border-0 print:p-8 print:shadow-none"
            style={{
              color: "#1e293b",
              backgroundColor: "#fcfcfb",
            }}
          >
            {/* TOP-LEFT GOLDEN LUXURY DIAGONAL BANNER CORNER */}
            <div className="absolute top-0 left-0 w-36 h-36 pointer-events-none select-none z-20">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="goldGradTL" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8A641A" />
                    <stop offset="35%" stopColor="#E6C46E" />
                    <stop offset="70%" stopColor="#F5E4A8" />
                    <stop offset="100%" stopColor="#B38928" />
                  </linearGradient>
                  <linearGradient id="darkGradTL" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0B132B" />
                    <stop offset="100%" stopColor="#1C2541" />
                  </linearGradient>
                </defs>
                <polygon points="0,0 100,0 0,100" fill="url(#goldGradTL)" />
                <polygon points="0,0 72,0 0,72" fill="url(#darkGradTL)" />
              </svg>
            </div>

            {/* BOTTOM-RIGHT GOLDEN LUXURY DIAGONAL BANNER CORNER */}
            <div className="absolute bottom-0 right-0 w-36 h-36 pointer-events-none select-none z-20">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="goldGradBR" x1="100%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#8A641A" />
                    <stop offset="35%" stopColor="#E6C46E" />
                    <stop offset="70%" stopColor="#F5E4A8" />
                    <stop offset="100%" stopColor="#B38928" />
                  </linearGradient>
                  <linearGradient id="darkGradBR" x1="100%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#0B132B" />
                    <stop offset="100%" stopColor="#1C2541" />
                  </linearGradient>
                </defs>
                <polygon points="100,100 0,100 100,0" fill="url(#goldGradBR)" />
                <polygon points="100,100 28,100 100,28" fill="url(#darkGradBR)" />
              </svg>
            </div>

            {/* TOP RIGHT CORNER VERIFICATION QR CODE CARD (BORDERLESS) */}
            <div
              className="absolute right-6 sm:right-10 top-6 sm:top-10 z-30 flex flex-col items-center bg-white p-2.5 rounded-2xl shadow-xs"
              style={{ backgroundColor: "#ffffff", border: "none" }}
            >
              <QRCodeSVG
                value={`https://prchardware.com/warranty?cert=${certificate.certNumber}`}
                size={74}
                level="H"
                includeMargin={false}
              />
              <span
                className="text-[8px] font-mono font-bold block text-center mt-1.5 uppercase tracking-tighter"
                style={{ color: "#475569" }}
              >
                SCAN TO VERIFY
              </span>
            </div>

            {/* HEADER AREA: LOGO, BRAND EYEBROW & CERTIFICATE TITLE */}
            <div className="relative z-10 text-center pr-16 sm:pr-24 pl-8">
              <ProtectedLogo className="mx-auto h-16 sm:h-20 w-auto object-contain mb-3" />

              {/* Eyebrow with decorative gold lines */}
              <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
                <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c49a45]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.32em]" style={{ color: "#b8860b" }}>
                  PRC PRECISION HARDWARE
                </p>
                <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c49a45]" />
              </div>

              {/* Main Title */}
              <h1
                className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight uppercase"
                style={{ color: "#0f172a", lineHeight: 1.15 }}
              >
                CERTIFICATE OF<br />2-YEAR WARRANTY
              </h1>

              {/* Diamond Divider */}
              <div className="flex items-center justify-center gap-2 mt-3 mb-2" style={{ color: "#c49a45" }}>
                <span className="h-[1px] w-24 bg-[#e2b857]/50" />
                <span className="text-xs">❖</span>
                <span className="h-[1px] w-24 bg-[#e2b857]/50" />
              </div>

              {/* Serial & Intro */}
              <p className="text-[11px] font-mono tracking-widest mt-2" style={{ color: "#64748b" }}>
                CERTIFICATE SERIAL NO.: <strong style={{ color: "#0f172a" }}>{certificate.certNumber}</strong>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] mt-3" style={{ color: "#64748b" }}>
                THIS OFFICIAL CERTIFICATE HEREBY VERIFIES THAT
              </p>
            </div>

            {/* LUXURY BLACK RIBBON BANNER FOR CUSTOMER NAME */}
            <div
              className="relative z-10 mx-auto my-6 max-w-xl rounded-xl p-4 sm:p-5 text-center shadow-xl border border-[#d4af37]/70"
              style={{
                backgroundColor: "#0f172a",
                backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              }}
            >
              <div className="flex flex-col items-center justify-center">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full border mb-1.5 shadow-sm"
                  style={{ borderColor: "#d4af37", backgroundColor: "#1e293b", color: "#e2b857" }}
                >
                  <User className="h-5 w-5" />
                </div>
                <h2
                  className="font-serif text-2xl sm:text-3xl font-bold tracking-wide"
                  style={{ color: "#e2b857" }}
                >
                  {certificate.customerName}
                </h2>
                <p className="text-xs mt-1 font-sans" style={{ color: "#e2e8f0" }}>
                  Project Site: <strong className="text-white">{certificate.projectSite}</strong>
                </p>
              </div>
            </div>

            {/* GRANT TEXT */}
            <div className="relative z-10 text-center max-w-2xl mx-auto space-y-4">
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#334155" }}>
                is granted an official <strong style={{ color: "#000000" }}>PRC 2-Year Universal Replacement Guarantee</strong> covering all supplied <strong style={{ color: "#000000" }}>{certificate.hardwareCategory}</strong> under Invoice / Order ID <strong style={{ color: "#000000" }}>{certificate.orderId}</strong>.
              </p>

              {/* WARRANTY TERMS BOX WITH 2-YEAR GOLD SHIELD BADGE */}
              <div
                className="rounded-2xl border p-4 text-left text-xs shadow-xs flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
                style={{
                  backgroundColor: "#fdfbf7",
                  borderColor: "#e5d5b5",
                }}
              >
                {/* 3D GOLD SHIELD EMBLEM */}
                <div className="shrink-0 flex flex-col items-center justify-center p-2">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                      <defs>
                        <linearGradient id="shieldGold" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#1E293B" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </linearGradient>
                        <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#B38928" />
                          <stop offset="50%" stopColor="#F5E4A8" />
                          <stop offset="100%" stopColor="#8A641A" />
                        </linearGradient>
                      </defs>

                      {/* Shield Outer Border */}
                      <path d="M50 5 L85 20 V50 C85 72 50 92 50 92 C50 92 15 72 15 50 V20 Z" fill="url(#goldBorder)" />
                      {/* Shield Inner */}
                      <path d="M50 9 L80 23 V49 C80 69 50 87 50 87 C50 87 20 69 20 49 V23 Z" fill="url(#shieldGold)" />

                      {/* Golden Laurel Wreath Overlay */}
                      <circle cx="50" cy="45" r="28" fill="none" stroke="#E6C46E" strokeWidth="1.5" strokeDasharray="3 3" />
                      <text x="50" y="44" textAnchor="middle" fill="#E6C46E" fontSize="22" fontWeight="bold" fontFamily="serif">2</text>
                      <text x="50" y="58" textAnchor="middle" fill="#E6C46E" fontSize="9" fontWeight="bold" letterSpacing="1">YEAR</text>
                    </svg>
                  </div>
                </div>

                {/* TERMS LIST */}
                <div className="space-y-2 text-slate-700">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs" style={{ color: "#b8860b" }}>
                    PRC 2-YEAR WARRANTY TERMS & GUARANTEE:
                  </div>
                  <ul className="space-y-1.5 text-[11px]" style={{ color: "#334155" }}>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#b8860b" }} />
                      <span><strong>100% Free Replacement:</strong> Covers structural cracking, mechanical hinge failure & indicator bolt defects.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#b8860b" }} />
                      <span><strong>Anti-Corrosion Shield:</strong> 48-hour salt spray tested against rust and oxidation in wet restrooms.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#b8860b" }} />
                      <span><strong>Coverage Validity:</strong> 24 Months from Issue Date ({certificate.issueDate}).</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FOOTER ROW: DATE, MEDALLION SEAL, AUTHORIZED SIGNATURE IN A SINGLE LINE */}
            <div
              className="relative z-10 mt-8 flex flex-row items-center justify-between gap-4 border-t pt-6 text-xs"
              style={{ borderColor: "#e2e8f0", color: "#475569" }}
            >
              {/* DATE OF ISSUE */}
              <div className="flex items-center gap-3 w-1/3 justify-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-xs">
                  <Calendar className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>DATE OF ISSUE</p>
                  <p className="font-mono text-sm font-bold mt-0.5" style={{ color: "#0f172a" }}>{certificate.issueDate}</p>
                  <p className="text-[10px]" style={{ color: "#64748b" }}>PRC Hardware Division</p>
                </div>
              </div>

              {/* GOLD MEDALLION STAMP SEAL */}
              <div className="flex flex-col items-center justify-center text-center w-1/3">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                    <defs>
                      <linearGradient id="medallionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8A641A" />
                        <stop offset="50%" stopColor="#F5E4A8" />
                        <stop offset="100%" stopColor="#B38928" />
                      </linearGradient>
                    </defs>
                    {/* Outer Serrated Star Ring */}
                    <circle cx="50" cy="50" r="48" fill="url(#medallionGrad)" />
                    <circle cx="50" cy="50" r="42" fill="#ffffff" stroke="#B38928" strokeWidth="1.5" />
                    <circle cx="50" cy="50" r="36" fill="none" stroke="#B38928" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Circular Text */}
                    <path id="circlePath" d="M 20, 50 a 30,30 0 1,1 60,0 a 30,30 0 1,1 -60,0" fill="none" />
                    <text fontSize="6.5" fontWeight="bold" fill="#8A641A" letterSpacing="0.8">
                      <textPath href="#circlePath" startOffset="50%" textAnchor="middle">
                        PRC PRECISION HARDWARE
                      </textPath>
                    </text>

                    {/* Center Text */}
                    <text x="50" y="52" textAnchor="middle" fill="#0F172A" fontSize="13" fontWeight="900" fontFamily="sans-serif">PRC</text>
                    <text x="50" y="62" textAnchor="middle" fill="#8A641A" fontSize="5" fontWeight="bold" letterSpacing="0.5">QUALITY ASSURED</text>
                  </svg>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: "#475569" }}>
                  OFFICIAL SEAL
                </span>
              </div>

              {/* AUTHORIZED SIGNATURE */}
              <div className="flex flex-col items-end justify-center text-right w-1/3">
                <div className="relative h-16 w-44 sm:w-52">
                  <img
                    src="/authorized_signature.png"
                    alt="Authorized Signature"
                    className="h-full w-full object-contain ml-auto scale-110"
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "#475569" }}>
                  AUTHORIZED SIGNATORY
                </p>
                <p className="text-[9px]" style={{ color: "#64748b" }}>PRC Hardware Quality Desk</p>
              </div>
            </div>

            {/* TERMS & CONDITIONS FOOTER BAR */}
            <div
              className="relative z-10 mt-6 border-t pt-3 text-center text-[10px] space-y-1.5"
              style={{ borderColor: "#e2e8f0", color: "#64748b" }}
            >
              <p>Warranty Coverage & Claim Policy is governed by official PRC Terms & Conditions.</p>
              <div className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1 bg-white text-[#0f172a] shadow-2xs font-medium" style={{ borderColor: "#cbd5e1" }}>
                <Globe className="h-3 w-3 text-amber-600" />
                <a
                  href="https://prchardware.com/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-semibold"
                >
                  https://prchardware.com/terms-and-conditions
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
