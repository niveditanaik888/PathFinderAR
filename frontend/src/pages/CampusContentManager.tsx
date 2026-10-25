import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Download, ImagePlus, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import React, { ChangeEvent, useMemo, useState } from "react";

type MediaSlot = "hero" | "showcase" | "building" | "destination";
type MediaDraft = { slot: MediaSlot; title: string; altText: string; caption: string; sortOrder: number; isActive: boolean };
const emptyMedia: MediaDraft = { slot: "building", title: "", altText: "", caption: "", sortOrder: 0, isActive: true };

function readBase64(file: File, onProgress?: (percent: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.onprogress = event => { if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100)); };
    reader.onload = () => { onProgress?.(100); resolve(String(reader.result).split(",")[1] ?? ""); };
    reader.readAsDataURL(file);
  });
}

export default function CampusContentManager() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const media = trpc.admin.media.useQuery(undefined, { enabled: user?.role === "admin" });
  const auditLogs = trpc.admin.auditLogs.useQuery({ entityType: "campus-media", limit: 200 }, { enabled: user?.role === "admin" });
  const uploadMedia = trpc.admin.uploadMedia.useMutation({ onSuccess: async () => { setNotice("Campus image uploaded and stored as an administrator-controlled asset."); setMediaDraft(emptyMedia); await utils.admin.media.invalidate(); await utils.admin.auditLogs.invalidate(); } });
  const deleteMedia = trpc.admin.deleteMedia.useMutation({ onSuccess: async () => { await utils.admin.media.invalidate(); await utils.admin.auditLogs.invalidate(); } });
  const [mediaDraft, setMediaDraft] = useState(emptyMedia);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [slotFilter, setSlotFilter] = useState<MediaSlot | "all">("all");
  const filteredMedia = useMemo(() => (media.data ?? []).filter(item => slotFilter === "all" || item.slot === slotFilter), [media.data, slotFilter]);
  const exportAuditLogs = () => {
    const rows = auditLogs.data ?? [];
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = ["id,actorUserId,action,entityType,entityId,metadata,createdAt", ...rows.map(row => [row.id, row.actorUserId, row.action, row.entityType, row.entityId, row.metadata, row.createdAt.toISOString()].map(escape).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `pathfinder-media-audit-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setUploading(true); setUploadProgress(0);
    try {
      if (!( ["image/jpeg", "image/png", "image/webp"] as string[]).includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("Choose a JPG, PNG, or WebP image no larger than 5 MB.");
      if (!mediaDraft.title.trim() || !mediaDraft.altText.trim()) throw new Error("Add an image title and accessibility description first.");
      await uploadMedia.mutateAsync({ ...mediaDraft, imageBase64: await readBase64(file, setUploadProgress), mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" });
    } catch (error) { setNotice(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); setUploadProgress(0); event.target.value = ""; }
  };
  if (loading) return <DashboardLayout><div className="p-8 text-sm text-muted-foreground">Loading administrator workspace…</div></DashboardLayout>;
  if (user?.role !== "admin") return <DashboardLayout><div className="mx-auto max-w-xl p-10 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" /><h1 className="mt-4 text-xl font-bold">Administrator access required</h1><p className="mt-2 text-sm text-muted-foreground">Only authorised campus administrators can manage published campus imagery.</p></div></DashboardLayout>;
  return <DashboardLayout><main className="space-y-6 p-4 sm:p-6"><header><div className="flex flex-wrap gap-2"><Badge variant="outline"><ImagePlus className="mr-1.5 h-3.5 w-3.5" />Campus imagery workspace</Badge><Badge variant="outline">{filteredMedia.length} matching images</Badge></div><h1 className="mt-3 font-display text-3xl font-bold">Campus content management</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Manage approved AIET photographs used across the homepage, destination pages, and visual orientation. No model or floor-plan assets are managed here.</p></header>{notice && <div role="status" className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 p-4 text-sm text-cyan-950">{notice}<button className="ml-3 underline" onClick={() => setNotice(null)}>Dismiss</button></div>}{uploading && <div role="status" className="rounded-xl border border-cyan-400/25 bg-cyan-50 p-4 text-sm text-cyan-950"><div className="flex items-center justify-between"><span>Preparing image for server validation…</span><strong>{uploadProgress}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-cyan-100"><div className="h-full bg-cyan-600 transition-[width]" style={{ width: `${uploadProgress}%` }} /></div></div>}<section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><article className="rounded-2xl border bg-card p-5 shadow-sm"><h2 className="font-semibold">Upload campus photograph</h2><p className="mt-1 text-sm text-muted-foreground">Server-side byte validation, administrator authorization, and audit logging remain active.</p><div className="mt-5 space-y-3"><label className="grid gap-1 text-sm font-medium">Content slot<select value={mediaDraft.slot} onChange={event => setMediaDraft({ ...mediaDraft, slot: event.target.value as MediaSlot })} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="hero">Homepage hero</option><option value="showcase">Homepage showcase</option><option value="building">Building</option><option value="destination">Destination</option></select></label><Input value={mediaDraft.title} onChange={event => setMediaDraft({ ...mediaDraft, title: event.target.value })} placeholder="Image title" /><Input value={mediaDraft.altText} onChange={event => setMediaDraft({ ...mediaDraft, altText: event.target.value })} placeholder="Accessibility description" /><Input value={mediaDraft.caption} onChange={event => setMediaDraft({ ...mediaDraft, caption: event.target.value })} placeholder="Caption (optional)" /><Input type="number" value={mediaDraft.sortOrder} onChange={event => setMediaDraft({ ...mediaDraft, sortOrder: Number(event.target.value) })} placeholder="Sort order" /><label className="grid min-h-28 cursor-pointer place-items-center rounded-xl border border-dashed border-cyan-700/40 p-4 text-center"><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadFile} /><span><UploadCloud className="mx-auto h-6 w-6 text-cyan-700" /><span className="mt-2 block text-sm font-semibold">Choose image</span><span className="mt-1 block text-xs text-muted-foreground">JPG, PNG, or WebP · maximum 5 MB</span></span></label></div></article><article className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Published image registry</h2><p className="mt-1 text-sm text-muted-foreground">Only campus media is listed in this workspace.</p></div><select aria-label="Filter campus media by slot" value={slotFilter} onChange={event => setSlotFilter(event.target.value as MediaSlot | "all")} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All slots</option><option value="hero">Hero</option><option value="showcase">Showcase</option><option value="building">Building</option><option value="destination">Destination</option></select></div><div className="mt-4 space-y-3">{media.isLoading ? <p className="text-sm text-muted-foreground">Loading image registry…</p> : filteredMedia.length ? filteredMedia.map(item => <div key={item.id} className="flex items-center gap-3 rounded-xl border p-3"><img src={item.mediaUrl} alt={item.altText} className="h-16 w-20 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.slot} · {item.isActive ? "active" : "inactive"}</p></div><Button variant="ghost" size="icon" aria-label={`Delete ${item.title}`} onClick={() => deleteMedia.mutate({ mediaId: item.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>) : <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No campus images match this filter.</p>}</div></article></section><section className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Campus-media audit log</h2><p className="mt-1 text-sm text-muted-foreground">Administrator-only, redacted upload and deletion history.</p></div><Button variant="outline" size="sm" onClick={exportAuditLogs} disabled={!auditLogs.data?.length}><Download className="mr-2 h-4 w-4" />Export CSV</Button></div><div className="mt-4 overflow-x-auto rounded-xl border"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Time</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Actor</th><th className="px-3 py-2">Metadata</th></tr></thead><tbody>{auditLogs.data?.length ? auditLogs.data.map(row => <tr key={row.id} className="border-t"><td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">{row.createdAt.toLocaleString()}</td><td className="px-3 py-3"><Badge variant="outline">{row.action}</Badge></td><td className="px-3 py-3">#{row.actorUserId}</td><td className="max-w-[360px] truncate px-3 py-3 text-xs text-muted-foreground">{row.metadata ?? "—"}</td></tr>) : <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No campus-media audit events yet.</td></tr>}</tbody></table></div></section></main></DashboardLayout>;
}
