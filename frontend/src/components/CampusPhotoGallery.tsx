import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { alvasLandingContent } from "@shared/landing-content";
import { Expand, MapPinned, Route, X } from "lucide-react";
import React, { useMemo, useState } from "react";
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

const filters = ["All", "Campus Buildings", "Campus Life", "Arrivals", "New Building", "CSE Department"] as const;
const campusPhotos: readonly CampusPhoto[] = alvasLandingContent.campusPhotoArchive;

const photoMatchesFilter = (photo: CampusPhoto, filter: (typeof filters)[number]) => {
  if (filter === "All") return true;
  if (filter === "Campus Buildings") return photo.category === "Campus" || photo.category === "Academic";
  if (filter === "Campus Life") return photo.category === "Campus life";
  if (filter === "Arrivals") return photo.category === "Arrival";
  return photo.category === filter;
};

const photoFallbackMap: Record<string, string> = {
  "campus-community": "/Images/Campus Community.jpeg",
  "campus-overview": "/Images/New Building Aerial Overview.jpeg",
  "engineering-block-aerial": "/Images/Engineering Block Aerial.jpeg",
  "main-entrance": "/Images/Main Entrance.jpeg",
  "canara-bank": "/Images/Canara Bank ATM Beside the Entrance.jpeg",
  "main-building": "/Images/Main Building.jpeg",
  "main-library": "/Images/Library.jpeg",
  "department-cse": "/Images/Department Library Room.jpeg",
  "cse-b-section": "/Images/Inside the Classroom.jpeg",
  "classroom": "/Images/Inside the Classroom.jpeg",
  "project-common-room": "/Images/Inside the Classroom.jpeg",
  "common-room-overview": "/Images/Inside the Classroom.jpeg",
  "mba-block": "/Images/Main Building.jpeg",
  "new-building-overview": "/Images/New Building Overview.jpeg",
  "new-building-entrance": "/Images/New Building Entrance.jpeg",
  "new-building-aerial": "/Images/New Building Aerial Overview.jpeg",
  "new-building-fountain": "/Images/Alvas Fountain.jpeg",
  "new-building-library-walkway": "/Images/New Building to Library Walkway.jpeg",
  "cse-submission-01": "/Images/Dr Manjunath Kotari Cabin.jpeg",
  "cse-submission-02": "/Images/Abhijith L Kotian Cabin.jpeg",
  "cse-submission-03": "/Images/Anitha Rao Cabin.jpeg",
  "cse-submission-04": "/Images/Asif Mulla Cabin.jpeg",
  "cse-submission-05": "/Images/Aysha Rameela Cabin.jpeg",
  "cse-submission-06": "/Images/Chandra Naik Cabin.jpeg",
  "cse-submission-07": "/Images/Deeksha M Cabin.jpeg",
  "cse-submission-08": "/Images/Deepika Kamath Cabin.jpeg",
  "cse-submission-09": "/Images/G Srinivasan Cabin.jpeg",
  "cse-submission-10": "/Images/Giridhar Gowda Cabin.jpeg",
  "cse-submission-11": "/Images/H Harshavardhan Cabin.jpeg",
  "cse-submission-12": "/Images/Jasmine Princy Lobo Cabin.jpeg",
  "cse-submission-13": "/Images/Jayendra Bandyan Cabin.jpeg",
  "cse-submission-14": "/Images/Kiran B V Cabin.jpeg",
  "cse-submission-15": "/Images/Madhusudhan S Cabin.jpeg",
  "cse-submission-16": "/Images/Mahesh D K Cabin.jpeg",
  "cse-submission-17": "/Images/Mahesh Kini M Cabin.jpeg",
  "cse-submission-18": "/Images/R Senthil Kumar Cabin.jpeg",
  "cse-submission-19": "/Images/Rakshitha Rai U Cabin.jpeg",
  "cse-submission-20": "/Images/Rizwan N Shaikh Cabin.jpeg",
  "cse-submission-21": "/Images/Shyla B G Cabin.jpeg",
  "cse-submission-22": "/Images/Vidya Cabin.jpeg",
  "cse-submission-23": "/Images/Yogitha Cabin.jpeg",
  "cse-submission-24": "/Images/Department Library Room.jpeg",
  "cse-submission-25": "/Images/HOD Entrance.jpeg",
  "cse-submission-26": "/Images/Inside the Classroom.jpeg",
  "cse-submission-27": "/Images/Engineering Block Aerial.jpeg",
  "cse-submission-28": "/Images/New Building to Library Walkway.jpeg",
  "cse-submission-29": "/Images/New Building Overview.jpeg",
  "cse-submission-30": "/Images/New Building Entrance.jpeg",
  "cse-submission-31": "/Images/New Building Aerial Overview.jpeg",
  "cse-submission-32": "/Images/Main Building.jpeg",
  "cse-submission-33": "/Images/Library.jpeg",
  "cse-submission-34": "/Images/Alvas Fountain.jpeg",
  "cse-submission-35": "/Images/Campus Community.jpeg",
  "cse-submission-36": "/Images/Canara Bank ATM Beside the Entrance.jpeg",
  "cse-submission-37": "/Images/Main Entrance.jpeg",
  "cse-submission-38": "/Images/Dr Manjunath Kotari Cabin.jpeg",
  "cse-submission-39": "/Images/HOD Entrance.jpeg",
  "cse-submission-40": "/Images/Inside the Classroom.jpeg",
};

export function CampusPhotoGallery() {
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [selectedPhoto, setSelectedPhoto] = useState<CampusPhoto | null>(null);
  const [failedPhotoIds, setFailedPhotoIds] = useState<ReadonlySet<string>>(new Set());
  const visiblePhotos = useMemo(() => campusPhotos.filter((photo) => photoMatchesFilter(photo, activeFilter)), [activeFilter]);

  const openConfiguredRoute = (photo: CampusPhoto) => {
    if (!photo.routeDestinationId) return;
    sessionStorage.setItem("pathfinder-destination", photo.routeDestinationId);
    setSelectedPhoto(null);
    setLocation("/map");
  };

  const handleImageError = (photoId: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    const fallback = photoFallbackMap[photoId] || "/Images/Main Building.jpeg";
    if (target.src.indexOf(encodeURI(fallback)) === -1 && target.src.indexOf("/Images/") === -1) {
      target.src = fallback;
    } else {
      setFailedPhotoIds((previous) => new Set(previous).add(photoId));
    }
  };

  return <>
    <div className="mt-8 flex flex-wrap gap-2" role="toolbar" aria-label="Landmark image filters">{filters.map((filter) => <button key={filter} type="button" onClick={() => setActiveFilter(filter)} aria-pressed={activeFilter === filter} className={`min-h-10 border px-3 text-xs font-bold uppercase tracking-[.13em] transition ${activeFilter === filter ? "border-[#7e1532] bg-[#7e1532] text-white" : "border-[#d8cac0] bg-[#fffdfa] text-[#6d5d60] hover:border-[#a91e42] hover:text-[#7e1532]"}`}>{filter}</button>)}</div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visiblePhotos.map((photo, index) => <article key={photo.id} className="group relative aspect-[4/3] min-h-0 overflow-hidden rounded-xl bg-[#201119] shadow-[0_12px_28px_rgba(58,24,33,.12)]">
      {failedPhotoIds.has(photo.id) ? <div className="absolute inset-0 grid place-items-center bg-[#2a111a] p-4 text-center text-xs font-semibold text-white/75">This supplied photograph is unavailable.</div> : <img src={photoFallbackMap[photo.id] || photo.imageUrl} alt={photo.alt} loading={index === 0 ? "eager" : "lazy"} onError={(e) => handleImageError(photo.id, e)} className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.025] motion-reduce:transform-none" />}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,4,8,.04)_25%,rgba(20,7,12,.86)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white"><div className="flex items-center justify-between gap-2"><span className="border border-white/20 bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[.14em] backdrop-blur-sm">{photo.category}</span><button type="button" onClick={() => setSelectedPhoto(photo)} className="grid h-9 w-9 place-items-center border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20" aria-label={`View ${photo.title} image`}><Expand className="h-4 w-4" /></button></div><h3 className="mt-8 font-display text-xl font-bold leading-tight">{photo.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-white/75">{photo.description}</p></div>
    </article>)}</div>
    {!visiblePhotos.length && <p className="mt-5 border border-dashed border-[#cbbdb5] bg-[#fffdfa] px-4 py-8 text-center text-sm text-[#6d5d60]">No supplied photographs are currently assigned to this category.</p>}
    <p className="mt-5 text-xs leading-5 text-[#6d5d60]">Visual archive based on user-supplied campus photographs and the submitted PathFinder presentation. Images support orientation and discovery; they do not establish room coordinates, floor assignments, or unsurveyed route details.</p>
    <Dialog open={Boolean(selectedPhoto)} onOpenChange={(open) => { if (!open) setSelectedPhoto(null); }}><DialogContent className="max-w-5xl border-[#34202a] bg-[#170b11] p-0 text-white sm:rounded-[1.6rem]"><DialogHeader className="sr-only"><DialogTitle>{selectedPhoto?.title}</DialogTitle><DialogDescription>{selectedPhoto?.description}</DialogDescription></DialogHeader>{selectedPhoto && <div className="grid max-h-[88vh] overflow-y-auto md:grid-cols-[minmax(0,1fr)_20rem]"><div className="min-h-72 bg-black"><img src={photoFallbackMap[selectedPhoto.id] || selectedPhoto.imageUrl} alt={selectedPhoto.alt} onError={(e) => handleImageError(selectedPhoto.id, e)} className="h-full max-h-[68vh] w-full object-contain" /></div><aside className="flex flex-col p-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f3c64f]">AIET visual landmark</p><h3 className="mt-3 font-display text-3xl font-bold">{selectedPhoto.title}</h3><p className="mt-4 text-sm leading-6 text-white/72">{selectedPhoto.description}</p><p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/45">Original image: {selectedPhoto.originalFilename}</p>{selectedPhoto.routeDestinationId ? <Button onClick={() => openConfiguredRoute(selectedPhoto)} className="mt-auto bg-[#f3c64f] text-[#2a111a] hover:bg-[#ffe08c]"><Route className="mr-2 h-4 w-4" />Plan configured route</Button> : <div className="mt-auto flex gap-2 border border-white/10 bg-white/[.05] p-3 text-xs leading-5 text-white/65"><MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-[#f3c64f]" />No verified destination handoff is configured for this visual landmark yet.</div>}</aside></div>}</DialogContent></Dialog>
  </>;
}
