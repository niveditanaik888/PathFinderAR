import { AlvasCampusShowcase } from "@/components/AlvasCampusShowcase";
import { CampusPhotoGallery } from "@/components/CampusPhotoGallery";
import { TopNav } from "@/components/TopNav";
import { TuluVoiceSampleButton } from "@/components/TuluVoiceSampleButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { calculateRoute } from "@shared/routing";
import { campusEdges, campusNodes, destinations } from "@shared/pathfinder";
import { alvasLandingContent } from "@shared/landing-content";
import { readRouteSelection, routeSelectionSearch, routableSourceNodes, writeRouteSelection } from "@shared/route-selection";
import { languageOptions, supportedLanguageCodes } from "@shared/i18n";
import { ArrowDown, ArrowDownRight, ArrowRight, Bot, Check, Compass, Headphones, Images, Map as MapIcon, MapPinned, Mic, Navigation, Route, Search, Volume2 } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

const destinationCategories = [
  "All",
  "Academic",
  "Administration",
  "Facility",
  "Accommodation",
  "Transport",
  "Campus",
  "Faculty Cabins",
] as const;

const TULU_ONBOARDING_KEY = "pathfinder-tulu-route-onboarding-complete";

export default function Home() {
  const [, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const plannerRef = useRef<HTMLElement | null>(null);
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [routeSelection, setRouteSelection] = useState(() => readRouteSelection(sessionStorage, window.location.search));
  const sourceNodeId = routeSelection.sourceNodeId;
  const destinationId = routeSelection.destinationId;
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directoryCategory, setDirectoryCategory] = useState<typeof destinationCategories[number]>("All");
  const [showTuluOnboarding, setShowTuluOnboarding] = useState(false);
  const managedHero = trpc.campus.media.useQuery({ slot: "hero" }).data?.[0];
  const heroFallbackImage = managedHero?.mediaUrl ?? alvasLandingContent.campusImage;
  const heroFallbackAlt = managedHero?.altText ?? "AIET academic block";

  const selectedDestination = destinations.find((destination) => destination.id === destinationId) ?? destinations[0];
  const routePreview = calculateRoute(campusNodes, campusEdges, sourceNodeId === "current-location" ? "gate" : sourceNodeId, selectedDestination.nodeId);
  const filteredDestinations = useMemo(() => {
    const query = directoryQuery.trim().toLowerCase();
    return destinations.filter((destination) => {
      const matchesCategory = directoryCategory === "All" || destination.category === directoryCategory;
      const matchesQuery = !query || `${destination.name} ${destination.buildingName} ${destination.category} ${destination.description} ${destination.roomNumber ?? ""}`.toLowerCase().includes(query);
      return destination.isActive && matchesCategory && matchesQuery;
    });
  }, [directoryCategory, directoryQuery]);

  useEffect(() => {
    if (language !== "tcy") return;
    setShowTuluOnboarding(window.localStorage.getItem(TULU_ONBOARDING_KEY) !== "true");
  }, [language]);

  const finishTuluOnboarding = () => {
    window.localStorage.setItem(TULU_ONBOARDING_KEY, "true");
    setShowTuluOnboarding(false);
  };

  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    if (videoPaused) {
      void video.play().then(() => setVideoPaused(false)).catch(() => setVideoPaused(true));
      return;
    }
    video.pause();
    setVideoPaused(true);
  };

  const focusRoutePlanner = () => {
    plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const chooseDestination = (nextDestinationId: string) => {
    setRouteSelection(writeRouteSelection({ sourceNodeId, destinationId: nextDestinationId }, sessionStorage));
    focusRoutePlanner();
  };

  const startNavigation = () => {
    const next = writeRouteSelection({ sourceNodeId, destinationId }, sessionStorage);
    setRouteSelection(next);
    setLocation(`/map?to=${destinationId}&from=${sourceNodeId}`);
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f7f4f0] text-[#1d1720]">
      <TopNav transparent />
      <main>
        <section aria-labelledby="home-hero-title" className="relative isolate overflow-hidden bg-[#241018] text-white min-h-[40rem] lg:min-h-[calc(100svh-4rem)] flex items-center">
          {/* Background video from https://new.aiet.org.in/ */}
          {!videoUnavailable && (
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={heroFallbackImage}
              onError={() => setVideoUnavailable(true)}
              onPause={() => setVideoPaused(true)}
              onPlay={() => setVideoPaused(false)}
              className="hero-campus-video absolute inset-0 h-full w-full object-cover z-0 pointer-events-none"
              aria-label="AIET campus highlights"
            >
              <source src="/aiet-campus-hero.webm" type="video/webm" />
              <source src="/api/video-proxy?url=https%3A%2F%2Fdrive.google.com%2Fuc%3Fexport%3Ddownload%26id%3D1RwenhclEcyMvlnPCW7mRYlT0RnBWOXRc" type="video/webm" />
              <source src="/aiet-campus-hero.mp4" type="video/mp4" />
              <source src={alvasLandingContent.heroVideo} type="video/mp4" />
            </video>
          )}
          {videoUnavailable && (
            <img
              src={heroFallbackImage}
              alt={heroFallbackAlt}
              className="absolute inset-0 h-full w-full object-cover z-0 opacity-40"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/Images/")) {
                  target.src = "/Images/Engineering Block Aerial.jpeg";
                }
              }}
            />
          )}

          {/* Cinematic dark overlay matching AIET design aesthetic */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#180a12]/85 via-[#260e19]/70 to-[#14060e]/95" aria-hidden="true" />
          {!videoUnavailable && <div className="hero-video-light absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />}
          <div className="pathfinder-hero-noise absolute inset-0 z-0 opacity-30 pointer-events-none" aria-hidden="true" />

          <div className="container relative z-10 grid min-h-[36rem] items-center gap-10 py-12 sm:py-16 lg:grid-cols-[.85fr_1.15fr] lg:gap-14 lg:py-20">
            <div data-testid="hero-copy" className="max-w-lg">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#f3c64f]"><span className="h-1.5 w-1.5 bg-[#f3c64f]" />Real campus. Clearer arrival.</p>
              <h1 id="home-hero-title" className="mt-5 max-w-xl font-display text-4xl font-bold leading-[.98] tracking-[-.055em] text-white sm:text-6xl lg:text-[4.8rem]">Explore <span className="text-[#f3c64f]">AIET.</span><br />Find Your Way.</h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/80 sm:text-base sm:leading-8">Discover configured buildings, facilities, and campus routes with AIET PathFinder — a practical digital campus guide for students, faculty, parents, and visitors.</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#explore" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#f3c64f] px-5 py-3 text-sm font-bold text-[#241018] shadow-lg shadow-amber-500/20 transition hover:bg-[#ffe08c] active:scale-[.97]">Explore Campus <ArrowDown className="h-4 w-4" /></a>
                <Link href="/destinations" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 bg-white/[.12] px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:border-[#f3c64f]/70 hover:bg-white/[.2] active:scale-[.97]">Plan Your Route <Route className="h-4 w-4" /></Link>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-white/70">
                <Link href="/ar" className="inline-flex items-center gap-2 text-white/80 transition hover:text-white">AR guidance <Compass className="h-3.5 w-3.5" /></Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-[11px] font-medium text-white/70"><span>{alvasLandingContent.shortName} digital campus guide</span><span className="text-[#f3c64f]">{alvasLandingContent.location}</span></div>
            </div>

            <div className="relative mx-auto w-full max-w-[40rem] lg:max-w-none">
              <div className="relative overflow-hidden rounded-[1.7rem] border border-white/20 bg-[#160a10]/75 p-6 backdrop-blur-xl shadow-[0_34px_100px_rgba(0,0,0,.55)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-[.18em] text-[#f8d98a]">Live AIET Campus Video</span>
                  </div>
                  <button type="button" onClick={toggleVideo} className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20" aria-label={videoUnavailable ? "Campus image fallback" : videoPaused ? "Play campus video" : "Pause campus video"}>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f3c64f]" />
                    {videoUnavailable ? "Campus image fallback" : videoPaused ? "Play campus video" : "Pause campus video"}
                  </button>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#f3c64f]">Featured Destination</p>
                    <h3 className="mt-1 truncate font-display text-2xl font-bold text-white">{selectedDestination.name}</h3>
                    <p className="mt-1 truncate text-xs text-white/70">{selectedDestination.buildingName} · {selectedDestination.floorName}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-white/80">
                      <span className="inline-flex items-center gap-1"><Route className="h-3.5 w-3.5 text-[#f3c64f]" />{routePreview.totalDistance}m away</span>
                      <span>·</span>
                      <span>{Math.max(1, Math.ceil(routePreview.estimatedTime / 60))} min walk</span>
                    </div>
                  </div>
                  <Link href="/map" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f3c64f] px-4 py-3 text-xs font-bold text-[#241018] shadow-lg shadow-amber-500/25 transition hover:bg-[#ffe08c] active:scale-[.98]">
                    Open campus map <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between px-1 text-xs text-white/60">
                <span>Official video source: <a href="https://new.aiet.org.in/" target="_blank" rel="noreferrer" className="underline hover:text-white">new.aiet.org.in</a></span>
                <span>Source-aware campus orientation</span>
              </div>
            </div>
          </div>
        </section>

        <section id="explore" className="relative scroll-mt-20 border-b border-[#e6ded5] bg-[#f7f4f0] py-10 sm:py-14">
          <div className="container">
            <div data-testid="destination-search" className="grid gap-6 rounded-[1.5rem] border border-[#ded2c8] bg-[#fffdfa] p-5 shadow-[0_24px_70px_rgba(60,29,17,.10)] sm:p-7 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
              <div><p className="eyebrow">Campus destination search</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-.04em] text-[#24151b] sm:text-4xl">Where would you like to go?</h2><p className="mt-2 text-sm leading-6 text-[#6b5d5e]">Search only across destinations currently configured in PathFinder.</p></div>
              <div>
                <div className="flex min-h-14 items-center gap-3 border border-[#d7cac0] bg-[#fffdfa] px-4 focus-within:border-[#8e1e3d] focus-within:ring-2 focus-within:ring-[#8e1e3d]/10"><Search className="h-5 w-5 shrink-0 text-[#8e1e3d]" /><label className="sr-only" htmlFor="home-directory-search">Search buildings, departments, labs or facilities</label><input id="home-directory-search" value={directoryQuery} onChange={(event) => setDirectoryQuery(event.target.value)} placeholder="Search buildings, departments, labs or facilities…" className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#241a1e] outline-none placeholder:text-[#978986]" />{directoryQuery && <button type="button" onClick={() => setDirectoryQuery("")} aria-label="Clear destination search" className="grid h-8 w-8 place-items-center rounded-full text-lg text-[#8e1e3d] transition hover:bg-[#f2e4bf]">×</button>}<button type="button" onClick={focusRoutePlanner} className="hidden min-h-10 shrink-0 items-center gap-2 bg-[#7e1532] px-4 text-xs font-bold text-white transition hover:bg-[#931a3b] sm:inline-flex">Find Route <ArrowRight className="h-3.5 w-3.5" /></button></div>
                <div className="mt-3 flex flex-wrap gap-2" aria-label="Destination categories">{destinationCategories.map((category) => <button key={category} type="button" onClick={() => setDirectoryCategory(category)} className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${directoryCategory === category ? "border-[#8e1e3d] bg-[#8e1e3d] text-white" : "border-[#d7cac0] bg-[#fffdfa] text-[#6b5d5e] hover:border-[#8e1e3d] hover:text-[#8e1e3d]"}`}>{category === "All" ? "All destinations" : category === "Faculty Cabins" ? "Staff Directory" : category}</button>)}</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">{filteredDestinations.slice(0, directoryQuery || directoryCategory !== "All" ? 8 : 6).map((destination) => <button key={destination.id} type="button" onClick={() => chooseDestination(destination.id)} className="group flex min-w-0 items-center gap-3 border border-[#e6ded5] bg-[#fbf8f5] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#a91e42]/50 hover:bg-white">{destination.imageUrl ? (<img src={destination.imageUrl} alt={destination.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />) : (<span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#f2e4bf] text-[#8a421a]"><MapPinned className="h-4 w-4" /></span>)}<span className="min-w-0"><strong className="block truncate text-sm text-[#2f2025]">{destination.name}</strong><small className="mt-0.5 block truncate text-xs text-[#857575]">{destination.buildingName} · {destination.category}</small></span><ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-[#a91e42] transition group-hover:translate-x-0.5" /></button>)}{!filteredDestinations.length && <p className="border border-dashed border-[#cbbdb5] px-4 py-6 text-center text-sm text-[#746864] sm:col-span-2">No configured destination matches this search.</p>}</div>
                <button type="button" onClick={focusRoutePlanner} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 bg-[#7e1532] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#931a3b] sm:hidden">Find Route <ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        </section>

        <section id="quick-access" className="scroll-mt-16 border-b border-[#e6ded5] bg-[#fffdfa] py-16 sm:py-20">
          <div className="container"><div className="grid items-center gap-10 lg:grid-cols-[1.08fr_.92fr] lg:gap-16"><div><p className="eyebrow">Your Campus, Connected</p><h2 className="home-heading mt-3">Everything you need<br /><em>to move with confidence.</em></h2><p className="mt-5 max-w-lg text-base leading-7 text-[#6b5d5e]">Everything you need to explore and navigate AIET — from configured destinations and route planning and device-supported AR guidance.</p></div><div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-[2rem] border border-[#eadfce] bg-[radial-gradient(circle_at_center,rgba(243,198,79,.24),transparent_62%),#f8f2e9] px-6 py-8 sm:min-h-64"><div className="absolute h-44 w-44 rounded-full bg-[#f3c64f]/15 blur-3xl" aria-hidden="true" /><img src="/alvas-education-foundation-logo.png" alt="Alva's Education Foundation official logo" className="relative z-[1] h-auto w-[78%] max-w-[20rem] object-contain drop-shadow-sm" /></div></div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[
              { title: "Explore Campus", copy: "Discover configured buildings, facilities, and points of interest.", action: "Browse destinations", href: "/destinations", icon: MapPinned },
              { title: "Interactive 2D Map", copy: "Locate destinations and understand the active campus route graph.", action: "Explore Map", href: "/map", icon: MapIcon },
              { title: "AR Navigation", copy: "Use device-supported guidance when your route and hardware allow it.", action: "Open AR", href: "/ar", icon: Compass },
            ].map((feature) => <article key={feature.title} className="group flex min-h-56 flex-col justify-between rounded-2xl border border-[#e5d9d1] bg-[#fffdfa] p-5 shadow-[0_10px_30px_rgba(60,29,17,.04)] transition duration-200 hover:-translate-y-1 hover:border-[#a91e42]/40 hover:shadow-[0_18px_40px_rgba(60,29,17,.10)]"><feature.icon className="h-6 w-6 text-[#8e1e3d]" /><div><h3 className="mt-8 font-display text-xl font-bold tracking-tight text-[#24151b]">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-[#6b5d5e]">{feature.copy}</p><Link href={feature.href} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#8e1e3d] transition group-hover:gap-3">{feature.action} <ArrowRight className="h-3.5 w-3.5" /></Link></div></article>)}
            </div>
          </div>
        </section>

        <section id="campus-info" className="border-b border-white/10 bg-[#35191f] py-8 text-white">
          <div className="container grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-[#35191f] p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f3c64f]">Campus directory</p><p className="mt-2 text-sm leading-6 text-white/72">Configured destinations connect to route planning, map, and assistant handoffs.</p></div>
            <div className="bg-[#35191f] p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f3c64f]">Academic departments</p><p className="mt-2 text-sm leading-6 text-white/72">Browse the current AIET programme and department discovery context.</p></div>
            <div className="bg-[#35191f] p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f3c64f]">Facilities & amenities</p><p className="mt-2 text-sm leading-6 text-white/72">Library, auditorium, cafeteria, hostel, parking, and sports routes where configured.</p></div>
            <div className="bg-[#35191f] p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f3c64f]">Visitor guidance</p><p className="mt-2 text-sm leading-6 text-white/72">Start at the Main Gate, choose a destination, and follow the active route graph.</p></div>
          </div>
        </section>

        <section id="campus-gallery" className="scroll-mt-16 bg-[#f7f4f0] py-16 sm:py-24"><div className="container"><div className="mb-8 max-w-2xl"><p className="eyebrow">Featured AIET campus photographs</p><h2 className="home-heading mt-4">Recognise the campus<br /><em>before you arrive.</em></h2><p className="mt-5 text-base leading-8 text-[#5b5253]">Browse authentic supplied photographs for visual orientation, then use the configured 2D map for verified route planning.</p></div><AlvasCampusShowcase /></div></section>

        <section id="landmark-archive" className="scroll-mt-16 bg-[#eee6dc] py-12 sm:py-16"><div className="container"><div className="grid gap-5 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-10"><div className="min-w-0"><p className="eyebrow">Real AIET photographs</p><h2 className="home-heading mt-3 max-w-[15ch] text-[clamp(2.25rem,4vw,4.25rem)] leading-[.98]">See the campus<br /><em>before you arrive.</em></h2></div><div className="min-w-0 border-l border-[#a91e42]/25 pl-5 text-base leading-7 text-[#5b5253] lg:pl-8">A source-aware visual landmark archive built from the submitted campus photographs. Open any image for a closer look; only cards connected to an existing PathFinder destination offer a route handoff.</div></div><CampusPhotoGallery /></div></section>

        <section ref={plannerRef} id="route-planner" className="scroll-mt-16 bg-[#e9e0d4] py-16 sm:py-24"><div className="container grid gap-10 lg:grid-cols-[.88fr_1.12fr] lg:items-end"><div><p className="eyebrow">Smart route planner</p><h2 className="home-heading mt-4">From here<br /><em>to there.</em></h2><p className="mt-6 max-w-md text-base leading-8 text-[#5b5253]">Plan only across locations currently configured in PathFinder. Distance and walk time are calculated from the active campus graph.</p></div><div className="border border-[#cbbda9] bg-[#fffdfa] p-5 shadow-[0_24px_60px_rgba(60,29,17,.10)] sm:p-7"><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#685a55]">From<select aria-label="Starting point" value={sourceNodeId} onChange={(event) => setRouteSelection(writeRouteSelection({ sourceNodeId: event.target.value, destinationId }, sessionStorage))} className="h-12 border border-[#d7cac0] bg-white px-3 text-sm font-semibold text-[#241a1e] outline-none focus:border-[#a91e42]"><option value="current-location">📍 Current Location</option><option value="gate">Main Gate</option>{routableSourceNodes().filter((node) => node.id !== "gate").map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#685a55]">To<select value={destinationId} onChange={(event) => setRouteSelection(writeRouteSelection({ sourceNodeId, destinationId: event.target.value }, sessionStorage))} className="h-12 border border-[#d7cac0] bg-white px-3 text-sm font-semibold text-[#241a1e] outline-none focus:border-[#a91e42]"><option value={destinationId}>{selectedDestination.name}</option>{destinations.filter((destination) => destination.isActive && destination.id !== destinationId).map((destination) => <option key={destination.id} value={destination.id}>{destination.name}</option>)}</select></label></div><div className="mt-6 grid gap-px border border-[#e3d8cf] bg-[#e3d8cf] sm:grid-cols-3"><div className="bg-[#fbf8f5] p-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#897972]">Route</p><p className="mt-2 font-display text-lg font-bold">{routePreview.totalDistance} m</p></div><div className="bg-[#fbf8f5] p-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#897972]">Walk time</p><p className="mt-2 font-display text-lg font-bold">{Math.max(1, Math.ceil(routePreview.estimatedTime / 60))} min</p></div><div className="bg-[#fbf8f5] p-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#897972]">Destination</p><p className="mt-2 truncate font-display text-lg font-bold">{selectedDestination.name}</p></div></div><button type="button" aria-label="Start navigation" onClick={startNavigation} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#7e1532] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#931a3b] active:scale-[.99]">Find Route & Start Navigation <Navigation className="h-4 w-4" /></button><p className="mt-3 text-center text-xs leading-5 text-[#746864]">Route estimates depend on the current configured graph and may update as campus data is maintained.</p></div></div></section>

        <section id="assistant" className="scroll-mt-16 bg-[#f7f4f0] py-20 sm:py-28"><div className="container grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center"><div className="relative overflow-hidden bg-[#2a111a] p-7 text-white shadow-[0_26px_70px_rgba(41,14,23,.18)] sm:p-10"><div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#f3c64f]/18 blur-3xl" /><div className="relative"><p className="eyebrow !text-[#f3c64f]">AI campus assistant</p><h2 className="mt-4 max-w-lg font-display text-4xl font-bold tracking-[-.045em] sm:text-5xl">Just ask<br />PathFinder.</h2><div className="mt-8 max-w-xl space-y-3"><div className="ml-auto max-w-sm border border-white/12 bg-white/[.09] p-4 text-sm leading-6 text-white/90">Where is the Central Library?</div><div className="max-w-md border border-[#f3c64f]/28 bg-[#14080d]/42 p-4 text-sm leading-6 text-white/74"><span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#f8d98a]"><Bot className="h-3.5 w-3.5" />PathFinder</span>The Central Library is in the configured Central Learning Block. Would you like directions?</div></div><Link href="/assistant" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#f8d98a] transition hover:gap-3">Open the AI assistant <ArrowRight className="h-4 w-4" /></Link></div></div><div><p className="eyebrow">Guided by configured information</p><h2 className="home-heading mt-4">Answers with<br /><em>real context.</em></h2><p className="mt-6 max-w-lg text-base leading-8 text-[#5b5253]">The assistant maintains route context over multiple turns and answers from locations currently configured in PathFinder. It does not invent campus places.</p><div className="mt-8 grid gap-3 text-sm text-[#43363a]"><p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#a91e42]" />Multilingual route conversation</p><p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#a91e42]" />Voice input and spoken reply controls</p><p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#a91e42]" />Map and AR route handoffs</p></div></div></div></section>

        <section id="voice" className="scroll-mt-16 bg-[#e8d7b5] py-20 sm:py-28"><div className="container grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><p className="eyebrow">Voice navigation</p><h2 className="home-heading mt-4">You speak.<br /><em>PathFinder guides.</em></h2><p className="mt-6 max-w-md text-base leading-8 text-[#5b5253]">Open the assistant, choose your language, and ask for a configured destination. Browser recognition is supported when available, with a recorded-audio transcription route for compatible devices.</p><Link href="/assistant" className="mt-8 inline-flex min-h-12 items-center gap-3 bg-[#7e1532] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#931a3b] active:scale-[.97]"><Mic className="h-4 w-4" />Open voice assistant</Link></div><div className="relative mx-auto w-full max-w-md border-[10px] border-[#2a1718] bg-[#201119] p-5 shadow-[0_28px_60px_rgba(62,36,18,.28)]"><div className="flex items-center justify-between text-xs font-semibold text-white/55"><span>AIET PATHFINDER</span><span>Voice guidance</span></div><div className="mt-11 flex justify-center gap-1.5" aria-label="Voice waveform visualisation">{[18, 34, 54, 78, 48, 68, 32, 44, 24].map((height, index) => <span key={index} className="voice-wave" style={{ height }} />)}</div><div className="mt-10 border border-white/10 bg-white/[.06] p-4"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#f3c64f]">Your request</p><p className="mt-2 text-lg font-semibold">“Take me to the library.”</p></div><div className="mt-3 border border-[#f3c64f]/22 bg-[#f3c64f]/[.08] p-4"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#f8d98a]">PathFinder</p><p className="mt-2 text-sm leading-6 text-white/80">“Sure. Where are you starting from?”</p></div><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50"><span className="inline-flex items-center gap-2"><Volume2 className="h-3.5 w-3.5 text-[#f3c64f]" />Spoken replies supported</span><Headphones className="h-4 w-4" /></div></div></div></section>

        <section id="language" className="scroll-mt-16 bg-[#f7f4f0] py-20 sm:py-28"><div className="container"><div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end"><div><p className="eyebrow">Multilingual campus</p><h2 className="home-heading mt-4">Your campus.<br /><em>Your language.</em></h2></div><div className="max-w-2xl text-base leading-8 text-[#5b5253]">Choose English, Kannada, Tulu, Hindi, Tamil, Telugu, or Malayalam. The centralized translation system keeps the assistant interface and spoken guidance aligned.</div></div><div className="mt-12 grid gap-px border border-[#ddd3cb] bg-[#ddd3cb] lg:grid-cols-[.8fr_1.2fr]"><div className="bg-[#fffdfa] p-6 sm:p-8"><label htmlFor="home-language" className="text-xs font-bold uppercase tracking-[.17em] text-[#8e1e3d]">Preview language</label><select id="home-language" value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} className="mt-4 h-12 w-full border border-[#d6c8bd] bg-white px-3 text-sm font-semibold outline-none focus:border-[#a91e42]">{supportedLanguageCodes.map((code) => <option key={code} value={code}>{languageOptions[code].label} · {languageOptions[code].nativeLabel}</option>)}</select><p className="mt-5 text-sm leading-6 text-[#62585a]">Current interface language: <strong>{languageOptions[language].nativeLabel}</strong></p><TuluVoiceSampleButton className="mt-5" />
          {language === "tcy" && showTuluOnboarding && <aside className="mt-6 border border-[#a91e42]/25 bg-[#fff2ec] p-4" aria-labelledby="tulu-route-onboarding-title"><p className="text-xs font-bold uppercase tracking-[.17em] text-[#8e1e3d]">Tulu route starter</p><h3 id="tulu-route-onboarding-title" className="mt-2 font-display text-xl font-bold">ತುಳುದ ಮಧಿಪ್ಪ್ ದಾರಿ ಕಲ್ಪನೆ</h3><p className="mt-2 text-sm leading-6 text-[#62585a]">Try these short prompts in the assistant to begin a campus route.</p><ol className="mt-4 grid gap-2 text-sm font-semibold text-[#4e2330]"><li className="border border-[#a91e42]/15 bg-white px-3 py-2">1. ಕೇಂದ್ರ ಗ್ರಂಥಾಲಯದ ದಾರಿ ತೋರ್ಸೆ</li><li className="border border-[#a91e42]/15 bg-white px-3 py-2">2. ಮುಖ್ಯ ದ್ವಾರದಿಂದ ಪ್ರಾರಂಭ ಮಲ್ಪುಲೆ</li><li className="border border-[#a91e42]/15 bg-white px-3 py-2">3. ಮಾರ್ಗದರ್ಶನ ಪ್ರಾರಂಭ ಮಲ್ಪುಲೆ</li></ol><div className="mt-4 flex flex-wrap gap-3"><Link href="/assistant" onClick={finishTuluOnboarding} className="inline-flex min-h-10 items-center bg-[#7e1532] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#931a3b] active:scale-[.97]">Try Tulu prompts</Link><button type="button" onClick={finishTuluOnboarding} className="min-h-10 px-3 py-2 text-sm font-bold text-[#7e1532] underline underline-offset-4">Hide tips</button></div></aside>}</div><div className="grid gap-px bg-[#ddd3cb] sm:grid-cols-2 xl:grid-cols-4">{alvasLandingContent.languageExamples.map((example) => <div key={example.code} className="bg-[#fffdfa] p-6"><p className="text-xs font-bold uppercase tracking-[.17em] text-[#8e1e3d]">{example.label}</p><p className="mt-6 font-display text-lg font-bold leading-7">{example.line}</p></div>)}</div></div></div></section>

        <section id="discover" className="scroll-mt-16 bg-[#f7f4f0] py-20 sm:py-28"><div className="container"><div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end"><div><p className="eyebrow">Discover AIET</p><h2 className="home-heading mt-4">Learn. Build.<br /><em>Lead.</em></h2></div><div className="max-w-2xl text-base leading-8 text-[#5b5253]">PathFinder is not a replacement for AIET’s institutional website. These discovery areas reflect the public categories presented by AIET; follow through for official details and updates.</div></div><div className="mt-12 grid gap-px border border-[#ded4cb] bg-[#ded4cb] sm:grid-cols-2 lg:grid-cols-3">{alvasLandingContent.officialDiscovery.map((item) => <a key={item.accent} href={alvasLandingContent.officialWebsite} target="_blank" rel="noreferrer" className="group min-h-48 bg-[#fffdfa] p-6 transition hover:bg-[#f2e4bf]"><span className="font-display text-4xl font-bold tracking-tighter text-[#a91e42]/25">{item.accent}</span><h3 className="mt-7 font-display text-2xl font-bold tracking-tight">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#62585a]">{item.detail}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#8e1e3d]">Official information <ArrowDownRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:translate-y-0.5" /></span></a>)}</div><div className="mt-10 border-t border-[#ddd3cb] pt-7"><p className="text-xs font-bold uppercase tracking-[.17em] text-[#8e1e3d]">Programmes listed publicly by AIET</p><div className="mt-4 flex flex-wrap gap-2">{alvasLandingContent.programmes.map((programme) => <span key={programme} className="border border-[#d8cac0] bg-[#fffdfa] px-3 py-2 text-xs font-medium text-[#594d4e]">{programme}</span>)}</div></div></div></section>

        <section className="bg-[#7e1532] py-20 text-white sm:py-24"><div className="container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="eyebrow !text-[#f8d98a]">Ready when you are</p><h2 className="mt-4 font-display text-4xl font-bold tracking-[-.045em] sm:text-6xl">Your campus is closer<br />than you think.</h2><p className="mt-5 max-w-xl text-base leading-7 text-white/70">Start a practical route, take a visual campus look, or use the assistant to navigate configured AIET destinations.</p></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Link href="/destinations" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#f3c64f] px-5 py-3 text-sm font-bold text-[#2a111a] transition hover:bg-[#ffe08c] active:scale-[.97]">Plan your route <Route className="h-4 w-4" /></Link><a href="#campus-gallery" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 active:scale-[.97]">See campus photographs <Images className="h-4 w-4" /></a><Link href="/ar" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 active:scale-[.97]">Start AR <Compass className="h-4 w-4" /></Link></div></div></section>
      </main>
      <footer className="bg-[#12090e] py-10 text-white/62"><div className="container grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end"><div className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white p-1 shadow-md"><img src="/alvas-education-foundation-logo.png" alt="Alva's Education Foundation" className="h-full w-full object-contain" /></span><div><p className="font-display text-xl font-bold text-white">AIET PathFinder</p><p className="mt-1 max-w-md text-sm leading-6">A smart digital campus navigation and exploration platform for Alva’s Institute of Engineering and Technology.</p></div></div><div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium"><a href={alvasLandingContent.officialWebsite} target="_blank" rel="noreferrer" className="transition hover:text-[#f8d98a]">Official AIET website</a><Link href="/map" className="transition hover:text-[#f8d98a]">Map</Link><Link href="/assistant" className="transition hover:text-[#f8d98a]">AI assistant</Link><Link href="/ar" className="transition hover:text-[#f8d98a]">AR guidance</Link></div></div><div className="container mt-8 border-t border-white/10 pt-4 text-xs text-white/35">© {new Date().getFullYear()} AIET PathFinder. Campus route information is limited to current PathFinder configuration.</div></footer>
    </div>
  );
}
