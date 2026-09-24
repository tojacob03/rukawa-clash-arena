// "Off the clock" (/off-the-clock): everything that changes lives here.
// Update the current technique, coffee or book without touching the page.
// The fragrance chapter is live data (see src/lib/fragrance.ts).

export type Gym = {
  name: string;
  city?: string;
  country?: string;
  home?: boolean;
};

// Home gym first, then open mats and drop-ins on the road.
// Leave city/country out when unknown - the page handles it.
const GYMS: Gym[] = [
  { name: "Checkmat Oldenburg", city: "Oldenburg", country: "Germany", home: true },
  { name: "Elevate Gym", city: "Bremen", country: "Germany" },
  { name: "UFD Gym", city: "Düsseldorf", country: "Germany" },
  { name: "Rhodes Knights BJJ", city: "Rhodes", country: "Greece" },
  { name: "Jiujitsu Squad Venezia", city: "Venice", country: "Italy" },
  { name: "Warszawskie Centrum Atletyki", city: "Warsaw", country: "Poland" },
  { name: "BJJ Brotherhood Tirana", city: "Tirana", country: "Albania" },
  { name: "MT Gym23", city: "Vienna", country: "Austria" },
  { name: "Hiro Gym", city: "Vienna", country: "Austria" },
  { name: "BJJ Prishtina", city: "Prishtina", country: "Kosovo" },
  { name: "038 Fightclub", city: "Prishtina", country: "Kosovo" },
];

export const BJJ = {
  since: "August 2023",
  belt: "White belt",
  goal: "Blue belt",
  style: "Almost exclusively No-Gi",
  home: "Checkmat Oldenburg",
  favourite: "Tarikoplata",
  favouriteExplainer: "A shoulder lock that blends the kimura and the omoplata.",
  gyms: GYMS,
  visited: GYMS.filter((g) => !g.home).map((g) => g.name),
};

export const COFFEE = {
  method: "Espresso",
  bean: "Jamaican Blue Mountain",
  roaster: "Fa-Kafë",
  from: "Prishtina",
  note: "Brought back from a trip.",
};

export const READING = {
  title: "The Mysterious Affair at Styles",
  author: "Agatha Christie",
  year: 1920,
  // Finished books, newest first. Shown under the current one when not empty.
  previous: [] as { title: string; author: string }[],
};
