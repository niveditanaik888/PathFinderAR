export type OfficialCampusGalleryItem = {
  id: string;
  group: "Library" | "Campus";
  title: string;
  alt: string;
  imageUrl: string;
  sourceUrl: string;
  sourceLabel: string;
  routeDestinationId?: string;
};

export const officialCampusGallery: OfficialCampusGalleryItem[] = [
  {
    id: "library-main-reading-hall",
    group: "Library",
    title: "Main Reading Hall",
    alt: "Official AIET Library Gallery image labelled Main Reading Hall.",
    imageUrl: "/manus-storage/library-main-reading-hall_d69b24cc.jpg",
    sourceUrl: "https://new.aiet.org.in/campus-life/library",
    sourceLabel: "AIET Central Library gallery",
    routeDestinationId: "d10",
  },
  {
    id: "library-digital-reference",
    group: "Library",
    title: "Digital Reference Section",
    alt: "Official AIET Library Gallery image labelled Digital Reference Section.",
    imageUrl: "/manus-storage/library-digital-reference_b73bb64a.jpg",
    sourceUrl: "https://new.aiet.org.in/campus-life/library",
    sourceLabel: "AIET Central Library gallery",
    routeDestinationId: "d10",
  },
  {
    id: "library-ejournal-lab",
    group: "Library",
    title: "E-Journal Lab",
    alt: "Official AIET Library Gallery image labelled E-Journal Lab.",
    imageUrl: "/manus-storage/library-ejournal-lab_af96efcf.jpg",
    sourceUrl: "https://new.aiet.org.in/campus-life/library",
    sourceLabel: "AIET Central Library gallery",
    routeDestinationId: "d10",
  },
  {
    id: "library-archive-stacks",
    group: "Library",
    title: "Archive Stacks",
    alt: "Official AIET Library Gallery image labelled Archive Stacks.",
    imageUrl: "/manus-storage/library-archive-stacks_2778833f.jpg",
    sourceUrl: "https://new.aiet.org.in/campus-life/library",
    sourceLabel: "AIET Central Library gallery",
    routeDestinationId: "d10",
  },
  {
    id: "library-group-study",
    group: "Library",
    title: "Group Study Area",
    alt: "Official AIET Library Gallery image labelled Group Study Area.",
    imageUrl: "/manus-storage/library-group-study_7706f036.jpg",
    sourceUrl: "https://new.aiet.org.in/campus-life/library",
    sourceLabel: "AIET Central Library gallery",
    routeDestinationId: "d10",
  },
  {
    id: "library-overview",
    group: "Library",
    title: "Library Overview",
    alt: "Official AIET Library Gallery image labelled Library Overview.",
    imageUrl: "/manus-storage/library-overview_d2d8b9d7.jpg",
    sourceUrl: "https://new.aiet.org.in/campus-life/library",
    sourceLabel: "AIET Central Library gallery",
    routeDestinationId: "d10",
  },
  {
    id: "campus-overview-1",
    group: "Campus",
    title: "College Campus",
    alt: "Official AIET College Campus image from the public Campus Life gallery.",
    imageUrl: "/manus-storage/campus-01_f5c84511.jpg",
    sourceUrl: "https://new.aiet.org.in/campus-life/campus",
    sourceLabel: "AIET Campus Life gallery",
  },
  {
    id: "campus-overview-2",
    group: "Campus",
    title: "College Campus",
    alt: "Official AIET College Campus image from the public Campus Life gallery.",
    imageUrl: "/manus-storage/campus-02_ab5ce6c5.jpg",
    sourceUrl: "https://new.aiet.org.in/campus-life/campus",
    sourceLabel: "AIET Campus Life gallery",
  },
  {
    id: "campus-overview-3",
    group: "Campus",
    title: "College Campus",
    alt: "Official AIET College Campus image from the public Campus Life gallery.",
    imageUrl: "/manus-storage/campus-03_10d65c09.jpg",
    sourceUrl: "https://new.aiet.org.in/campus-life/campus",
    sourceLabel: "AIET Campus Life gallery",
  },
];
