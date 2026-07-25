import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, MapPin, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

type Address = {
  id: string;
  full_name: string;
  phone: string;
  alt_phone: string | null;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pin_code: string;
  country: string;
  is_default: boolean;
};

const empty: Omit<Address, "id"> = {
  full_name: "",
  phone: "",
  alt_phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pin_code: "",
  country: "India",
  is_default: false,
};

export const Route = createFileRoute("/account/$accountId/addresses")({
  component: AddressesTab,
});

function AddressesTab() {
  const { profile } = useAccount();
  const [list, setList] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Omit<Address, "id">>(empty);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", profile.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setList((data as unknown as Address[]) ?? []);
  }

  useEffect(() => {
    void load();
  }, [profile.id]);

  function startNew() {
    setEditing(null);
    setForm({
      ...empty,
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
    });
    setShowForm(true);
  }
  function startEdit(a: Address) {
    setEditing(a);
    setForm({ ...a });
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const full_name = (form.full_name || profile.full_name || "").trim();
    const phone = (form.phone || profile.phone || "").trim();
    const line1 = (form.line1 || "").trim();
    const city = (form.city || "").trim();
    const state = (form.state || "State").trim();
    const pin_code = (form.pin_code || "").trim();

    if (!full_name) return toast.error("Please enter full name");
    if (!phone) return toast.error("Please enter phone number");
    if (!line1) return toast.error("Please enter address line 1");
    if (!city) return toast.error("Please enter city");
    if (!pin_code) return toast.error("Please enter PIN code");

    const payload = {
      full_name,
      phone,
      alt_phone: form.alt_phone?.trim() || null,
      line1,
      line2: form.line2?.trim() || null,
      landmark: form.landmark?.trim() || null,
      city,
      state: state || "State",
      pin_code,
      country: form.country?.trim() || "India",
      is_default: form.is_default,
    };

    setSaving(true);
    if (form.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", profile.id);
    }
    if (editing) {
      const { error } = await supabase.from("addresses").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Address updated");
    } else {
      const { error } = await supabase.from("addresses").insert({ ...payload, user_id: profile.id });
      if (error) toast.error(error.message);
      else toast.success("Address added");
    }
    setSaving(false);
    setShowForm(false);
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this address?")) return;
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      await load();
    }
  }

  async function setDefault(id: string) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", profile.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    toast.success("Default updated");
    await load();
  }

  if (!list) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Saved Addresses</h2>
        <Button onClick={startNew}>
          <Plus className="mr-2 h-4 w-4" /> Add address
        </Button>
      </div>

      {showForm && (
        <form onSubmit={save} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-serif text-lg">{editing ? "Edit" : "New"} address</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
            <Field label="Alternate phone" value={form.alt_phone ?? ""} onChange={(v) => setForm({ ...form, alt_phone: v })} />
            <Field label="Landmark" value={form.landmark ?? ""} onChange={(v) => setForm({ ...form, landmark: v })} />
            <Field label="Address line 1" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} required span={2} />
            <Field label="Address line 2" value={form.line2 ?? ""} onChange={(v) => setForm({ ...form, line2: v })} span={2} />
            <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
            <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} required />
            <Field label="PIN code" value={form.pin_code} onChange={(v) => setForm({ ...form, pin_code: v })} required />
            <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              />
              Set as default
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Add"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {list.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No addresses yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">{a.full_name}</p>
                {a.is_default && (
                  <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] uppercase tracking-widest text-background">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {a.line1}
                {a.line2 && `, ${a.line2}`}
                {a.landmark && `, ${a.landmark}`}<br />
                {a.city}, {a.state} — {a.pin_code}<br />
                {a.country}<br />
                📞 {a.phone}
                {a.alt_phone && ` · ${a.alt_phone}`}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(a)}>
                  Edit
                </Button>
                {!a.is_default && (
                  <Button size="sm" variant="ghost" onClick={() => setDefault(a.id)}>
                    <Star className="mr-1 h-3 w-3" /> Set default
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  span,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  span?: number;
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <Label>{label}{required && " *"}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}
