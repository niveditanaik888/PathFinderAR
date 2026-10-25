import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { saveAssistantRouteLaunch } from "@/lib/assistantRouteLaunch";
import { trpc } from "@/lib/trpc";
import { Compass, MapPin, Route, ShieldCheck } from "lucide-react";
import React from "react";
import { useLocation, useRoute } from "wouter";

export default function SharedRoute() {
  const [, params] = useRoute("/shared/:token");
  const [, setLocation] = useLocation();
  const token = params?.token ?? "";
  const route = trpc.sharedRoutes.resolve.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const sharedNote = route.data && "note" in route.data ? route.data.note : undefined;
  const sharedTags = route.data && "tags" in route.data && Array.isArray(route.data.tags) ? route.data.tags : [];
  const openOnMap = () => {
    if (!route.data) return;
    saveAssistantRouteLaunch({ sourceNodeId: route.data.sourceNodeExternalId, destinationId: route.data.destinationExternalId, accessibleOnly: route.data.accessibleOnly, autoStart: false, voiceOn: false, language: "en" });
    setLocation("/map");
  };

  return <div className="min-h-screen bg-slate-50"><TopNav /><main className="container grid min-h-[70vh] place-items-center py-12"><section className="w-full max-w-xl rounded-3xl border border-sky-100 bg-white p-6 shadow-xl shadow-sky-950/5 sm:p-9">{route.isLoading && <p className="text-sm text-slate-600">Opening shared route…</p>}{route.isError && <><p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-700">Link unavailable</p><h1 className="mt-3 font-display text-3xl font-bold text-slate-950">This route is no longer shared.</h1><p className="mt-3 leading-7 text-slate-600">The route owner may have revoked this link. Ask them to generate a new one.</p><Button className="mt-6" onClick={() => setLocation("/destinations")}>Plan your own route</Button></>}{route.data && <><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">AIET shared route</p><h1 className="mt-3 font-display text-3xl font-bold text-slate-950">{route.data.label}</h1></div><div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-700"><Route className="h-5 w-5" /></div></div><p className="mt-4 flex items-center gap-2 text-sm leading-6 text-slate-600"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />This link shares route details only—not the owner’s account or live location.</p>{sharedNote && <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/70 p-4"><p className="text-xs font-bold uppercase tracking-wider text-sky-800">Shared note</p><p className="mt-1 text-sm leading-6 text-slate-700">{sharedNote}</p>{sharedTags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{sharedTags.map((tag) => <span key={tag} className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-sky-800">#{tag}</span>)}</div>}</div>}<Button onClick={openOnMap} className="mt-7 w-full bg-slate-950 py-5 text-base hover:bg-slate-800"><MapPin className="mr-2 h-4 w-4" />Open route on map <Compass className="ml-2 h-4 w-4" /></Button></>}</section></main></div>;
}
