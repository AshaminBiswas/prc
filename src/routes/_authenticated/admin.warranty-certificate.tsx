import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/AdminUI";
import { WarrantyCertificateGenerator } from "@/components/prch/WarrantyCertificateGenerator";
import { Award, ShieldCheck, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/warranty-certificate")({
  component: AdminWarrantyCertificatePage,
  head: () => ({
    meta: [
      { title: "Generate Warranty Certificate — Admin Panel" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AdminWarrantyCertificatePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Warranty Certificate Generator"
        description="Issue official PRC 2-Year Warranty Certificates for clients, architects, and commercial projects."
        actions={
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <Award className="h-4 w-4 text-amber-500" />
            Admin Exclusive Portal
          </div>
        }
      />

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-700 dark:text-blue-300">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
          Official Certification Guidelines:
        </div>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-blue-600/90 dark:text-blue-300/90">
          <li>Warranty certificates are issued exclusively by authorized PRC administrators.</li>
          <li>Enter the customer's name, Order ID / Invoice number, and installation location.</li>
          <li>Click <strong>Generate Certificate</strong> to preview and print an official gold-bordered A4 certificate.</li>
        </ul>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <WarrantyCertificateGenerator />
      </div>
    </div>
  );
}
