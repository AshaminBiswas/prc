import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { optimizeImage } from "@/lib/image-optimizer";

export const Route = createFileRoute("/account/$accountId/profile")({
  component: ProfileTab,
});

function ProfileTab() {
  const { profile, email, refresh } = useAccount();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [saving, setSaving] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile updated");
      await refresh();
    }
  }

  async function uploadAvatar(file: File) {
    const optimized = await optimizeImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 });
    const path = `avatars/${profile.id}-${Date.now()}.${optimized.name.split(".").pop() || "webp"}`;
    const { error } = await supabase.storage.from("media").upload(path, optimized, { upsert: true, contentType: optimized.type });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    toast.success("Avatar uploaded — save to apply");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) return toast.error("Password must be at least 8 characters");
    if (newPw !== confirmPw) return toast.error("Passwords don't match");
    setPwSaving(true);
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPw,
    });
    if (verifyErr) {
      setPwSaving(false);
      return toast.error("Current password is incorrect");
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
    const { error } = await supabase.auth.updateUser({ data: { deletion_requested: true } });
    if (error) toast.error(error.message);
    else toast.success("Deletion requested. Our team will process it shortly.");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-6">

        <form onSubmit={save} className="space-y-5">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full border border-border object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted" />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
              className="max-w-xs"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-serif text-xl">Change Password</h2>
        <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Current</Label>
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
          </div>
          <div>
            <Label>New</Label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
          </div>
          <div>
            <Label>Confirm</Label>
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={pwSaving}>
              {pwSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="mb-2 font-serif text-xl text-destructive">Danger Zone</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Delete your account permanently. This cannot be undone.
        </p>
        <Button variant="destructive" onClick={deleteAccount}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete account
        </Button>
      </section>
    </div>
  );
}
