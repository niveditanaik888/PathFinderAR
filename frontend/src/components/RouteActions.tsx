import { Button } from "@/components/ui/button";
import type { AssistantRouteAction } from "@/lib/assistantRouteActions";
import type { GuidedRoute } from "@shared/assistant-conversation";
import { Globe2, Map, Navigation, Route } from "lucide-react";
import React from "react";

export const createRouteActionHandler = (action: AssistantRouteAction, onAction: (action: AssistantRouteAction) => void) => () => onAction(action);

export function RouteActions({ route, onAction }: { route: GuidedRoute; onAction: (action: AssistantRouteAction) => void }) {
  return <section aria-label="Verified route actions" className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">Verified PathFinder route</p><h2 className="mt-1 font-display text-xl font-bold text-slate-950">{route.source.name} <span className="text-cyan-700">→</span> {route.destination.name}</h2><p className="mt-1 text-sm text-slate-600">{route.result.totalDistance} m · about {Math.max(1, Math.ceil(route.result.estimatedTime / 60))} min · {route.instructions.length} guided steps</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-600 text-white"><Route className="h-5 w-5" /></span></div><p className="mt-3 rounded-xl bg-white/80 p-3 text-sm font-medium text-slate-700">{route.instructions[0]}</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><Button onClick={createRouteActionHandler("voice", onAction)} className="bg-cyan-600 text-white hover:bg-cyan-700"><Navigation className="mr-2 h-4 w-4" />Start voice guidance</Button><Button variant="outline" onClick={createRouteActionHandler("map", onAction)}><Map className="mr-2 h-4 w-4" />Open map</Button><Button variant="outline" onClick={createRouteActionHandler("ar", onAction)}><Globe2 className="mr-2 h-4 w-4" />AR guidance</Button></div></section>;
}
