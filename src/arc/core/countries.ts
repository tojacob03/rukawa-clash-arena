// Countries for the profile and the flag patches. Flags are drawn in a 30x20
// box. Plain tricolours use their official colours; flags with a coat of arms
// or detailed emblems are simplified (civil flags where one exists, e.g. Spain,
// Peru, Serbia).

export type FlagSpec =
  | { t: "h"; c: string[]; w?: number[] }
  | { t: "v"; c: string[]; w?: number[] }
  | { t: "nordic"; bg: string; cross: string; inner?: string }
  | { t: "custom" };

export interface Country {
  code: string;
  name: string;
  flag: FlagSpec;
  simplified?: boolean;
}

const h = (c: string[], w?: number[]): FlagSpec => ({ t: "h", c, w });
const v = (c: string[], w?: number[]): FlagSpec => ({ t: "v", c, w });
const nordic = (bg: string, cross: string, inner?: string): FlagSpec => ({ t: "nordic", bg, cross, inner });
const custom: FlagSpec = { t: "custom" };
const W = "#FFFFFF";

const LIST: Country[] = [
  { code: "DE", name: "Deutschland", flag: h(["#000000", "#DD0000", "#FFCC00"]) },
  { code: "AT", name: "Österreich", flag: h(["#C8102E", W, "#C8102E"]) },
  { code: "CH", name: "Schweiz", flag: custom },
  { code: "NL", name: "Niederlande", flag: h(["#AE1C28", W, "#21468B"]) },
  { code: "BE", name: "Belgien", flag: v(["#000000", "#FDDA24", "#EF3340"]) },
  { code: "LU", name: "Luxemburg", flag: h(["#EF3340", W, "#00A3E0"]) },
  { code: "FR", name: "Frankreich", flag: v(["#0055A4", W, "#EF4135"]) },
  { code: "IT", name: "Italien", flag: v(["#009246", W, "#CE2B37"]) },
  { code: "ES", name: "Spanien", flag: h(["#AA151B", "#F1BF00", "#AA151B"], [1, 2, 1]) },
  { code: "PT", name: "Portugal", flag: custom, simplified: true },
  { code: "IE", name: "Irland", flag: v(["#169B62", W, "#FF883E"]) },
  { code: "GB", name: "Vereinigtes Königreich", flag: custom },
  { code: "ENG", name: "England", flag: custom },
  { code: "SCO", name: "Schottland", flag: custom },
  { code: "PL", name: "Polen", flag: h([W, "#DC143C"]) },
  { code: "CZ", name: "Tschechien", flag: custom },
  { code: "HU", name: "Ungarn", flag: h(["#CD2A3E", W, "#436F4D"]) },
  { code: "RO", name: "Rumänien", flag: v(["#002B7F", "#FCD116", "#CE1126"]) },
  { code: "BG", name: "Bulgarien", flag: h([W, "#00966E", "#D62612"]) },
  { code: "HR", name: "Kroatien", flag: custom, simplified: true },
  { code: "RS", name: "Serbien", flag: h(["#C6363C", "#0C4076", W]) },
  { code: "BA", name: "Bosnien und Herzegowina", flag: custom, simplified: true },
  { code: "GR", name: "Griechenland", flag: custom },
  { code: "TR", name: "Türkei", flag: custom },
  { code: "UA", name: "Ukraine", flag: h(["#0057B7", "#FFD700"]) },
  { code: "RU", name: "Russland", flag: h([W, "#0039A6", "#D52B1E"]) },
  { code: "EE", name: "Estland", flag: h(["#0072CE", "#000000", W]) },
  { code: "LV", name: "Lettland", flag: h(["#9E3039", W, "#9E3039"], [2, 1, 2]) },
  { code: "LT", name: "Litauen", flag: h(["#FDB913", "#006A44", "#C1272D"]) },
  { code: "SE", name: "Schweden", flag: nordic("#006AA7", "#FECC00") },
  { code: "NO", name: "Norwegen", flag: nordic("#BA0C2F", W, "#00205B") },
  { code: "DK", name: "Dänemark", flag: nordic("#C8102E", W) },
  { code: "FI", name: "Finnland", flag: nordic(W, "#002F6C") },
  { code: "IS", name: "Island", flag: nordic("#02529C", W, "#DC1E35") },
  { code: "GE", name: "Georgien", flag: custom },
  { code: "AM", name: "Armenien", flag: h(["#D90012", "#0033A0", "#F2A800"]) },
  { code: "AE", name: "Vereinigte Arabische Emirate", flag: custom },
  { code: "MA", name: "Marokko", flag: custom },
  { code: "NG", name: "Nigeria", flag: v(["#008751", W, "#008751"]) },
  { code: "US", name: "USA", flag: custom, simplified: true },
  { code: "CA", name: "Kanada", flag: custom, simplified: true },
  { code: "MX", name: "Mexiko", flag: custom, simplified: true },
  { code: "BR", name: "Brasilien", flag: custom, simplified: true },
  { code: "AR", name: "Argentinien", flag: custom, simplified: true },
  { code: "CO", name: "Kolumbien", flag: h(["#FCD116", "#003893", "#CE1126"], [2, 1, 1]) },
  { code: "PE", name: "Peru", flag: v(["#D91023", W, "#D91023"]) },
  { code: "JP", name: "Japan", flag: custom },
  { code: "CN", name: "China", flag: custom, simplified: true },
  { code: "VN", name: "Vietnam", flag: custom },
  { code: "TH", name: "Thailand", flag: h(["#A51931", W, "#2D2A4A", W, "#A51931"], [1, 1, 2, 1, 1]) },
  { code: "PH", name: "Philippinen", flag: custom, simplified: true },
  { code: "ID", name: "Indonesien", flag: h(["#FF0000", W]) },
  { code: "IN", name: "Indien", flag: custom, simplified: true },
  { code: "AU", name: "Australien", flag: custom, simplified: true },
  // Europe
  { code: "AL", name: "Albanien", flag: custom, simplified: true },
  { code: "XK", name: "Kosovo", flag: custom, simplified: true },
  { code: "MK", name: "Nordmazedonien", flag: custom },
  { code: "ME", name: "Montenegro", flag: custom, simplified: true },
  { code: "SI", name: "Slowenien", flag: custom, simplified: true },
  { code: "SK", name: "Slowakei", flag: custom, simplified: true },
  { code: "MD", name: "Moldau", flag: custom, simplified: true },
  { code: "CY", name: "Zypern", flag: custom, simplified: true },
  { code: "MT", name: "Malta", flag: custom, simplified: true },
  { code: "MC", name: "Monaco", flag: h(["#CE1126", W]) },
  { code: "WAL", name: "Wales", flag: custom, simplified: true },
  // Caucasus and Central Asia
  { code: "AZ", name: "Aserbaidschan", flag: custom },
  { code: "DAG", name: "Dagestan", flag: h(["#1E9A3E", "#1B5DB5", "#D8261E"]) },
  { code: "KZ", name: "Kasachstan", flag: custom, simplified: true },
  { code: "UZ", name: "Usbekistan", flag: custom, simplified: true },
  { code: "KG", name: "Kirgisistan", flag: custom, simplified: true },
  { code: "TJ", name: "Tadschikistan", flag: custom, simplified: true },
  { code: "MN", name: "Mongolei", flag: custom, simplified: true },
  // Middle East
  { code: "IR", name: "Iran", flag: custom, simplified: true },
  { code: "IQ", name: "Irak", flag: custom, simplified: true },
  { code: "SY", name: "Syrien", flag: custom },
  { code: "LB", name: "Libanon", flag: custom, simplified: true },
  { code: "JO", name: "Jordanien", flag: custom },
  { code: "PS", name: "Palästina", flag: custom },
  { code: "SA", name: "Saudi-Arabien", flag: custom, simplified: true },
  { code: "QA", name: "Katar", flag: custom },
  { code: "KW", name: "Kuwait", flag: custom },
  { code: "BH", name: "Bahrain", flag: custom },
  { code: "OM", name: "Oman", flag: custom, simplified: true },
  { code: "YE", name: "Jemen", flag: h(["#CE1126", W, "#000000"]) },
  { code: "KUR", name: "Kurdistan", flag: custom },
  // South, East and Southeast Asia, Pacific
  { code: "PK", name: "Pakistan", flag: custom },
  { code: "BD", name: "Bangladesch", flag: custom },
  { code: "LK", name: "Sri Lanka", flag: custom, simplified: true },
  { code: "KR", name: "Südkorea", flag: custom, simplified: true },
  { code: "TW", name: "Taiwan", flag: custom },
  { code: "MY", name: "Malaysia", flag: custom, simplified: true },
  { code: "SG", name: "Singapur", flag: custom, simplified: true },
  { code: "KH", name: "Kambodscha", flag: custom, simplified: true },
  { code: "NZ", name: "Neuseeland", flag: custom, simplified: true },
  { code: "WS", name: "Samoa", flag: custom },
  { code: "TO", name: "Tonga", flag: custom },
  // Africa
  { code: "EG", name: "Ägypten", flag: custom, simplified: true },
  { code: "TN", name: "Tunesien", flag: custom },
  { code: "DZ", name: "Algerien", flag: custom },
  { code: "LY", name: "Libyen", flag: custom },
  { code: "SO", name: "Somalia", flag: custom },
  { code: "ET", name: "Äthiopien", flag: custom, simplified: true },
  { code: "KE", name: "Kenia", flag: custom, simplified: true },
  { code: "GH", name: "Ghana", flag: custom },
  { code: "SN", name: "Senegal", flag: custom },
  { code: "CI", name: "Elfenbeinküste", flag: v(["#F77F00", W, "#009E60"]) },
  { code: "CM", name: "Kamerun", flag: custom },
  { code: "CD", name: "Kongo (Dem. Rep.)", flag: custom },
  { code: "ZA", name: "Südafrika", flag: custom },
  // Americas
  { code: "CL", name: "Chile", flag: custom },
  { code: "UY", name: "Uruguay", flag: custom, simplified: true },
  { code: "PY", name: "Paraguay", flag: custom, simplified: true },
  { code: "BO", name: "Bolivien", flag: h(["#D52B1E", "#F9E300", "#007934"]) },
  { code: "EC", name: "Ecuador", flag: custom, simplified: true },
  { code: "VE", name: "Venezuela", flag: custom, simplified: true },
  { code: "CU", name: "Kuba", flag: custom },
  { code: "DO", name: "Dominikanische Republik", flag: custom, simplified: true },
  { code: "PR", name: "Puerto Rico", flag: custom },
  { code: "JM", name: "Jamaika", flag: custom },
  { code: "CR", name: "Costa Rica", flag: h(["#002B7F", W, "#CE1126", W, "#002B7F"], [1, 1, 2, 1, 1]) },
  { code: "PA", name: "Panama", flag: custom },
  { code: "GT", name: "Guatemala", flag: custom, simplified: true },
  { code: "HN", name: "Honduras", flag: custom },
  { code: "SV", name: "El Salvador", flag: custom, simplified: true },
  { code: "HT", name: "Haiti", flag: custom, simplified: true },
];

/** Alphabetical by German name; the picker has a search on top. */
export const COUNTRIES = [...LIST].sort((a, b) => a.name.localeCompare(b.name, "de"));

export const COUNTRY = Object.fromEntries(COUNTRIES.map((c) => [c.code, c])) as Record<string, Country>;
