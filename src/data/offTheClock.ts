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

// [longitude, latitude] per city, for the globe. A city missing here simply
// isn't pinned; its gyms still get their stamp.
const CITY_COORDS: Record<string, [number, number]> = {
  Oldenburg: [8.2146, 53.1435],
  Bremen: [8.8017, 53.0793],
  Düsseldorf: [6.7735, 51.2277],
  Rhodes: [28.2176, 36.4341],
  Venice: [12.3155, 45.4408],
  Warsaw: [21.0122, 52.2297],
  Tirana: [19.8187, 41.3275],
  Vienna: [16.3738, 48.2082],
  Prishtina: [21.1655, 42.6629],
};

export type MatPhoto = { src: string; gym: string; alt: string };

const PHOTOS: Record<string, MatPhoto[]> = {
  Prishtina: [
    {
      src: "/off-the-clock/038-fightclub.webp",
      gym: "038 Fightclub",
      alt: "Empty red mats at 038 Fight Club in Prishtina, a Kosovo flag and the club banner on the wall",
    },
    {
      src: "/off-the-clock/bjj-prishtina.webp",
      gym: "BJJ Prishtina",
      alt: "The empty BJJ Prishtina hall with blue and red puzzle mats and trophies along the back wall",
    },
  ],
};

export type MatStop = {
  city: string;
  country: string;
  coords: [number, number];
  gyms: string[];
  home?: boolean;
  photos?: MatPhoto[];
};

// One stop per city, home first, in the order the gyms are listed above.
export const MAT_STOPS: MatStop[] = GYMS.reduce<MatStop[]>((stops, gym) => {
  const coords = gym.city ? CITY_COORDS[gym.city] : undefined;
  if (!gym.city || !gym.country || !coords) return stops;
  const stop = stops.find((s) => s.city === gym.city);
  if (stop) {
    stop.gyms.push(gym.name);
    stop.home ||= gym.home;
  } else {
    stops.push({
      city: gym.city,
      country: gym.country,
      coords,
      gyms: [gym.name],
      home: gym.home,
      photos: PHOTOS[gym.city],
    });
  }
  return stops;
}, []);

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
  origin: "Jamaica",
  roaster: "Fa-Kafë",
  from: "Prishtina, Kosovo",
  note: "Jamaican beans, roasted locally by Fa-Kafë in Prishtina and brought back from a trip.",
};

export const READING = {
  title: "The Mysterious Affair at Styles",
  author: "Agatha Christie",
  year: 1920,
  // Finished books, newest first. Shown under the current one when not empty.
  previous: [] as { title: string; author: string }[],
};
