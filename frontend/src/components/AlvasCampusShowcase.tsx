import { Badge } from "@/components/ui/badge";
import { alvasLandingContent } from "@shared/landing-content";
import { ArrowLeft, ArrowRight, Images, MapPinned, X } from "lucide-react";
import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

type CampusPhoto = {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly imageUrl: string;
  readonly originalFilename: string;
  readonly alt: string;
  readonly description: string;
  readonly routeDestinationId?: string;
};

const galleryIds = [
  "campus-overview",
  "engineering-block-aerial",
  "main-entrance",
  "main-building",
  "main-library",
  "department-cse",
] as const;

const showcaseFallbackMap: Record<string, string> = {
  "campus-overview": "/Images/New Building Aerial Overview.jpeg",
  "engineering-block-aerial": "/Images/Engineering Block Aerial.jpeg",
  "main-entrance": "/Images/Main Entrance.jpeg",
  "main-building": "/Images/Main Building.jpeg",
  "main-library": "/Images/Library.jpeg",
  "department-cse": "/Images/Department Library Room.jpeg",
};

function CampusImage({ photo, eager = false, onOpen }: { photo: CampusPhoto; eager?: boolean; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    const fallback = showcaseFallbackMap[photo.id] || "/Images/Main Building.jpeg";
    if (target.src.indexOf(encodeURI(fallback)) === -1 && target.src.indexOf("/Images/") === -1) {
      target.src = fallback;
    } else {
      setFailed(true);
    }
  };
  return <button type="button" onClick={onOpen} className="group relative block h-full w-full overflow-hidden rounded-[1rem] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f3c64f]" aria-label={`Open larger view: ${photo.title}`}>
    {failed ? <div className="grid h-full min-h-28 place-items-center bg-[#2c151d] p-4 text-center text-xs text-white/70">Campus image unavailable</div> : <img src={showcaseFallbackMap[photo.id] || photo.imageUrl} alt={photo.alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={handleImageError} className="h-full min-h-28 w-full object-cover transition duration-300 group-hover:scale-[1.025]" />}
    <span className="absolute inset-x-3 bottom-3 rounded-lg bg-[#170a10]/78 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">{photo.title}</span>
  </button>;
}

export function AlvasCampusShowcase() {
  const [, setLocation] = useLocation();
  const photos = useMemo(() => galleryIds.map((id) => alvasLandingContent.campusPhotoArchive.find((photo) => photo.id === id)).filter(Boolean) as CampusPhoto[], []);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const activePhoto = activeIndex === null ? undefined : photos[activeIndex];

  const showPrevious = () => setActiveIndex((current) => current === null ? 0 : (current - 1 + photos.length) % photos.length);
  const showNext = () => setActiveIndex((current) => current === null ? 0 : (current + 1) % photos.length);

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex]);

  const findThisLocation = () => {
    if (!activePhoto?.routeDestinationId) return;
    sessionStorage.setItem("pathfinder-destination", activePhoto.routeDestinationId);
    setLocation("/map");
    setActiveIndex(null);
  };

  return <>
    <section aria-label="Authentic AIET campus photo gallery" className="relative w-full min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3 px-1"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#f8d98a]">Authentic campus gallery</p><p className="mt-1 text-xs text-white/60">Six supplied AIET building and grounds photographs</p></div><Badge className="border border-white/15 bg-white/10 text-white/80 hover:bg-white/10"><Images className="mr-1.5 h-3.5 w-3.5 text-[#f3c64f]" /> {photos.length} views</Badge></div>
      <div className="grid grid-cols-2 gap-3 sm:aspect-[1/1] sm:auto-rows-fr sm:grid-cols-3">
        {photos.map((photo, index) => <div key={photo.id} className={index === 0 ? "col-span-2 row-span-2 min-h-[18rem] sm:min-h-0" : "min-h-36 sm:min-h-0"}><CampusImage photo={photo} eager={index === 0} onOpen={() => setActiveIndex(index)} /></div>)}
      </div>
      <div className="mt-3 flex items-center justify-between px-1 text-xs text-white/55"><span>Tap a photograph to inspect it</span><span>Source-aware campus orientation</span></div>
    </section>
    {activePhoto && activeIndex !== null && <div role="dialog" aria-modal="true" aria-labelledby="campus-gallery-title" className="fixed inset-0 z-[80] grid place-items-center bg-[#0b0508]/90 p-4 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) setActiveIndex(null); }} onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(event) => { const start = touchStartX.current; const end = event.changedTouches[0]?.clientX; touchStartX.current = null; if (start === null || end === undefined || Math.abs(end - start) < 48) return; if (end < start) showNext(); else showPrevious(); }}>
      <div className="relative w-full max-w-5xl rounded-2xl border border-white/15 bg-[#170a10] p-3 shadow-2xl sm:p-5"><div className="flex items-start justify-between gap-4 px-1 pb-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#f3c64f]">AIET campus photograph</p><h2 id="campus-gallery-title" className="mt-1 font-display text-xl font-bold text-white">{activePhoto.title}</h2><p className="mt-1 text-xs text-white/60">{activePhoto.description}</p></div><button type="button" onClick={() => setActiveIndex(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-white transition hover:bg-white/10" aria-label="Close campus photo viewer"><X className="h-4 w-4" /></button></div><div className="relative overflow-hidden rounded-xl bg-black/20"><img src={showcaseFallbackMap[activePhoto.id] || activePhoto.imageUrl} alt={activePhoto.alt} className="max-h-[68vh] min-h-60 w-full object-contain" /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><button type="button" onClick={showPrevious} className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 text-white transition hover:bg-white/10" aria-label="Previous campus photograph"><ArrowLeft className="h-4 w-4" /></button><span className="min-w-16 text-center text-xs font-semibold text-white/70">{activeIndex + 1} / {photos.length}</span><button type="button" onClick={showNext} className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 text-white transition hover:bg-white/10" aria-label="Next campus photograph"><ArrowRight className="h-4 w-4" /></button></div>{activePhoto.routeDestinationId && <button type="button" onClick={findThisLocation} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#f3c64f] px-3 py-2 text-xs font-bold text-[#241018] transition hover:bg-[#ffe08c]"><MapPinned className="h-3.5 w-3.5" />Find on Map</button>}</div></div>
    </div>}
  </>;
}
