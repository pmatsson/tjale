export type Language = "sv" | "en";

export type TranslationKey =
  | "title"
  | "subtitle"
  | "loading"
  | "error"
  | "noData"
  | "frostDepth"
  | "depth"
  | "station"
  | "lastMeasured"
  | "stationsLoaded"
  | "legendShallow"
  | "legendMid"
  | "legendDeep"
  | "opacity"
  | "temperatureProfile"
  | "noFrostFound"
  | "frostRange"
  | "play"
  | "pause"
  | "latest"
  | "noHistory"
  | "modeDepth"
  | "modeFrostLine";

const translations: Record<Language, Record<TranslationKey, string>> = {
  sv: {
    title: "Tjälkarta",
    subtitle: "Tjälläget i Sverige",
    loading: "Hämtar data…",
    error: "Fel vid hämtning av data",
    noData: "Ingen data tillgänglig",
    frostDepth: "Tjäldjup",
    depth: "Djup",
    station: "Mätstation",
    lastMeasured: "Senast mätt",
    stationsLoaded: "stationer laddade",
    legendShallow: "Ytlig",
    legendMid: "Måttlig",
    legendDeep: "Djup",
    opacity: "Täckning",
    temperatureProfile: "Temperaturprofil",
    noFrostFound: "Ingen tjäle detekterad",
    frostRange: "Tjäle (från–till)",
    play: "Spela upp",
    pause: "Pausa",
    latest: "LIVE",
    noHistory: "Historik ej tillgänglig",
    modeDepth: "Djup",
    modeFrostLine: "Tjällinje",
  },
  en: {
    title: "Frost Map",
    subtitle: "Ground frost in Sweden",
    loading: "Fetching data…",
    error: "Error fetching data",
    noData: "No data available",
    frostDepth: "Frost depth",
    depth: "Depth",
    station: "Measurement station",
    lastMeasured: "Last measured",
    stationsLoaded: "stations loaded",
    legendShallow: "Shallow",
    legendMid: "Moderate",
    legendDeep: "Deep",
    opacity: "Coverage",
    temperatureProfile: "Temperature profile",
    noFrostFound: "No frost detected",
    frostRange: "Frost layer (top–bottom)",
    play: "Play",
    pause: "Pause",
    latest: "LIVE",
    noHistory: "History unavailable",
    modeDepth: "Depth",
    modeFrostLine: "Frost line",
  },
};

let currentLang: Language = "sv";

export function setLanguage(lang: Language): void {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as TranslationKey;
    if (key in translations[currentLang]) {
      el.textContent = translations[currentLang][key];
    }
  });
}

export function t(key: TranslationKey): string {
  return translations[currentLang][key];
}

export function getLang(): Language {
  return currentLang;
}
